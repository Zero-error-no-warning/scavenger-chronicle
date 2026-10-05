import { BALANCE, CARD_TYPES, LOCATIONS, MODULES, RESOURCES } from './data.js?v=0.1.5';
import { abilities, playerActor, beginCombat, resolveRound, prepareRound, validatePlan, inRange } from './combat.js?v=0.1.5';
import * as world from './world.js?v=0.1.5';
import { equipped, itemModifiers, carriedWeight } from './items.js?v=0.1.5';
import { icon, character, scenery, weaponArt, armorArt, cardArt, escapeHTML as e } from './art.js?v=0.1.5';
import { loadGame, saveGame, parseSave } from './storage.js?v=0.1.5';
import { renderMap, paintMap } from './map.js?v=0.1.5';
import { abilityHelp, abilityNames } from './ability-help.js?v=0.1.5';
import { actionHelp, actionHelpActions } from './action-help.js?v=0.1.5';
import { replayPhases, replayView, renderResolution, phaseNames, positionResolution, enemyActionSummary, enemyAbilityInfo } from './battle-presentation.js?v=0.1.5';
const $=s=>document.querySelector(s);
let state,tab='explore',driving=false,playing=false,frame=null,saveError='',toastTimer,sound=false,audio,mapOpen=false,replaySkip=false,wakeReplay=null;
try {state=loadGame()||world.newGame();}catch(err){state=world.newGame();saveError=err.message;}
const app=$('#app'),dialog=$('#dialog');
const button=(action,label,{cls='',disabled=false,value='',title=''}={})=>`<button class="${cls}" data-action="${action}" data-value="${e(value)}" ${actionHelpActions.has(action)?`data-help-action="${action}" aria-describedby="ability-tooltip"`: ''} ${disabled?'disabled':''} ${title&&!actionHelpActions.has(action)?`title="${e(title)}"`:title&&cls.includes('icon-button')?`aria-label="${e(title)}"`:''}>${label}</button>`;
function toast(text) {$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function persist() {try{saveGame(state);if(saveError)saveError='';}catch{saveError='自動保存できません。メニューからセーブを書き出してください。';}}
function tone(type='tap') {
  if(!sound)return;
  try {
    audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();
    const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);
    o.type=type==='hit'?'triangle':'sine';o.frequency.setValueAtTime(type==='hit'?190:520,audio.currentTime);o.frequency.exponentialRampToValueAtTime(type==='hit'?70:340,audio.currentTime+.12);
    g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.2);
  }catch{}
}
const shownBattle=()=>frame?{...state.combat,...frame}:state.combat;
const currentActor=()=>shownBattle()?.player||playerActor(state);
function gauges(actor,compact=false) {
  return `<div class="gauges ${compact?'compact':''}">${[['headHP','頭HP','head','rose'],['bodyHP','体HP','body','coral'],['headST','頭ST','brain','blue'],['bodyST','体ST','lung','gold']].map(([key,label,svg,color])=>`<div class="gauge ${color}"><div class="gauge-top"><span>${icon(svg)}${label}</span><b>${actor[key]}<small> / ${actor.max[key]}</small></b></div><div class="bar" role="meter" aria-label="${label}" aria-valuenow="${actor[key]}" aria-valuemin="0" aria-valuemax="${actor.max[key]}"><i style="width:${Math.max(0,actor[key]/actor.max[key]*100)}%"></i></div></div>`).join('')}</div>`;
}
function abilityTrigger(key,label,{context='current',cls='ability-number'}={}) {
  return `<button type="button" class="${cls}" data-action="explain" data-ability="${key}" data-context="${context}" aria-label="${abilityNames[key]}の計算内訳" aria-describedby="ability-tooltip">${label}</button>`;
}
function abilityTiles(actor) {
  const a=abilities(actor),context=actor.visual==='player'?'current':'enemy';
  if(context==='enemy'&&state.combat)for(const key of ['perception','judgment','action'])a[key]=enemyAbilityInfo(state.combat,key,actor).value;
  return `<div class="abilities">${[['perception','知覚','eye'],['judgment','判断','brain'],['action','行動','action'],['execution','実効','dice']].map(([key,name,svg])=>abilityTrigger(key,`${icon(svg)}<span>${context==='enemy'&&key==='action'?'行動上限':name}</span><strong>${a[key]}</strong>`,{context,cls:'ability'})).join('')}</div>`;
}

function survivor() {
  const a=currentActor(),weapon=equipped(state,'weapon');
  return `<aside class="survivor panel"><div class="section-label">THE SCAVENGER <span>01</span></div><div class="survivor-title"><h2>今日も、生き延びる。</h2><span class="status-dot ${a.headHP<=0?'dead':''}">${a.headHP<=0?'旅の終わり':a.headHP<=3?'頭に重傷':'旅の途中'}</span></div><div class="portrait-frame">${character(state,{portrait:true})}<span class="portrait-note">拾ったもので、できている。</span></div>${gauges(a)}${abilityTiles(a)}<div class="weapon-summary">${icon('blade')}<div><small>いまの相棒</small><strong>${e(weapon.name)}</strong><span>鋭さ ${weapon.sharpness} · 重さ ${weapon.weight}<br>間合い ${weapon.minRange}–${weapon.maxRange}</span></div></div><div class="pack-weight">${icon('bag')}携行重量 <strong>${carriedWeight(state)} / 12</strong></div></aside>`;
}
function header() {
  return `<header class="header"><a class="brand" href="./" aria-label="拾荒者クロニクル">${icon('van')}<div><span>SCAVENGER CHRONICLE</span><h1>拾荒者クロニクル</h1></div></a><div class="day-chip">${icon('sun')}<b>${state.day}<small>日目</small></b><span>${String(state.hour).padStart(2,'0')}:00</span></div><div class="survival-chip ${state.hunger>=70?'alert':''}">${icon('food')}<span>空腹 <b>${state.hunger}%</b></span></div><div class="survival-chip ${state.thirst>=70?'alert':''}">${icon('water')}<span>渇き <b>${state.thirst}%</b></span></div><div class="header-buttons">${button('sound',icon(sound?'lung':'close'),{title:sound?'音をオフ':'音をオン',cls:'icon-button'})}${button('help','?',{title:'遊び方',cls:'icon-button'})}${button('menu',icon('save'),{title:'セーブ・設定',cls:'icon-button'})}</div></header>`;
}
function navigation() {
  return `<nav class="navigation" aria-label="ゲーム画面">${[['explore','map','探索'],['base','van','走る家'],['inventory','bag','装備と荷物'],['journal','book','旅の記録']].map(([value,svg,name])=>button('tab',`${icon(svg)}<span>${name}</span>`,{value,cls:tab===value?'active':'',disabled:!!state.combat})).join('')}<span class="autosave">${saveError?'保存エラー':'自動保存'}<i></i></span></nav>`;
}
function locationHeader(camp=false) {
  const loc=world.location(state);
  return `<div class="location-heading"><div><span class="eyebrow">${camp?'OUR LITTLE HOME':`SECTOR ${String(state.region).padStart(2,'0')} / 区画 ${String(state.location+1).padStart(2,'0')}`}</span><h2>${camp?'走る家、スズメ号':e(loc.name)}</h2></div><span class="badge ${world.atBase(state)?'green':''}">${world.atBase(state)?`${icon('van')}拠点にいる`:`${icon('advance')}拠点まで ${distanceToBase()} 区画`}</span></div>`;
}
function distanceToBase(){return Math.abs(state.location%5-state.baseLocation%5)+Math.abs(Math.floor(state.location/5)-Math.floor(state.baseLocation/5));}
function map() {
  return `<div class="map-wrap ${mapOpen?'open':''}"><div class="map-caption"><span>${icon('map')}周辺の地図</span><small>${driving?'光る施設へ拠点ごと移動':'光る施設を選ぶと徒歩移動'}</small>${button('toggleMap',mapOpen?'閉じる':'開く',{cls:'mobile-map-toggle',title:'周辺地図の表示を切り替える'})}</div>${renderMap(state,{driving})}</div>`;
}

function journalSnippet() {
  return `<section class="field-log"><div class="section-label">FIELD JOURNAL ${icon('book')}</div>${state.log.slice(0,3).map((l,i)=>`<p class="${i===0?'latest':''}"><time>${String(l.hour).padStart(2,'0')}:00</time>${e(l.text)}</p>`).join('')}</section>`;
}
function supplyStrip() {
  return `<div class="supplies">${Object.entries(RESOURCES).map(([key,r])=>`<span title="携行している${r.name}">${icon(r.icon)}<b>${state.pack[key]}</b></span>`).join('')}</div>`;
}
function exploreMain() {
  return `<main class="main-column explore-main">${locationHeader()}<div class="scene-frame">${scenery(state,world.location(state).kind)}<div class="scene-story"><span>THE WORLD AFTER</span><p>終わった世界にも、<br>今日の居場所はある。</p></div><div class="scene-weather">風の音だけが、聞こえる。</div></div>${map()}${journalSnippet()}</main>`;
}
function exploreControls() {
  const ex=state.exploration,a=world.stats(state),loc=world.location(state),progress=world.explorationProgress(state),available=progress.remaining;
  return `<aside class="commands panel"><div class="section-label">OUT THERE ${icon('eye')}</div><h2>何をしよう。</h2><p class="muted">${available>0?'拾えるものを探して、家に持ち帰ろう。':'この場所は調べ尽くした。次の場所へ。'}</p><div class="exploration-progress"><span>区画 ${String(state.location+1).padStart(2,'0')}</span><strong>調査済み ${progress.done.length} / ${progress.total} 箇所</strong><span>未探索 ${available} 箇所</span></div><div class="danger-line"><span>遭遇の危険</span><span class="danger-pips">${[0,1,2,3,4].map(i=>`<i class="${i<Math.ceil(loc.danger*10)?'on':''}"></i>`).join('')}</span></div>
  ${button('survey',`${icon('eye')}${progress.done.length?`残り${available}箇所を見渡す`:'周辺を見渡す'}`,{cls:'primary full',disabled:!!ex?.remaining||available===0})}
  <div class="search-summary"><span>発見 ${abilityTrigger('judgment',ex?.stats?.judgment??a.judgment,{context:ex?'exploration':'current'})} 箇所まで</span><span>探索 ${abilityTrigger('action',ex?.remaining??a.action,{context:ex?'exploration':'current'})} 回</span></div>
  ${ex?.remaining>0?`<div class="spots">${ex.spots.filter(spot=>!state.world[state.location].used.includes(spot.index)).map(spot=>button('search',`<span>${icon('bag')}<b>${e(spot.name)}</b></span><small>調べる ${icon('advance')}</small>`,{value:spot.index,cls:'spot'})).join('')}</div>${button('endSearch','探索を切り上げる',{cls:'text-button'})}`:`<p class="search-complete">${!available?'この区画の全箇所を調査済みです。':ex?'今回の探索は終了。未探索の箇所が残っています。':'未探索の箇所を見渡して、調べる場所を選びます。'}</p>`}
  ${progress.done.length?`<details class="searched-spots"><summary>調査済みの ${progress.done.length} 箇所</summary><p>${progress.done.map(spot=>e(spot.name)).join(' / ')}</p></details>`:''}
  <div class="command-divider"></div><div class="section-label">POCKET SUPPLIES</div>${supplyStrip()}<div class="quick-supplies">${button('consume',`${icon('food')}食べる`,{value:'food',disabled:state.pack.food+(world.atBase(state)?state.baseResources.food:0)<1})}${button('consume',`${icon('water')}飲む`,{value:'water',disabled:state.pack.water+(world.atBase(state)?state.baseResources.water:0)<1})}${button('consume',`${icon('medical')}手当`,{value:'med',disabled:state.pack.med+(world.atBase(state)?state.baseResources.med:0)<1})}</div>
  ${button('rest',`${icon('bed')}${world.atBase(state)?'家で休む':'物陰で休む'}<small>食料１＋水１</small>`,{cls:'full secondary'})}
  <div class="command-divider"></div>${button('driving',`${icon('van')}${driving?'拠点ごと移動中':'拠点を動かす'}`,{cls:`full ${driving?'active':''}`,disabled:!world.atBase(state)})}<small class="hint">${driving?'地図の光る施設を選択。':'拠点にいる時、道路でつながる施設へ車で移動。'} 燃料${state.modules.includes('engine')?1:2}。</small>${button('encounter','近くの気配を追う',{cls:'text-button encounter',title:'意図的に戦闘を始める。勝てるとは限りません。'})}</aside>`;
}
function baseMain() {
  return `<main class="main-column base-main">${locationHeader(true)}<div class="scene-frame camp">${scenery(state,world.location(state).kind,{camp:true})}<div class="scene-story"><span>HOME IS WHERE WE PARK</span><p>窓から灯りが漏れる。<br>ここが、いまの家。</p></div></div><div class="base-banner">${icon('van')}<div><strong>${state.modules.length} / 5 設備</strong><span>拾った部品が、少しずつ家になる。</span></div>${world.atBase(state)?button('deposit','資源を全部しまう',{cls:'primary'}):'<span class="badge">拠点に戻ると利用できます</span>'}</div>${!world.atBase(state)?`<p class="base-away">車は区画 ${String(state.baseLocation+1).padStart(2,'0')} に駐車中です。現在地にはありません。</p>`:''}<div class="module-grid">${MODULES.map(mod=>`<article class="module ${state.modules.includes(mod.id)?'installed':''}"><div>${icon(mod.icon)}<span>${state.modules.includes(mod.id)?'INSTALLED':'UPGRADE'}</span></div><h3>${mod.name}</h3><p>${mod.text}</p><div class="costs">${Object.entries(mod.cost).map(([key,n])=>`<span>${icon(RESOURCES[key].icon)}${n}</span>`).join('')}</div>${button('install',state.modules.includes(mod.id)?`${icon('check')}取り付け済み`:'取り付ける',{value:mod.id,cls:'full',disabled:state.modules.includes(mod.id)||!world.atBase(state)||Object.entries(mod.cost).some(([key,n])=>state.baseResources[key]+state.pack[key]<n)})}</article>`).join('')}</div></main>`;
}
function baseControls() {
  return `<aside class="commands panel"><div class="section-label">IN OUR HOME ${icon('van')}</div><h2>備えが、明日になる。</h2><p class="muted">拠点の物資。右の＋で１つ持ち出せる。</p><div class="resource-list">${Object.entries(RESOURCES).map(([key,r])=>`<div>${icon(r.icon)}<span>${r.name}</span><strong>${state.baseResources[key]}</strong>${button('takeSupply',icon('plus'),{value:key,cls:'icon-button',disabled:!world.atBase(state)||!state.baseResources[key],title:`${r.name}を１つ持ち出す`})}</div>`).join('')}</div>${button('rest',`${icon('bed')}家で休む`,{cls:'secondary full',disabled:!world.atBase(state)})}<small class="hint">食料１・水１ / ６時間。寝床を作ると傷の回復も増える。</small><div class="command-divider"></div><div class="section-label">NEXT STOP</div><h3>まだ知らない街へ。</h3><p class="muted">エンジンを修理し、燃料を３つ集めたら出発できる。</p>${button('nextRegion',`${icon('advance')}次の街へ走る`,{cls:'primary full',disabled:!world.atBase(state)||!state.modules.includes('engine')})}<small class="hint">この地域の地図と探索状況はリセットされる。</small></aside>`;
}
function itemCard(item,stored=false) {
  const mods=itemModifiers(item),isEquipped=state.equipment[item.slot]===item.id;
  const graphic=item.type==='weapon'?weaponArt(item):armorArt(item);
  return `<article class="item-card ${isEquipped?'equipped':''}"><div class="item-head">${graphic}<div><span class="eyebrow">${item.type==='weapon'?'WEAPON':item.slot==='head'?'HEAD GEAR':'BODY GEAR'} ${isEquipped?' / EQUIPPED':''}</span><h3>${e(item.name)}</h3><small>${item.carry} 携行重量</small></div></div><p>${e(item.text)}</p><div class="item-numbers">${item.type==='weapon'?`<span>鋭さ <b>${item.sharpness}</b></span><span>重さ <b>${item.weight}</b></span><span>射程 <b>${item.minRange}–${item.maxRange}</b></span>`:`<span>硬さ <b>${item.hardness}</b></span><span>柔らかさ <b>${item.softness}</b></span>`}</div>${mods.length?`<div class="tradeoff">${mods.map(mod=>`<div class="modifier-row"><b>${e(mod.name)}</b><span class="benefit">＋ ${e(mod.good)}</span><span class="drawback">− ${e(mod.bad)}</span></div>`).join('')}</div>`:'<div class="tradeoff"><span>そのままの、素朴な装備。</span></div>'}${item.cards?`<div class="granted-cards">デッキに追加：${item.cards.map(k=>CARD_TYPES[k].name).join(' / ')}</div>`:''}<div class="item-actions">${stored?button('retrieveItem','持ち出す',{value:item.id,disabled:!world.atBase(state)}):button('equip',isEquipped?'装備中':'装備する',{value:item.id,cls:isEquipped?'':'primary',disabled:isEquipped})}${!stored?button('stashItem','家にしまう',{value:item.id,disabled:isEquipped||!world.atBase(state)}):''}${!stored?button('salvage','解体',{value:item.id,disabled:isEquipped||!world.atBase(state),cls:'text-button'}):''}</div></article>`;
}
function inventoryMain() {
  return `<main class="main-column inventory-main"><div class="location-heading"><div><span class="eyebrow">NOT PERFECT. STILL USEFUL.</span><h2>癖のある、相棒たち。</h2></div><span class="badge">${carriedWeight(state)} / 12 重量</span></div><p class="intro-text">良いところも、悪いところも。何を選ぶかで、生き方が変わる。</p><div class="item-grid">${state.inventory.map(it=>itemCard(it)).join('')}</div><h3 class="stash-title">家に置いてきたもの <span>${state.stash.length} / ${state.modules.includes('storage')?16:8}</span></h3><div class="item-grid">${state.stash.length?state.stash.map(it=>itemCard(it,true)).join(''):'<p class="muted">収納はまだ空っぽ。</p>'}</div></main>`;
}
function inventoryControls() {
  return `<aside class="commands panel"><div class="section-label">YOUR LOADOUT ${icon('bag')}</div><h2>道具が、選択肢になる。</h2><p class="muted">武器を替えると、戦闘デッキに加わるカードも変わる。</p>${['head','body','weapon'].map(slot=>{const it=equipped(state,slot);return `<div class="equip-summary">${icon(slot==='head'?'head':slot==='body'?'cloth':'blade')}<div><small>${{head:'頭',body:'胴',weapon:'武器'}[slot]}</small><strong>${e(it.name)}</strong></div></div>`;}).join('')}<div class="quiet-note">硬さは刃を、柔らかさは重さを受け止める。<br><br>クリティカルは頭に当たる。帽子も、ただのおしゃれではない。</div>${button('help','戦闘ルールを見る',{cls:'full secondary'})}</aside>`;
}
function journalMain() {
  return `<main class="main-column"><div class="location-heading"><div><span class="eyebrow">ONE MORE DAY</span><h2>旅の記録。</h2></div><span class="badge">${state.day}日目</span></div><div class="milestones"><div><strong>${state.visits}</strong><span>探索した場所</span></div><div><strong>${state.kills}</strong><span>生き抜いた戦闘</span></div><div><strong>${state.lootCount}</strong><span>見つけたもの</span></div></div><div class="journal-list">${state.log.map(l=>`<article><time>${l.day}日目<br>${String(l.hour).padStart(2,'0')}:00</time><p>${e(l.text)}</p></article>`).join('')}</div></main>`;
}
function cardFace(key,{index=null,hidden=false,selected=false,small=false,number=null,disabled=false,status='',current=false}={}) {
  const card=CARD_TYPES[key];
  if(hidden)return `<div class="intent-card hidden-card" aria-label="${number}番目の敵行動：伏せカード"><span class="card-number">${number}</span><span class="card-back-symbol">?</span><small>伏せカード</small></div>`;
  const a=state.combat?.player;
  const range=card.range==='weapon'?`${a?.weapon.minRange}–${a?.weapon.maxRange}`:card.range?`${card.range[0]}–${card.range[1]}`:null;
  const html=`${number!==null?`<span class="card-number">${number}</span>`:''}<div class="card-top"><span>${{attack:'ATTACK',move:'MOVE',guard:'GUARD',recover:'RECOVER',escape:'ESCAPE'}[card.kind]}</span>${card.bodyCost||card.headCost?`<small>体${card.bodyCost} / 頭${card.headCost}</small>`:'<small>回復</small>'}</div><div class="card-art">${cardArt(key)}</div><strong>${card.name}</strong>${small?'':`<p>${card.desc}</p><div class="card-foot">${range?`距離 ${range}`:card.kind==='move'?'距離を変える':'間合い不問'}${card.kind==='attack'?`<span>${icon('dice')}×実効</span>`:''}</div>`}${selected?`<span class="selected-order">${state.combat.plan.indexOf(index)+1}</span>`:''}`;
  return index!==null?button('selectCard',html,{value:index,cls:`action-card ${card.color} ${selected?'selected':''}`,disabled}):`<div class="intent-card ${card.color} ${current?'current-intent':''} ${status?'status-'+status:''}">${html}${status&&status!=='pending'?`<small class="intent-status">${{played:'実行済み',miss:'射程外',failed:'不発',cancelled:'未実行'}[status]}</small>`:''}</div>`;
}
function battleMain() {
  const b=shownBattle(),actual=state.combat,ended=!playing&&actual.result;
  const currentFrame=frame,visibleCount=playing?Math.min(actual.enemyPlan.length,Math.max(actual.limits.perception,currentFrame?.slot||0)):actual.resolved?actual.enemyPlan.length:Math.min(actual.limits.perception,actual.enemyPlan.length),hiddenCount=actual.enemyPlan.length-visibleCount,counts=enemyActionSummary(b);
  return `<main class="main-column battle-main"><div class="location-heading"><div><span class="eyebrow">${playing?'RESOLVING':ended?'AFTER THE DUST':'PLAN BEFORE YOU ACT'}</span><h2>${e(b.enemy.name)}</h2></div><span class="badge coral">ROUND ${actual.round}</span></div><section class="enemy-intents" aria-label="相手の予定：合計${actual.enemyPlan.length}行動"><div class="intents-heading"><b>相手の行動列 · 予定 ${actual.enemyPlan.length} 回</b><span>公開 ${visibleCount} 枚 / 伏せ ${hiddenCount} 枚</span>${abilityTrigger('perception',`知覚 ${actual.limits.perception}`,{context:'round'})}</div>${counts.known&&actual.resolved?`<p class="enemy-execution-count">実行 ${counts.executed} / 不発 ${counts.failed} / ${playing?'残り':'戦闘終了で未実行'} ${playing?counts.pending:counts.cancelled} 回</p>`:''}<div class="intents-row">${actual.enemyPlan.map((key,i)=>cardFace(key,{hidden:i>=visibleCount,small:true,number:i+1,status:b.enemyResolution?.[i],current:playing&&i===currentFrame?.slot-1})).join('')||'<p class="muted">相手はこのラウンド待機します。</p>'}</div></section><div class="scene-frame battle-scene">${scenery(state,'road',{combat:b})}<div class="distance-strip"><span>近い</span>${Array.from({length:7},(_,i)=>`<div class="distance-step ${i===b.distance?'active':''}">${i}</div>`).join('')}<span>遠い</span></div>${currentFrame?`<div class="resolution-caption" role="status"><b>行動 ${currentFrame.slot}</b><span>あなた：${CARD_TYPES[currentFrame.playerCard]?.name||'待機'} / 相手：${CARD_TYPES[currentFrame.enemyCard]?.name||'待機'}<small class="phase-label"> · ${phaseNames[currentFrame.phase]}</small></span>${button('skipReplay','演出をスキップ',{cls:'replay-skip'})}</div>${renderResolution(currentFrame)}`:''}</div>
  ${ended?`<div class="battle-result"><span class="eyebrow">${actual.result==='victory'?'STILL ALIVE':actual.result==='escaped'?'LIVE TO SEE TOMORROW':'THE ROAD ENDS HERE'}</span><h2>${{victory:'まだ、生きている。',escaped:'走り抜けた。',defeat:'旅は、ここまで。',mutual:'どちらも、戻れなかった。'}[actual.result]}</h2><p>${actual.result==='victory'?'傷を手当てして、家に帰ろう。':'勝つことだけが、生き残ることではなかった。'}</p>${button('finishCombat',actual.result==='victory'||actual.result==='escaped'?'探索に戻る':'旅の記録へ',{cls:'primary',disabled:playing})}</div>`:`<div class="hand-heading"><span>あなたの手札 ${abilityTrigger('judgment',actual.hand.length,{context:'round'})}</span><small>タップした順に並ぶ。もう一度タップで取り消し。</small></div><div class="hand" aria-label="行動カードの手札">${actual.hand.map((key,i)=>cardFace(key,{index:i,selected:actual.plan.includes(i),disabled:playing||actual.resolved||(!actual.plan.includes(i)&&actual.plan.length>=actual.limits.action)})).join('')}</div>`}
  <div class="battle-log" aria-live="polite">${(currentFrame?.messages||actual.history.slice(-4)).map(message=>`<p>${e(message)}</p>`).join('')||'<p>相手の予定を読み、自分の行動列を組もう。</p>'}</div></main>`;
}
function battleControls() {
  const b=shownBattle(),actual=state.combat;
  const plan=actual.plan.map(i=>CARD_TYPES[actual.hand[i]]);
  return `<aside class="commands panel battle-commands"><div class="battle-plan-body"><div class="section-label">OPPONENT ${icon('eye')}</div><h3>${e(b.enemy.name)}</h3>${gauges(b.enemy,true)}<div class="enemy-stats">${abilityTiles(b.enemy)}</div><div class="command-divider"></div><div class="section-label">YOUR PLAN <span>${plan.length} / ${abilityTrigger('action',actual.limits.action,{context:'round'})}</span></div><div class="plan-list">${Array.from({length:actual.limits.action},(_,i)=>`<div class="plan-slot ${plan[i]?'filled':''}"><span>${i+1}</span>${plan[i]?`${icon(plan[i].icon)}<b>${plan[i].name}</b><div>${button('planUp','↑',{value:i,cls:'queue-button',disabled:i===0||playing||actual.resolved,title:'前に移動'})}${button('planRemove','×',{value:i,cls:'queue-button',disabled:playing||actual.resolved,title:'取り消す'})}</div>`:'<small>行動カードを選ぶ</small>'}</div>`).join('')}</div><div class="plan-cost"><span>ST消費</span><b>頭 ${plan.reduce((v,c)=>v+c.headCost,0)} / 体 ${plan.reduce((v,c)=>v+c.bodyCost,0)}</b></div>
  </div><div class="battle-action-footer">${actual.result?'':actual.resolved?button('nextRound','次のラウンドへ',{cls:'primary full',disabled:playing}):button('resolve',`${icon('action')}${playing?'行動を解決中…':'この行動列で実行'}`,{cls:'primary full',disabled:playing||!plan.length})}${!actual.resolved&&!actual.result?button('passRound','このラウンドは待機',{cls:'text-button full',disabled:playing||!!plan.length}):''}<p class="hint">同じ順番のカードを同時に解決。移動・回復・防御 → 攻撃。相打ちも起こる。</p><div class="quiet-note">６の出目は頭に当たる。<br>体HPが０でも、戦闘は続く。<br><br>離脱カードは距離５以上で有効。</div></div></aside>`;
}
function deathScreen() {
  return `<main class="main-column death-screen"><span class="eyebrow">THE LAST PAGE</span><h2>あの家は、もう走らない。</h2><p>${state.day}日間、終わった世界を歩いた。<br>${state.visits}箇所を探索し、${state.kills}度の戦闘を生き抜いた。</p>${button('confirmNew','もう一度、旅に出る',{cls:'primary'})}<div class="journal-list">${state.log.slice(0,8).map(l=>`<article><time>${l.day}日目</time><p>${e(l.text)}</p></article>`).join('')}</div></main>`;
}
function render() {
  hideAbilityTooltip();
  const dead=state.vitals.headHP<=0&&!state.combat;
  let main,controls;
  if(state.combat){main=battleMain();controls=battleControls();}
  else if(dead){main=deathScreen();controls=inventoryControls();}
  else if(tab==='base'){main=baseMain();controls=baseControls();}
  else if(tab==='inventory'){main=inventoryMain();controls=inventoryControls();}
  else if(tab==='journal'){main=journalMain();controls=exploreControls();}
  else {main=exploreMain();controls=exploreControls();}
  app.innerHTML=`<div class="game-shell ${state.combat?'combat-mode':''}">${header()}${navigation()}<div class="mobile-hud">${gauges(currentActor(),true)}${abilityTiles(currentActor())}</div>${saveError?`<div class="save-warning" role="alert">${e(saveError)}</div>`:''}<div class="game-layout">${survivor()}${main}${controls}</div><footer class="footer"><span>走る家と、終わった世界。</span><span>EARLY BUILD 0.1.5 · ${state.region}つ目の街</span></footer>${state.combat&&!state.combat.result?`<div class="mobile-combat-dock"><span>${state.combat.plan.length} / ${state.combat.limits.action} 行動<small>${playing?'解決中':'距離 '+shownBattle().distance}</small></span>${state.combat.resolved?button('nextRound','次のラウンドへ',{cls:'primary',disabled:playing}):button('resolve',playing?'解決中…':'この行動列で実行',{cls:'primary',disabled:playing||!state.combat.plan.length})}</div>`:''}</div>`;
  paintMap(app.querySelector('.painted-map'),state);
  positionResolution(app.querySelector('.battle-scene'));
}
function openDialog(title,body) {
  dialog.innerHTML=`<div class="dialog-header"><h2>${title}</h2>${button('closeDialog',icon('close'),{cls:'icon-button',title:'閉じる'})}</div><div class="dialog-body">${body}</div>`;
  if(!dialog.open)dialog.showModal();
}
function help() {
  openDialog('この世界の歩き方',`<p>操作ボタンにマウスを重ねると、効果・消費・関連する能力が表示されます。スマホではボタンを長押しすると説明を開けます。</p><p>周辺を見渡す → 場所を探索 → 装備と資源を持ち帰る → 移動拠点を育てる。地図で道路のつながった、光る施設を選ぶと徒歩移動します。</p><h3>４つの能力</h3><table><tr><th>能力</th><th>戦闘</th><th>探索</th></tr><tr><td>知覚</td><td>敵の予定を公開する枚数</td><td>良い発見の確率</td></tr><tr><td>判断</td><td>引く手札の枚数</td><td>見つける探索箇所数</td></tr><tr><td>行動</td><td>実行できるカード枚数</td><td>調べられる回数</td></tr><tr><td>実効</td><td>攻撃の６面ダイス数</td><td>何かが見つかる確率</td></tr></table><p>頭HP→知覚、頭ST→判断、体HP→行動、体ST→実効。現在値÷最大値で比例減少し、切り上げ。知覚は最低０、ほかは最低１。</p><h3>行動列を組む</h3><p>相手は先に計画を決めます。知覚に応じて予定の先頭を公開。手札をタップした順に自分の計画を組み、実行を押します。同じ順番のカードは同時扱いで、移動・回復・防御の後、攻撃を解決します。</p><p>射程外の攻撃もSTを消費します。防御は同じ行動枠だけ有効。途中でSTが不足した行動は不発になります。使えるカードがないときは、カードを選ばず「このラウンドは待機」で次へ進めます（相手は行動します）。判断・行動・知覚はラウンド開始時、実効は各行動のST消費前に確定します。</p><h3>ダメージ</h3><p class="formula">HP = [max(0, 鋭さ − 硬さ) + 重さ ÷ 柔らかさ] × 出目<br>ST = [重さ ÷ 柔らかさ] × 出目</p><p>柔らかさは最低１。出目６は頭、それ以外は体。その部位の防具で計算します。体HPからあふれた分は頭HPへ。STの超過分は転送しません。頭HPが０で死亡。体HPとSTが０でも死亡しません。</p><p>防御はダメージを半減、渾身の一撃は1.4倍。例：鋭さ０、重さ２、柔らかさ２で［３・６］なら、体HP−３・頭HP−６（STもそれぞれ−３・−６）。</p><h3>生き残るコツ</h3><p>息を整える／頭を冷やすカードでSTを回復。頭の傷は医療品で手当て。拠点で食料と水を使って眠ると回復します。空腹・渇き80%以上では時間経過でSTが減ります。</p><p>エンジンを修理し、燃料を３つ集めると新しい街へ進めます。１つの装備に修飾子が複数つくことがあります。各修飾子に長所と短所があり、効果を合算します。</p>`);
}
function menu() {
  openDialog('旅のセーブ',`<p>行動ごとに自動保存。再読み込みしても同じ手札・敵の予定から再開します。</p>${saveError?`<p class="error">${e(saveError)}</p>`:''}<div class="menu-actions">${button('exportSave',`${icon('save')}セーブを書き出す`,{cls:'primary full'})}<label class="file-button">${icon('bag')}セーブを読み込む<input id="import-save" type="file" accept=".json,application/json"></label>${button('confirmNew','最初から始める',{cls:'full danger-button'})}</div><p class="hint">旧版HTMLのセーブは使えません。新規開始・読み込みでは現在のセーブを置き換えます。</p>`);
}
function pauseReplay(ms) {
  return new Promise(resolve=>{
    const done=()=>{clearTimeout(timer);if(wakeReplay===done)wakeReplay=null;resolve();};
    const timer=setTimeout(done,ms);wakeReplay=done;
  });
}
async function playRound(pass=false) {
  const b=state.combat,error=pass&&!b.plan.length?null:validatePlan(b);
  if(error){toast(error);return;}
  const frames=resolveRound(state,b,{pass});persist();
  playing=true;replaySkip=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const f of frames) {
    if(replaySkip)break;
    for(const phase of replayPhases(f,{reduced})) {
      if(replaySkip)break;
      frame=replayView(f,phase.name);render();
      if(phase.name==='impact'&&f.effects.length)tone('hit');
      await pauseReplay(phase.duration);
    }
  }
  frame=null;playing=false;wakeReplay=null;render();
}
async function handleAction(event) {
  const btn=event.target.closest('[data-action]');
  if(blockedHelpClick?.trigger===btn&&Date.now()<blockedHelpClick.until){event.preventDefault();blockedHelpClick=null;return;}
  if(!btn||btn.disabled||btn.getAttribute('aria-disabled')==='true')return;
  if(btn.dataset.action==='explain'){toggleAbilityTooltip(btn);return;}
  hideAbilityTooltip();
  const {action,value}=btn.dataset;
  if(playing&& !['sound','help','menu','closeDialog','exportSave','skipReplay'].includes(action))return;
  tone();
  let error=null,changed=true;
  switch(action) {
    case 'tab':tab=value;changed=false;break;
    case 'toggleMap':mapOpen=!mapOpen;changed=false;break;
    case 'move':error=world.move(state,Number(value),driving);break;
    case 'survey':error=world.survey(state);break;
    case 'search':error=world.searchSpot(state,Number(value));break;
    case 'endSearch':error=world.endSearch(state);break;
    case 'skipReplay':replaySkip=true;wakeReplay?.();return;
    case 'consume':error=world.consume(state,value);break;
    case 'rest':error=world.rest(state);break;
    case 'driving':driving=!driving;if(driving)mapOpen=true;changed=false;break;
    case 'deposit':error=world.deposit(state);break;
    case 'takeSupply':error=world.takeSupply(state,value);break;
    case 'install':error=world.install(state,value);break;
    case 'nextRegion':error=world.nextRegion(state);if(!error)tab='explore';break;
    case 'equip':error=world.equip(state,value);break;
    case 'stashItem':error=world.stashItem(state,value);break;
    case 'retrieveItem':error=world.retrieveItem(state,value);break;
    case 'salvage':error=world.salvage(state,value);break;
    case 'encounter':if(state.vitals.headHP>0&&!state.combat){beginCombat(state,'dog');world.log(state,'野犬のいる路地に踏み込んだ。');}break;
    case 'selectCard':{const b=state.combat,i=Number(value);if(!b||b.resolved)return;if(b.plan.includes(i))b.plan=b.plan.filter(n=>n!==i);else if(b.plan.length<b.limits.action)b.plan.push(i);break;}
    case 'planUp':{const i=Number(value),p=state.combat.plan;if(i>0)[p[i-1],p[i]]=[p[i],p[i-1]];break;}
    case 'planRemove':state.combat.plan.splice(Number(value),1);break;
    case 'resolve':await playRound();return;
    case 'passRound':await playRound(true);return;
    case 'nextRound':prepareRound(state,state.combat);break;
    case 'finishCombat':error=world.finishCombat(state);tab=state.vitals.headHP<=0?'journal':'explore';break;
    case 'help':help();return;
    case 'menu':menu();return;
    case 'closeDialog':dialog.close();return;
    case 'sound':sound=!sound;changed=false;break;
    case 'confirmNew':openDialog('新しい旅に出ますか？',`<p>現在の旅を上書きします。残したい場合は先にセーブを書き出してください。</p><div class="menu-actions">${button('exportSave','現在のセーブを書き出す',{cls:'full'})}${button('newGame','新しい旅を始める',{cls:'primary full'})}</div>`);return;
    case 'newGame':state=world.newGame();tab='explore';driving=false;dialog.close();break;
    case 'exportSave':{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`scavenger-day-${state.day}.json`;a.hidden=true;dialog.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    default:return;
  }
  if(error){toast(error);changed=false;}
  if(changed)persist();render();
}
const abilityTooltip=document.createElement('div');
abilityTooltip.id='ability-tooltip';abilityTooltip.className='ability-tooltip';abilityTooltip.setAttribute('role','tooltip');abilityTooltip.hidden=true;document.body.append(abilityTooltip);
let tooltipTrigger=null,tooltipPinned=false,holdTimer=null,blockedHelpClick=null;
const helpSelector='[data-ability],[data-help-action]';
function hideAbilityTooltip(){abilityTooltip.hidden=true;tooltipTrigger=null;tooltipPinned=false;abilityTooltip.classList.remove('pinned');}
function showAbilityTooltip(trigger){
  const key=trigger.dataset.ability,context=trigger.dataset.context,b=shownBattle(),actual=state.combat,ex=state.exploration;
  let actor=currentActor(),options={battle:!!actual,roundValue:actual&&key!=='execution'?actual.limits[key]:null};
  if(context==='enemy'){const info=enemyAbilityInfo(actual,key,b.enemy);actor=info.actor;options=info.options;}
  if(context==='round'){actor=actual.limitActor||actual.player;options={battle:true,frozen:true,missingSnapshot:!actual.limitActor,fixedValue:actual.limits[key]};}
  if(context==='exploration'&&ex){actor=ex.abilityActor||playerActor(state);options={battle:false,frozen:true,missingSnapshot:!ex.abilityActor,fixedValue:ex.stats?.[key],remaining:key==='action'?ex.remaining:null};}
  let html=key?abilityHelp(actor,key,options):actionHelp(state,trigger.dataset.helpAction,trigger.dataset.value,{driving});
  if(context==='enemy'&&key==='action')html+=`<p class="ability-use">このラウンドの予定は <b>${actual.enemyPlan.length} 回</b>。行動上限の範囲で選び、ST不足や戦闘終了で実行されないカードもあります。</p>`;
  if(!html){hideAbilityTooltip();return;}
  abilityTooltip.innerHTML=html;abilityTooltip.hidden=false;tooltipTrigger=trigger;
  const r=trigger.getBoundingClientRect(),width=Math.min(420,innerWidth-24);abilityTooltip.style.width=`${width}px`;
  const height=abilityTooltip.offsetHeight,beside=!!trigger.closest('.commands')&&r.left>width+24;
  const left=beside?r.left-width-12:Math.max(12,Math.min(r.left,innerWidth-width-12));
  const top=beside?Math.max(12,Math.min(r.top,innerHeight-height-12)):r.bottom+8+height<=innerHeight-12?r.bottom+8:Math.max(12,r.top-height-8);
  abilityTooltip.style.left=`${left}px`;abilityTooltip.style.top=`${top}px`;
}
function toggleAbilityTooltip(trigger){if(tooltipPinned&&tooltipTrigger===trigger){hideAbilityTooltip();return;}showAbilityTooltip(trigger);tooltipPinned=true;abilityTooltip.classList.add('pinned');}
document.addEventListener('pointerover',event=>{if(event.pointerType==='touch')return;const trigger=event.target.closest(helpSelector);if(trigger&&!tooltipPinned&&trigger!==tooltipTrigger)showAbilityTooltip(trigger);});
document.addEventListener('pointerout',event=>{if(!tooltipPinned&&event.target.closest(helpSelector)&&!event.relatedTarget?.closest?.(helpSelector))hideAbilityTooltip();});
document.addEventListener('focusin',event=>{const trigger=event.target.closest(helpSelector);if(trigger&&!tooltipPinned)showAbilityTooltip(trigger);});
document.addEventListener('focusout',event=>{if(!tooltipPinned&&event.target.closest(helpSelector))hideAbilityTooltip();});
document.addEventListener('click',event=>{if(!event.target.closest('[data-ability],[data-help-action],#ability-tooltip'))hideAbilityTooltip();});
document.addEventListener('pointerdown',event=>{
  clearTimeout(holdTimer);
  const trigger=event.target.closest('[data-help-action]');if(event.pointerType!=='touch'||!trigger)return;
  const startX=event.clientX,startY=event.clientY;
  const cancelOnMove=move=>{if(Math.hypot(move.clientX-startX,move.clientY-startY)>8)clearTimeout(holdTimer);};
  document.addEventListener('pointermove',cancelOnMove);
  const finishHold=()=>{
    clearTimeout(holdTimer);document.removeEventListener('pointermove',cancelOnMove);
    document.removeEventListener('pointerup',finishHold);document.removeEventListener('pointercancel',finishHold);
    if(blockedHelpClick?.trigger===trigger)blockedHelpClick.until=Date.now()+1000;
  };
  document.addEventListener('pointerup',finishHold);document.addEventListener('pointercancel',finishHold);
  holdTimer=setTimeout(()=>{showAbilityTooltip(trigger);tooltipPinned=true;abilityTooltip.classList.add('pinned');blockedHelpClick={trigger,until:Date.now()+2000};},500);
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')hideAbilityTooltip();
  if(['Enter',' '].includes(event.key)&&event.target.matches('.map-node')){event.preventDefault();handleAction(event).catch(err=>toast(err.message));}
});
window.addEventListener('resize',hideAbilityTooltip);
document.addEventListener('scroll',event=>{if(event.target!==abilityTooltip)hideAbilityTooltip();},true);
document.addEventListener('click',event=>handleAction(event).catch(err=>toast(`操作を完了できませんでした：${err.message}`)));
document.addEventListener('change',async event=>{
  if(event.target.id!=='import-save')return;
  try {
    if(playing)throw new Error('戦闘の解決が終わってから読み込んでください。');
    const file=event.target.files[0];if(!file)return;if(file.size>2e6)throw new Error('ファイルが大きすぎます。');
    const imported=parseSave(await file.text());
    openDialog('この旅を読み込みますか？',`<p>${imported.day}日目 / ${imported.region}つ目の街。現在の旅を置き換えます。</p>${button('importConfirm','このセーブを読み込む',{cls:'primary full'})}`);
    const confirm=dialog.querySelector('[data-action="importConfirm"]');
    confirm.addEventListener('click',()=>{state=imported;tab='explore';driving=false;frame=null;persist();dialog.close();render();toast('セーブを読み込みました。');},{once:true});
  }catch(err){toast(`読み込めません：${err.message}`);}
});
if(!saveError)persist();render();
