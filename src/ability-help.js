import { BALANCE, WEAPONS, ARMOR } from './data.js?v=0.2.4';
import { abilityBreakdown } from './combat.js?v=0.2.4';
import { itemModifiers } from './items.js?v=0.2.4';
import { escapeHTML as e } from './art.js?v=0.2.4';

export const abilityNames={perception:'知覚',judgment:'判断',action:'行動',execution:'実効'};
const gaugeNames={headHP:'頭HP',headST:'頭ST',bodyHP:'体HP',bodyST:'体ST'};
const number=n=>Number(n.toFixed(2));
const signed=n=>`${n>=0?'+':''}${number(n)}`;
export function abilityHelp(actor,key,{battle=false,frozen=false,missingSnapshot=false,fixedValue=null,remaining=null,roundValue=null}={}) {
  const d=abilityBreakdown(actor)[key],player=actor.visual==='player';
  let sources='';
  if(player){
    const baseValue=battle&&key==='execution'?BALANCE.combatExecution.player:BALANCE.player[key];
    sources=`<li><span>${battle&&key==='execution'?'戦闘の基礎値':'基礎値'}</span><b>${baseValue}</b></li>`;
    let accounted=baseValue;
    for(const item of [actor.armor.head,actor.armor.body,actor.weapon]){
      const delta=item.stats?.[key]||0;if(!delta)continue;accounted+=delta;
      const original=[...WEAPONS,...ARMOR].find(x=>x.id===item.baseId)?.stats?.[key]||0;
      const parts=[original?`装備本体 ${signed(original)}`:'',...itemModifiers(item).filter(m=>m.stats?.[key]).map(m=>`${m.name} ${signed(m.stats[key])}`)].filter(Boolean);
      sources+=`<li><span>${e(item.name||'装備')}<small>${e(parts.join(' / '))}</small></span><b>${signed(delta)}</b></li>`;
    }
    if(accounted!==d.base)sources+=`<li><span>その他の補正</span><b>${signed(d.base-accounted)}</b></li>`;
  }else sources=`<li><span>相手の基礎値</span><b>${d.base}</b></li>`;
  let use=battle?{perception:'敵の予定を公開する枚数',judgment:'このラウンドに引く手札枚数',action:'このラウンドに実行できるカード枚数',execution:'攻撃で振る６面ダイス数'}[key]:{perception:'一度の見渡しで新しく発見する探索箇所数',judgment:'見渡し・引き直しで引く手札枚数',action:'見渡し・引き直し後に行える探索・回復の回数（基本探索も1回）',execution:'カード探索で振るD6の合計個数。基本1D6に追加ダイスと道具補正を加えます。カード不要の基本探索は常に1D6'}[key];
  const value=fixedValue??d.value;
  let extra='';
  if(remaining!==null)extra+=`<p class="ability-use">開始時 ${value}回 − 使用済み ${value-remaining}回 ＝ 残り <b>${remaining}回</b></p>`;
  if(battle&&!frozen&&roundValue!==null)extra+=`<p class="ability-use">今回のラウンドの確定値は <b>${roundValue}</b>。途中の変化は次のラウンドに反映されます。</p>`;
  if(battle&&key==='perception')extra+='<p class="ability-use">行動列の中からランダムな位置を公開します。公開位置はこのラウンド中に変わりません。敵の予定枚数より多い分は公開に使いません。</p>';
  if(battle&&key==='execution')extra+='<p class="ability-use">各行動のST消費前に計算。前の行動で疲れると、後の攻撃のダイスが減ります。</p>';
  return `<div class="ability-help-title"><b>${abilityNames[key]}</b><strong>${value}</strong></div><p>${use}</p>${missingSnapshot?'<p class="ability-use">開始時の内訳は未記録です。以下は現在の参考値です。</p>':''}<ul class="ability-sources">${sources}</ul><div class="ability-formula">装備補正後 <b>${d.base}</b>${d.effectiveBase!==d.base?` → 下限補正 ${d.effectiveBase}`:''}<br>${gaugeNames[d.gauge]} <b>${d.current} / ${d.maximum}</b>（${number(d.ratio*100)}%）<br>${d.effectiveBase} × ${d.current} ÷ ${d.maximum} → 切り上げ <b>${d.value}</b><small>最低${d.min}を保証</small></div>${frozen?`<p class="ability-use">開始時の値を固定。次の${battle?'ラウンド':'見渡し'}で更新されます。</p>`:''}${extra}`;
}
