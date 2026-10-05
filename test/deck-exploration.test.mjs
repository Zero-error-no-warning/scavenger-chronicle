import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, survey, redraw, searchSpot, searchOption, obstacle, successChance, commitDeck, isNight, encounterRisk, rest, move, stashItem, endSearch } from '../src/world.js';
import { cardPool, deckError, refId, drawShared, discardRefs, pileError, releaseBattle, resetPile, cardInfo } from '../src/deck.js';
import { beginCombat, resolveRound, prepareRound, validatePlan } from '../src/combat.js';
import { parseSave } from '../src/storage.js';
const fresh=()=>newGame(9);
const saved=s=>parseSave(JSON.stringify(s));
function prepared(){const s=fresh();assert.equal(survey(s),null);assert.equal(s.combat,null);return s;}
function candidate(s){for(const spot of s.exploration.spots)for(let i=0;i<s.exploration.hand.length;i++)if(!searchOption(s,spot.index,i).error&&cardInfo(s.exploration.hand[i],s.inventory).search)return [spot.index,i];throw new Error('fixture has no playable card');}

test('共通デッキは18枚、基本カードと携行品の固有カードを手動採用する',()=>{
  const s=fresh();assert.equal(s.deck.length,18);assert.equal(deckError(s,s.deck),null);assert.ok(s.deck.some(r=>r.key==='pry'&&r.source));assert.ok(cardPool(s).some(r=>r.key==='cut'));assert.equal(pileError(s),null);
  const refs=structuredClone(s.deck);refs[0]={key:'unlock',source:'missing-item'};assert.ok(deckError(s,refs));assert.ok(deckError(s,refs.slice(1)));assert.ok(deckError(s,Array(18).fill({key:'rummage',source:null})));
});
test('デッキ編集の上限・拠点条件・時間消費を守り、同じ内容では振り直さない',()=>{
  const s=fresh(),before=JSON.stringify(s);assert.equal(commitDeck(s,s.deck),null);assert.equal(JSON.stringify(s),before);
  const refs=structuredClone(s.deck);refs[0]={key:'rummage',source:null};assert.equal(commitDeck(s,refs),null);assert.equal(s.hour,9);assert.deepEqual(s.deck,refs);assert.equal(pileError(s),null);
  s.location=6;const away=JSON.stringify(s);assert.ok(commitDeck(s,refs));assert.equal(JSON.stringify(s),away);
});
test('手札を予約したまま同じ物理カードを重複して引かず捨て札だけ循環する',()=>{
  const s=fresh(),a=drawShared(s,5),b=drawShared(s,30);assert.equal(a.length+b.length,18);assert.equal(drawShared(s,1).length,0);
  discardRefs(s,a);assert.equal(drawShared(s,30).length,5);discardRefs(s,[...a,...b]); // Return each reserved copy once.
  assert.equal(pileError(s),null);
});
test('探索の引き直しは独立して1時間・STを使い箇所を保持する',()=>{
  const s=prepared(),spots=structuredClone(s.exploration.spots),hour=s.hour,st=s.vitals.headST,hand=JSON.stringify(s.exploration.hand);s.rng=1000000;
  assert.equal(redraw(s),null);assert.equal(s.combat,null);assert.equal(s.hour,hour+1);assert.equal(s.vitals.headST,st-1);assert.deepEqual(s.exploration.spots,spots);assert.notEqual(JSON.stringify(s.exploration.hand),hand);assert.equal(s.exploration.remaining,3);assert.equal(pileError(s),null);saved(s);
});
test('カード判定は実効個のD6合計＋道具補正、失敗箇所は残る',()=>{
  let failures=0,successes=0;
  for(let rng=1;rng<60;rng++){
    const s=prepared(),[index,i]=candidate(s),option=searchOption(s,index,i),remaining=s.exploration.remaining;s.rng=rng*71234567>>>0;
    assert.equal(searchSpot(s,index,i),null);const c=s.lastCheck;
    assert.equal(c.dice.length,option.execution);assert.equal(c.total,c.dice.reduce((a,b)=>a+b,0)+option.bonus);assert.equal(c.success,c.total>=option.obstacle.difficulty);assert.equal(s.hour,10);
    if(c.success){successes++;assert.ok(s.world[7].used.includes(index));if(!s.combat){const before=JSON.stringify(s);assert.ok(searchSpot(s,index,i));assert.equal(JSON.stringify(s),before);}}
    else {failures++;assert.ok(!s.world[7].used.includes(index));assert.ok(s.exploration.spots.some(x=>x.index===index));}
    if(!s.combat)assert.equal(s.exploration.remaining,remaining-1);assert.equal(pileError(s),null);saved(s);
  }
  assert.ok(failures>0&&successes>0);
});
test('不適合・使用済みカード・ST不足は時間と乱数を消費しない',()=>{
  const s=prepared(),i=s.exploration.hand.findIndex(r=>r.key==='cut'),spot=s.exploration.spots.find(x=>x.index===4);let before=JSON.stringify(s);assert.ok(searchSpot(s,spot.index,i));assert.equal(JSON.stringify(s),before);
  const [index,j]=candidate(s);s.vitals.headST=s.vitals.bodyST=0;before=JSON.stringify(s);assert.ok(searchSpot(s,index,j));assert.equal(JSON.stringify(s),before);
});
test('探索の回復カードも行動1回・1時間を使い使用済みを捨て札に戻す',()=>{
  const s=newGame(1);survey(s);const i=s.exploration.hand.findIndex(r=>r.key==='breathe');s.vitals.bodyST=1;s.rng=1000000;assert.equal(searchSpot(s,null,i),null);assert.equal(s.vitals.bodyST,10);assert.equal(s.exploration.remaining,2);assert.equal(s.lastCheck.recovery,true);assert.equal(pileError(s),null);const before=JSON.stringify(s);assert.ok(searchSpot(s,null,i));assert.equal(JSON.stringify(s),before);saved(s);
});
test('成功率の表示はD6分布と一致し障害物の難易度は再読み込みで変わらない',()=>{
  assert.equal(successChance(1,0,4),50);assert.equal(successChance(2,0,7),58);assert.equal(successChance(1,4,5),100);assert.equal(successChance(1,-2,9),0);
  const s=fresh();assert.equal(obstacle(s,0).kind,'locked');assert.deepEqual(obstacle(saved(s),0),obstacle(s,0));
});
test('探索から戦闘へ共通手札を戻し、探索専用カードの戦闘使用を拒否する',()=>{
  const s=prepared(),discovered=structuredClone(s.world[7].discovered),b=beginCombat(s,'dog');assert.equal(s.exploration.hand.length,0);assert.deepEqual(s.world[7].discovered,discovered);assert.equal(pileError(s),null);saved(s);
  releaseBattle(s);b.sharedDeck=false;b.handRefs=[];b.hand=['rummage'];b.plan=[0];const before=JSON.stringify(s);assert.match(validatePlan(b),/探索専用/);assert.throws(()=>resolveRound(s,b));assert.equal(JSON.stringify(s),before);
});
test('道具カードは採用元の武器を使い、装備武器の射程や威力と混同しない',()=>{
  const s=fresh(),knife=s.inventory.find(x=>x.baseId==='knife'),c=cardInfo({key:'cut',source:knife.id},s.inventory);assert.deepEqual(c.range,[knife.minRange,knife.maxRange]);assert.equal(c.ownWeapon.sharpness,knife.sharpness);assert.equal(c.ownWeapon.weight,knife.weight);
  const strike=cardInfo({key:'strike',source:knife.id},s.inventory);assert.deepEqual(strike.range,[knife.minRange,knife.maxRange]);assert.equal(strike.ownWeapon.sharpness,knife.sharpness);
  const basic=cardInfo({key:'strike',source:null},s.inventory);assert.equal(basic.range,'weapon');assert.equal(basic.ownWeapon,undefined);
});
test('道具を置くとそのカードを外し18枚を補い探索手札との総数も保つ',()=>{
  const s=prepared(),id=s.inventory.find(x=>x.baseId==='crowbar').id;assert.equal(stashItem(s,id),null);assert.ok(!s.deck.some(r=>r.source===id));assert.equal(s.deck.length,18);assert.equal(s.exploration.hand.length,0);assert.equal(deckError(s,s.deck),null);assert.equal(pileError(s),null);saved(s);
});
test('保存された手札・使用履歴・判定結果を保持し山札の重複や欠落を拒否する',()=>{
  const s=prepared(),copy=saved(s);assert.deepEqual(copy,s);const bad=structuredClone(s);bad.deckState.discard.push(bad.deck[0]);assert.throws(()=>saved(bad));bad.deckState.discard.pop();bad.exploration.hand[0].source='not-owned';assert.throws(()=>saved(bad));
});
test('旧セーブの戦闘の手札・予定・乱数を保ち次ラウンドから共有山札へ移る',()=>{
  const s=fresh(),b=beginCombat(s,'dog');s.version=1;delete s.deck;delete s.deckState;const rng=s.rng,hand=[...b.hand],enemy=[...b.enemyPlan];const copy=saved(s);assert.equal(copy.version,2);assert.equal(copy.rng,rng);assert.deepEqual(copy.combat.hand,hand);assert.deepEqual(copy.combat.enemyPlan,enemy);assert.equal(copy.combat.sharedDeck,false);resolveRound(copy,copy.combat,{pass:true});if(!copy.combat.result){prepareRound(copy,copy.combat);assert.equal(copy.combat.sharedDeck,true);assert.equal(pileError(copy),null);saved(copy);}
});
test('夜は18時から6時前まで、探索・徒歩の危険度が大幅に増す',()=>{
  const s=fresh();assert.equal(isNight(s,17),false);assert.equal(isNight(s,18),true);assert.equal(isNight(s,5),true);assert.equal(isNight(s,6),false);assert.ok(encounterRisk(s,'search',18)>=encounterRisk(s,'search',17)*3);assert.ok(encounterRisk(s,'walk',18)>encounterRisk(s,'walk',17)*10);
});
test('夜の拠点では食料と水を消費して翌朝6時まで安全に休む',()=>{
  const s=prepared();s.hour=22;const food=s.pack.food;assert.equal(rest(s),null);assert.equal(s.hour,6);assert.equal(s.day,2);assert.equal(s.pack.food,food-1);assert.equal(s.combat,null);assert.equal(s.exploration.hand.length,0);assert.equal(pileError(s),null);saved(s);
});
test('長い探索・引き直し・戦闘・移動でも共有デッキの保存整合性を維持する',()=>{
  for(let seed=1;seed<=30;seed++){
    let s=newGame(seed);
    for(let turn=0;turn<30;turn++){
      if(s.combat){if(!s.combat.resolved)resolveRound(s,s.combat,{pass:true});if(s.combat.result)break;prepareRound(s,s.combat);}
      else if(turn%5===0){endSearch(s);move(s,s.location===7?6:7);}
      else if(s.exploration?.hand.length&&s.exploration.remaining){const i=s.exploration.hand.findIndex((r,i)=>!s.exploration.usedCards.includes(i)&&cardInfo(r,s.inventory).kind==='recover');if(i>=0)searchSpot(s,null,i);else {let used=false;for(const spot of s.exploration.spots){for(let j=0;j<s.exploration.hand.length;j++)if(!searchOption(s,spot.index,j).error){searchSpot(s,spot.index,j);used=true;break;}if(used)break;}if(!used)redraw(s);}}
      else if(s.world[s.location].discovered.some(i=>!s.world[s.location].used.includes(i)))redraw(s);else survey(s);
      assert.equal(pileError(s),null);s=saved(s);
    }
  }
});

test('到着では手札を引かず、再訪した発見済み区画も見渡し操作で探索を再開する',()=>{
  const s=fresh();s.baseResources.fuel=20;s.world[7].discovered=[0,1,2,3,4,5];s.world[7].used=[1];
  const known=[...s.world[7].discovered],pile=structuredClone(s.deckState);
  assert.equal(move(s,6,true),null);assert.equal(s.exploration,null);assert.deepEqual(s.deckState,pile);
  assert.equal(move(s,7,true),null);assert.equal(s.exploration,null);assert.deepEqual(s.world[7].discovered,known);
  s.rng=1000000;const hour=s.hour;assert.equal(survey(s),null);assert.equal(s.combat,null);
  assert.equal(s.hour,hour+1);assert.equal(s.exploration.hand.length,s.exploration.stats.judgment);
  assert.deepEqual(s.exploration.spots.map(x=>x.index),[0,2,3,4,5]);assert.equal(pileError(s),null);saved(s);
});
