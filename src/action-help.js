import { BALANCE, CARD_TYPES, LOCATIONS, MODULES, RESOURCES } from './data.js';
import { abilities, abilityBreakdown, playerActor, validatePlan } from './combat.js';
import { atBase, location, neighbors } from './world.js';
import { carriedWeight } from './items.js';
import { abilityNames } from './ability-help.js';
import { round } from './random.js';
import { escapeHTML as e } from './art.js';

export const actionHelpActions=new Set(['survey','search','endSearch','rest','consume','driving','move','encounter','deposit','takeSupply','install','nextRegion','equip','stashItem','retrieveItem','salvage','selectCard','resolve','passRound','nextRound']);
const n=value=>Number(value.toFixed(2));
const row=(label,value)=>`<li><span>${e(label)}</span><b>${e(String(value))}</b></li>`;
const box=(title,body)=>`<div class="ability-help-title"><b>${e(title)}</b></div>${body}`;
const list=rows=>`<ul class="ability-sources">${rows.join('')}</ul>`;
const note=text=>`<p class="ability-use">${e(text)}</p>`;
const blocked=text=>text?`<p class="action-help-blocked">${e(text)}</p>`:'';
function abilityRows(actor,keys) {
  const detail=abilityBreakdown(actor);
  return keys.map(key=>{
    const d=detail[key],base=BALANCE.player[key],delta=d.base-base;
    const sources=[actor.armor.head,actor.armor.body,actor.weapon].filter(item=>item.stats?.[key]).map(item=>`${item.name} ${item.stats[key]>0?'+':''}${item.stats[key]}`);
    const gauge={headHP:'頭HP',bodyHP:'体HP',headST:'頭ST',bodyST:'体ST'}[d.gauge];
    return `<li><span>${abilityNames[key]}<small>基礎 ${base} ＋ 装備 ${delta>=0?'+':''}${delta}、${gauge} ${d.current}/${d.maximum} → 切り上げ${sources.length?`<br>${e(sources.join(' / '))}`:''}</small></span><b>${d.value}</b></li>`;
  });
}
// Read-only explanations: never roll dice, spend resources or change a plan.
export function actionHelp(state,action,value='',{driving=false}={}) {
  if(!actionHelpActions.has(action))return '';
  const actor=state.combat?.player||playerActor(state),a=abilities(actor),loc=location(state),home=atBase(state),ex=state.exploration;
  const supplies=key=>state.pack[key]+(home?state.baseResources[key]:0);
  const chance=(key,stats=a)=>n(Math.min(.95,(key==='good'?BALANCE.search.goodBase: BALANCE.search.findBase)+stats[key==='good'?'perception':'execution']*(key==='good'?BALANCE.search.goodPerception:BALANCE.search.findExecution))*100);
  const unavailable=state.combat?'戦闘中はこの操作を使えません。':state.vitals.headHP<=0?'旅が終わっています。':'';
  if(action==='survey'){
    const remaining=loc.spots.length-state.world[state.location].used.length;
    return box('周辺を見渡す',`<p>探索候補を見つけ、調べられる回数を決めます。</p>${list([row('発見できる箇所',`${Math.min(a.judgment,remaining)} 箇所（未探索 ${remaining} 箇所）`),row('調べられる回数',`${a.action} 回`),...abilityRows(actor,['judgment','action'])])}${note('時間・STは消費しません。回数は見渡した時点で確定します。知覚・実効は、その後に各場所を調べる時の発見に影響します。')}${blocked(unavailable|| (ex?.remaining>0?'現在の探索を終えるか、切り上げてから見渡せます。':!remaining?'ここは調べ尽くしました。別の場所へ移動してください。':''))}`);
  }
  if(action==='search'){
    const spot=ex?.spots.find(s=>s.index===Number(value)),searchActor=structuredClone(actor);
    if(state.hunger+2>=80)searchActor.bodyST=round(Math.max(0,searchActor.bodyST-1));
    if(state.thirst+3>=80)searchActor.headST=round(Math.max(0,searchActor.headST-1));
    const searchStats=abilities(searchActor);
    return box(spot?.name||'場所を調べる',`${list([row('探索回数',`1 回消費 / 残り ${ex?.remaining??0} 回`),row('時間','1 時間'),row('ST消費','頭 1 / 体 2'),row('何かが見つかる確率',`${chance('find',searchStats)}%`),row('良い発見の判定',`${chance('good',searchStats)}%`),row('敵に遭遇する確率',`${n(loc.danger*100)}%`),...abilityRows(searchActor,['perception','execution'])])}${note('確率はその場所を調べる時の能力で判定。時間経過による空腹・渇きの疲労を含み、探索のST消費はその後です。良い発見の判定と、何かが見つかる判定は別々に行います。持ち帰れる量は携行重量に制限されます。')}${blocked(unavailable||(!spot||!ex?.remaining?'この場所は今は調べられません。':''))}`);
  }
  if(action==='endSearch')return box('探索を切り上げる',`<p>残りの探索回数を終了します。未探索の場所は、もう一度見渡すと候補になります。</p>${note('時間・STは消費しません。')}`);
  if(action==='rest'){
    const bed=home&&state.modules.includes('bed');
    return box(home?'家で休む':'物陰で休む',`${list([row('消費','食料 1 / 水 1'),row('使える物資',`食料 ${supplies('food')} / 水 ${supplies('water')}`),row('時間',`${home?6:2} 時間`),row('ST回復',home?'頭・体を全回復':'頭 +6 / 体 +8'),row('HP回復',`頭 +${bed?3:home?1:0} / 体 +${bed?10:home?4:0}`),row('空腹・渇き','時間経過後、それぞれ −35 / −40'),...(!home?[row('敵に遭遇する確率',`${n(loc.danger*50)}%`)]:[])])}${note('回復は最大値まで。拠点では携行品と拠点の物資を両方使えます。')}${blocked(unavailable||(supplies('food')<1||supplies('water')<1?'食料と水が1つずつ必要です。':''))}`);
  }
  if(action==='consume'){
    const r=RESOURCES[value];if(!r)return '';
    const effects={food:'空腹 −35 / 体ST +3',water:'渇き −40 / 頭ST +3',med:'頭HP +3 / 体HP +8'};
    return box(`${r.name}を使う`,`${list([row('消費',`${r.name} 1`),row('使える数',supplies(value)),row('効果',effects[value])])}${note('時間は進みません。回復は最大値まで。拠点では拠点の在庫も使えます。')}${blocked(unavailable||(!supplies(value)?'物資がありません。':''))}`);
  }
  if(action==='move'||action==='driving'){
    const fuel=state.modules.includes('engine')?1:2,target=state.world[Number(value)],withBase=action==='driving'||driving;
    const name=action==='move'&&target?.seen?LOCATIONS.find(l=>l.id===target.locId).name:action==='driving'?'拠点を動かす':'地図を移動';
    return box(name,`<p>${withBase?'拠点と一緒に、道路でつながった施設へ移動します。':'徒歩で移動します。拠点は現在の位置に残ります。'}</p>${list([row('時間','1 時間'),row('体ST消費','1'),row('燃料',withBase?`${fuel} 消費 / 在庫 ${supplies('fuel')}`:'消費なし')])}${action==='driving'?note(driving?'もう一度押すと徒歩移動に切り替えます。':'このボタンで拠点移動に切り替え、地図の光る施設を選ぶと移動します。切り替え自体は物資を消費しません。'):note('現在の探索は終了します。')}${blocked(unavailable||(withBase&&!home?'まず拠点に戻ってください。':action==='move'&&!neighbors(state.location).includes(Number(value))?'道路で直接つながった施設だけ選べます。':withBase&&supplies('fuel')<fuel?'燃料が足りません。':''))}`);
  }
  if(action==='encounter')return box('近くの気配を追う',`<p>野犬との戦闘を自分から始めます。</p>${note('時間・物資は開始時に消費しません。戦闘中は頭HPが0になると旅が終わります。')}${blocked(unavailable)}`);
  if(action==='deposit')return box('資源を全部しまう',`<p>携行している資源をすべて拠点へ移します。装備は移しません。</p>${note('時間・物資は消費しません。携行重量が軽くなります。')}${blocked(unavailable||(!home?'拠点でのみ使えます。':''))}`);
  if(action==='takeSupply')return box(`${RESOURCES[value]?.name||'資源'}を持ち出す`,`${list([row('持ち出す量','1'),row('携行重量',`${carriedWeight(state)} / ${BALANCE.packCapacity} → +0.15`),row('拠点の在庫',state.baseResources[value]??0)])}${blocked(unavailable||(!home?'拠点でのみ使えます。':!state.baseResources[value]?'拠点に在庫がありません。':carriedWeight(state)+.15>BALANCE.packCapacity?'携行重量がいっぱいです。':''))}`);
  if(action==='install'){
    const mod=MODULES.find(m=>m.id===value);if(!mod)return '';
    return box(mod.name,`<p>${e(mod.text)}</p>${list([row('工作時間','2 時間'),...Object.entries(mod.cost).map(([key,cost])=>row(RESOURCES[key].name,`${cost} 消費 / 在庫 ${supplies(key)}`))])}${blocked(unavailable||(state.modules.includes(value)?'取り付け済みです。':!home?'工作は拠点で行います。':Object.entries(mod.cost).some(([k,c])=>supplies(k)<c)?'材料が足りません。':''))}`);
  }
  if(action==='nextRegion')return box('次の街へ走る',`${list([row('燃料',`3 消費 / 在庫 ${supplies('fuel')}`),row('時間','8 時間')])}${note('装備・資源・拠点設備は引き継ぎ、現在の地域の地図と探索状況を更新します。エンジン修理が必要です。')}${blocked(unavailable||(!home?'拠点に戻ってください。':!state.modules.includes('engine')?'まずエンジンを修理してください。':supplies('fuel')<3?'燃料が3必要です。':''))}`);
  if(['equip','stashItem','retrieveItem','salvage'].includes(action)){
    const item=[...state.inventory,...state.stash].find(i=>i.id===value);if(!item)return '';
    const descriptions={equip:'同じ部位の装備を持ち替えます。能力補正と見た目に反映され、武器は戦闘デッキも変わります。',stashItem:'拠点に保管し、携行重量から外します。',retrieveItem:'拠点から携行品へ戻します。',salvage:`装備を解体し、スクラップを${state.modules.includes('workbench')?3:2}つ得ます。`};
    const equipped=Object.values(state.equipment).includes(value);
    return box(item.name,`<p>${e(descriptions[action])}</p>${list([row('携行重量',item.carry),...Object.entries(item.stats||{}).map(([key,delta])=>row(abilityNames[key],`${delta>=0?'+':''}${delta}`))])}${note('時間は進みません。')}${blocked(unavailable||(action==='equip'?(equipped?'装備中です。':''):!home?'拠点でのみ使えます。':equipped?'装備を持ち替えてから操作してください。':action==='stashItem'&&state.stash.length>=(state.modules.includes('storage')?16:8)?'拠点の収納がいっぱいです。':action==='retrieveItem'&&carriedWeight(state)+item.carry>BALANCE.packCapacity?'携行重量がいっぱいです。':''))}`);
  }
  const b=state.combat;if(!b)return '';
  if(action==='selectCard'){
    const index=Number(value),c=CARD_TYPES[b.hand[index]];if(!c)return '';
    const range=c.range==='weapon'?[actor.weapon.minRange,actor.weapon.maxRange]:c.range;
    return box(c.name,`<p>${e(c.desc)}</p>${list([row('ST消費',`頭 ${c.headCost} / 体 ${c.bodyCost}`),...(range?[row('有効距離',`${range[0]}〜${range[1]} / 現在 ${b.distance}`)]:[]),...(c.kind==='attack'?[row('ダイス',`現在の実効 ${a.execution} 個`),...abilityRows(actor,['execution'])]:[])])}${note(c.kind==='attack'?'ダイス数は各行動のST消費前に決まります。先の行動で疲労すると減ります。射程外でもSTを消費します。':'同じ順番の敵カードと同時に解決します。')}${blocked(b.resolved?'このラウンドは解決済みです。':!b.plan.includes(index)&&b.plan.length>=b.limits.action?'行動上限です。選んだカードを外すと追加できます。':'')}`);
  }
  if(action==='resolve')return box('この行動列で実行',`${list([row('選んだ行動',`${b.plan.length} / ${b.limits.action} 回`),row('敵の行動',`${b.enemyPlan.length} 回`),row('ST消費の合計',`頭 ${b.plan.reduce((sum,i)=>sum+CARD_TYPES[b.hand[i]].headCost,0)} / 体 ${b.plan.reduce((sum,i)=>sum+CARD_TYPES[b.hand[i]].bodyCost,0)}`)])}${note('双方の同じ順番を同時に解決。移動・回復・防御の後に攻撃します。敵の攻撃によるST減少で、後の行動が不発になることもあります。')}${blocked(b.resolved?'このラウンドは解決済みです。':validatePlan(b))}`);
  if(action==='passRound')return box('このラウンドは待機',`<p>あなたは行動せず、相手の ${b.enemyPlan.length} 回の予定だけを解決します。</p>${note('STは消費しませんが、敵からのダメージは受けます。待機だけではSTは回復しません。')}${blocked(b.plan.length?'選んだカードをすべて外すと待機できます。':'')}`);
  if(action==='nextRound')return box('次のラウンドへ',`<p>今のHP・STから知覚・判断・行動を再計算し、手札と敵の予定を新しくします。</p>${list(abilityRows(actor,['perception','judgment','action']))}${note('残った手札は持ち越しません。STは自動回復しません。')}`);
  return '';
}
