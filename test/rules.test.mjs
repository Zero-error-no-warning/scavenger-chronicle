import { releaseBattle, resetPile } from '../src/deck.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, move, survey, searchSpot, deposit, depositSupply, takeSupply, install, rest, equip, neighbors, nextRegion, roadObstacle, clearRoadObstacle, atMapEdge } from '../src/world.js';
import { abilities, abilityBreakdown, beginCombat, damageDice, resolveRound, prepareRound, validatePlan, inRange, playerActor } from '../src/combat.js';
import { makeItem, generateItem, carriedWeight } from '../src/items.js';
import { validateSave, parseSave } from '../src/storage.js';
import { CARD_TYPES, BALANCE } from '../src/data.js';
import { mapLayout, renderMap } from '../src/map.js';
import { abilityHelp } from '../src/ability-help.js';
import { actionHelp } from '../src/action-help.js';
const fresh=()=>newGame(218341);
const dummy=()=>({headHP:10,bodyHP:30,headST:16,bodyST:24,armor:{head:{hardness:0,softness:2},body:{hardness:0,softness:2}}});
function battle(cards,enemyCards=[],distance=1) {
  const s=fresh(),b=beginCombat(s,'dog');releaseBattle(s);b.sharedDeck=false;b.handRefs=[];b.hand=cards;b.plan=cards.map((_,i)=>i);b.enemyPlan=enemyCards;b.enemyResolution=enemyCards.map(()=>'pending');b.revealedEnemyIndices=enemyCards.map((_,i)=>i).slice(0,b.limits.perception);b.distance=distance;b.limits.action=Math.max(3,cards.length);
  return {s,b};
}
test('出目３・６は体に３、頭に６の独立したダメージ',()=>{
  const a=dummy(),r=damageDice(a,{sharpness:0,weight:2},[3,6]);
  assert.equal(a.bodyHP,27);assert.equal(a.headHP,4);assert.equal(a.bodyST,21);assert.equal(a.headST,10);assert.deepEqual(r.hits.map(h=>h.part),['body','head']);
});
test('クリティカルは頭防具、通常打撃は体防具で計算する',()=>{
  const a=dummy();a.armor.head={hardness:4,softness:4};a.armor.body={hardness:0,softness:2};
  const r=damageDice(a,{sharpness:2,weight:2},[3,6]);assert.equal(r.bodyHP,9);assert.equal(r.headHP,3);
});
test('体HPを超えたダメージを頭へ転送、ST超過は転送しない',()=>{
  const a=dummy();a.bodyHP=2;a.bodyST=0;
  damageDice(a,{sharpness:0,weight:2},[3]);assert.equal(a.bodyHP,0);assert.equal(a.headHP,9);assert.equal(a.headST,16);
});
test('体HP０では通常打撃をすべて頭で受ける',()=>{
  const a=dummy();a.bodyHP=0;damageDice(a,{sharpness:0,weight:2},[4]);assert.equal(a.headHP,6);
});
test('柔らかさ０を与えても無限大にならない',()=>{
  const a=dummy();a.armor.body.softness=0;const r=damageDice(a,{sharpness:0,weight:2},[2]);assert.equal(r.bodyHP,4);assert.ok(Number.isFinite(a.bodyHP));
});
test('防御はHP・STを両方半減',()=>{
  const a=dummy(),r=damageDice(a,{sharpness:0,weight:2},[4],1,true);assert.equal(r.bodyHP,2);assert.equal(r.bodyST,2);
});
test('負傷と疲労は別々の能力を低下させ、最低値を守る',()=>{
  const a=playerActor(fresh());a.headHP=0;a.bodyHP=0;a.headST=0;a.bodyST=0;
  assert.deepEqual(abilities(a),{perception:0,judgment:1,action:1,execution:1});
  a.headHP=5;a.bodyHP=15;a.headST=8;a.bodyST=12;
  assert.deepEqual(abilities(a),{perception:1,judgment:4,action:3,execution:1});
});
test('双方の同時移動を合算した距離を使う',()=>{
  const {s,b}=battle(['advance'],['retreat'],3);resolveRound(s,b);assert.equal(b.distance,3);
});
test('先に移動してから射程を判定する',()=>{
  const {s,b}=battle(['advance','strike'],[],2);const frames=resolveRound(s,b);assert.equal(frames[1].effects.length,1);assert.equal(b.distance,1);
});
test('射程外でもコストを払い、ダメージを与えない',()=>{
  const {s,b}=battle(['strike'],[],6);const hp=b.enemy.bodyHP,st=b.player.bodyST;resolveRound(s,b);assert.equal(b.enemy.bodyHP,hp);assert.equal(b.player.bodyST,st-2);
});
test('途中のST消費により後続行動のダイス数が減る',()=>{
  const {s,b}=battle(['strike','strike'],[],1);b.player.bodyST=7;b.enemy.headHP=b.enemy.max.headHP=100;b.enemy.bodyHP=b.enemy.max.bodyHP=100;
  const frames=resolveRound(s,b);assert.equal(frames[0].effects[0].dice.length,2);assert.equal(frames[1].effects[0].dice.length,1);
});
test('同じ行動枠の攻撃は相打ちを許す',()=>{
  const {s,b}=battle(['strike'],['strike'],1);b.player.headHP=b.enemy.headHP=.1;b.player.bodyHP=b.enemy.bodyHP=0;
  resolveRound(s,b);assert.equal(b.result,'mutual');assert.equal(b.player.headHP,0);assert.equal(b.enemy.headHP,0);
});
test('離脱は距離を２広げ、移動後に距離６なら成功する',()=>{
  let x=battle(['escape'],[],3);resolveRound(x.s,x.b);assert.equal(x.b.distance,5);assert.equal(x.b.result,null);
  x=battle(['escape'],[],4);resolveRound(x.s,x.b);assert.equal(x.b.distance,6);assert.equal(x.b.result,'escaped');
  x=battle(['escape'],['advance'],4);resolveRound(x.s,x.b);assert.equal(x.b.distance,5);assert.equal(x.b.result,null);
  x=battle(['escape'],['advance'],5);resolveRound(x.s,x.b);assert.equal(x.b.distance,6);assert.equal(x.b.result,'escaped');
});
test('コスト不足の計画は実行前に拒否し、回復を挟めば実行できる',()=>{
  const {s,b}=battle(['heavy'],[],1);b.player.bodyST=1;assert.ok(validatePlan(b));assert.throws(()=>resolveRound(s,b));
  b.hand=['breathe','heavy'];b.plan=[0,1];assert.equal(validatePlan(b),null);resolveRound(s,b);assert.equal(b.resolved,true);
});
test('解決済みのラウンドは再実行・振り直しできない',()=>{
  const {s,b}=battle(['guard']);resolveRound(s,b);assert.throws(()=>resolveRound(s,b));prepareRound(s,b);assert.equal(b.resolved,false);
});
test('STが尽きて有料カードしか引けなくても待機で次へ進める',()=>{
  const {s,b}=battle(['heavy'],[],3);b.player.headST=b.player.bodyST=0;b.plan=[];
  const frames=resolveRound(s,b,{pass:true});assert.equal(frames.length,1);assert.equal(b.player.headHP,10);assert.equal(b.resolved,true);assert.ok(frames[0].messages[0].includes('待機'));prepareRound(s,b);assert.equal(b.round,2);
});
test('セーブ往復は手札・敵の予定・乱数を保持し同じ結果になる',()=>{
  const {s,b}=battle(['throw','guard'],['advance','throw'],3);
  const copy=parseSave(JSON.stringify(s));assert.deepEqual(copy.combat.enemyPlan,b.enemyPlan);
  assert.deepEqual(resolveRound(s,b),resolveRound(copy,copy.combat));assert.equal(s.rng,copy.rng);validateSave(s);
});
test('複数修飾子の効果を合算し、同じ修飾子を重複適用しない',()=>{
  const s=fresh(),item=makeItem(s,'knife',['sharp','long','rusty','sharp']);
  assert.equal(item.modifiers.length,3);assert.equal(item.sharpness,1.6);assert.equal(item.weight,.5);assert.equal(item.minRange,1);assert.equal(item.maxRange,2);assert.equal(item.stats.action,-1);
});
test('複数修飾子の適用順で下限処理による差が出ない',()=>{
  const s=fresh();const a=makeItem(s,'broom',['balanced','sharp','rusty']),b=makeItem(s,'broom',['rusty','sharp','balanced']);
  for(const key of ['sharpness','weight','carry'])assert.equal(a[key],b[key]);
});
test('生成した修飾子装備を装備してセーブできる',()=>{
  const s=fresh();let multiple=0;
  for(let i=0;i<60;i++){const item=generateItem(s,i%2===0);if(item.modifiers.length>1)multiple++;assert.ok(item.modifiers.length<=BALANCE.maxModifiers);s.inventory.push(item);}
  assert.ok(multiple>10);validateSave(s);
});
test('装備変更は能力とキャラクター装備を一緒に更新する',()=>{
  const s=fresh(),old=playerActor(s),knife=s.inventory.find(x=>x.baseId==='knife');equip(s,knife.id);
  assert.equal(abilities(playerActor(s)).action,abilities(old).action-1);assert.equal(playerActor(s).weapon.id,knife.id);
});
test('移動は隣接のみ、徒歩では拠点を動かさない',()=>{
  const s=fresh();assert.ok(move(s,0));assert.equal(s.location,7);assert.equal(move(s,6),null);assert.equal(s.location,6);assert.equal(s.baseLocation,7);assert.ok(s.world[6].seen);
});
test('クルマは修理前は動かず、修理後は燃料1・30分で人と一緒に移動する',()=>{
  const s=fresh(),fuel=s.pack.fuel+s.baseResources.fuel,hour=s.hour;assert.match(move(s,12,true),/故障/);s.modules.push('engine');assert.equal(move(s,12,true),null);assert.equal(s.location,s.baseLocation);assert.equal(s.pack.fuel+s.baseResources.fuel,fuel-1);assert.equal(s.hour,hour+.5);
});
test('探索は知覚の数だけ箇所を発見し判断の数だけ手札を引く',()=>{
    const s=newGame(1);assert.equal(survey(s),null);assert.equal(s.exploration.spots.length,2);assert.equal(s.exploration.hand.length,8);assert.equal(s.exploration.remaining,5);assert.equal(s.hour,9);validateSave(s);
  });
test('資源の預け入れは総量を保持する',()=>{
  const s=fresh(),before=s.pack.food+s.baseResources.food;deposit(s);assert.equal(s.pack.food,0);assert.equal(s.baseResources.food,before);
});
test('設備設置は材料消費・重複拒否・拠点条件を守る',()=>{
  const s=fresh();s.baseResources.cloth=3;assert.equal(install(s,'bed'),null);assert.ok(s.modules.includes('bed'));assert.ok(install(s,'bed'));move(s,6);assert.ok(install(s,'filter'));
});
test('寝床の回復と食料・水の消費',()=>{
  const s=fresh();s.modules.push('bed');s.vitals.headHP=3;s.vitals.bodyHP=5;s.vitals.headST=1;s.vitals.bodyST=1;
  const food=s.pack.food+s.baseResources.food;assert.equal(rest(s),null);assert.equal(s.vitals.headHP,6);assert.equal(s.vitals.bodyHP,15);assert.equal(s.vitals.headST,16);assert.equal(s.vitals.bodyST,24);assert.equal(s.pack.food+s.baseResources.food,food-1);validateSave(s);
});
test('次の街へは修理済みクルマでマップ端にいる時だけ進める',()=>{
  const s=fresh();assert.equal(atMapEdge(s),false);assert.ok(nextRegion(s));s.modules.push('engine');assert.ok(nextRegion(s));s.location=s.baseLocation=0;const gear=JSON.stringify(s.inventory);assert.equal(nextRegion(s),null);assert.equal(s.region,2);assert.equal(JSON.stringify(s.inventory),gear);assert.ok(s.modules.includes('engine'));assert.equal(s.location,7);
});
test('道路障害はHPを持ち、適切な道具で削り切るまでクルマを止める',()=>{
  const s=fresh();s.modules.push('engine');const crowbar=s.inventory.find(i=>i.baseId==='crowbar');const block=roadObstacle(s,7,6);assert.ok(block);assert.equal(block.hp,4);assert.match(move(s,6,true),/道路を塞/);assert.equal(clearRoadObstacle(s,6,crowbar.id),null);assert.equal(roadObstacle(s,7,6).hp,2);assert.equal(clearRoadObstacle(s,6,crowbar.id),null);assert.equal(roadObstacle(s,7,6),null);assert.equal(move(s,6,true),null);
});
test('手持ち資源と車載収納は1個ずつ相互に出し入れできる',()=>{
  const s=fresh(),pack=s.pack.food,stored=s.baseResources.food;assert.equal(takeSupply(s,'food'),null);assert.equal(s.pack.food,pack+1);assert.equal(s.baseResources.food,stored-1);assert.equal(depositSupply(s,'food'),null);assert.equal(s.pack.food,pack);assert.equal(s.baseResources.food,stored);
});
test('破損セーブ・未知カード・不正装備を読んでも拒否する',()=>{
  assert.throws(()=>parseSave('{}'));
  const s=fresh();s.equipment.head='not-found';assert.throws(()=>validateSave(s));
  const bstate=fresh();beginCombat(bstate,'dog');bstate.combat.hand.push('unknown');assert.throws(()=>validateSave(bstate));
});
test('地図描画はゲーム乱数とセーブ状態を変更せず、再読み込みでも同じ配置',()=>{
  const s=fresh(),before=JSON.stringify(s),layout=mapLayout(s);
  renderMap(s);assert.equal(JSON.stringify(s),before);assert.deepEqual(mapLayout(parseSave(before)),layout);
  assert.equal(layout.nodes.length,15);assert.equal(layout.roads.length,22);
  for(const road of layout.roads)assert.ok(neighbors(road.a.id).includes(road.b.id));
  move(s,6);assert.deepEqual(mapLayout(s).nodes.map(({id,x,y})=>({id,x,y})),layout.nodes.map(({id,x,y})=>({id,x,y})));
});
test('装備補正と傷の計算内訳は実際の能力値に一致する',()=>{
  const s=fresh();equip(s,s.inventory.find(i=>i.baseId==='knife').id);s.vitals.bodyHP=15;
  const actor=playerActor(s),detail=abilityBreakdown(actor).action;
  assert.equal(detail.base,4);assert.equal(detail.ratio,.5);assert.equal(detail.value,2);
  assert.match(abilityHelp(actor,'action'),/長すぎる/);assert.match(abilityHelp(actor,'action'),/15 \/ 30/);
  actor.base.action=-3;assert.equal(abilityBreakdown(actor).action.value,1);
});
test('ラウンド開始時の内訳は途中の疲労と区別され、セーブに残る',()=>{
  const s=fresh(),b=beginCombat(s,'dog'),before=structuredClone(b.limitActor);
  b.player.headST=0;assert.equal(abilities(b.player).judgment,1);assert.equal(b.limits.judgment,8);
  const copy=parseSave(JSON.stringify(s));assert.deepEqual(copy.combat.limitActor,before);
  prepareRound(s,b);assert.equal(b.limitActor.headST,0);assert.equal(b.limits.judgment,1);
  delete copy.combat.limitActor;assert.doesNotThrow(()=>validateSave(copy));
});
test('探索開始時の回数と内訳は回復カード使用による時間経過でも固定される',()=>{
    const s=newGame(1);survey(s);const basis=structuredClone(s.exploration.abilityActor),i=s.exploration.hand.findIndex(r=>r.key==='breathe');
    s.rng=1000000;assert.equal(searchSpot(s,null,i),null);assert.deepEqual(s.exploration.abilityActor,basis);assert.equal(s.exploration.remaining,4);assert.deepEqual(parseSave(JSON.stringify(s)).exploration.abilityActor,basis);
  });
  test('操作の説明は乱数・物資・回数を変更せず実際のカード判定を説明する',()=>{
    const s=newGame(9);survey(s);s.vitals.bodyST=13;s.hunger=79;const before=JSON.stringify(s),spot=s.exploration.spots[0],i=s.exploration.hand.findIndex(r=>r.key==='sweep');
    assert.match(actionHelp(s,'survey'),/1 時間/);assert.match(actionHelp(s,'redraw'),/未解決/);assert.match(actionHelp(s,'useSearchCard',`${spot.index}:${i}`),/D6/);assert.match(actionHelp(s,'useSearchCard',`${spot.index}:${i}`),/遭遇率/);
    actionHelp(s,'rest');actionHelp(s,'install','bed');actionHelp(s,'move',6);assert.equal(JSON.stringify(s),before);
  });
