import { BALANCE, CARD_TYPES, LOCATIONS, MODULES, WEAPONS, ARMOR, TOOLS, RESOURCES, MODIFIERS, ENEMIES, CONSUMABLES, ROAD_OBSTACLES } from './data.js?v=0.2.8';
import { ensureDeck, deckError, pileError, cardPool, refId } from './deck.js?v=0.2.8';
import { shuffled } from './random.js?v=0.2.8';
import { abilities, playerActor } from './combat.js?v=0.2.8';
import { itemPlan } from './consumables.js?v=0.2.8';
import { migrateWeaponRange } from './items.js?v=0.2.8';
const KEY='scavenger-chronicle-save-v1';
const gaugeKeys=['headHP','bodyHP','headST','bodyST'];
const statKeys=['perception','judgment','action','execution'];
const num=(x,min=0,max=1e6)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const arr=(x,max=1000)=>Array.isArray(x)&&x.length<=max;
const text=x=>typeof x==='string'&&x.length<1000;
const isId=(x,values)=>values.includes(x);
const adjacent=(a,b)=>Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5))===1;
export function validateSave(s) {
  const fail=()=>{throw new Error('セーブデータの形式が違うか、壊れています。元のデータは上書きしていません。');};
  if(!s||![1,BALANCE.saveVersion].includes(s.version))fail();
  const legacy=s.version===1;
  for(const key of ['serial','day','region','visits','kills','lootCount'])if(!num(s[key]))fail();
  if(!num(s.rng,1,4294967295)||!Number.isInteger(s.rng)||!num(s.hour,0,23)||!num(s.location,0,14)||!Number.isInteger(s.location)||!num(s.baseLocation,0,14)||!Number.isInteger(s.baseLocation)||!num(s.hunger,0,100)||!num(s.thirst,0,100))fail();
  if(!s.vitals||gaugeKeys.some(k=>!num(s.vitals[k],0,BALANCE.player[k])))fail();
  if(s.boosts===undefined)s.boosts={exploration:{},battle:{}};
  if(!s.boosts||!['exploration','battle'].every(scope=>s.boosts[scope]&&!Array.isArray(s.boosts[scope])&&Object.entries(s.boosts[scope]).every(([k,v])=>statKeys.includes(k)&&num(v,0,10))))fail();
  for(const resources of [s.pack,s.baseResources]){
    if(!resources||Array.isArray(resources)||Object.keys(resources).some(k=>!Object.hasOwn(RESOURCES,k)))fail();
    for(const key of Object.keys(CONSUMABLES))if(!['food','water','med'].includes(key)&&resources[key]===undefined)resources[key]=0;
    if(Object.keys(RESOURCES).some(k=>!num(resources[k])||!Number.isInteger(resources[k])))fail();
  }
  if(!arr(s.modules,5)||s.modules.some(k=>!MODULES.some(m=>m.id===k))||new Set(s.modules).size!==s.modules.length)fail();
  const itemValid=item=>item&&text(item.id)&&text(item.name)&&text(item.visual)&&/^#[\da-f]{6}$/i.test(item.color)&&[...WEAPONS,...ARMOR,...TOOLS].some(x=>x.id===item.baseId)&&isId(item.slot,['head','body','weapon','tool'])&&num(item.carry,.1,50)&&num(item.weight,.1,50)&&num(item.sharpness,0,50)&&num(item.hardness,0,50)&&num(item.softness,1,50)&&arr(item.modifiers,10)&&new Set(item.modifiers).size===item.modifiers.length&&item.modifiers.every(k=>MODIFIERS.some(m=>m.id===k&&m.types.includes(item.type)))&&item.stats&&Object.entries(item.stats).every(([k,v])=>isId(k,statKeys)&&num(v,-20,20))&&(!item.cards||(arr(item.cards,10)&&item.cards.every(k=>!!CARD_TYPES[k])))&&(item.slot!=='weapon'||(num(item.minRange,0,6)&&num(item.maxRange,0,6)));
  if(!arr(s.inventory,100)||!arr(s.stash,16)||[...s.inventory,...s.stash].some(x=>!itemValid(x)))fail();
  if(new Set([...s.inventory,...s.stash].map(x=>x.id)).size!==s.inventory.length+s.stash.length)fail();
  if(!s.equipment||['head','body','weapon'].some(slot=>!s.inventory.some(x=>x.id===s.equipment[slot]&&x.slot===slot)))fail();
  if(s.roadObstacles===undefined)s.roadObstacles=[[6,7,'wreck'],[7,8,'rubble'],[2,7,'tree'],[12,13,'wreck']].map(([a,b,kind])=>({a,b,kind,hp:ROAD_OBSTACLES[kind].maxHp,maxHp:ROAD_OBSTACLES[kind].maxHp}));
  if(!arr(s.roadObstacles,22)||s.roadObstacles.some(o=>!o||!Number.isInteger(o.a)||!Number.isInteger(o.b)||!num(o.a,0,14)||!num(o.b,0,14)||!adjacent(o.a,o.b)||!ROAD_OBSTACLES[o.kind]||!Number.isInteger(o.hp)||!num(o.hp,0,ROAD_OBSTACLES[o.kind].maxHp)||o.maxHp!==ROAD_OBSTACLES[o.kind].maxHp)||new Set(s.roadObstacles.map(o=>`${Math.min(o.a,o.b)}-${Math.max(o.a,o.b)}`)).size!==s.roadObstacles.length)fail();
  if(!arr(s.world,15)||s.world.length!==15||s.world.some((node,i)=>node.id!==i||!LOCATIONS.some(x=>x.id===node.locId)||!num(node.visits)||typeof node.seen!=='boolean'||!arr(node.used,6)||node.used.some(x=>!Number.isInteger(x)||!num(x,0,5))))fail();
  if(!arr(s.log,80)||s.log.some(x=>!text(x.text)||!num(x.day)||!num(x.hour,0,23)))fail();
  if(s.exploration&&(!arr(s.exploration.spots,6)||s.exploration.spots.some(x=>!text(x.name)||!num(x.index,0,5)||!Number.isInteger(x.index))||!num(s.exploration.remaining,0,30)))fail();
  if(s.exploration?.location!==undefined&&(!num(s.exploration.location,0,14)||!Number.isInteger(s.exploration.location)))fail();
  if(s.combat) {
    const b=s.combat;
    if(b.battleBoosts===undefined)b.battleBoosts={};
    if(!b.battleBoosts||Array.isArray(b.battleBoosts)||Object.entries(b.battleBoosts).some(([k,v])=>!statKeys.includes(k)||!num(v,0,10)))fail();
    for(const actor of [b.player,b.enemy,...(b.limitActor?[b.limitActor]:[]),...(b.enemyLimitActor?[b.enemyLimitActor]:[])]) {
      if(!actor||!text(actor.name)||!text(actor.visual)||!actor.max||!actor.base||gaugeKeys.some(k=>!num(actor.max[k],1,1000)||!num(actor[k],0,actor.max[k]))||statKeys.some(k=>!num(actor.base[k],-20,30)))fail();
      if(!actor.weapon||!num(actor.weapon.sharpness,0,50)||!num(actor.weapon.weight,.1,50)||!num(actor.weapon.minRange,0,6)||!num(actor.weapon.maxRange,0,6))fail();
      if(!actor.armor||['head','body'].some(k=>!actor.armor[k]||!num(actor.armor[k].hardness,0,50)||!num(actor.armor[k].softness,1,50)))fail();
    }
    for(const key of ['hand','playerDeckSource','enemyDeckSource','playerDeck','enemyDeck','enemyPlan'])if(!arr(b[key],100)||b[key].some(k=>!CARD_TYPES[k]))fail();
    if(b.revealedEnemyIndices!==undefined&&(!arr(b.revealedEnemyIndices,100)||new Set(b.revealedEnemyIndices).size!==b.revealedEnemyIndices.length||b.revealedEnemyIndices.some(i=>!Number.isInteger(i)||!num(i,0,b.enemyPlan.length-1))||b.revealedEnemyIndices.length!==Math.min(b.enemyPlan.length,b.limits?.perception??0)))fail();
    if(b.enemyLimits&&statKeys.some(k=>!num(b.enemyLimits[k],0,30)))fail();
    if(b.enemyResolution&&(!arr(b.enemyResolution,100)||b.enemyResolution.length!==b.enemyPlan.length||b.enemyResolution.some(value=>!isId(value,['pending','played','miss','failed','cancelled']))))fail();
    if(!arr(b.plan,30)||b.plan.some(x=>!itemPlan(x)&&(!Number.isInteger(x)||!num(x,0,b.hand.length-1)))||new Set(b.plan.filter(Number.isInteger)).size!==b.plan.filter(Number.isInteger).length||!num(b.distance,0,6)||!num(b.round,1,1e6)||!arr(b.history,60)||b.history.some(x=>!text(x))||!text(b.text)||!b.limits||statKeys.some(k=>!num(b.limits[k],0,30))||!isId(b.result,[null,'victory','defeat','mutual','escaped'])||typeof b.resolved!=='boolean')fail();
    if(b.plan.length>b.limits.action)fail();
    const reserved={};for(const entry of b.plan)if(itemPlan(entry))reserved[entry.item]=(reserved[entry.item]||0)+1;
    if(!b.resolved&&Object.entries(reserved).some(([key,n])=>n>s.pack[key]))fail();
    b.supplies=structuredClone(s.pack);
  }
  // Older saves have no exploration location. Keep used spots authoritative and
  // remove stale candidates without granting new actions or consuming RNG.
  for(const node of s.world)node.used=[...new Set(node.used)];
  if(s.exploration) {
    if(s.exploration.location!==undefined&&s.exploration.location!==s.location)s.exploration=null;
    else {
      const ex=s.exploration,seen=new Set(s.world[s.location].used);
      ex.location=s.location;
      ex.spots=ex.spots.filter(spot=>{if(seen.has(spot.index))return false;seen.add(spot.index);return true;});
      if(!ex.spots.length)ex.remaining=0;
    }
  }
  if(legacy){
    s.version=BALANCE.saveVersion;ensureDeck(s);
    for(const node of s.world)node.discovered=[...new Set([...node.used,...(s.exploration?.location===node.id?s.exploration.spots.map(x=>x.index):[])])];
    if(s.exploration){s.exploration.hand=[];s.exploration.usedCards=[];s.exploration.remaining=0;s.exploration.stats=abilities(playerActor(s));s.exploration.abilityActor=playerActor(s);}
    if(s.combat){s.combat.sharedDeck=false;s.combat.handDiscarded=true;s.combat.handRefs=[];s.combat.playerTools=[];}
  }
  if(deckError(s,s.deck)||!s.deckState)fail();
  const pool=new Set(cardPool(s).map(refId));
  const refsValid=refs=>arr(refs,18)&&refs.every(r=>r&&typeof r.key==='string'&&(r.source===null||typeof r.source==='string')&&pool.has(refId(r)));
  if(!refsValid(s.deckState.draw)||!refsValid(s.deckState.discard))fail();
  for(const node of s.world)if(!arr(node.discovered,6)||new Set(node.discovered).size!==node.discovered.length||node.discovered.some(i=>!Number.isInteger(i)||!num(i,0,5)))fail();
  const ex=s.exploration;
  if(ex){
    const actor=ex.abilityActor;if(!actor||!actor.base||!actor.max||gaugeKeys.some(k=>!num(actor.max[k],1,1000)||!num(actor[k],0,actor.max[k]))||statKeys.some(k=>!num(actor.base[k],-20,30))||!actor.weapon||!actor.armor?.head||!actor.armor?.body)fail();
    if(!refsValid(ex.hand)||!arr(ex.usedCards,18)||new Set(ex.usedCards).size!==ex.usedCards.length||ex.usedCards.some(i=>!Number.isInteger(i)||!num(i,0,ex.hand.length-1))||!ex.stats||statKeys.some(k=>!num(ex.stats[k],0,30))||ex.remaining>ex.stats.action||ex.remaining+ex.usedCards.length>ex.stats.action)fail();
    if(ex.spots.some(x=>!s.world[s.location].discovered.includes(x.index)))fail();
  }
  if(s.combat){const b=s.combat;if(typeof b.sharedDeck!=='boolean'||typeof b.handDiscarded!=='boolean'||!refsValid(b.handRefs))fail();if(b.sharedDeck&&(b.handRefs.length!==b.hand.length||b.handRefs.some((r,i)=>r.key!==b.hand[i])))fail();b.playerTools=structuredClone(s.inventory);
    // A legacy round gets one deterministic reveal without changing gameplay RNG.
    b.revealedEnemyIndices??=shuffled({rng:s.rng},b.enemyPlan.map((_,i)=>i)).slice(0,b.limits.perception).sort((a,c)=>a-c);}
  if(pileError(s))fail();
  if(s.lastCheck){const c=s.lastCheck;if(!text(c.name)||!text(c.card)||!arr(c.dice,30)||c.dice.some(x=>!Number.isInteger(x)||!num(x,1,6))||!num(c.bonus,-10,20)||!num(c.total,0,200)||!num(c.difficulty,1,30)||typeof c.success!=='boolean'||typeof c.recovery!=='boolean'||!num(c.day)||!num(c.hour,0,23))fail();}
  const loot=s.lastCheck?.loot;
  if(loot!==undefined){
    if(!s.lastCheck.success||s.lastCheck.recovery||!loot||!Number.isInteger(loot.quantity)||!Number.isInteger(loot.offered)||!num(loot.quantity,0,3)||!num(loot.offered,1,3)||loot.quantity>loot.offered)fail();
    if(loot.kind==='item'){if(loot.offered!==1||!itemValid(loot.item))fail();}
    else if(loot.kind==='resource'){if(!Object.hasOwn(RESOURCES,loot.key))fail();}
    else fail();
  }
  // Apply balance changes without rerolling, recreating items or changing plans.
  for(const item of [...s.inventory,...s.stash,...(loot?.kind==='item'?[loot.item]:[])])migrateWeaponRange(item);
  if(ex)migrateWeaponRange(ex.abilityActor.weapon);
  if(s.combat){
    const b=s.combat;
    for(const actor of [b.player,...(b.limitActor?[b.limitActor]:[])]){migrateWeaponRange(actor.weapon);actor.base.execution=playerActor(s,{battle:true}).base.execution;}
    const def=ENEMIES.find(x=>x.id===b.enemyId);
    if(def){for(const actor of [b.enemy,...(b.enemyLimitActor?[b.enemyLimitActor]:[])])actor.base.execution=def.stats[3]*BALANCE.combatExecution.enemyMultiplier;}
    b.limits.execution=abilities(b.limitActor||b.player).execution;
    if(b.enemyLimits)b.enemyLimits.execution=abilities(b.enemyLimitActor||b.enemy).execution;
    b.playerTools=structuredClone(s.inventory);
  }
  return s;
}
export function loadGame() {
  const raw=localStorage.getItem(KEY);
  return raw?validateSave(JSON.parse(raw)):null;
}
export function saveGame(s) {localStorage.setItem(KEY,JSON.stringify(s));}
export function parseSave(text) {if(text.length>2e6)throw new Error('セーブファイルが大きすぎます。');return validateSave(JSON.parse(text));}
