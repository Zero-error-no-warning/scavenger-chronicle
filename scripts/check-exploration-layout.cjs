const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const p=await browser.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.GAME_URL||'http://localhost:4173');
 for(const [width,height] of [[1536,694],[1920,868],[1440,900],[1366,768],[1024,768],[800,600],[1280,540],[320,844],[390,844]]){
  await p.setViewportSize({width,height});
  await p.evaluate(async()=>{
   const w=await import('./src/world.js?v=0.2.7'),st=await import('./src/storage.js?v=0.2.7');
   const s=w.newGame(9);s.world[s.location].discovered=[0,1,2,3,4,5];w.survey(s);st.saveGame(s);
  });await p.reload();await p.locator('.spot-tile').first().waitFor();
  const geometry=await p.evaluate(()=>{
   const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,client:e.clientHeight,scroll:e.scrollHeight}};
   return {table:rect('.exploration-table'),board:rect('.spot-board'),tile:rect('.spot-tile'),main:rect('.explore-main')};
  });
  assert(await p.locator(".explore-main").evaluate(e=>e.scrollWidth<=e.clientWidth+1),`main horizontal overflow at ${width}`);
  assert(geometry.board.client>=geometry.tile.height,`first row clipped at ${width}x${height}`);
  for(const tile of await p.locator('.spot-tile').all()){
   await tile.evaluate(e=>e.scrollIntoView({block:"nearest",inline:"nearest"}));await tile.click();assert((await tile.getAttribute('class')).includes('selected'));
   const visible=await tile.evaluate(e=>{const r=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect(),m=document.querySelector('.explore-main').getBoundingClientRect();return r.top>=b.top-1&&r.bottom<=b.bottom+1&&(innerWidth<=720||r.top>=m.top-1&&r.bottom<=m.bottom+1);});
   assert(visible,`tile not fully visible after scroll at ${width}x${height}`);
   assert(!(await p.locator('.search-choice>span').innerText()).includes('探索箇所を選ぶ'));
  }
  await p.locator('.search-hand .action-card:not(.unusable)').first().click();
  assert((await p.locator('.search-hand .selected').count())===1);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow ${width}`);
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('Exploration tile layout and selection passed at nine desktop/mobile sizes');
})().catch(e=>{console.error(e);process.exit(1)});
