// Balance knobs and content live here, independently from rules and rendering.
export const BALANCE = {
  player: { headHP: 10, bodyHP: 30, headST: 16, bodyST: 24, perception: 2, judgment: 5, action: 3, execution: 2 },
  softnessFloor: 1, maxDistance: 6, startingDistance: 3,
  search: { goodBase: .38, goodPerception: .09, findBase: .40, findExecution: .12 },
  packCapacity: 12, maxModifiers: 3, saveVersion: 1,
};
export const CARD_TYPES = {
  advance: { name: '踏み込む', kind: 'move', icon: 'advance', bodyCost: 1, headCost: 0, move: -1, desc: '距離を１縮める。', color: 'teal' },
  retreat: { name: '間合いを取る', kind: 'move', icon: 'retreat', bodyCost: 1, headCost: 0, move: 1, desc: '距離を１広げる。', color: 'teal' },
  strike: { name: '一撃', kind: 'attack', icon: 'blade', bodyCost: 2, headCost: 0, power: 1, range: 'weapon', desc: '武器の間合いで攻撃。実効の数だけダイス。', color: 'coral' },
  heavy: { name: '渾身の一撃', kind: 'attack', icon: 'burst', bodyCost: 5, headCost: 1, power: 1.4, range: 'weapon', desc: 'ダメージ×1.4。体STを大きく使う。', color: 'coral' },
  throw: { name: '石を投げる', kind: 'attack', icon: 'stone', bodyCost: 2, headCost: 1, power: .7, range: [2, 4], ownWeapon: { sharpness: 0, weight: 1.1 }, desc: '距離２〜４。弱いが、武器に頼らない。', color: 'gold' },
  guard: { name: '身を守る', kind: 'guard', icon: 'shield', bodyCost: 1, headCost: 0, desc: 'この行動枠で受けるHP・STダメージを半減。', color: 'blue' },
  breathe: { name: '息を整える', kind: 'recover', icon: 'lung', bodyCost: 0, headCost: 0, bodyRecovery: 9, headRecovery: 2, desc: '体ST＋９、頭ST＋２。', color: 'teal' },
  focus: { name: '頭を冷やす', kind: 'recover', icon: 'eye', bodyCost: 0, headCost: 0, bodyRecovery: 2, headRecovery: 7, desc: '頭ST＋７、体ST＋２。', color: 'blue' },
  escape: { name: '離脱する', kind: 'escape', icon: 'exit', bodyCost: 3, headCost: 1, desc: '距離５以上で戦闘から離脱。', color: 'gold' },
};
export const BASE_DECK = ['advance','advance','retreat','retreat','strike','strike','strike','guard','guard','breathe','breathe','focus','throw','escape'];
export const WEAPONS = [
  { id:'broom', name:'箒', sharpness:0, weight:.65, minRange:1, maxRange:2, carry:1, visual:'broom', color:'#d4aa67', cards:['retreat','guard'], text:'掃除が本業。長い柄は間合いを作る。' },
  { id:'knife', name:'ナイフ', sharpness:1.2, weight:.3, minRange:0, maxRange:1, carry:.4, visual:'knife', color:'#adc4c4', cards:['strike','strike'], text:'軽く、鋭い。近づく必要がある。' },
  { id:'pipe', name:'鉄パイプ', sharpness:0, weight:1.6, minRange:0, maxRange:1, carry:2.1, visual:'pipe', color:'#8e9896', cards:['heavy','guard'], text:'刃はない。重さを相手に押しつける。' },
  { id:'axe', name:'手斧', sharpness:1.1, weight:1, minRange:0, maxRange:1, carry:1.5, visual:'axe', color:'#d77858', cards:['heavy','strike'], text:'薪にも、身を守るためにも。' },
  { id:'umbrella', name:'傘', sharpness:.2, weight:.5, minRange:1, maxRange:2, carry:.8, visual:'umbrella', color:'#849cba', cards:['guard','retreat'], text:'雨よけが一番。ついでに牽制。' },
  { id:'shovel', name:'スコップ', sharpness:.4, weight:1.2, minRange:1, maxRange:2, carry:1.8, visual:'shovel', color:'#8ca397', cards:['heavy','advance'], text:'掘る、こじ開ける、振り回す。' },
];
export const ARMOR = [
  { id:'workcoat', name:'作業ジャケット', slot:'body', hardness:.4, softness:2, carry:1.2, visual:'coat', color:'#6c9e91', text:'ほどよい厚み。まだ着られる。' },
  { id:'puffer', name:'綿入りコート', slot:'body', hardness:.1, softness:3.5, carry:1.8, visual:'puffer', color:'#d1915d', text:'衝撃を吸う。刃には弱い。' },
  { id:'vest', name:'防刃ベスト', slot:'body', hardness:1.3, softness:1.5, carry:2.5, visual:'vest', color:'#727d87', text:'刃を防ぐ。打撃は通りやすい。' },
  { id:'raincoat', name:'雨合羽', slot:'body', hardness:0, softness:1.5, carry:.6, visual:'coat', color:'#e0bb58', stats:{execution:1,action:-1}, text:'軽快だが、裾が足を取る。' },
  { id:'cap', name:'野球帽', slot:'head', hardness:.1, softness:1.5, carry:.2, visual:'cap', color:'#cf785d', text:'日差しと、ほんの少しの衝撃対策。' },
  { id:'helmet', name:'工事ヘルメット', slot:'head', hardness:1, softness:2, carry:.8, visual:'helmet', color:'#edbb5b', stats:{perception:-1}, text:'頭を守る。視野は少し狭まる。' },
  { id:'goggles', name:'古いゴーグル', slot:'head', hardness:.3, softness:1.2, carry:.3, visual:'goggles', color:'#6e9699', stats:{perception:1}, text:'遠くの動きがよく見える。' },
];
export const MODIFIERS = [
  { id:'sharp', name:'切れ味のよい', types:['weapon'], changes:{sharpness:.9,weight:-.1}, good:'鋭さ＋0.9', bad:'重さ−0.1', tint:'#dce0bf' },
  { id:'long', name:'長すぎる', types:['weapon'], changes:{minRange:1,maxRange:1,carry:.4}, stats:{action:-1}, good:'最短・最長射程＋１', bad:'行動−１・携行重量＋0.4', tint:'#c8b0d6' },
  { id:'heavy', name:'重すぎる', types:['weapon'], changes:{weight:.8,carry:1}, stats:{execution:-1}, good:'打撃の重さ＋0.8', bad:'実効−１・携行重量＋１', tint:'#a9b2bc' },
  { id:'balanced', name:'握りやすい', types:['weapon'], changes:{weight:-.2}, stats:{action:1}, good:'行動＋１', bad:'打撃の重さ−0.2', tint:'#9dc5b2' },
  { id:'rusty', name:'錆びた', types:['weapon'], changes:{sharpness:-.5,weight:.3}, good:'打撃の重さ＋0.3', bad:'鋭さ−0.5', tint:'#bd8560' },
  { id:'hard', name:'硬すぎる', types:['armor'], changes:{hardness:.7,softness:-.5,carry:.5}, good:'硬さ＋0.7', bad:'柔らかさ−0.5・携行重量＋0.5', tint:'#9eacb9' },
  { id:'soft', name:'ふかふかの', types:['armor'], changes:{softness:1.5,hardness:-.3,carry:.4}, good:'柔らかさ＋1.5', bad:'硬さ−0.3・携行重量＋0.4', tint:'#d9b9a0' },
  { id:'light', name:'薄くて軽い', types:['armor'], changes:{softness:-.3,carry:-.4}, stats:{action:1}, good:'行動＋１・携行重量−0.4', bad:'柔らかさ−0.3', tint:'#c1d9c8' },
  { id:'bright', name:'目立ちすぎる', types:['armor'], stats:{perception:1,judgment:-1}, good:'反射光で知覚＋１', bad:'落ち着かず判断−１', tint:'#e9b869' },
];
export const RESOURCES = { food:{name:'食料',icon:'food'},water:{name:'水',icon:'water'},scrap:{name:'スクラップ',icon:'gear'},cloth:{name:'布',icon:'cloth'},fuel:{name:'燃料',icon:'fuel'},med:{name:'医療品',icon:'medical'} };
export const MODULES = [
  {id:'bed',name:'ちゃんとした寝床',icon:'bed',cost:{scrap:3,cloth:3},text:'休息時の回復が増える。傷も治しやすくなる。'},
  {id:'workbench',name:'小さな工作台',icon:'gear',cost:{scrap:5,cloth:1},text:'装備を解体するとスクラップを１つ多く回収。'},
  {id:'storage',name:'増設トランク',icon:'bag',cost:{scrap:4,cloth:2},text:'拠点の装備収納が８枠から１６枠へ。'},
  {id:'filter',name:'雨水フィルター',icon:'water',cost:{scrap:4,cloth:3},text:'日をまたぐたび、水を２つ生成する。'},
  {id:'engine',name:'エンジン修理',icon:'van',cost:{scrap:8,fuel:2},text:'走行の燃料消費を２から１にする。'},
];
export const LOCATIONS = [
  {id:'road',name:'ひび割れた国道',kind:'road',danger:.08,loot:['scrap','fuel'],spots:['放置車のトランク','道路脇の工具箱','止まった給油所','壊れた配送車','高架の下','古い料金所']},
  {id:'mart',name:'からっぽの商店街',kind:'shop',danger:.22,loot:['food','water','cloth'],spots:['シャッターの隙間','忘れられた食品棚','店主のロッカー','二階の休憩室','レジ裏の金庫','裏通りの物置']},
  {id:'clinic',name:'蔦の診療所',kind:'clinic',danger:.28,loot:['med','cloth','water'],spots:['処置室','薬品棚','職員ロッカー','受付の引き出し','物資保管室','救急車']},
  {id:'factory',name:'眠った町工場',kind:'factory',danger:.34,loot:['scrap','fuel'],spots:['工具ラック','機械の残骸','資材置き場','作業員ロッカー','奥の制御室','古い搬入口']},
  {id:'forest',name:'帰らずの森',kind:'forest',danger:.2,loot:['food','water','cloth'],spots:['小川のほとり','捨てられたテント','倒木の下','古い山小屋','獣道の先','木のうろ']},
  {id:'apart',name:'窓のない団地',kind:'apart',danger:.25,loot:['food','cloth','med'],spots:['台所','押し入れ','屋上の物干し','管理人室','避難用の倉庫','郵便受け']},
  {id:'junk',name:'ガラクタの丘',kind:'junk',danger:.3,loot:['scrap','fuel','cloth'],spots:['積み上がった車','壊れた家電','コンテナの奥','廃材の山','古いバス','作業小屋']},
  {id:'river',name:'濁った河川敷',kind:'river',danger:.16,loot:['water','food','scrap'],spots:['橋脚の下','漂着した箱','漁師の小屋','草むら','止まった船','堤防の物置']},
  {id:'tower',name:'途切れた電波塔',kind:'tower',danger:.38,loot:['scrap','med','fuel'],spots:['通信室','非常用物資庫','整備員ロッカー','配電盤','塔の足元','地下ケーブル室']},
];
export const ENEMIES = [
  {id:'dog',name:'腹ぺこの野犬',visual:'dog',hp:[7,18],st:[10,16],stats:[1,4,2,1],weapon:{sharpness:.7,weight:.5,minRange:0,maxRange:1},armor:{head:{hardness:0,softness:1.5},body:{hardness:.1,softness:2}},deck:['advance','advance','strike','strike','heavy','retreat','breathe'],text:'耳を伏せ、こちらの荷物を見ている。'},
  {id:'scavenger',name:'道を塞ぐ拾荒者',visual:'raider',hp:[10,24],st:[14,20],stats:[2,5,3,1],weapon:{sharpness:.5,weight:.7,minRange:0,maxRange:1},armor:{head:{hardness:.3,softness:1.8},body:{hardness:.5,softness:2}},deck:['advance','strike','strike','throw','guard','retreat','breathe','focus'],text:'「その袋を置いていけ」――そう言って、笑った。'},
  {id:'robot',name:'居残り警備ロボ',visual:'robot',hp:[12,32],st:[12,20],stats:[1,4,2,1],weapon:{sharpness:0,weight:1.1,minRange:0,maxRange:2},armor:{head:{hardness:1,softness:1.4},body:{hardness:1.1,softness:1.5}},deck:['advance','strike','heavy','guard','breathe','throw'],text:'錆びたランプが、赤く点滅を始める。'},
];
