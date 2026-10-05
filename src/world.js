import { BALANCE, LOCATIONS, MODULES, CARD_TYPES, OBSTACLES } from './data.js?v=0.2.1';
import { random, pick, shuffled, clamp, round } from './random.js?v=0.2.1';
import { makeItem, generateItem, equipped, carriedWeight } from './items.js?v=0.2.1';
import { abilities, playerActor, beginCombat } from './combat.js?v=0.2.1';

import { ensureDeck, drawShared, discardRefs, releaseExploration, releaseBattle, syncDeck, resetPile, deckError, cardInfo } from './deck.js?v=0.2.1';

export function newGame(seed=Date.now()) {
  const s={version:BALANCE.saveVersion,rng:(seed>>>0)||123456789,serial:0,hour:8,day:1,location:7,baseLocation:7,region:1,world:[],
    vitals:Object.fromEntries(['headHP','bodyHP','headST','bodyST'].map(key=>[key,BALANCE.player[key]])),pack:{food:3,water:3,scrap:0,cloth:0,fuel:1,med:1},
    baseResources:{food:6,water:6,scrap:4,cloth:2,fuel:3,med:2},inventory:[],stash:[],equipment:{},modules:[],hunger:0,thirst:0,exploration:null,combat:null,log:[],visits:0,kills:0,lootCount:0};
  const weapon=makeItem(s,'broom','sharp'),coat=makeItem(s,'workcoat',null),cap=makeItem(s,'cap',null),knife=makeItem(s,'knife','long');
  s.inventory.push(weapon,coat,cap,knife,makeItem(s,'crowbar',null));
  ensureDeck(s);
  s.equipment={weapon:weapon.id,body:coat.id,head:cap.id};
  createWorld(s);
  log(s,'朝が来た。今日もこの小さな家を走らせる。');
  return s;
}
export function createWorld(s) {
  s.world=Array.from({length:15},(_,i)=>({id:i,locId:pick(s,LOCATIONS).id,seen:false,visits:0,used:[],discovered:[]}));
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
  const beforeRisk=encounterRisk(s,'walk');releaseExploration(s);
  s.location=id;s.exploration=null;s.world[id].visits++;reveal(s);advanceTime(s,1);
  s.vitals.bodyST=Math.max(0,s.vitals.bodyST-1);
  log(s,`${withBase?'拠点と一緒に':'歩いて'}${location(s).name}へ。`);
  if(!withBase&&random(s)<Math.max(beforeRisk,encounterRisk(s,'walk')))encounter(s);
  return null;
}
export const isNight=(s,hour=s.hour)=>hour>=18||hour<6;
export function encounterRisk(s,kind='search',hour=s.hour,noise=0) {
  const danger=location(s).danger;
  if(kind==='walk')return isNight(s,hour)?Math.min(.7,danger*1.5+.25):danger*.15;
  return Math.min(.9,(isNight(s,hour)?danger*3+.18:danger)+noise);
}
export function returnHours(s){return Math.abs(s.location%5-s.baseLocation%5)+Math.abs(Math.floor(s.location/5)-Math.floor(s.baseLocation/5));}
function encounter(s){beginCombat(s);log(s,'物音。こちらに気づいた何かが、近づいてくる。');}
export function obstacle(s,index){
  const name=location(s).spots[index];
  const kind=/ロッカー|金庫|工具箱|トランク|郵便受け|物資庫/.test(name)?'locked':/屋上|二階|高架|塔の/.test(name)?'high':/草|倒木|うろ|獣道|テント/.test(name)?'overgrown':/残骸|廃材|家電|積み上がった|配電|ケーブル/.test(name)?'salvage':/奥|シャッター|搬入|コンテナ|倉庫/.test(name)?'blocked':'open';
  return {...OBSTACLES[kind],kind,spotName:name,index};
}
export function successChance(count,bonus,difficulty){
  let dist=[1];for(let i=0;i<count;i++){const next=Array(dist.length+6).fill(0);for(let sum=0;sum<dist.length;sum++)for(let die=1;die<=6;die++)next[sum+die]+=dist[sum]/6;dist=next;}
  return Math.round(dist.reduce((sum,p,i)=>sum+(i+bonus>=difficulty?p:0),0)*100);
}
export function searchOption(s,index,handIndex){
  const ex=s.exploration,ref=ex?.hand?.[handIndex],c=ref&&cardInfo(ref,s.inventory),o=obstacle(s,index),execution=stats(s).execution;
  const error=!ex||ex.location!==s.location?'周辺を見渡してください。':ex.remaining<=0?'行動回数を使い切りました。カードを引き直してください。':!c||ex.usedCards.includes(handIndex)?'使用できる手札を選んでください。':s.vitals.bodyST<c.bodyCost||s.vitals.headST<c.headCost?'STが足りません。回復カードや物資を使ってください。':c.kind==='recover'?null:!ex.spots.some(x=>x.index===index)||s.world[s.location].used.includes(index)?'この箇所は探索できません。':c.search?.[o.kind]===undefined?'このカードではこの箇所を調べられません。':null;
  const bonus=c?.search?.[o.kind]??0;
  return {card:c,obstacle:o,execution,bonus,chance:c?.search?.[o.kind]!==undefined?successChance(execution,bonus,o.difficulty):0,risk:Math.max(encounterRisk(s,'search',s.hour,c?.noise||0),encounterRisk(s,'search',(s.hour+1)%24,c?.noise||0)),error};
}
function searchSession(s){
  const a=stats(s),node=s.world[s.location];
  s.exploration={location:s.location,spots:node.discovered.filter(i=>!node.used.includes(i)).map(index=>({index,name:location(s).spots[index]})),hand:drawShared(s,a.judgment),usedCards:[],remaining:a.action,stats:{...a},abilityActor:playerActor(s)};
}
export function survey(s){
  if(!free(s))return '今は周辺を調べられません。';
  const node=s.world[s.location],a=stats(s);node.discovered||=[];
  const unknown=location(s).spots.map((_,i)=>i).filter(i=>!node.used.includes(i)&&!node.discovered.includes(i));
  const known=node.discovered.some(i=>!node.used.includes(i));
  if(!unknown.length){
    if(known&&!s.exploration?.hand.length)return redraw(s);
    return known?'未解決の場所があります。カードを引き直して挑戦できます。':'ここは調べ尽くしました。';
  }
  if(!a.perception)return '知覚が0のため新しい箇所を発見できません。まず頭の傷を手当てしてください。';
  releaseExploration(s);const risk=Math.max(encounterRisk(s),encounterRisk(s,'search',(s.hour+1)%24));
  const found=shuffled(s,unknown).slice(0,a.perception);node.discovered.push(...found);searchSession(s);
  advanceTime(s,1);s.vitals.bodyST=Math.max(0,s.vitals.bodyST-1);s.vitals.headST=Math.max(0,s.vitals.headST-1);
  log(s,`${found.length}箇所を発見。手札${s.exploration.hand.length}枚、行動${s.exploration.remaining}回。見渡しに1時間。`);
  if(random(s)<risk)encounter(s);return null;
}
export function redraw(s){
  if(!free(s))return '戦闘中は探索カードを引き直せません。';
  const node=s.world[s.location];if(!node.discovered?.some(i=>!node.used.includes(i)))return 'まず周辺を見渡して探索箇所を見つけてください。';
  releaseExploration(s);const risk=Math.max(encounterRisk(s),encounterRisk(s,'search',(s.hour+1)%24));searchSession(s);advanceTime(s,1);
  s.vitals.headST=Math.max(0,s.vitals.headST-1);s.vitals.bodyST=Math.max(0,s.vitals.bodyST-1);
  log(s,`カードを引き直した。手札${s.exploration.hand.length}枚、行動${s.exploration.remaining}回。1時間が過ぎた。`);
  if(random(s)<risk)encounter(s);return null;
}
export function searchSpot(s,index,handIndex){
  if(!free(s))return '戦闘中は探索できません。';
  if(s.world[s.location].used.includes(index))return 'この箇所は調査済みです。';
  const option=searchOption(s,index,handIndex);if(option.error)return option.error;
  const {card:c,obstacle:o,execution,bonus,risk}=option,ex=s.exploration;
  ex.usedCards.push(handIndex);discardRefs(s,[ex.hand[handIndex]]);ex.remaining--;
  const dice=c.kind==='recover'?[]:Array.from({length:execution},()=>1+Math.floor(random(s)*6)),total=dice.reduce((a,b)=>a+b,0)+bonus,success=c.kind==='recover'||total>=o.difficulty;
  s.vitals.bodyST=clamp(s.vitals.bodyST-c.bodyCost+(c.bodyRecovery||0),0,BALANCE.player.bodyST);s.vitals.headST=clamp(s.vitals.headST-c.headCost+(c.headRecovery||0),0,BALANCE.player.headST);advanceTime(s,1);
  s.lastCheck={name:c.kind==='recover'?c.name:o.spotName,card:c.name,dice,bonus,total,difficulty:o.difficulty,success,recovery:c.kind==='recover',day:s.day,hour:s.hour};
  if(c.kind==='recover')log(s,`${c.name}。1時間かけてSTを回復。`);
  else if(!success)log(s,`${o.spotName}：${c.name}［${dice.join('・')}］＋${bonus}＝${total} / 難易度${o.difficulty}。失敗。未解決のまま残る。`);
  else {
    s.world[s.location].used.push(index);ex.spots=ex.spots.filter(x=>x.index!==index);s.visits++;
    const good=total>=o.difficulty+3,loc=location(s);
    if(random(s)<.45){const item=generateItem(s,good);if(carriedWeight(s)+item.carry<=BALANCE.packCapacity){s.inventory.push(item);s.lootCount++;log(s,`${o.spotName}から「${item.name}」を回収。拠点でカードを組み込める。`);}else log(s,`${item.name}を見つけたが、携行重量がいっぱい。`);}
    else {const key=pick(s,loc.loot),space=Math.max(0,Math.floor((BALANCE.packCapacity-carriedWeight(s))/.15+1e-6)),n=Math.min(good?3:1,space);s.pack[key]+=n;s.lootCount+=n;log(s,`${o.spotName}を調査完了。${{food:'食料',water:'水',scrap:'スクラップ',cloth:'布',fuel:'燃料',med:'医療品'}[key]}を${n}つ回収。`);}
  }
  if(random(s)<risk)encounter(s);return null;
}
export function endSearch(s){if(!free(s))return '今は探索を終了できません。';releaseExploration(s);s.exploration=null;return null;}
export function commitDeck(s,refs){
  if(!free(s)||!atBase(s))return 'デッキの組み直しは拠点で行います。';
  const error=deckError(s,refs);if(error)return error;
  if(JSON.stringify(refs)===JSON.stringify(s.deck))return null;
  releaseExploration(s);s.exploration=null;s.deck=structuredClone(refs);resetPile(s);advanceTime(s,1);log(s,'18枚のデッキを組み直した。準備に1時間。');return null;
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
  const home=atBase(s),bed=home&&s.modules.includes('bed'),night=isNight(s),risk=Math.max(encounterRisk(s),encounterRisk(s,'search',(s.hour+2)%24));
  releaseExploration(s);
  advanceTime(s,home?(night?(6-s.hour+24)%24:6):2);
  s.hunger=Math.max(0,s.hunger-35);s.thirst=Math.max(0,s.thirst-40);
  s.vitals.headST=clamp(s.vitals.headST+(home?BALANCE.player.headST:6),0,BALANCE.player.headST);
  s.vitals.bodyST=clamp(s.vitals.bodyST+(home?BALANCE.player.bodyST:8),0,BALANCE.player.bodyST);
  s.vitals.headHP=clamp(s.vitals.headHP+(bed?3:home?1:0),0,BALANCE.player.headHP);
  s.vitals.bodyHP=clamp(s.vitals.bodyHP+(bed?10:home?4:0),0,BALANCE.player.bodyHP);
  log(s,home?'家の中で眠った。目覚めたら、また出かけよう。':'物陰で少しだけ休んだ。');
  if(!home&&random(s)<risk*.7)beginCombat(s);
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
  if(item.type==='tool')return '道具は装備せず、拠点でデッキにカードを採用します。';
  s.equipment[item.slot]=id;log(s,`${item.name}を装備した。`);return null;
}
export function stashItem(s,id) {
  if(!free(s)||!atBase(s))return '拠点に戻ってください。';
  if(Object.values(s.equipment).includes(id))return '装備中です。別の装備に持ち替えてください。';
  if(s.stash.length>=(s.modules.includes('storage')?16:8))return '拠点の収納がいっぱいです。';
  const index=s.inventory.findIndex(x=>x.id===id);if(index<0)return '装備が見つかりません。';
  s.stash.push(s.inventory.splice(index,1)[0]);if(syncDeck(s))log(s,'しまった道具のカードを外し、基本カードで18枚を補充した。');return null;
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
  s.inventory.splice(index,1);if(syncDeck(s))log(s,'解体した道具のカードを外し、基本カードで18枚を補充した。');s.baseResources.scrap+=s.modules.includes('workbench')?3:2;
  log(s,'使わない装備をばらし、部品を拾い集めた。');return null;
}
export function finishCombat(s) {
  const b=s.combat;if(!b?.result)return '戦闘はまだ続いています。';
  if(b.result==='victory'){s.kills++;const item=generateItem(s,true);if(carriedWeight(s)+item.carry<=12)s.inventory.push(item);else log(s,'戦利品は重くて持ち帰れなかった。');log(s,`生き残った。${item.name}が落ちていた。`);}
  if(b.result==='escaped')log(s,'生きて帰ることが、いちばん大切だ。');
  if(['defeat','mutual'].includes(b.result))log(s,'この旅は、ここで終わった。');
  releaseBattle(s);s.combat=null;advanceTime(s,1);return null;
}
export function nextRegion(s) {
  if(!free(s)||!atBase(s))return '拠点に戻ってください。';
  if(!s.modules.includes('engine'))return 'まずエンジンを修理してください。';
  if(available(s,'fuel')<3)return '次の街へ向かうには燃料が３必要です。';
  spend(s,'fuel',3);releaseExploration(s);s.region++;s.exploration=null;createWorld(s);advanceTime(s,8);log(s,'見慣れた廃墟が、バックミラーの向こうへ消えた。');return null;
}
