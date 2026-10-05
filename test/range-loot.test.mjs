import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, redraw, searchSpot, searchOption } from '../src/world.js';
import { WEAPONS, BALANCE, CARD_TYPES, ENEMIES } from '../src/data.js';
import { makeItem, carriedWeight } from '../src/items.js';
import { abilities, playerActor, beginCombat, resolveRound } from '../src/combat.js';
import { releaseBattle } from '../src/deck.js';
import { parseSave } from '../src/storage.js';
import { renderLoot, lootSummary } from '../src/loot-presentation.js';
import { abilityHelp } from '../src/ability-help.js';
const saved=s=>parseSave(JSON.stringify(s));
function search(rng=1000000){const s=newGame(9);s.world[7].discovered=[2];s.rng=1000000;redraw(s);s.rng=rng;return s;}
function runSearch(s){const i=s.exploration.hand.findIndex((r,i)=>!searchOption(s,2,i).error&&CARD_TYPES[r.key].kind!=='recover');assert.ok(i>=0);assert.equal(searchSpot(s,2,i),null);return s.lastCheck.loot;}
function battle(distance=0){const s=newGame(9),b=beginCombat(s,'dog');releaseBattle(s);b.sharedDeck=false;b.handRefs=[];b.hand=['strike'];b.plan=[0];b.enemyPlan=[];b.enemyResolution=[];b.revealedEnemyIndices=[];b.distance=distance;return {s,b};}

test('全通常武器は0〜1、長すぎる修飾は1〜2で加算する',()=>{
  for(const base of WEAPONS){const s=newGame(9),normal=makeItem(s,base.id,['sharp','balanced']),long=makeItem(s,base.id,['sharp','long']);assert.deepEqual([normal.minRange,normal.maxRange],[0,1]);assert.deepEqual([long.minRange,long.maxRange],[1,2]);}
});
test('密着した敵に通常攻撃が命中し、長い武器は距離を取って攻撃する',()=>{
  const close=battle();assert.equal(resolveRound(close.s,close.b)[0].effects[0].dice.length,4);
  for(const distance of [0,1,2,3]){const {s,b}=battle(distance);b.player.weapon=makeItem(s,'broom','long');const frame=resolveRound(s,b)[0];assert.equal(frame.effects.length,[1,2].includes(distance)?1:0);}
});
test('戦闘のみ基礎ダイスを倍にし、装備補正・疲労・最低1個を適用する',()=>{
  const s=newGame(9);assert.equal(abilities(playerActor(s)).execution,2);assert.equal(abilities(playerActor(s,{battle:true})).execution,4);
  const heavy=makeItem(s,'broom','heavy');s.inventory.push(heavy);s.equipment.weapon=heavy.id;const actor=playerActor(s,{battle:true});assert.equal(abilities(actor).execution,3);actor.bodyST=12;assert.equal(abilities(actor).execution,2);actor.bodyST=0;assert.equal(abilities(actor).execution,1);
  const b=beginCombat(s,'dog'),help=abilityHelp(b.player,'execution',{battle:true});assert.match(help,/戦闘の基礎値<\/span><b>4/);assert.match(help,/重すぎる/);
  for(const def of ENEMIES){const state=newGame(9),enemy=beginCombat(state,def.id).enemy;assert.equal(abilities(enemy).execution,def.stats[3]*2);}
});
test('旧セーブの所有・保管・探索・戦闘の射程とダイスを乱数や予定を変えず移行する',()=>{
  const s=search(),extra=makeItem(s,'umbrella','long');s.stash.push(extra);
  for(const i of [...s.inventory,...s.stash])if(['broom','umbrella','shovel'].includes(i.baseId)){i.minRange++;i.maxRange++;}
  const exploration=structuredClone(s);const migratedEx=saved(exploration);assert.deepEqual([migratedEx.exploration.abilityActor.weapon.minRange,migratedEx.exploration.abilityActor.weapon.maxRange],[0,1]);assert.equal(migratedEx.exploration.stats.execution,2);
  const b=beginCombat(s,'dog');for(const a of [b.player,b.limitActor])a.base.execution=2;for(const a of [b.enemy,b.enemyLimitActor])a.base.execution=1;b.limits.execution=2;b.enemyLimits.execution=1;
  const before={rng:s.rng,serial:s.serial,hand:b.hand,plan:b.enemyPlan,revealed:b.revealedEnemyIndices,history:b.history};const migrated=saved(s),mb=migrated.combat;
  assert.deepEqual({rng:migrated.rng,serial:migrated.serial,hand:mb.hand,plan:mb.enemyPlan,revealed:mb.revealedEnemyIndices,history:mb.history},before);
  assert.equal(mb.limits.execution,4);assert.equal(mb.enemyLimits.execution,2);assert.equal(mb.limitActor.base.execution,4);assert.equal(mb.player.weapon.minRange,0);assert.equal(mb.playerTools.find(x=>x.baseId==='broom').minRange,0);assert.deepEqual([migrated.stash[0].minRange,migrated.stash[0].maxRange],[1,2]);assert.deepEqual(saved(migrated),migrated);
});
test('旧標準射程以外の武器設定はセーブ移行で上書きしない',()=>{const s=newGame(9),item=s.inventory[0];item.minRange=0;item.maxRange=3;assert.equal(saved(s).inventory[0].maxRange,3);});
for(const [rng,type] of [[7000000,'tool'],[9000000,'armor'],[10000000,'weapon']])test(`探索の${type}回収を名前・画像とともに保存し、描画で状態を変更しない`,()=>{
  const s=search(rng),count=s.inventory.length,loot=runSearch(s);assert.equal(loot.kind,'item');assert.equal(loot.item.type,type);assert.equal(loot.quantity,1);assert.equal(s.inventory.length,count+1);assert.deepEqual(s.inventory.at(-1),loot.item);
  const before=JSON.stringify(s),html=renderLoot(loot);assert.match(html,/回収しました/);assert.ok(html.includes(loot.item.name));assert.match(html,/assets\/art\//);assert.match(html,/×1/);assert.equal(JSON.stringify(s),before);assert.deepEqual(saved(s).lastCheck.loot,loot);
});
test('資源の良品3個回収と通常1個回収を保存する',()=>{
  for(const [rng,quantity] of [[1000000,3],[6000000,1]]){const s=search(rng),before={...s.pack},loot=runSearch(s);assert.equal(loot.kind,'resource');assert.equal(loot.quantity,quantity);assert.equal(s.pack[loot.key]-before[loot.key],quantity);assert.match(renderLoot(loot),new RegExp(`×${quantity}`));assert.deepEqual(saved(s).lastCheck.loot,loot);}
});
test('荷重上限による未回収と一部回収を成功と区別して表示する',()=>{
  for(const [rng,slots] of [[7000000,0],[1000000,0],[1000000,1]]){const s=search(rng);s.pack.scrap+=Math.floor((BALANCE.packCapacity-carriedWeight(s))/.15+1e-6)-slots;const pack={...s.pack},count=s.inventory.length,loot=runSearch(s);assert.equal(loot.quantity,slots);assert.ok(carriedWeight(s)<=12);if(!slots){assert.match(renderLoot(loot),/未回収/);assert.match(lootSummary(loot),/回収できませんでした/);assert.deepEqual(s.pack,pack);assert.equal(s.inventory.length,count);}else{assert.equal(loot.offered,3);assert.match(renderLoot(loot),/上限まで1個/);}assert.deepEqual(saved(s).lastCheck.loot,loot);}
});
test('失敗・回復では回収表示を残さず、再探索で過去の成果を重複取得しない',()=>{
  const s=search(7000000);runSearch(s);const before=JSON.stringify(s);assert.match(searchSpot(s,2,null),/調査済み/);assert.equal(JSON.stringify(s),before);
  let failures=0;for(let rng=1000000;rng<=15000000;rng+=1000000){const f=search(rng);searchSpot(f,2,null);if(!f.lastCheck.success){failures++;assert.equal(f.lastCheck.loot,undefined);saved(f);}}assert.ok(failures>0);
  const recovery=search(),i=recovery.exploration.hand.findIndex(r=>CARD_TYPES[r.key].kind==='recover');assert.ok(i>=0);searchSpot(recovery,2,i);assert.equal(recovery.lastCheck.loot,undefined);saved(recovery);
});
test('不正な成果データを拒否し、成果を持たない旧判定は読み込める',()=>{
  const s=search();runSearch(s);const old=structuredClone(s);delete old.lastCheck.loot;assert.doesNotThrow(()=>saved(old));
  for(const loot of [null,{kind:'resource',key:'unknown',quantity:1,offered:1},{kind:'resource',key:'food',quantity:4,offered:3},{kind:'resource',key:'food',quantity:2,offered:1},{kind:'item',item:{},quantity:1,offered:1}]){const bad=structuredClone(s);bad.lastCheck.loot=loot;assert.throws(()=>saved(bad));}
});
