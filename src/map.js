import { LOCATIONS } from './data.js';
import { neighbors } from './world.js';
import { escapeHTML as e } from './art.js';

// Decoration has its own deterministic seed. Rendering never consumes gameplay RNG.
function hash(text) {let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function mapLayout(state) {
  const seed=hash(`${state.region}:${state.world.map(n=>n.locId).join(',')}`);
  const anchors=[[54,54],[192,38],[382,44],[520,61],[654,43],[80,134],[230,112],[353,145],[535,129],[665,151],[54,219],[203,219],[394,222],[522,215],[659,220]];
  const nodes=state.world.map(node=>{
    const n=hash(`${seed}:${node.id}`);
    const [x,y]=anchors[node.id];
    return {...node,x:x+(n%13)-6,y:y+((n>>>8)%13)-6};
  });
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const roads=nodes.flatMap(a=>neighbors(a.id).filter(id=>id>a.id).map(id=>({a,b:byId.get(id)})));
  return {nodes,roads};
}
function landmark(kind) {
  if(kind==='forest')return '<path d="M-14 8l8-22L2 8zM-1 10l10-29 12 29z" fill="#728d62"/><path d="M-6 8v8M9 10v7"/>';
  if(kind==='river')return '<path d="M-21 0q10-7 20 0t20 0M-21 8q10-7 20 0t20 0" fill="none" stroke="#7caaa6" stroke-width="4"/><path d="M-10-10h24l-5 7H-5z" fill="#cab78c"/>';
  if(kind==='tower')return '<path d="M-12 14L0-19l12 33M-7 2H7M-10 10h20M-8-17q8-8 16 0" fill="none"/><circle cy="-19" r="3" fill="#e2b76c"/>';
  if(kind==='road')return '<path d="M-23 8L20-7" stroke="#ddceb0" stroke-width="12"/><path d="M-23 8L20-7" stroke="#839080" stroke-width="1.5" stroke-dasharray="5 5"/><rect x="-9" y="-15" width="22" height="13" rx="3" fill="#b1b999"/><circle cx="-4" cy="-1" r="3"/><circle cx="9" cy="-1" r="3"/>';
  if(kind==='junk')return '<path d="M-22 11l10-15 14 5 13-16 9 26z" fill="#b5b298"/><rect x="-13" y="-4" width="17" height="10" rx="2" fill="#ba9f7b"/><path d="M5 1l11-10 5 17" fill="#8da397"/>';
  const roof=kind==='factory'?'<path d="M-21-5l9-9v9l9-9v9h22" fill="#bf9a73"/><rect x="12" y="-24" width="7" height="21" fill="#aaa28a"/>':'<path d="M-23-7L0-21l23 14z" fill="#ba9471"/>';
  return `<rect x="-20" y="-7" width="40" height="23" rx="2" fill="${kind==='clinic'?'#e0d7b4':kind==='shop'?'#c5b895':'#b5bd9f'}"/>${roof}<path d="M-11 1h7v7h-7zM5 1h7v7H5z" fill="#6d8c80"/>${kind==='clinic'?'<path d="M-3-11v-8M-7-15h8" stroke="#e5e9d4" stroke-width="3"/>':''}${kind==='shop'?'<path d="M-19-5h38v5h-38z" fill="#dcb875"/>':''}`;
}
export function renderMap(state,{driving=false}={}) {
  const {nodes,roads}=mapLayout(state),reachable=neighbors(state.location);
  const route=({a,b})=>`M${a.x} ${a.y} C${a.x+(b.x-a.x)*.3+8} ${a.y+(b.y-a.y)*.3-12},${a.x+(b.x-a.x)*.7-8} ${a.y+(b.y-a.y)*.7+10},${b.x} ${b.y}`;
  return `<div class="world-map terrain-map"><svg viewBox="0 0 720 270" preserveAspectRatio="none" aria-label="道路で結ばれた周辺地図。光る施設を選ぶと${driving?'拠点ごと':'徒歩で'}移動" class="region-map">
    <rect width="720" height="270" rx="12" fill="#d9d6b6"/><path d="M0 32Q170 5 268 62T530 24L720 0v97q-127 51-234 5T220 88 0 114zM0 216q145-70 267-6t453-33v93H0z" fill="#c4cca6"/>
    <path d="M560-20q-100 55-65 101t-81 111-55 88" fill="none" stroke="#e5dfbc" stroke-width="31"/><path d="M560-20q-100 55-65 101t-81 111-55 88" fill="none" stroke="#99b9ad" stroke-width="21"/><path d="M560-20q-100 55-65 101t-81 111-55 88" fill="none" stroke="#b6d0bd" stroke-width="2"/>
    ${Array.from({length:38},(_,i)=>{const n=hash(`${state.region}:trees:${i}`),x=n%720,y=(n>>>10)%270;return `<path d="M${x-4} ${y+6}l4-12 4 12z" fill="#9da97d" opacity=".45"/>`;}).join('')}
    <g fill="none" stroke-linecap="round">${roads.map(r=>`<path d="${route(r)}" stroke="#acb495" stroke-width="11"/><path d="${route(r)}" stroke="#ede1bb" stroke-width="7"/>`).join('')}${roads.filter(r=>r.a.id===state.location||r.b.id===state.location).map(r=>`<path d="${route(r)}" stroke="#7b9568" stroke-width="2" stroke-dasharray="4 6"/>`).join('')}</g>
    ${nodes.map(node=>{
      const loc=LOCATIONS.find(l=>l.id===node.locId),current=node.id===state.location,home=node.id===state.baseLocation,canMove=reachable.includes(node.id)&&!state.combat;
      const label=current?'現在地':home?'走る家':node.seen?loc.name.replace(/.*?の/,''):'未踏';
      return `<g class="map-node ${current?'current':''} ${canMove?'reachable':''} ${home?'home':''} ${node.seen?'known':'unknown'}" transform="translate(${node.x} ${node.y})" data-action="move" data-help-action="move" aria-describedby="ability-tooltip" data-value="${node.id}" role="button" tabindex="${canMove?0:-1}" aria-disabled="${!canMove}" aria-label="${e(node.seen?loc.name:'未踏の場所')}${current?'（現在地）':canMove?'へ移動':''}"><title>${e(node.seen?loc.name:'未踏の場所')}${home?' / 移動拠点':''}</title><ellipse class="map-halo" ry="25" rx="32"/>${node.seen?`<g class="landmark" stroke="#617765" stroke-width="1.6" stroke-linejoin="round">${landmark(loc.kind)}</g>`:'<text class="unseen-mark" y="9">?</text>'}<rect class="map-label-bg" x="-49" y="21" width="98" height="19" rx="6"/><text class="map-label" y="34">${e(label)}</text>${current?'<circle class="location-pin" cy="-29" r="5"/>':''}${home?'<g class="home-pin" transform="translate(23 -18)"><rect x="-6" y="-6" width="15" height="10" rx="2"/><circle cx="-2" cy="5" r="2"/><circle cx="6" cy="5" r="2"/></g>':''}</g>`;
    }).join('')}<text x="693" y="24" text-anchor="middle" fill="#7b8969" font-size="10">N</text><path d="M693 30v20m-4-15 4-6 4 6" stroke="#7b8969" fill="none"/></svg></div>`;
}
