import { WEAPONS, ARMOR, TOOLS, MODIFIERS, BALANCE } from './data.js?v=0.2.2';
import { pick, random, round, shuffled } from './random.js?v=0.2.2';
export function makeItem(state, baseId, modifierIds) {
  const base = [...WEAPONS, ...ARMOR, ...TOOLS].find(x => x.id === baseId);
  if (!base) throw new Error('Unknown item base');
  const type = WEAPONS.includes(base) ? 'weapon' : TOOLS.includes(base) ? 'tool' : 'armor';
  const ids = [...new Set(Array.isArray(modifierIds)?modifierIds:modifierIds?[modifierIds]:[])];
  const mods = ids.map(id=>MODIFIERS.find(x=>x.id===id&&x.types.includes(type))).filter(Boolean);
  const item = { ...structuredClone(base), baseId:base.id, id:`item-${++state.serial}`, type, slot:type==='weapon'?'weapon':base.slot, modifiers:mods.map(x=>x.id), name:`${mods.map(x=>x.name).join('・')}${base.name}`, stats:{...base.stats} };
  for(const mod of mods) {
    for (const [key, delta] of Object.entries(mod.changes || {})) item[key] = round((item[key]||0) + delta);
    for (const [key, delta] of Object.entries(mod.stats || {})) item.stats[key] = (item.stats[key]||0) + delta;
  }
  item.sharpness = Math.max(0,item.sharpness||0);
  item.weight = Math.max(.1,item.weight||.1);
  item.hardness = Math.max(0,item.hardness||0);
  item.softness = Math.max(BALANCE.softnessFloor,item.softness||1);
  item.carry = Math.max(.1,item.carry);
  return item;
}
export function generateItem(state, good) {
  if(random(state)<.2)return makeItem(state,pick(state,TOOLS).id,null);
  const weapon = random(state) < .58;
  const base = pick(state, weapon ? WEAPONS : ARMOR);
  const options = MODIFIERS.filter(x=>x.types.includes(weapon?'weapon':'armor'));
  // "Good" is a bonus opportunity, not a rarity ladder that removes trade-offs.
  const useful = options.filter(x=>['sharp','balanced','soft','light','bright'].includes(x.id));
  const count=Math.min(BALANCE.maxModifiers,random(state)<.5?1:random(state)<.7?2:3,options.length);
  const first=pick(state,good&&useful.length?useful:options);
  const rest=shuffled(state,options.filter(x=>x.id!==first.id)).slice(0,count-1);
  return makeItem(state,base.id,[first,...rest].map(x=>x.id));
}
export function equipped(state, slot) { return state.inventory.find(x=>x.id===state.equipment[slot]); }
export function itemModifiers(item) { return (item.modifiers||[]).map(id=>MODIFIERS.find(x=>x.id===id)).filter(Boolean); }
export function carriedWeight(state) {
  return round(state.inventory.reduce((a,x)=>a+x.carry,0) + Object.values(state.pack).reduce((a,x)=>a+x,0)*.15);
}
