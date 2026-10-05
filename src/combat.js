import { BALANCE, CARD_TYPES, ENEMIES } from './data.js?v=0.2.1';
import { equipped } from './items.js?v=0.2.1';
import { clamp, pick, random, round, shuffled } from './random.js?v=0.2.1';

import { drawShared, releaseExploration, releaseBattle, combatCard, isCombat } from './deck.js?v=0.2.1';

export function abilityBreakdown(actor) {
  return Object.fromEntries([['perception','headHP',0],['judgment','headST',1],['action','bodyHP',1],['execution','bodyST',1]].map(([key,gauge,min])=>{
    const base=actor.base[key],effectiveBase=Math.max(min,base),ratio=clamp(actor[gauge]/actor.max[gauge],0,1);
    return [key,{base,effectiveBase,gauge,current:actor[gauge],maximum:actor.max[gauge],ratio,min,value:Math.max(min,Math.ceil(effectiveBase*ratio))}];
  }));
}
export function abilities(actor) {
  return Object.fromEntries(Object.entries(abilityBreakdown(actor)).map(([key,detail])=>[key,detail.value]));
}
export function playerActor(state) {
  const base = { ...BALANCE.player };
  for (const slot of ['head','body','weapon']) {
    for (const [key,delta] of Object.entries(equipped(state,slot)?.stats||{})) if (key in base) base[key] += delta;
  }
  return { name:'あなた', visual:'player', ...state.vitals, max:Object.fromEntries(['headHP','bodyHP','headST','bodyST'].map(key=>[key,BALANCE.player[key]])), base,
    weapon:equipped(state,'weapon') || {sharpness:0,weight:.3,minRange:0,maxRange:0},
    armor:{head:equipped(state,'head')||{hardness:0,softness:1},body:equipped(state,'body')||{hardness:0,softness:1}},
  };
}
function enemyActor(def) {
  const [headHP,bodyHP]=def.hp, [headST,bodyST]=def.st;
  const [perception,judgment,action,execution]=def.stats;
  return {name:def.name,visual:def.visual,headHP,bodyHP,headST,bodyST,max:{headHP,bodyHP,headST,bodyST},base:{perception,judgment,action,execution},weapon:structuredClone(def.weapon),armor:structuredClone(def.armor)};
}
function draw(state, battle, side, count) {
  const field = `${side}Deck`;
  const source = side==='player' ? battle.playerDeckSource : battle.enemyDeckSource;
  const hand=[];
  while(hand.length<count) {
    if(!battle[field].length) battle[field]=shuffled(state,source);
    hand.push(battle[field].pop());
  }
  return hand;
}
export function beginCombat(state,enemyId) {
  const def=ENEMIES.find(x=>x.id===enemyId)||pick(state,ENEMIES);
  const player=playerActor(state);
  const b={round:0,distance:BALANCE.startingDistance,player,enemy:enemyActor(def),enemyId:def.id,text:def.text,
    playerDeckSource:state.deck.map(x=>x.key),enemyDeckSource:[...def.deck],playerDeck:[],enemyDeck:[],plan:[],history:[],result:null,resolved:false};
  releaseExploration(state);b.sharedDeck=true;b.handDiscarded=true;b.playerTools=structuredClone(state.inventory);
  state.combat=b;
  prepareRound(state,b);
  return b;
}
export function prepareRound(state,b) {
  if(b.result)throw new Error('終わった戦闘の次のラウンドは開始できません。');
  b.resolved=false;
  b.round++;
  b.limits=abilities(b.player);
  b.limitActor=structuredClone(b.player);
  releaseBattle(state);b.handRefs=drawShared(state,b.limits.judgment);b.hand=b.handRefs.map(x=>x.key);b.handDiscarded=false;b.sharedDeck=true;b.playerTools=structuredClone(state.inventory);
  const enemyStats=abilities(b.enemy);
  b.enemyLimits={...enemyStats};b.enemyLimitActor=structuredClone(b.enemy);
  const candidates=draw(state,b,'enemy',enemyStats.judgment);
  b.enemyPlan=[];
  let distance=b.distance, brain=b.enemy.headST, body=b.enemy.bodyST;
  for(let i=0;i<enemyStats.action;i++) {
    const score=key=>{
      const c=CARD_TYPES[key];
      if(c.bodyCost>body||c.headCost>brain)return -10;
      if(key==='breathe')return body<8?12:1;
      if(key==='focus')return brain<5?12:0;
      if(key==='advance')return distance>b.enemy.weapon.maxRange?10:0;
      if(key==='retreat')return distance<b.enemy.weapon.minRange?10:1;
      if(c.kind==='attack')return inRange(c,b.enemy,distance)?8:0;
      return 3;
    };
    candidates.sort((a,c)=>score(c)-score(a));
    const key=candidates.shift();
    if(!key||score(key)<0)break;
    b.enemyPlan.push(key);
    const card=CARD_TYPES[key];
    body=clamp(body-card.bodyCost+(card.bodyRecovery||0),0,b.enemy.max.bodyST);
    brain=clamp(brain-card.headCost+(card.headRecovery||0),0,b.enemy.max.headST);
    distance=clamp(distance+(card.move||0),0,BALANCE.maxDistance);
  }
  b.plan=[];
  b.enemyResolution=b.enemyPlan.map(()=>'pending');
}
export function inRange(card,actor,distance) {
  const [min,max]=['weapon','tool'].includes(card.range)?[actor.weapon.minRange,actor.weapon.maxRange]:(card.range||[0,0]);
  return distance>=min&&distance<=max;
}
// Each die is a separate hit. A 6 redirects the complete hit to the head.
export function damageDice(target,weapon,dice,power=1,guard=false) {
  const hits=dice.map(die=>{
    const part=die===6?'head':'body';
    const armor=target.armor[part];
    const blunt=weapon.weight/Math.max(BALANCE.softnessFloor,armor.softness);
    const factor=power*(guard?.5:1);
    return {die,part,hp:round((Math.max(0,weapon.sharpness-armor.hardness)+blunt)*die*factor),st:round(blunt*die*factor)};
  });
  const bodyHP=round(hits.filter(x=>x.part==='body').reduce((s,x)=>s+x.hp,0));
  const headHP=round(hits.filter(x=>x.part==='head').reduce((s,x)=>s+x.hp,0));
  const bodyST=round(hits.filter(x=>x.part==='body').reduce((s,x)=>s+x.st,0));
  const headST=round(hits.filter(x=>x.part==='head').reduce((s,x)=>s+x.st,0));
  const overflow=round(Math.max(0,bodyHP-target.bodyHP));
  target.bodyHP=round(Math.max(0,target.bodyHP-bodyHP));
  target.headHP=round(Math.max(0,target.headHP-headHP-overflow));
  target.bodyST=round(Math.max(0,target.bodyST-bodyST));
  target.headST=round(Math.max(0,target.headST-headST));
  return {hits,bodyHP,headHP:round(headHP+overflow),bodyST,headST,overflow};
}
export function validatePlan(b) {
  if(!b.plan.length)return 'カードを１枚以上選んでください。';
  if(b.plan.length>b.limits.action)return '行動数を超えています。';
  if(new Set(b.plan).size!==b.plan.length)return '同じ手札を二度選ぶことはできません。';
  let brain=b.player.headST,body=b.player.bodyST;
  for(const index of b.plan) {
    const c=combatCard(b,index);
    if(!c?.kind)return '手札が見つかりません。';
    if(!isCombat(c))return '探索専用カードは戦闘で使えません。';
    if(c.headCost>brain||c.bodyCost>body)return '予定の途中でSTが足りなくなります。回復カードを先に入れてください。';
    brain=clamp(brain-c.headCost+(c.headRecovery||0),0,b.player.max.headST);
    body=clamp(body-c.bodyCost+(c.bodyRecovery||0),0,b.player.max.bodyST);
  }
  return null;
}
export function resolveRound(state,b,{pass=false}={}) {
  if(b.resolved||b.result)throw new Error('このラウンドは解決済みです。');
  const error=pass&&!b.plan.length?null:validatePlan(b);
  if(error)throw new Error(error);
  const playerPlan=b.plan.map(i=>b.hand[i]);
  const enemyPlan=[...b.enemyPlan];
  b.enemyResolution=enemyPlan.map(()=>'pending');
  const frames=[];
  for(let slot=0;slot<Math.max(1,playerPlan.length,enemyPlan.length);slot++) {
    const before={distance:b.distance,player:structuredClone(b.player),enemy:structuredClone(b.enemy),enemyResolution:[...(b.enemyResolution||b.enemyPlan.map(()=>'pending'))]};
    const messages=pass&&slot===0?['あなた：このラウンドは待機。']:[],commands=[];
    for(const [side,plan] of [['player',playerPlan],['enemy',enemyPlan]]) {
      const actor=b[side], key=plan[slot],card=side==='player'&&key?combatCard(b,b.plan[slot]):CARD_TYPES[key];
      if(!card)continue;
      const execution=abilities(actor).execution;
      if(actor.bodyST<card.bodyCost||actor.headST<card.headCost) { messages.push(`${actor.name}：${card.name}はST不足で不発。`); continue; }
      actor.bodyST=round(actor.bodyST-card.bodyCost);
      actor.headST=round(actor.headST-card.headCost);
      commands.push({side,actor,key,card,execution});
    }
    // Both moves contribute to one distance before either attack is evaluated.
    b.distance=clamp(b.distance+commands.reduce((sum,x)=>sum+(x.card.move||0),0),0,BALANCE.maxDistance);
    for(const c of commands) {
      if(c.card.kind==='move')messages.push(`${c.actor.name}：${c.card.name}。`);
      if(c.card.kind==='recover') {
        c.actor.bodyST=clamp(c.actor.bodyST+(c.card.bodyRecovery||0),0,c.actor.max.bodyST);
        c.actor.headST=clamp(c.actor.headST+(c.card.headRecovery||0),0,c.actor.max.headST);
        messages.push(`${c.actor.name}：${c.card.name}。`);
      }
      if(c.card.kind==='guard')messages.push(`${c.actor.name}：身を守る。`);
    }
    const attacks=[];
    for(const c of commands.filter(x=>x.card.kind==='attack')) {
      if(!inRange(c.card,c.actor,b.distance)) { messages.push(`${c.actor.name}：${c.card.name}は距離${b.distance}で届かない。`); continue; }
      const targetSide=c.side==='player'?'enemy':'player';
      const dice=Array.from({length:c.execution},()=>1+Math.floor(random(state)*6));
      attacks.push({...c,targetSide,dice,guard:commands.some(x=>x.side===targetSide&&x.card.kind==='guard')});
    }
    // Both attacks were declared while both combatants were alive; mutual defeat is valid.
    const ready={distance:b.distance,player:structuredClone(b.player),enemy:structuredClone(b.enemy)};
    const status=side=>{
      if(!(side==='player'?playerPlan:enemyPlan)[slot])return 'wait';
      const command=commands.find(c=>c.side===side);
      if(!command)return 'failed';
      return command.card.kind==='attack'&&!attacks.some(a=>a.side===side)?'miss':'played';
    };
    const effects=[];
    for(const a of attacks) {
      const damage=damageDice(b[a.targetSide],a.card.ownWeapon||a.actor.weapon,a.dice,a.card.power,a.guard);
      effects.push({side:a.side,targetSide:a.targetSide,card:a.key,dice:a.dice,damage});
      messages.push(`${a.actor.name}：${a.card.name}［${a.dice.join('・')}］ → 頭${damage.headHP} / 体${damage.bodyHP} HP${a.dice.includes(6)?'（６：クリティカル）':''}${damage.overflow?'（体から頭へ超過）':''}。`);
    }
    if(b.player.headHP<=0)b.result=b.enemy.headHP<=0?'mutual':'defeat';
    else if(b.enemy.headHP<=0)b.result='victory';
    else if(commands.some(x=>x.side==='player'&&x.card.kind==='escape')) {
      if(b.distance>=5) {b.result='escaped';messages.push('背を向け、走り抜けた。');}
      else messages.push('離脱には距離５以上が必要。');
    }
    b.enemyResolution ||= b.enemyPlan.map(()=>'pending');
    if(slot<b.enemyPlan.length)b.enemyResolution[slot]=status('enemy');
    if(b.result)b.enemyResolution=b.enemyResolution.map(value=>value==='pending'?'cancelled':value);
    b.history.push(...messages);
    b.history=b.history.slice(-60);
    frames.push({slot:slot+1,before,ready,enemyResolution:[...b.enemyResolution],playerStatus:status('player'),enemyStatus:status('enemy'),distance:b.distance,player:structuredClone(b.player),enemy:structuredClone(b.enemy),messages,effects,result:b.result,playerCard:playerPlan[slot],enemyCard:enemyPlan[slot]});
    if(b.result)break;
  }
  for(const key of ['headHP','bodyHP','headST','bodyST'])state.vitals[key]=b.player[key];
  releaseBattle(state);b.resolved=true;
  return frames;
}
