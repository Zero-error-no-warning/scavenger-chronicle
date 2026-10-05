import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, survey, searchSpot, endSearch, move, explorationProgress } from '../src/world.js';
import { scenery } from '../src/art.js';
import { beginCombat, resolveRound, prepareRound, abilities } from '../src/combat.js';
import { parseSave } from '../src/storage.js';
import { replayPhases, replayView, cardRoute, renderResolution, diceArt, enemyActionSummary, enemyAbilityInfo } from '../src/battle-presentation.js';

function battle(playerCards,enemyCards,distance=1) {
  const s=newGame(9128),b=beginCombat(s,'dog');
  b.hand=playerCards;b.plan=playerCards.map((_,i)=>i);b.limits.action=Math.max(3,playerCards.length);b.enemyPlan=enemyCards;b.enemyResolution=enemyCards.map(()=>'pending');b.distance=distance;
  return {s,b};
}
test('車は現在地に駐車中のときだけ探索・拠点画面に現れる',()=>{
  const s=newGame(12);
  assert.match(scenery(s),/scene-van/);
  move(s,6);assert.doesNotMatch(scenery(s),/scene-van/);assert.doesNotMatch(scenery(s,'road',{camp:true}),/scene-van/);
  move(s,7);assert.match(scenery(s),/scene-van/);
  move(s,6,true);assert.match(scenery(s),/scene-van/);
});
test('探索終了・再見渡し・往復・セーブ後も調査済み箇所は再取得できない',()=>{
  for(let seed=1;seed<=40;seed++) {
    let s=newGame(seed);const searched=new Set();
    while(explorationProgress(s).remaining) {
      assert.equal(survey(s),null);
      while(s.exploration.remaining&&s.exploration.spots.length) {
        const spot=s.exploration.spots[0];assert.equal(searched.has(spot.index),false);searched.add(spot.index);
        assert.equal(searchSpot(s,spot.index),null);s.combat=null;
        assert.match(searchSpot(s,spot.index),/調査済み/);
      }
      endSearch(s);s=parseSave(JSON.stringify(s));
    }
    assert.equal(searched.size,6);assert.equal(explorationProgress(s).done.length,6);
    const before=JSON.stringify(s);assert.ok(survey(s));assert.equal(JSON.stringify(s),before);
    move(s,6);move(s,7);assert.ok(survey(s));assert.equal(explorationProgress(s).remaining,0);
  }
});
test('古い候補に調査済み箇所が残っていても報酬・時間・乱数を更新しない',()=>{
  const s=newGame(23);survey(s);const spot=s.exploration.spots[0];s.world[7].used.push(spot.index);
  const before=JSON.stringify(s);assert.match(searchSpot(s,spot.index),/調査済み/);assert.equal(JSON.stringify(s),before);
  delete s.exploration.location;const loaded=parseSave(JSON.stringify(s));
  assert.equal(loaded.exploration.location,7);assert.equal(loaded.exploration.spots.some(p=>p.index===spot.index),false);assert.equal(loaded.rng,s.rng);
  s.exploration.location=6;assert.match(searchSpot(s,s.exploration.spots[1].index),/別の区画/);assert.equal(parseSave(JSON.stringify(s)).exploration,null);
});
test('同名施設の別区画は別の探索履歴を持つ',()=>{
  const s=newGame(14);s.world[6].locId='road';s.world[7].used=[0,1,2,3,4,5];move(s,6);
  assert.equal(explorationProgress(s).remaining,6);assert.equal(survey(s),null);
});
test('双方のカードは衝突し、相手が待機中の攻撃は本体へ向かう',()=>{
  const {s,b}=battle(['strike'],['guard']);const [f]=resolveRound(s,b);
  assert.equal(cardRoute(f,'player'),'clash');assert.equal(cardRoute(f,'enemy'),'clash');
  const lone=battle(['strike'],[]);const [direct]=resolveRound(lone.s,lone.b);assert.equal(cardRoute(direct,'player'),'body');assert.equal(cardRoute(direct,'enemy'),'wait');
  const recovery=battle(['breathe'],[]);assert.equal(cardRoute(resolveRound(recovery.s,recovery.b)[0],'player'),'self');
});
test('射程外・ST不足は本体への命中演出をしない',()=>{
  const miss=battle(['strike'],[],6);const [f]=resolveRound(miss.s,miss.b);assert.equal(cardRoute(f,'player'),'miss');assert.equal(f.effects.length,0);
  const failed=battle([],['heavy']);failed.b.enemy.bodyST=0;const [g]=resolveRound(failed.s,failed.b,{pass:true});assert.equal(cardRoute(g,'enemy'),'failed');assert.equal(g.effects.length,0);
  assert.deepEqual(enemyActionSummary(failed.b),{planned:1,known:true,executed:0,failed:1,cancelled:0,pending:0});
});
test('演出は移動・消費前→ダイス前→確定結果を表示し、乱数を振り直さない',()=>{
  const {s,b}=battle(['advance','strike'],['guard','strike'],3),[first,attack]=resolveRound(s,b),saved=JSON.stringify(s);
  assert.equal(first.before.distance,3);assert.equal(first.ready.distance,2);
  assert.ok(attack.before.player.bodyST>attack.ready.player.bodyST);
  assert.deepEqual(replayPhases(attack).map(p=>p.name),['cards','dice','result','impact']);
  assert.deepEqual(replayPhases(attack,{reduced:true}).map(p=>p.name),['impact']);
  for(const phase of replayPhases(attack))renderResolution(replayView(attack,phase.name));
  assert.equal(JSON.stringify(s),saved);assert.equal(replayView(attack,'dice').player.bodyHP,attack.ready.player.bodyHP);
  assert.deepEqual(replayView(attack,'cards').enemyResolution,attack.before.enemyResolution);
  assert.deepEqual(replayView(attack,'impact').enemyResolution,b.enemyResolution);
});
test('サイコロは確定した個数と出目を表示し６だけをクリティカルにする',()=>{
  const effect={side:'player',dice:[1,3,6]},html=diceArt(effect);
  assert.equal((html.match(/class="die /g)||[]).length,3);assert.equal((html.match(/critical/g)||[]).length,1);
  for(const value of effect.dice)assert.ok(html.includes(`D6の出目 ${value}`));
  const rolling=diceArt(effect,{rolling:true});assert.equal((rolling.match(/class="die rolling/g)||[]).length,3);assert.doesNotMatch(rolling,/D6の出目/);
});
test('戦闘終了で残った敵カードは未実行、実行＋不発＋未実行が予定枚数に一致する',()=>{
  const {s,b}=battle(['strike'],['guard','strike']);b.enemy.headHP=.01;b.enemy.bodyHP=0;
  resolveRound(s,b);const counts=enemyActionSummary(b);assert.equal(b.result,'victory');assert.equal(counts.executed,1);assert.equal(counts.cancelled,1);
  assert.equal(counts.executed+counts.failed+counts.cancelled+counts.pending,counts.planned);
  assert.deepEqual(parseSave(JSON.stringify(s)).combat.enemyResolution,b.enemyResolution);
});
test('敵の上限とツールチップは敵自身の開始値を使い、途中の負傷で減らない',()=>{
  const {s,b}=battle(['guard'],['guard']);assert.notEqual(b.limits.action,b.enemyLimits.action);
  const expected=b.enemyLimits.action;b.enemy.bodyHP=0;assert.equal(abilities(b.enemy).action,1);
  const info=enemyAbilityInfo(b,'action');assert.equal(info.value,expected);assert.equal(info.options.fixedValue,expected);assert.equal(info.options.roundValue,null);
  b.enemy.bodyST=0;assert.equal(enemyAbilityInfo(b,'execution').value,1);
  prepareRound(s,b);assert.equal(enemyAbilityInfo(b,'action').value,1);assert.deepEqual(b.enemyResolution,b.enemyPlan.map(()=>'pending'));
});

test('行動開始時２回の敵は負傷して現在値１でも表示と実行が２回で一致する',()=>{
  const s=newGame(192),b=beginCombat(s,'dog');assert.equal(b.enemyPlan.length,2);
  b.enemy.bodyHP=1;assert.equal(abilities(b.enemy).action,1);
  assert.equal(enemyAbilityInfo(b,'action').value,2);
  const frames=resolveRound(s,b,{pass:true});assert.equal(frames.filter(f=>f.enemyCard).length,2);
  assert.equal(enemyActionSummary(b).executed,2);
  const old=structuredClone(b);delete old.enemyLimits;delete old.enemyLimitActor;
  assert.equal(enemyAbilityInfo(old,'action').value,2);
  prepareRound(s,b);assert.equal(b.enemyLimits.action,1);assert.ok(b.enemyPlan.length<=1);
});
