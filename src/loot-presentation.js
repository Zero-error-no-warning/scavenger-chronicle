import { RESOURCES } from './data.js?v=0.2.4';
import { icon, weaponArt, armorArt, toolArt, escapeHTML as e } from './art.js?v=0.2.4';

export function lootSummary(loot) {
  const name=loot.kind==='item'?loot.item.name:RESOURCES[loot.key].name;
  return loot.quantity?`${name} ×${loot.quantity}を回収${loot.quantity<loot.offered?'（一部は携行重量超過）':''}`:`${name}を発見 · 携行重量がいっぱいで回収できませんでした`;
}
export function renderLoot(loot) {
  const item=loot.kind==='item'?loot.item:null,name=item?item.name:RESOURCES[loot.key].name;
  const art=item?(item.type==='weapon'?weaponArt(item):item.type==='tool'?toolArt(item):armorArt(item)):icon(RESOURCES[loot.key].icon);
  return `<section class="loot-result" aria-label="探索で見つけたもの"><h4>${loot.quantity?'回収しました':'見つけたもの'}</h4><div class="loot-found">${art}<div><strong>${e(name)}</strong><b>×${loot.quantity}${!loot.quantity?'（未回収）':''}</b></div></div><p>${!loot.quantity?'携行重量がいっぱいで回収できませんでした。':loot.quantity<loot.offered?`${loot.offered}個を発見。携行重量の上限まで${loot.quantity}個を回収しました。`:item?'持ち物に追加しました。拠点で装備やデッキを見直せます。':'携行物資に追加しました。'}</p></section>`;
}
