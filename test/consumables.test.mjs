import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSUMABLES, RESOURCES, BALANCE } from '../src/data.js';
import { newGame, consume, craftBandage, deposit, takeSupply, rest, redraw, searchSpot } from '../src/world.js';
import { queueBattleItem, reservedItems, consumableDescription, lootResource, availableGroup, resourceWeight } from '../src/consumables.js';
import { beginCombat, resolveRound, validatePlan, abilities, prepareRound } from '../src/combat.js';
import { releaseBattle, pileError } from '../src/deck.js';
import { parseSave } from '../src/storage.js';
import { renderResolution, cardRoute, replayView } from '../src/battle-presentation.js';
import { actionHelp } from '../src/action-help.js';
const saved=s=>parseSave(JSON.stringify(s));
function battle(cards=[]){const s=newGame(9),b=beginCombat(s,'dog');releaseBattle(s);b.sharedDeck=false;b.handRefs=[];b.hand=cards;b.plan=[];b.enemyPlan=[];b.enemyResolution=[];b.revealedEnemyIndices=[];b.distance=1;return {s,b};}
for(const [key,d] of Object.entries(CONSUMABLES))test(`${d.name}は1行動で${d.target}だけを回復し、1個だけ消費する`,()=>{
  const {s,b}=battle();for(const gauge of ['headHP','bodyHP','headST','bodyST'])b.player[gauge]=1;
  s.pack[key]=1;b.supplies={...s.pack};const before={...b.player},rng=s.rng,time=s.hour;assert.equal(queueBattleItem(s,key),null);assert.equal(b.plan.length,1);assert.equal(s.pack[key],1);assert.equal(validatePlan(b),null);
  const [f]=resolveRound(s,b);for(const gauge of ['headHP','bodyHP','headST','bodyST'])assert.equal(b.player[gauge],gauge===d.target?Math.min(1+d.amount,b.player.max[gauge]):before[gauge]);
  assert.equal(s.pack[key],0);assert.equal(b.supplies[key],0);assert.equal(s.rng,rng);assert.equal(s.hour,time);assert.equal(f.playerCard,`supply:${key}`);assert.equal(f.recoveries[0].target,d.target);assert.equal(cardRoute(f,'player'),'self');assert.match(renderResolution(f,'impact'),/heal-burst/);assert.ok(renderResolution(f,'impact').includes(d.name));assert.equal(pileError(s),null);assert.deepEqual(saved(s),s);
});
test('カードとアイテムは合計5枠、同じアイテムも所有数まで予約できる',()=>{
  const {s,b}=battle(['guard','advance']);b.plan=[0,1];for(const key of ['food','food','water'])assert.equal(queueBattleItem(s,key),null);assert.equal(b.plan.length,5);assert.equal(reservedItems(b,'food'),2);assert.equal(s.pack.food,3);const before=JSON.stringify(s);assert.match(queueBattleItem(s,'bandage'),/上限/);assert.equal(JSON.stringify(s),before);
  b.plan.pop();b.plan.pop();assert.equal(reservedItems(b,'food'),1);assert.equal(queueBattleItem(s,'bandage'),null);assert.equal(s.pack.bandage,2);assert.equal(validatePlan(b),null);
});
test('予定を取り消しても消費せず、拠点在庫は戦闘で使えない',()=>{
  const {s,b}=battle();s.pack.med=1;b.supplies={...s.pack};assert.equal(queueBattleItem(s,'med'),null);const before=JSON.stringify(s);assert.match(queueBattleItem(s,'med'),/未予約/);assert.equal(JSON.stringify(s),before);b.plan=[];assert.equal(queueBattleItem(s,'med'),null);assert.equal(s.pack.med,1);
  s.pack.med=0;b.supplies.med=0;b.plan=[];assert.ok(s.baseResources.med>0);assert.match(queueBattleItem(s,'med'),/携行/);assert.match(consume(s,'med'),/行動列/);assert.equal(s.baseResources.med,2);
});
test('食事を攻撃の前に使うと後続のST不足を防ぎ、ダイスも増える',()=>{
  const {s,b}=battle(['heavy']);b.player.bodyST=4;s.pack.canned=1;b.supplies={...s.pack};b.enemy.bodyHP=b.enemy.max.bodyHP=100;b.enemy.headHP=b.enemy.max.headHP=100;
  b.plan=[0];assert.match(validatePlan(b),/ST/);b.plan=[];queueBattleItem(s,'canned');b.plan.push(0);assert.equal(validatePlan(b),null);const frames=resolveRound(s,b);assert.equal(frames.length,2);assert.equal(frames[1].effects[0].dice.length,3);assert.equal(s.pack.canned,0);assert.equal(b.player.bodyST,9);
});
test('医療箱は同じ枠の敵攻撃より先に回復し、敵の行動は省略しない',()=>{
  const {s,b}=battle();b.player.headHP=.5;b.player.bodyHP=0;b.enemy.weapon.sharpness=0;b.enemy.weapon.weight=.3;b.enemyPlan=['strike'];b.enemyResolution=['pending'];b.revealedEnemyIndices=[0];s.rng=1000000;
  queueBattleItem(s,'med');const [f]=resolveRound(s,b);assert.equal(f.before.player.headHP,.5);assert.equal(f.ready.player.headHP,3.5);assert.equal(f.effects.length,1);assert.equal(f.effects[0].side,'enemy');assert.equal(cardRoute(f,'enemy'),'body');assert.equal(b.enemyResolution[0],'played');assert.ok(b.player.headHP>0);assert.equal(b.result,null);assert.equal(s.pack.med,0);assert.deepEqual(saved(s).combat.plan,[{item:'med'}]);
});
test('HP回復は今回の固定行動上限を増やさず、次ラウンドに反映する',()=>{
  const s=newGame(9);s.vitals.bodyHP=6;const b=beginCombat(s,'dog');b.enemyPlan=[];b.enemyResolution=[];b.revealedEnemyIndices=[];assert.equal(b.limits.action,1);queueBattleItem(s,'bandage');resolveRound(s,b);assert.equal(b.player.bodyHP,12);assert.equal(abilities(b.player).action,2);assert.equal(b.limits.action,1);prepareRound(s,b);assert.equal(b.limits.action,2);assert.deepEqual(b.supplies,s.pack);saved(s);
});
test('回復は最大値で止まり、乾パンの渇き増加なども1度だけ適用する',()=>{
  const {s,b}=battle();b.player.bodyST=23;s.hunger=50;s.thirst=20;s.pack.dried=1;b.supplies={...s.pack};queueBattleItem(s,'dried');const [f]=resolveRound(s,b);assert.equal(b.player.bodyST,24);assert.equal(f.recoveries[0].amount,1);assert.equal(s.hunger,25);assert.equal(s.thirst,25);const before=JSON.stringify(s);assert.throws(()=>resolveRound(s,b));assert.equal(JSON.stringify(s),before);
});
test('先の行動で戦闘が終わったら後ろのアイテムを消費しない',()=>{
  const win=battle(['strike']);win.b.plan=[0];win.b.enemy.headHP=.1;win.b.enemy.bodyHP=0;queueBattleItem(win.s,'food');const food=win.s.pack.food;assert.equal(resolveRound(win.s,win.b).length,1);assert.equal(win.b.result,'victory');assert.equal(win.s.pack.food,food);
  const lose=battle(['advance']);lose.b.plan=[0];lose.b.player.headHP=.1;lose.b.player.bodyHP=0;lose.b.enemy.weapon.sharpness=3;lose.b.enemyPlan=['strike'];lose.b.enemyResolution=['pending'];lose.b.revealedEnemyIndices=[0];queueBattleItem(lose.s,'food');const count=lose.s.pack.food;assert.equal(resolveRound(lose.s,lose.b).length,1);assert.equal(lose.b.result,'defeat');assert.equal(lose.s.pack.food,count);assert.match(queueBattleItem(lose.s,'med'),/戦闘中/);
});
test('予定を保存しても消費せず、再読み込み後の解決が同一で再消費しない',()=>{
  const {s,b}=battle(['strike']);b.player.bodyST=5;queueBattleItem(s,'food');b.plan.push(0);const copy=saved(s);assert.equal(copy.pack.food,s.pack.food);assert.deepEqual(copy.combat.plan,[{item:'food'},0]);assert.equal(copy.rng,s.rng);assert.deepEqual(resolveRound(s,b),resolveRound(copy,copy.combat));assert.deepEqual(saved(s),saved(copy));const settled=saved(s),before=JSON.stringify(settled);assert.throws(()=>resolveRound(settled,settled.combat));assert.equal(JSON.stringify(settled),before);
});
test('旧セーブに新アイテムの0個を補い、物資・乱数・手札・予定を保つ',()=>{
  const {s,b}=battle(['strike']);b.plan=[0];const oldKeys=['food','water','med','cloth','fuel','scrap'];for(const resources of [s.pack,s.baseResources])for(const key of Object.keys(resources))if(!oldKeys.includes(key))delete resources[key];delete b.supplies;const rng=s.rng,plan=structuredClone(b.plan),loaded=saved(s);assert.equal(loaded.rng,rng);assert.deepEqual(loaded.combat.plan,plan);assert.equal(loaded.pack.food,3);assert.equal(loaded.pack.med,1);assert.equal(loaded.pack.bandage,0);assert.equal(loaded.baseResources.firstaid,0);assert.deepEqual(loaded.combat.supplies,loaded.pack);assert.deepEqual(saved(loaded),loaded);
});
test('所持数を超えた予約・不正な予定・負の個数を拒否し、実行失敗では何も変えない',()=>{
  const {s,b}=battle(['guard']);for(const plan of [[{item:'unknown'}],[{item:'food',amount:99}],[{item:'med'},{item:'med'}],[0,0],[-1]]){const bad=structuredClone(s);bad.combat.plan=plan;assert.throws(()=>saved(bad));}
  for(const value of [-1,1.5,null]){const bad=structuredClone(s);bad.pack.bandage=value;assert.throws(()=>saved(bad));}
  queueBattleItem(s,'food');s.pack.food=0;const before=JSON.stringify(s);assert.throws(()=>resolveRound(s,b),/アイテム/);assert.equal(JSON.stringify(s),before);assert.match(queueBattleItem(s,'cloth'),/回復アイテム/);
});
test('探索中にも4種の対応ゲージを回復し、医療箱は体HPを回復しない',()=>{
  for(const key of ['food','water','bandage','med']){const s=newGame(9);s.vitals={headHP:1,bodyHP:1,headST:1,bodyST:1};const before={...s.vitals},d=CONSUMABLES[key],rng=s.rng;assert.equal(consume(s,key),null);for(const gauge of Object.keys(before))assert.equal(s.vitals[gauge],gauge===d.target?Math.min(1+d.amount,BALANCE.player[gauge]):1);assert.equal(s.rng,rng);saved(s);}
});
test('バリエーションを預け入れ・持ち出しでき、種類ごとの重量上限を守る',()=>{
  const s=newGame(9);s.pack.canned=2;const total=s.pack.canned+s.baseResources.canned;assert.equal(deposit(s),null);assert.equal(s.pack.canned,0);assert.equal(s.baseResources.canned,total);assert.equal(takeSupply(s,'canned'),null);assert.equal(s.pack.canned,1);assert.equal(resourceWeight('canned'),.3);
  s.pack.scrap=65;const before=JSON.stringify(s);assert.match(takeSupply(s,'firstaid'),/重量/);assert.equal(JSON.stringify(s),before);
});
test('布から包帯を1時間で作り、持ち出して使える',()=>{
  const s=newGame(9),cloth=s.baseResources.cloth,bandages=s.baseResources.bandage;assert.equal(craftBandage(s),null);assert.equal(s.baseResources.cloth,cloth-1);assert.equal(s.baseResources.bandage,bandages+1);assert.equal(s.hour,9);assert.equal(takeSupply(s,'bandage'),null);s.vitals.bodyHP=10;assert.equal(consume(s,'bandage'),null);assert.equal(s.vitals.bodyHP,16);s.location=6;const before=JSON.stringify(s);assert.match(craftBandage(s),/拠点/);assert.equal(JSON.stringify(s),before);saved(s);
});
test('休息には保存食と水以外の食事・飲み物も使える',()=>{
  const s=newGame(9);for(const resources of [s.pack,s.baseResources])for(const [key,d] of Object.entries(CONSUMABLES))if(['food','water'].includes(d.category))resources[key]=0;s.pack.canned=1;s.pack.tea=1;assert.equal(availableGroup(s,'food',true),1);assert.equal(rest(s),null);assert.equal(s.pack.canned,0);assert.equal(s.pack.tea,0);assert.equal(s.hour,14);saved(s);
});
test('食品棚や医療物資から全回復バリエーションが抽選される',()=>{
  const found=new Set();for(let seed=1;seed<=300;seed++)for(const key of ['food','water','med']){const s={rng:seed*71234567>>>0};found.add(lootResource(s,key,false));}
  for(const key of Object.keys(CONSUMABLES))assert.ok(found.has(key),key);
  let variant=false;for(let seed=1;seed<=60&&!variant;seed++){const s=newGame(9);s.world[7].locId='mart';s.world[7].discovered=[1,3];s.rng=1000000;redraw(s);if(s.combat)continue;s.rng=seed*71234567>>>0;const i=s.exploration.hand.findIndex(r=>r.key==='sweep');if(i<0)continue;searchSpot(s,1,i);const loot=s.lastCheck.loot;if(loot?.kind==='resource'&&['ration','canned','dried','tea'].includes(loot.key)){assert.equal(s.pack[loot.key],loot.quantity);assert.equal(RESOURCES[loot.key].name,CONSUMABLES[loot.key].name);saved(s);variant=true;}}assert.ok(variant);
});
test('アイテムとその演出・説明は表示するだけで消費や乱数を変えない',()=>{
  const {s,b}=battle();queueBattleItem(s,'bandage');const before=JSON.stringify(s),help=actionHelp(s,'queueSupply','bandage');assert.match(help,/体HP＋6/);assert.match(help,/行動列の1枠/);assert.equal(JSON.stringify(s),before);const [frame]=resolveRound(s,b),settled=JSON.stringify(s);for(const phase of ['cards','impact'])renderResolution(replayView(frame,phase));assert.equal(JSON.stringify(s),settled);
});
