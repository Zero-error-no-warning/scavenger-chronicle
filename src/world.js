import { BALANCE, LOCATIONS, MODULES } from './data.js?v=0.1.5';
import { random, pick, shuffled, clamp, round } from './random.js?v=0.1.5';
import { makeItem, generateItem, equipped, carriedWeight } from './items.js?v=0.1.5';
import { abilities, playerActor, beginCombat } from './combat.js?v=0.1.5';

export function newGame(seed=Date.now()) {
  const s={version:BALANCE.saveVersion,rng:(seed>>>0)||123456789,serial:0,hour:8,day:1,location:7,baseLocation:7,region:1,world:[],
    vitals:Object.fromEntries(['headHP','bodyHP','headST','bodyST'].map(key=>[key,BALANCE.player[key]])),pack:{food:3,water:3,scrap:0,cloth:0,fuel:1,med:1},
    baseResources:{food:6,water:6,scrap:4,cloth:2,fuel:3,med:2},inventory:[],stash:[],equipment:{},modules:[],hunger:0,thirst:0,exploration:null,combat:null,log:[],visits:0,kills:0,lootCount:0};
  const weapon=makeItem(s,'broom','sharp'),coat=makeItem(s,'workcoat',null),cap=makeItem(s,'cap',null),knife=makeItem(s,'knife','long');
  s.inventory.push(weapon,coat,cap,knife);
  s.equipment={weapon:weapon.id,body:coat.id,head:cap.id};
  createWorld(s);
  log(s,'朝が来た。今日もこの小さな家を走らせる。');
  return s;
}
export function createWorld(s) {
  s.world=Array.from({length:15},(_,i)=>({id:i,locId:pick(s,LOCATIONS).id,seen:false,visits:0,used:[]}));
  s.world[7].locId='road'; s.world[2].locId='clinic';s.world[6].locId='mart';s.world[8].locId='factory';s.world[12].locId='forest';
  s.location=s.baseLocation=7; reveal(s);
}
export function log(s,message) {s.log.unshift({day:s.day,hour:s.hour,text:message});s.log=s.log.slice(0,80);}
export const atBase=s=>s.location===s.baseLocation;
export const location=s=>LOCATIONS.find(x=>x.id===s.world[s.location].locId);
export function explorationProgress(s,id=s.location) {
  const node=s.world[id],loc=LOCATIONS.find(x=>x.id===node.locId);
  const used=new Set(node.used);
  const done=loc.spots.map((name,index)=>({name,index})).filter(spot=>used.has(spot.index));
  return {done,total:loc.spots.length,remaining:loc.spots.length-done.length};
}
export const stats=s=>abilities(playerActor(s));
export function neighbors(id) {
  const x=id%5,y=Math.floor(id/5);
  return [x>0?id-1:null,x<4?id+1:null,y>0?id-5:null,y<2?id+5:null].filter(x=>x!==null);
}
export function reveal(s) {for(const id of [s.location,...neighbors(s.location)])s.world[id].seen=true;}
export function advanceTime(s,hours) {
  s.hour+=hours; s.hunger=clamp(s.hunger+hours*2,0,100);s.thirst=clamp(s.thirst+hours*3,0,100);
  while(s.hour>=24) {
    s.hour-=24;s.day++;
    if(s.modules.includes('filter')){s.baseResources.water+=2;log(s,'雨水フィルターが水を２つ集めた。');}
  }
  if(s.hunger>=80)s.vitals.bodyST=round(Math.max(0,s.vitals.bodyST-hours));
  if(s.thirst>=80)s.vitals.headST=round(Math.max(0,s.vitals.headST-hours));
}
function available(s,key) {return s.pack[key]+(atBase(s)?s.baseResources[key]:0);}
function spend(s,key,n) {const p=Math.min(s.pack[key],n);s.pack[key]-=p;if(n>p)s.baseResources[key]-=n-p;}
function free(s) {return s.vitals.headHP>0&&!s.combat;}
export function move(s,id,withBase=false) {
  if(!free(s))return '戦闘中は移動できません。';
  if(!neighbors(s.location).includes(id))return '隣接する場所を選んでください。';
  if(withBase) {
    if(!atBase(s))return 'まず移動拠点に戻ってください。';
    const fuel=s.modules.includes('engine')?1:2;
    if(available(s,'fuel')<fuel)return `燃料が${fuel}必要です。`;
    spend(s,'fuel',fuel);s.baseLocation=id;
  }
  s.location=id;s.exploration=null;s.world[id].visits++;reveal(s);advanceTime(s,1);
  s.vitals.bodyST=Math.max(0,s.vitals.bodyST-1);
  log(s,`${withBase?'拠点と一緒に':'歩いて'}${location(s).name}へ。`);
  return null;
}
export function survey(s) {
  if(!free(s))return '今は周辺を調べられません。';
  const node=s.world[s.location],loc=location(s),a=stats(s);
  if(s.exploration?.remaining>0)return '見つけた探索箇所を調べるか、探索を終えてください。';
  const spots=shuffled(s,loc.spots.map((name,index)=>({name,index})).filter(x=>!node.used.includes(x.index))).slice(0,a.judgment);
  if(!spots.length)return 'ここは調べ尽くしました。別の場所へ移動しましょう。';
  s.exploration={location:s.location,spots,remaining:a.action,stats:{...a},abilityActor:playerActor(s)};
  log(s,`${spots.length}箇所を発見。あと${a.action}回調べられる。`);
  return null;
}
export function searchSpot(s,index) {
  if(!free(s))return '戦闘中は探索できません。';
  const ex=s.exploration,spot=ex?.spots.find(x=>x.index===index);
  if(ex?.location!==undefined&&ex.location!==s.location)return 'この探索候補は別の区画のものです。周辺を見渡してください。';
  if(s.world[s.location].used.includes(index))return 'この箇所は調査済みです。';
  if(!spot||ex.remaining<=0)return '探索できません。';
  ex.spots=ex.spots.filter(x=>x.index!==index);ex.remaining--;
  s.world[s.location].used.push(index);advanceTime(s,1);s.visits++;
  const a=stats(s),loc=location(s);
  s.vitals.bodyST=Math.max(0,s.vitals.bodyST-2);s.vitals.headST=Math.max(0,s.vitals.headST-1);
  const good=random(s)<Math.min(.95,BALANCE.search.goodBase+a.perception*BALANCE.search.goodPerception);
  const found=random(s)<Math.min(.95,BALANCE.search.findBase+a.execution*BALANCE.search.findExecution);
  if(found) {
    if(random(s)<.5) {
      const item=generateItem(s,good);
      if(carriedWeight(s)+item.carry<=BALANCE.packCapacity) {s.inventory.push(item);s.lootCount++;log(s,`${spot.name}で「${item.name}」を拾った。${good?'手応えのある発見だ。':''}`);}
      else log(s,`${item.name}を見つけたが、重くて持ち帰れない。拠点で荷物を整理しよう。`);
    } else {
      const key=pick(s,loc.loot),quantity=good?3:1;
      const space=Math.max(0,Math.floor((BALANCE.packCapacity-carriedWeight(s))/.15+1e-6));
      const n=Math.min(quantity,space);
      s.pack[key]+=n;s.lootCount+=n;
      const names={food:'食料',water:'水',scrap:'スクラップ',cloth:'布',fuel:'燃料',med:'医療品'};
      log(s,n?`${spot.name}から${names[key]}を${n}つ回収。`:'荷物がいっぱいで資源を持ち帰れなかった。');
    }
  } else log(s,`${spot.name}には、もう何も残っていなかった。`);
  if(!ex.spots.length)ex.remaining=0;
  if(random(s)<loc.danger) {beginCombat(s);log(s,'物音。こちらに気づいた何かが、近づいてくる。');}
  return null;
}
export function endSearch(s) {
  if(!free(s))return '今は探索を終了できません。';
  s.exploration=null;return null;
}
export function deposit(s) {
  if(!atBase(s)||!free(s))return '拠点に戻ってください。';
  for(const key of Object.keys(s.pack)){s.baseResources[key]+=s.pack[key];s.pack[key]=0;}
  log(s,'持ち帰った資源を、家の収納に収めた。');return null;
}
export function takeSupply(s,key) {
  if(!atBase(s)||!free(s))return '拠点に戻ってください。';
  if(!s.baseResources[key])return '拠点に在庫がありません。';
  if(carriedWeight(s)+.15>BALANCE.packCapacity)return '携行重量がいっぱいです。';
  s.baseResources[key]--;s.pack[key]++;return null;
}
export function consume(s,key) {
  if(!free(s))return '戦闘中は物資を使えません。';
  if(!available(s,key))return '物資がありません。';
  spend(s,key,1);
  if(key==='food'){s.hunger=Math.max(0,s.hunger-35);s.vitals.bodyST=clamp(s.vitals.bodyST+3,0,BALANCE.player.bodyST);log(s,'食料をゆっくり噛んだ。');}
  if(key==='water'){s.thirst=Math.max(0,s.thirst-40);s.vitals.headST=clamp(s.vitals.headST+3,0,BALANCE.player.headST);log(s,'水を飲み、ひと息ついた。');}
  if(key==='med'){s.vitals.headHP=clamp(s.vitals.headHP+3,0,BALANCE.player.headHP);s.vitals.bodyHP=clamp(s.vitals.bodyHP+8,0,BALANCE.player.bodyHP);log(s,'傷を洗って、包帯を巻いた。');}
  return null;
}
export function rest(s) {
  if(!free(s))return '今は休めません。';
  if(available(s,'food')<1||available(s,'water')<1)return '休息には食料と水が１つずつ必要です。';
  spend(s,'food',1);spend(s,'water',1);
  const home=atBase(s),bed=home&&s.modules.includes('bed');
  advanceTime(s,home?6:2);
  s.hunger=Math.max(0,s.hunger-35);s.thirst=Math.max(0,s.thirst-40);
  s.vitals.headST=clamp(s.vitals.headST+(home?BALANCE.player.headST:6),0,BALANCE.player.headST);
  s.vitals.bodyST=clamp(s.vitals.bodyST+(home?BALANCE.player.bodyST:8),0,BALANCE.player.bodyST);
  s.vitals.headHP=clamp(s.vitals.headHP+(bed?3:home?1:0),0,BALANCE.player.headHP);
  s.vitals.bodyHP=clamp(s.vitals.bodyHP+(bed?10:home?4:0),0,BALANCE.player.bodyHP);
  log(s,home?'家の中で眠った。目覚めたら、また出かけよう。':'物陰で少しだけ休んだ。');
  if(!home&&random(s)<location(s).danger*.5)beginCombat(s);
  return null;
}
export function install(s,id) {
  if(!free(s)||!atBase(s))return '工作は拠点で行います。';
  const mod=MODULES.find(x=>x.id===id);
  if(!mod||s.modules.includes(id))return 'すでに取り付けています。';
  if(Object.entries(mod.cost).some(([key,n])=>available(s,key)<n))return '材料が足りません。';
  for(const [key,n] of Object.entries(mod.cost))spend(s,key,n);
  s.modules.push(id);advanceTime(s,2);log(s,`${mod.name}を取り付けた。この家が、少し好きになった。`);return null;
}
export function equip(s,id) {
  if(!free(s))return '戦闘中は装備を変更できません。';
  const item=s.inventory.find(x=>x.id===id);
  if(!item)return '装備が見つかりません。';
  s.equipment[item.slot]=id;log(s,`${item.name}を装備した。`);return null;
}
export function stashItem(s,id) {
  if(!free(s)||!atBase(s))return '拠点に戻ってください。';
  if(Object.values(s.equipment).includes(id))return '装備中です。別の装備に持ち替えてください。';
  if(s.stash.length>=(s.modules.includes('storage')?16:8))return '拠点の収納がいっぱいです。';
  const index=s.inventory.findIndex(x=>x.id===id);if(index<0)return '装備が見つかりません。';
  s.stash.push(s.inventory.splice(index,1)[0]);return null;
}
export function retrieveItem(s,id) {
  if(!free(s)||!atBase(s))return '拠点に戻ってください。';
  const index=s.stash.findIndex(x=>x.id===id);if(index<0)return '装備が見つかりません。';
  if(carriedWeight(s)+s.stash[index].carry>BALANCE.packCapacity)return '携行重量がいっぱいです。';
  s.inventory.push(s.stash.splice(index,1)[0]);return null;
}
export function salvage(s,id) {
  if(!free(s)||!atBase(s))return '解体は拠点で行います。';
  if(Object.values(s.equipment).includes(id))return '装備中のものは解体できません。';
  const index=s.inventory.findIndex(x=>x.id===id);if(index<0)return '装備が見つかりません。';
  s.inventory.splice(index,1);s.baseResources.scrap+=s.modules.includes('workbench')?3:2;
  log(s,'使わない装備をばらし、部品を拾い集めた。');return null;
}
export function finishCombat(s) {
  const b=s.combat;if(!b?.result)return '戦闘はまだ続いています。';
  if(b.result==='victory'){s.kills++;const item=generateItem(s,true);if(carriedWeight(s)+item.carry<=12)s.inventory.push(item);else log(s,'戦利品は重くて持ち帰れなかった。');log(s,`生き残った。${item.name}が落ちていた。`);}
  if(b.result==='escaped')log(s,'生きて帰ることが、いちばん大切だ。');
  if(['defeat','mutual'].includes(b.result))log(s,'この旅は、ここで終わった。');
  s.combat=null;advanceTime(s,1);return null;
}
export function nextRegion(s) {
  if(!free(s)||!atBase(s))return '拠点に戻ってください。';
  if(!s.modules.includes('engine'))return 'まずエンジンを修理してください。';
  if(available(s,'fuel')<3)return '次の街へ向かうには燃料が３必要です。';
  spend(s,'fuel',3);s.region++;s.exploration=null;createWorld(s);advanceTime(s,8);log(s,'見慣れた廃墟が、バックミラーの向こうへ消えた。');return null;
}
