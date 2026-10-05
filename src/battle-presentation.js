import { CARD_TYPES } from './data.js?v=0.2.1';
import { abilities } from './combat.js?v=0.2.1';
import { cardArt, escapeHTML as e } from './art.js?v=0.2.1';

export function replayPhases(frame,{reduced=false}={}) {
  if(reduced)return [{name:'impact',duration:240}];
  return [{name:'cards',duration:600},...(frame.effects.length?[{name:'dice',duration:1100},{name:'result',duration:450}]:[]),{name:'impact',duration:650}];
}
export function replayView(frame,phase) {
  const snapshot=phase==='cards'?frame.before:['dice','result'].includes(phase)?frame.ready:frame;
  return {...frame,...snapshot,enemyResolution:phase==='impact'?frame.enemyResolution:frame.before.enemyResolution,phase};
}
export function enemyActionSummary(battle) {
  const planned=battle.enemyPlan.length,statuses=battle.enemyResolution;
  if(!statuses)return {planned,known:false};
  return {planned,known:true,executed:statuses.filter(s=>s==='played'||s==='miss').length,failed:statuses.filter(s=>s==='failed').length,cancelled:statuses.filter(s=>s==='cancelled').length,pending:statuses.filter(s=>s==='pending').length};
}
export function enemyAbilityInfo(battle,key,displayEnemy=battle.enemy) {
  const frozen=key!=='execution',actor=frozen&&battle.enemyLimitActor?battle.enemyLimitActor:displayEnemy,fixed=frozen?battle.enemyLimits?.[key]:null;
  // Legacy saves retain the plan but not its starting ability snapshot.
  const value=fixed??(key==='action'?Math.max(abilities(actor).action,battle.enemyPlan.length):abilities(actor)[key]);
  return {value,actor,options:{battle:true,frozen:frozen&&fixed!==undefined&&fixed!==null,missingSnapshot:frozen&&!battle.enemyLimitActor,fixedValue:fixed??(key==='action'?value:null),roundValue:null}};
}
export function cardRoute(frame,side) {
  const key=frame[`${side}Card`],status=frame[`${side}Status`];
  if(!key||status==='wait')return 'wait';
  if(status==='failed'||status==='miss')return status;
  const other=side==='player'?'enemy':'player';
  if(frame[`${other}Card`]&&frame[`${other}Status`]==='played')return 'clash';
  return frame.effects.some(effect=>effect.side===side)?'body':'self';
}
const pips={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function dieFace(value) {
  return `<span class="die-face" aria-hidden="true">${Array.from({length:9},(_,i)=>`<i class="${pips[value].includes(i)?'pip':''}"></i>`).join('')}</span>`;
}
export function diceArt(effect,{rolling=false}={}) {
  return `<div class="dice-group"><small>${effect.side==='player'?'あなた':'相手'}</small>${effect.dice.map((value,i)=>`<span class="die ${rolling?'rolling':value===6?'critical':''}" role="img" aria-label="${rolling?'D6を振っています':`D6の出目 ${value}`}" style="--die-delay:${-i*83-(effect.side==='enemy'?41:0)}ms">${rolling?`<span class="die-reel">${[1,2,3,4,5,6,1].map(dieFace).join('')}</span>`:dieFace(value)}</span>`).join('')}</div>`;
}
export const phaseNames={cards:'カードを同時に解決',dice:'ダイスを振っています',result:'出目確定',impact:'結果を反映'};
export function renderResolution(frame,phase=frame.phase) {
  if(!frame)return '';
  const cards=['player','enemy'].map(side=>{
    const key=frame[`${side}Card`],card=CARD_TYPES[key];if(!card)return '';
    const route=cardRoute(frame,side),label=route==='failed'?'ST不足で不発':route==='miss'?'射程外':card.name;
    return `<div class="duel-card ${side} ${card.color}" data-route="${route}"><small>${side==='player'?'あなた':'相手'}</small>${cardArt(key)}<b>${e(label)}</b></div>`;
  }).join('');
  const hits=phase==='impact'?frame.effects.map(effect=>`<div class="hit-burst ${effect.targetSide}" data-target="${effect.targetSide}"><span class="impact-star" aria-hidden="true"></span><b>${effect.damage.headHP?`頭HP −${effect.damage.headHP}`:''}${effect.damage.headHP&&effect.damage.bodyHP?'<br>':''}${effect.damage.bodyHP?`体HP −${effect.damage.bodyHP}`:''}${!effect.damage.headHP&&!effect.damage.bodyHP?'防いだ':''}</b></div>`).join(''):'';
  const dice=frame.effects.length&&phase!=='cards'?`<div class="dice-overlay ${phase==='dice'?'is-rolling':'settled'}">${frame.effects.map(effect=>diceArt(effect,{rolling:phase==='dice'})).join('')}</div>`:'';
  return `<div class="combat-cinema" data-phase="${phase}" aria-label="行動 ${frame.slot}：${phaseNames[phase]}">${cards}${hits}${dice}</div>`;
}
// Align cards with the rendered actors rather than assuming a screen size.
export function positionResolution(scene) {
  const cinema=scene?.querySelector('.combat-cinema');if(!cinema)return;
  const bounds=scene.getBoundingClientRect(),centers={};
  for(const side of ['player','enemy']) {
    const actor=scene.querySelector(`.scene-${side}`)?.getBoundingClientRect();
    centers[side]={x:actor?actor.left+actor.width/2-bounds.left:bounds.width*(side==='player'?.25:.75),y:actor?actor.top+actor.height/2-bounds.top:bounds.height*.52};
  }
  const middle={x:(centers.player.x+centers.enemy.x)/2,y:(centers.player.y+centers.enemy.y)/2};
  for(const card of cinema.querySelectorAll('.duel-card')) {
    const side=card.classList.contains('player')?'player':'enemy',other=side==='player'?'enemy':'player',route=card.dataset.route;
    const target=route==='body'?centers[other]:route==='clash'?middle:route==='miss'?{x:(centers[side].x+middle.x)/2,y:(centers[side].y+middle.y)/2}:centers[side];
    for(const axis of ['x','y']){card.style.setProperty(`--from-${axis}`,`${centers[side][axis]}px`);card.style.setProperty(`--to-${axis}`,`${target[axis]}px`);}
  }
  for(const hit of cinema.querySelectorAll('.hit-burst')){hit.style.left=`${centers[hit.dataset.target].x}px`;hit.style.top=`${centers[hit.dataset.target].y}px`;}
  for(const side of ['player','enemy'])scene.querySelector(`.scene-${side}`)?.classList.toggle('actor-hit',cinema.dataset.phase==='impact'&&scene.querySelector(`.hit-burst.${side}`)!==null);
}
