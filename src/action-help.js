import { BALANCE, CARD_TYPES, LOCATIONS, MODULES, RESOURCES } from './data.js?v=0.2.3';
import { abilities, abilityBreakdown, playerActor, validatePlan } from './combat.js?v=0.2.3';
import { atBase, location, neighbors, explorationProgress, stats, isNight, encounterRisk, returnHours, searchOption, obstacle } from './world.js?v=0.2.3';
import { carriedWeight } from './items.js?v=0.2.3';
import { abilityNames } from './ability-help.js?v=0.2.3';
import { round } from './random.js?v=0.2.3';
import { escapeHTML as e } from './art.js?v=0.2.3';

import { cardInfo, cardPool, combatCard, isCombat, isExploration } from './deck.js?v=0.2.3';
export const actionHelpActions=new Set(['basicSearch','redraw','chooseSpot','chooseSearchCard','useSearchCard','deckAdd','deckRemove','commitDeck','survey','search','endSearch','rest','consume','driving','move','encounter','deposit','takeSupply','install','nextRegion','equip','stashItem','retrieveItem','salvage','selectCard','resolve','passRound','nextRound']);
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
export function actionHelp(state,action,value='',{driving=false,deckDraft=null}={}) {
  if(!actionHelpActions.has(action))return '';
  const actor=state.combat?.player||playerActor(state),a=abilities(actor),loc=location(state),home=atBase(state),ex=state.exploration;
  const supplies=key=>state.pack[key]+(home?state.baseResources[key]:0);
  const chance=(key,stats=a)=>n(Math.min(.95,(key==='good'?BALANCE.search.goodBase: BALANCE.search.findBase)+stats[key==='good'?'perception':'execution']*(key==='good'?BALANCE.search.goodPerception:BALANCE.search.findExecution))*100);
  const unavailable=state.combat?'戦闘中はこの操作を使えません。':state.vitals.headHP<=0?'旅が終わっています。':'';
  if(action==='survey'||action==='redraw'){
    const node=state.world[state.location],unknown=6-new Set([...(node.discovered||[]),...node.used]).size;
    return box(action==='redraw'?'カードを引き直す':'周辺を見渡す',`${list([row('時間','1 時間'),row('ST消費','頭 1 / 体 1'),...(action==='survey'?[row('新しく発見する箇所',`${Math.min(a.perception,unknown)}（知覚 ${a.perception} / 未発見 ${unknown}）`)]:[]),row('引く手札',`${a.judgment} 枚`),row('使える回数',`${a.action} 回に更新`),row('遭遇率',`${Math.round(Math.max(encounterRisk(state),encounterRisk(state,'search',(state.hour+1)%24))*100)}%`),...abilityRows(actor,action==='survey'?['perception','judgment','action']:['judgment','action'])])}${note('現在の手札を捨て、共通山札から引きます。未解決の探索箇所は残り、解決済みからは二度回収できません。18時〜6時は危険度が大幅に上がります。')}${blocked(unavailable)}`);
  }
  if(action==='chooseSpot'){
    const o=obstacle(state,Number(value)),methods=cardPool(state).filter(r=>cardInfo(r,state.inventory).search?.[o.kind]!==undefined).map(r=>cardInfo(r,state.inventory).name);
    return box(o.spotName,`${list([row('障害',o.name),row('難易度',o.difficulty),row('基本探索',o.kind==='open'?'カード不要・1D6':'対応した探索カードが必要'),row('使えるカード',[...new Set(methods)].join(' / '))])}${note('実効個のD6の合計＋カードの道具補正が難易度以上で成功。失敗した箇所は再挑戦できます。選択だけでは時間は進みません。')}`);
  }
  if(action==='chooseSearchCard'){
    const ref=ex?.hand?.[Number(value)],c=ref&&cardInfo(ref,state.inventory);if(!c)return '';
    return box(c.name,`<p>${e(c.desc)}</p>${list([row('道具',c.sourceName||'基本カード'),row('ST消費',`頭 ${c.headCost} / 体 ${c.bodyCost}`),row('使用時間','1 時間'),row('探索で使用',isExploration(c)?'可':'戦闘専用のため不可')])}${note('カード選択だけでは時間は進みません。戦闘専用カードは探索中には使えません。')}`);
  }
  if(action==='basicSearch'){
    const o=searchOption(state,Number(value),null);
    return box('基本探索',`${list([row('判定',`1D6 ≥ ${o.obstacle.difficulty}`),row('成功率',`${o.chance}%`),row('時間','1時間'),row('行動','1回消費'),row('ST消費','頭1 / 体1'),row('遭遇率',`${Math.round(o.risk*100)}%`)])}${note('カードを消費せず開いた物資を探索します。対応カードを使うと実効に応じた追加ダイスと道具補正が付きます。失敗した箇所には再挑戦できます。')}${blocked(o.error||unavailable)}`);
  }
  if(action==='useSearchCard'){
    const [spot,index]=String(value).split(':').map(Number),o=searchOption(state,spot,index),c=o.card;if(!c)return box('探索カードを使う','<p>手札と探索箇所を選んでください。</p>');
    return box(c.name,`${list([row('時間','1 時間'),row('行動','1 回消費'),row('ST消費',`頭 ${c.headCost} / 体 ${c.bodyCost}`),...(c.kind==='recover'?[row('ST回復',`頭 +${c.headRecovery} / 体 +${c.bodyRecovery}`)]:[row('判定',`基本1D6 ＋ 追加${Math.max(0,o.execution-1)}D6 ＋ ${o.bonus} ≥ ${o.obstacle.difficulty}`),row('成功率',`${o.chance}%`),...abilityRows(actor,['execution'])]),row('遭遇率',`${Math.round(o.risk*100)}%`)])}${note('実効はカードのST消費前に計算します。判定結果は先に自動保存され、演出中に再読み込みしても振り直しません。')}${blocked(o.error||unavailable)}`);
  }
  if(action==='endSearch')return box('手札を片付ける',`${note('残っている手札を捨て札に戻します。発見した未解決の箇所は残り、引き直しで再開できます。時間・STは消費しません。')}`);
  if(action==='rest'){
    const bed=home&&state.modules.includes('bed'),hours=home?(isNight(state)?(6-state.hour+24)%24:6):2;
    return box(home&&isNight(state)?'朝まで家で休む':home?'家で休む':'物陰で休む',`${list([row('消費','食料 1 / 水 1'),row('使える物資',`食料 ${supplies('food')} / 水 ${supplies('water')}`),row('時間',`${hours} 時間`),row('ST回復',home?'頭・体を全回復':'頭 +6 / 体 +8'),row('HP回復',`頭 +${bed?3:home?1:0} / 体 +${bed?10:home?4:0}`),row('遭遇率',home?'0%（安全な拠点）':`${Math.round(Math.max(encounterRisk(state),encounterRisk(state,'search',(state.hour+2)%24))*.7*100)}%`)])}${note('休息では探索手札を片付けます。拠点では携行品と拠点物資を使えます。夜の拠点では翌朝6時まで休みます。')}${blocked(unavailable||(supplies('food')<1||supplies('water')<1?'食料と水が1つずつ必要です。':''))}`);
  }
  if(['deckAdd','deckRemove'].includes(action)){const ref=action==='deckAdd'?cardPool(state)[Number(value)]:(deckDraft||state.deck)[Number(value)],c=ref&&cardInfo(ref,state.inventory);return c?box(c.name,`<p>${e(c.desc)}</p>${list([row('道具',c.sourceName||'基本カード'),row('戦闘',isCombat(c)?'使用可':'使用不可'),row('探索',isExploration(c)?'使用可':'使用不可')])}${note('編集は「この18枚を採用する」で確定します。')}`):'';}
  if(action==='commitDeck')return box('18枚を採用する',`${list([row('場所','拠点のみ'),row('時間','1時間（変更なしなら0時間）')])}${note('探索手札を片付け、18枚の山札を作り直します。')}`);
  if(action==='consume'){
    const r=RESOURCES[value];if(!r)return '';
    const effects={food:'空腹 −35 / 体ST +3',water:'渇き −40 / 頭ST +3',med:'頭HP +3 / 体HP +8'};
    return box(`${r.name}を使う`,`${list([row('消費',`${r.name} 1`),row('使える数',supplies(value)),row('効果',effects[value])])}${note('時間は進みません。回復は最大値まで。拠点では拠点の在庫も使えます。')}${blocked(unavailable||(!supplies(value)?'物資がありません。':''))}`);
  }
  if(action==='move'||action==='driving'){
    const fuel=state.modules.includes('engine')?1:2,target=state.world[Number(value)],withBase=action==='driving'||driving;
    const name=action==='move'&&target?.seen?LOCATIONS.find(l=>l.id===target.locId).name:action==='driving'?'拠点を動かす':'地図を移動';
    return box(name,`<p>${withBase?'拠点と一緒に、道路でつながった施設へ移動します。':'徒歩で移動します。拠点は現在の位置に残ります。'}</p>${list([row('区画',action==='move'&&target?`${Number(value)+1}（調査済み ${explorationProgress(state,Number(value)).done.length} / 6）`:`${state.location+1} → 地図で選択`),row('時間','1 時間'),row('体ST消費','1'),row('徒歩の遭遇',withBase?'なし':`${Math.round(Math.max(encounterRisk(state,'walk'),encounterRisk(state,'walk',(state.hour+1)%24))*100)}%（現在の区画を基準。到着先がより危険なら増加）`),row('燃料',withBase?`${fuel} 消費 / 在庫 ${supplies('fuel')}`:'消費なし')])}${action==='driving'?note(driving?'もう一度押すと徒歩移動に切り替えます。':'このボタンで拠点移動に切り替え、地図の光る施設を選ぶと移動します。切り替え自体は物資を消費しません。'):note('現在の探索は終了します。')}${blocked(unavailable||(withBase&&!home?'まず拠点に戻ってください。':action==='move'&&!neighbors(state.location).includes(Number(value))?'道路で直接つながった施設だけ選べます。':withBase&&supplies('fuel')<fuel?'燃料が足りません。':''))}`);
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
    const descriptions={equip:'同じ部位の装備を持ち替えます。能力補正と見た目に反映され、カードの採用は拠点のデッキ画面で行います。',stashItem:'拠点に保管し、携行重量から外します。その道具の採用カードを基本カードに差し替えます。',retrieveItem:'拠点から携行品へ戻します。',salvage:`装備を解体し、スクラップを${state.modules.includes('workbench')?3:2}つ得ます。`};
    const equipped=Object.values(state.equipment).includes(value);
    return box(item.name,`<p>${e(descriptions[action])}</p>${list([row('携行重量',item.carry),...Object.entries(item.stats||{}).map(([key,delta])=>row(abilityNames[key],`${delta>=0?'+':''}${delta}`))])}${note('時間は進みません。')}${blocked(unavailable||(action==='equip'?(equipped?'装備中です。':''):!home?'拠点でのみ使えます。':equipped?'装備を持ち替えてから操作してください。':action==='stashItem'&&state.stash.length>=(state.modules.includes('storage')?16:8)?'拠点の収納がいっぱいです。':action==='retrieveItem'&&carriedWeight(state)+item.carry>BALANCE.packCapacity?'携行重量がいっぱいです。':''))}`);
  }
  const b=state.combat;if(!b)return '';
  if(action==='selectCard'){
    const index=Number(value),c=combatCard(b,index);if(!c)return '';
    const range=c.range==='weapon'?[actor.weapon.minRange,actor.weapon.maxRange]:c.range;
    return box(c.name,`<p>${e(c.desc)}</p>${list([row('ST消費',`頭 ${c.headCost} / 体 ${c.bodyCost}`),...(range?[row('有効距離',`${range[0]}〜${range[1]} / 現在 ${b.distance}`)]:[]),...(c.kind==='escape'?[row('離脱距離',`${c.escapeDistance??5}以上`)]:[]),...(c.kind==='attack'?[row('ダイス',`現在の実効 ${a.execution} 個`),...abilityRows(actor,['execution'])]:[])])}${note(!isCombat(c)?'探索専用カードなので、この戦闘では使えません。':c.kind==='attack'?'ダイス数は各行動のST消費前に決まります。先の行動で疲労すると減ります。射程外でもSTを消費します。':'同じ順番の敵カードと同時に解決します。')}${blocked(b.resolved?'このラウンドは解決済みです。':!b.plan.includes(index)&&b.plan.length>=b.limits.action?'行動上限です。選んだカードを外すと追加できます。':'')}`);
  }
  if(action==='resolve')return box('この行動列で実行',`${list([row('選んだ行動',`${b.plan.length} / ${b.limits.action} 回`),row('敵の行動',`${b.enemyPlan.length} 回`),row('ST消費の合計',`頭 ${b.plan.reduce((sum,i)=>sum+combatCard(b,i).headCost,0)} / 体 ${b.plan.reduce((sum,i)=>sum+combatCard(b,i).bodyCost,0)}`)])}${note('双方の同じ順番を同時に解決。移動・回復・防御の後に攻撃します。敵の攻撃によるST減少で、後の行動が不発になることもあります。')}${blocked(b.resolved?'このラウンドは解決済みです。':validatePlan(b))}`);
  if(action==='passRound')return box('このラウンドは待機',`<p>あなたは行動せず、相手の ${b.enemyPlan.length} 回の予定だけを解決します。</p>${note('STは消費しませんが、敵からのダメージは受けます。待機だけではSTは回復しません。')}${blocked(b.plan.length?'選んだカードをすべて外すと待機できます。':'')}`);
  if(action==='nextRound')return box('次のラウンドへ',`<p>今のHP・STから知覚・判断・行動を再計算し、手札と敵の予定を新しくします。</p>${list(abilityRows(actor,['perception','judgment','action']))}${note('残った手札は持ち越しません。STは自動回復しません。')}`);
  return '';
}
