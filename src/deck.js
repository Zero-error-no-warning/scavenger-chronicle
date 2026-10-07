import { CARD_TYPES, BASIC_COPIES, ITEM_CARDS, DECK_SIZE } from './data.js?v=0.2.8';
import { itemPlan, consumableCard } from './consumables.js?v=0.2.8';
import { shuffled } from './random.js?v=0.2.8';

export const refId=ref=>`${ref.key}:${ref.source||''}`;
export function cardPool(s) {
  return [...Object.entries(BASIC_COPIES).map(([key,limit])=>({key,source:null,limit})),
    ...s.inventory.flatMap(item=>[...new Set([...(item.cards||[]),...(ITEM_CARDS[item.baseId]||[])])].map(key=>({key,source:item.id,limit:2})))];
}
export function cardInfo(ref,inventory=[]) {
  const c={...CARD_TYPES[ref.key]},item=inventory.find(x=>x.id===ref.source);
  if(item){c.sourceName=item.name;if(['pry','cut','dig'].includes(ref.key)||(item.type==='weapon'&&c.kind==='attack'&&c.range==='weapon')){c.ownWeapon={sharpness:item.sharpness,weight:item.weight};if(['tool','weapon'].includes(c.range))c.range=[item.minRange,item.maxRange];}}
  return c;
}
export const combatCard=(b,index)=>{if(itemPlan(index))return consumableCard(index.item);const c=cardInfo(b.handRefs?.[index]?.key===b.hand[index]?b.handRefs[index]:{key:b.hand[index]},b.playerTools||[]);return {...c,name:c.combatName||c.name};};
export const planKey=(b,entry)=>itemPlan(entry)?`supply:${entry.item}`:b.hand[entry];
export const isCombat=c=>c.kind!=='search';
export const isExploration=c=>!!c.search||c.kind==='recover';
export function deckError(s,refs) {
  if(!Array.isArray(refs)||refs.length!==DECK_SIZE)return `デッキは${DECK_SIZE}枚にしてください。`;
  const pool=cardPool(s),counts=new Map();
  for(const ref of refs){if(!ref||!CARD_TYPES[ref.key]||!(ref.source===null||typeof ref.source==='string'))return 'カードの形式が違います。';const id=refId(ref),entry=pool.find(x=>refId(x)===id);if(!entry)return '持ち歩いていない道具のカードがあります。';counts.set(id,(counts.get(id)||0)+1);if(counts.get(id)>entry.limit)return '同じカードの枚数上限を超えています。';}
  if(!refs.some(r=>isCombat(CARD_TYPES[r.key])&&CARD_TYPES[r.key].kind!=='recover'))return '戦闘カードを1枚以上入れてください。';
  return null;
}
export function initialDeck(s) {
  const keys=['advance','advance','retreat','strike','strike','heavy','throw','guard','guard','breathe','breathe','focus','escape','rummage','rummage','force','force','rummage'];
  const refs=keys.map(key=>({key,source:null}));
  for(const key of ['pry','cut','sweep']){const entry=cardPool(s).find(x=>x.key===key&&x.source);if(entry){const i=refs.findLastIndex(r=>r.key==='rummage'||r.key==='force');refs[i]={key,source:entry.source};}}
  return refs;
}
export function resetPile(s) {s.deckState={draw:[],discard:structuredClone(s.deck)};}
export function ensureDeck(s) {if(!s.deck){s.deck=initialDeck(s);resetPile(s);}}
export function drawShared(s,count) {
  ensureDeck(s);const hand=[];
  while(hand.length<count){if(!s.deckState.draw.length){if(!s.deckState.discard.length)break;s.deckState.draw=shuffled(s,s.deckState.discard);s.deckState.discard=[];}hand.push(s.deckState.draw.pop());}
  return hand;
}
export function discardRefs(s,refs) {ensureDeck(s);s.deckState.discard.push(...structuredClone(refs));}
export function releaseExploration(s) {
  const ex=s.exploration;if(!ex?.hand)return;
  discardRefs(s,ex.hand.filter((_,i)=>!ex.usedCards.includes(i)));ex.hand=[];ex.usedCards=[];ex.remaining=0;
}
export function releaseBattle(s) {
  const b=s.combat;if(!b?.sharedDeck||b.handDiscarded)return;
  discardRefs(s,b.handRefs);b.handDiscarded=true;
}
export function syncDeck(s) {
  ensureDeck(s);const available=new Set(cardPool(s).map(refId));
  if(s.deck.every(r=>available.has(refId(r))))return false;
  releaseExploration(s);s.deck=s.deck.filter(r=>available.has(refId(r)));
  const pool=cardPool(s).filter(r=>!r.source);
  while(s.deck.length<DECK_SIZE){const entry=pool.find(r=>s.deck.filter(x=>refId(x)===refId(r)).length<r.limit);s.deck.push({key:entry.key,source:null});}
  if(!s.deck.some(r=>isCombat(CARD_TYPES[r.key])&&CARD_TYPES[r.key].kind!=='recover'))s.deck[0]={key:'advance',source:null};
  resetPile(s);return true;
}
export function pileError(s) {
  const refs=[...s.deckState.draw,...s.deckState.discard,...(s.exploration?.hand||[]).filter((_,i)=>!s.exploration.usedCards.includes(i)),...(s.combat?.sharedDeck&&!s.combat.handDiscarded?s.combat.handRefs:[])];
  const counts=items=>items.map(refId).sort().join('|');
  return counts(refs)===counts(s.deck)?null:'山札・捨て札・手札の枚数が合いません。';
}
