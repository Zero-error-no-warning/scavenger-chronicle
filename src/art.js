import { equipped } from './items.js';
export const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ink='#223033';
const ICONS = {
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  brain:'<path d="M12 4c-3-5-9 0-7 4-5 2-3 8 1 8-1 5 4 7 6 3V4Zm0 0c3-5 9 0 7 4 5 2 3 8-1 8 1 5-4 7-6 3"/><path d="m5 8 3 2m11-2-3 2M6 16l3-2m9 2-3-2"/>',
  action:'<path d="m13 3-7 10h6l-1 8 7-11h-6l1-7Z"/>',
  dice:'<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="12" cy="12" r="1"/>',
  blade:'<path d="m6 18 12-13 2 2-2 7-8 7m-6-7 7 7m-8 0 4-4"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  advance:'<path d="M3 12h16m-6-6 6 6-6 6"/>',
  retreat:'<path d="M21 12H5m6-6-6 6 6 6"/>',
  burst:'<path d="m12 2 2 6 6-4-3 7 5 3-7 1 1 7-5-5-6 4 2-7-6-2 7-3-2-5 6 4Z"/>',
  stone:'<path d="m5 10 6-5 8 4 2 8-8 4-9-5 1-6Z"/>',
  lung:'<path d="M12 3v9m0-3C6 6 2 13 3 19c0 3 7 1 7-2v-7m2-1c6-3 10 4 9 10 0 3-7 1-7-2v-7"/>',
  exit:'<path d="M9 4H4v16h5m0-8h12m-5-5 5 5-5 5"/>',
  van:'<path d="M2 17V6h13l7 7v5H2m12-12v8h8"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M5 9h5"/>',
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/>',
  bag:'<path d="M5 9h14l2 12H3L5 9Zm3 0V6a4 4 0 0 1 8 0v3"/><path d="M8 15h8"/>',
  gear:'<path d="m9 3 6 0 1 4 4 2 1 5-4 2-2 5H9l-2-5-4-2 1-5 4-2 1-4Z"/><circle cx="12" cy="12" r="3"/>',
  food:'<path d="M4 8h16v12H4V8Zm1 0V5h14v3m-14 6h14"/><path d="M9 3h6"/>',
  water:'<path d="M12 2C9 7 4 11 4 15a8 8 0 0 0 16 0c0-4-5-8-8-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  cloth:'<path d="m8 3-6 5 4 4 2-2v11h8V10l2 2 4-4-6-5c0 4-8 4-8 0Z"/>',
  fuel:'<path d="M4 8h13v13H4V8Zm2 0V4h8v4m3 2 4-4 2 2-4 5"/><path d="m7 12 7 6m0-6-7 6"/>',
  medical:'<rect x="3" y="6" width="18" height="15" rx="3"/><path d="M8 6V3h8v3m-4 4v7m-3-3h6"/>',
  bed:'<path d="M3 7v14m18-9v9M3 17h18M5 11h5v6H5V11Zm5 2h9l2 4"/>',
  book:'<path d="M12 6C8 3 3 4 3 4v16s5-1 9 2c4-3 9-2 9-2V4s-5-1-9 2v16"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  close:'<path d="m6 6 12 12m0-12L6 18"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  head:'<path d="M19 21v-6c4-12-13-17-15-6-1 3 0 7 4 8v4m0-8h4"/>',
  body:'<path d="m8 3-5 5 3 6 2-2v9h8v-9l2 2 3-6-5-5H8Z"/>',
  save:'<path d="M4 3h13l4 4v14H3V3h1Zm3 0v7h10V3M7 21v-7h10v7"/>',
};
export function icon(name,cls='') {return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]||ICONS.gear}</svg>`;}

export function weaponArt(item={visual:'broom'},x=0,y=0) {
  const color=item.color||'#bba487';
  const long=item.modifiers?.includes('long')?1.3:1;
  let shape='';
  switch(item.visual) {
    case 'knife':shape='<path d="M0 0v-29l9-14 2 43Z" fill="#c3d5cf"/><path d="M-3 0h17v7H-3Z" fill="#74594b"/><path d="M3 7h7v21H3Z" fill="#c28257"/>';break;
    case 'pipe':shape='<path d="M0 27V-50l12-5 5 10-8 5v67Z" fill="#929ea1"/><path d="M3-39h5"/>';break;
    case 'axe':shape='<path d="M0 28v-82h7v82Z" fill="#ac8458"/><path d="M7-51c27-8 28 14 23 22L7-34Z" fill="#b9c9c4"/>';break;
    case 'umbrella':shape=`<path d="M3 24v-60m0 60q14 18 14 0" fill="none"/><path d="M-22-37Q3-80 28-37l-12-5-13 6-12-6Z" fill="${color}"/>`;break;
    case 'shovel':shape='<path d="M0 22v-62h8v62Z" fill="#c49f6a"/><path d="M-10-45H18v-21Q4-90-10-66Z" fill="#859c98"/>';break;
    default:shape='<path d="M0 18v-90h7v90Z" fill="#b99b65"/><path d="m-8 8-8 33c8 10 30 10 40 0L16 8Z" fill="#e1b76c"/><path d="M-8 35 0 13m8 24 0-22m8 24-4-25" fill="none"/><path d="M-8 10h25v9H-8Z" fill="#799b86"/>';
  }
  return `<g transform="translate(${x} ${y}) scale(${long})" stroke="${ink}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${shape}</g>`;
}
export function character(state,{x=0,y=0,scale=1,flip=false,portrait=false}={}) {
  const head=equipped(state,'head'),body=equipped(state,'body'),weapon=equipped(state,'weapon');
  const coat=body?.color||'#709c90';
  let hat='';
  if(head?.visual==='helmet')hat=`<path d="M-54-85q-8-65 53-65 60 0 58 64Z" fill="${head.color}"/><path d="M-65-85H64v12H-65Z" fill="${head.color}"/><path d="M-7-143v47h18v-47" fill="none"/>`;
  if(head?.visual==='cap')hat=`<path d="M-56-101q7-46 54-47 52 0 59 46Z" fill="${head.color}"/><path d="M-60-101h129q13 14-6 18l-106-6Z" fill="${head.color}"/><path d="M-4-145v43" fill="none"/>`;
  if(head?.visual==='goggles')hat='<path d="M-61-109H61v18H-61Z" fill="#704e3e"/><rect x="-39" y="-121" width="34" height="29" rx="10" fill="#98c7c1"/><rect x="7" y="-121" width="34" height="29" rx="10" fill="#98c7c1"/>';
  const torso=body?.visual==='vest'?`<path d="M-32-25H31L39 28H-38Z" fill="${coat}"/><path d="M-18-8h36v21h-36Z" fill="#979f96"/>`:
    `<path d="M-30-28Q-41-4-36 28H37Q42 0 29-27Z" fill="${coat}"/><path d="M0-20v48M-23 5h14m17 0h16" fill="none"/>${body?.visual==='puffer'?'<path d="M-35-7H35M-36 12H36" fill="none"/>':''}`;
  return `<g class="toon-character${portrait?' portrait':''}" transform="translate(${x} ${y}) scale(${flip?-scale:scale} ${scale})" stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cy="74" rx="53" ry="11" fill="#20302f" opacity=".16" stroke="none"/>
    <path d="m-28 23-6 43 25 4 12-44m10 0 5 44 26-4-13-44" fill="#525f6a"/>
    <path d="M-37 62q-16 0-13 15h35l5-13m16 0 4 13h36q2-16-15-16" fill="#3d4146"/>
    <path d="M-34-21q-26-6-25 35l20 1m72-34q24-8 29 27l-15 7" fill="${coat}"/>
    <path d="M-34-25q-25-22-17-58l9-44q33-44 82-3 21 49-7 105Z" fill="#41484d"/>
    ${torso}
    <path d="M-25-27 1-14l23-14 12 14L1 0l-36-16Z" fill="#de9562"/>
    <ellipse cy="-77" rx="61" ry="55" fill="#e9be97"/>
    <path d="M-59-88q-11-57 43-61l-9-17 40 14q40-12 50 49l-22-20-8 16-21-18-20 18-16-12-27 26Z" fill="#40484c"/>
    <ellipse cx="-25" cy="-71" rx="22" ry="26" fill="#fff7df"/><ellipse cx="26" cy="-71" rx="22" ry="26" fill="#fff7df"/>
    <ellipse cx="-20" cy="-68" rx="13" ry="21" fill="#334740" stroke="none"/><ellipse cx="30" cy="-68" rx="13" ry="21" fill="#334740" stroke="none"/>
    <ellipse cx="-17" cy="-65" rx="8" ry="16" fill="#223033" stroke="none"/><ellipse cx="33" cy="-65" rx="8" ry="16" fill="#223033" stroke="none"/>
    <circle cx="-22" cy="-78" r="5.5" fill="#fff" stroke="none"/><circle cx="28" cy="-78" r="5.5" fill="#fff" stroke="none"/>
    <path d="m-28-103 16-3m29 0 17 4M-7-40q10 8 18-1" fill="none" stroke-width="3"/>
    <ellipse cx="-42" cy="-48" rx="10" ry="5" fill="#d58972" opacity=".45" stroke="none"/><ellipse cx="45" cy="-48" rx="10" ry="5" fill="#d58972" opacity=".45" stroke="none"/>
    ${hat}
    ${weaponArt(weapon,62,12)}
    <ellipse cx="61" cy="19" rx="9" ry="8" fill="#e9be97"/>
    <path d="M-46 15h14v14h-14Z" fill="#e9be97"/>
  </g>`;
}
export function enemyArt(type,x=0,y=0,scale=1) {
  let art='';
  if(type==='dog')art='<path d="m-56 22-15-35-18 7 12 38m24-35 57 5 25 45-22 7-9-27-21 7-11 25-22-3 6-26Z" fill="#a78e67"/><path d="M4 4Q-9-60 29-76L52-66l27-16-4 43 10 38-29 26Z" fill="#bba57d"/><path d="m4-49 5-32 23 10m-6 82 19 10 19-10" fill="#7a6b59"/><ellipse cx="26" cy="-23" rx="15" ry="20" fill="#fff2d4"/><ellipse cx="61" cy="-24" rx="14" ry="20" fill="#fff2d4"/><ellipse cx="30" cy="-20" rx="7" ry="14" fill="#273133"/><ellipse cx="58" cy="-20" rx="7" ry="14" fill="#273133"/><path d="m32 4 16-3 5 10-12 3Z" fill="#263236"/><path d="m31 24 11 9 12-9m-18 7 2 8 5-6m7-1 4 8 2-11" fill="#fff2d4"/>';
  else if(type==='robot')art='<path d="m-30 16-12 39h25l12-37m17 0 13 37h23L31 12" fill="#617877"/><path d="M-35-26H35l12 49H-44Z" fill="#8caaa0"/><path d="M-45-15-63 16l-11-4 14-41m105 10 22 40-15 8-22-31" fill="#8caaa0"/><rect x="-54" y="-107" width="110" height="83" rx="26" fill="#9cad97"/><rect x="-43" y="-91" width="86" height="43" rx="15" fill="#324a4b"/><path d="M-1-111v-25m-16 106 27 0M-24 2h50" fill="none"/><circle cy="-139" r="8" fill="#de8365"/><circle cx="-21" cy="-72" r="12" fill="#e3ad61"/><circle cx="22" cy="-72" r="12" fill="#e3ad61"/><path d="M-22-75h7m33 0h7" stroke="#fff0c7"/>';
  else art='<path d="m-28 9-8 49 27 4L3 11m12 0 1 50 25-5-9-45" fill="#615765"/><path d="M-30-32 31-35 43 19H-41Z" fill="#b37867"/><path d="M-34-33-27 13H26l7-45" fill="#726770"/><path d="m-33-29-24 40 14 10 23-29m50-22 27 31-10 16-25-31" fill="#b37867"/><ellipse cy="-83" rx="57" ry="52" fill="#dab38a"/><path d="M-59-92q-9-61 61-60l21-16 2 20q31 5 35 61l-22-10-12 15-18-25-22 14-18-9-26 10Z" fill="#685b60"/><path d="m-48-81 40 1-7 32h-29Zm60 1h36l-2 32H16Z" fill="#fff0d0"/><path d="m-48-83 40 7m18-6 39-4" fill="none" stroke-width="7"/><ellipse cx="-21" cy="-61" rx="8" ry="15" fill="#293538"/><ellipse cx="25" cy="-64" rx="8" ry="15" fill="#293538"/><path d="M-53-41Q0-20 54-40L34-17h-68Z" fill="#a45951"/><path d="M-1-34v11m13-16v14" fill="none"/>';
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="${ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><ellipse cy="63" rx="68" ry="10" fill="#20302f" opacity=".16" stroke="none"/>${art}</g>`;
}
export function vanArt(s,x=0,y=0,scale=1) {
  const installed=id=>s.modules.includes(id);
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="${ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="80" cy="72" rx="151" ry="13" fill="#20302f" opacity=".18" stroke="none"/>
    <path d="M-57-78H128l70 85v52H-62V-69q0-9 5-9Z" fill="#80a793"/>
    <path d="M-62 15H198v42H-62Z" fill="#d9c184"/><path d="M-61-3H148" stroke="#36514a" stroke-width="8"/>
    <path d="M91-67h32l43 55H91Z" fill="#cad6b3"/><path d="m118-60 32 40" stroke="#f0e8c8" stroke-width="8"/>
    <rect x="-44" y="-63" width="64" height="47" rx="4" fill="#374d4b"/><path d="M-27-62v45M-45-32h66" fill="none"/>
    <path d="M27-65h52V48H27Z" fill="#86a996"/><path d="M59-8h11" fill="none"/>
    <circle cx="-21" cy="55" r="27" fill="#344144"/><circle cx="145" cy="55" r="27" fill="#344144"/>
    <circle cx="-21" cy="55" r="11" fill="#b4b6a1"/><circle cx="145" cy="55" r="11" fill="#b4b6a1"/>
    <path d="M187 11h15v14h-15Z" fill="#e4d39a"/><path d="M-69 37h14v16h-14Z" fill="#cb7258"/>
    <path d="M-29-100h89v21h-89Z" fill="#b99563"/><path d="M-8-100v21m40-21v21" fill="none"/>
    ${installed('storage')?'<rect x="64" y="-112" width="60" height="32" rx="5" fill="#637584"/><path d="M94-112v32" fill="none"/>':''}
    ${installed('filter')?'<path d="m-58-89-10 8v36h-14v-49Z" fill="#7bafb1"/>':''}
    ${installed('bed')?'<path d="M-44-29h60v10h-60Z" fill="#d89273"/><path d="M-41-39h17v10h-17Z" fill="#e9dbc0"/>':''}
    ${installed('workbench')?'<path d="M-47 26h39v9h-39Z" fill="#9d7859"/><path d="m-40 31 2 15m20-15-2 15" fill="none"/>':''}
    <path d="m119 14-4 12m-94-63 11 4" stroke="#c3a278"/>
    <path d="M-5 23h18v15H-5Z" fill="#f1e3b9"/><path d="M4 25v11m-6-6h12" stroke="#708f71" stroke-width="2"/>
  </g>`;
}
function building(kind) {
  const shared='<path d="M310 87h38v61h-38Zm66 0h38v61h-38Z" fill="#36504d"/><path d="M330 153h53v92h-53Z" fill="#65796a"/><path d="m337 155 9 29-8 33m-34-92 18-10 8 12" fill="none" stroke="#b8bb96"/>';
  if(kind==='forest')return '<g fill="#678575"><path d="M210 253 267 57l53 196ZM350 256 409 24l63 232ZM504 262 550 79l60 183Z"/><path d="M293 275 336 108l41 165ZM117 259 164 109l57 162Z" fill="#829880"/><path d="M265 241v62m142-60v64m149-59v64" stroke="#4b675a" stroke-width="11"/></g><path d="M280 282h160l-17-19-74-14-58 13Z" fill="#8b765c"/>';
  if(kind==='river')return '<path d="M50 243q270-89 580 14l-84 49H113Z" fill="#8aa9a2"/><path d="M93 263h87m62-13h170m-106 29h134" stroke="#bcc5a4" fill="none"/><path d="M200 110h409v27H200Z" fill="#8b9380"/><path d="M228 137v130h34V137m255 0v141h34V137" fill="#7e8a75"/><path d="m220 100 58-7 126 7 70-4 114 4" fill="none" stroke-width="9"/>';
  if(kind==='junk')return '<path d="m200 270 36-67 88 10 23-69 96 24 6 48 112-13 63 72Z" fill="#9c9880"/><path d="M224 229v-62h82l27 63Z" fill="#87968a"/><path d="M251 183h42l15 26h-57Z" fill="#405854"/><path d="m364 167-28-44 88-23 17 43Z" fill="#b19d77"/><path d="M462 244v-75h60v75Z" fill="#7c8c83"/><circle cx="259" cy="232" r="17" fill="#364b49"/><circle cx="304" cy="232" r="17" fill="#364b49"/>';
  if(kind==='tower')return '<path d="m367 268 52-241 71 241m-63-212 48 161m-77-119 60 0m-69 54h85m-101 55h117" fill="none" stroke="#667e73" stroke-width="9"/><path d="M214 210h138v58H214Z" fill="#a3a17b"/><path d="M243 229h33v39h-33Z" fill="#3f5651"/><path d="M420 26h-43m61 26h44" stroke="#a2846a" stroke-width="8"/>';
  if(kind==='factory')return `<path d="M243 251V78l116 40V67l129 45v140Z" fill="#afad83"/><path d="M439 81V-9h39v105Z" fill="#829080"/>${shared}<path d="M397 166h78v85h-78Z" fill="#435b55"/><path d="M413 172v70m19-69v69m21-69v69" stroke="#879581"/>`;
  if(kind==='apart')return `<path d="M251 247V-2h76l3 20 81-6 29 25v209Z" fill="#a9a67b"/><g fill="#4b655c"><path d="M265 38h38v45h-38Zm62 0h41v45h-41Zm58 0h32v45h-32ZM265 102h38v45h-38Zm120 0h32v45h-32Z"/></g>${shared}<path d="m311 8 7 53-9 24 13 78" fill="none" stroke="#6e7e68"/>`;
  return `<path d="M223 250V69l26-18h159l46 18v181Z" fill="#bab18a"/><path d="M212 50h251v33H212Z" fill="#6f8c79"/>${shared}<path d="M235 100h65v101h-65Z" fill="#354e4b"/><path d="M246 105h37v9h-37m-38 111h62" fill="none" stroke="#a8b795"/>${kind==='clinic'?'<path d="M329 18v49m-24-25h49" stroke="#c97e60" stroke-width="17"/>':'<path d="M233 85h217v20H233Z" fill="#b88063"/><path d="M233 85v20m36-20v20m36-20v20m36-20v20m36-20v20m36-20v20" stroke="#e5cf9b" stroke-width="15"/>'}`;
}
export function scenery(s,kind='road',{combat=null,camp=false}={}) {
  const b=combat;
  return `<svg class="landscape" viewBox="0 0 960 510" role="img" aria-label="${b?'荒れた道路での戦闘':camp?'移動拠点と主人公':'廃墟と主人公'}">
    <defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#c0c9aa"/><stop offset="1" stop-color="#ead8ad"/></linearGradient><linearGradient id="ground" x2="0" y2="1"><stop stop-color="#a5ad87"/><stop offset="1" stop-color="#7d9582"/></linearGradient></defs>
    <rect width="960" height="510" fill="url(#sky)"/><circle cx="780" cy="92" r="53" fill="#f3dfac"/>
    <g fill="#a2b09a" opacity=".8"><path d="M0 260V177h59v-56h57v120h39V97h68v165h56V143h43v107h47V64h58v184h39V129h63v121h65V159h58v79h85V99h55v147h61V134h59v126Z"/></g>
    <g stroke="#b3bfa0" stroke-width="7" fill="none"><path d="M190 119v57m17-49v28m175-57v106m20-78v75m141-63v34m217-56v104m21-87v82"/></g>
    <path d="M0 278q159-48 293-15 195-74 373-11 180-31 294 24v234H0Z" fill="url(#ground)"/>
    <path d="M317 289 757 274 960 510H0Z" fill="#a9a88b"/><path d="M469 333h91l29 31H440m-26 48h223l31 37H385" fill="#dacda6" opacity=".8"/>
    <g transform="translate(0 10)" stroke="#5b7467" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${b?'':building(kind)}</g>
    <g stroke="#546d60" stroke-width="3" fill="none" stroke-linecap="round"><path d="m54 414 25 18 37-9 26 33m610-54 18 21 61-10 30 26m-461-39 37 12-25 28 22 12m184-78 51 3 8 13"/><path d="m60 324 4-32m0 16-9-15m9 8 8-14m644 35 3-26m0 11 9-18m-10 11-9-10m168 49 2-37m0 20 12-13m-13 1-8-12"/></g>
    <g fill="#687e6a" stroke="#4e695c" stroke-width="3"><path d="m9 466 28-29 14 29 35-7-23 51H0Zm843 44 16-42 31 15 18-38 31 29 12 36Z"/><path d="m153 367 31-11 17 16-13 9-40-2Z" fill="#92987d"/><path d="m730 361 22-15 27 14-6 14h-45Z" fill="#9a9d81"/></g>
    ${b?character(s,{x:170+(6-b.distance)*22,y:352,scale:1.05})+enemyArt(b.enemy.visual,782-(6-b.distance)*22,352,1.2):vanArt(s,camp?603:737,camp?329:300,camp?1.14:.83)+character(s,{x:camp?252:171,y:352,scale:camp?1.12:1})}
    <path d="M0 479q111-18 175 9 101-11 210 13 240-27 386 1 128-21 189-9v17H0Z" fill="#5c7d6a" opacity=".6"/>
    <g fill="#283e37" opacity=".3"><path d="m829 142 10-5 11 5-11-2Zm-19 10 8-5 11 5-11-2Z"/></g>
  </svg>`;
}
