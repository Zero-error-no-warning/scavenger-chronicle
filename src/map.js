import { LOCATIONS } from './data.js?v=0.1.5';
import { neighbors } from './world.js?v=0.1.5';
import { escapeHTML as e, landmarkArt } from './art.js?v=0.1.5';

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
export function renderMap(state,{driving=false}={}) {
  const {nodes}=mapLayout(state),reachable=neighbors(state.location);
  return `<div class="world-map terrain-map"><div class="region-map painted-map" role="group" aria-label="道路で結ばれた周辺地図。施設を選ぶと${driving?'拠点ごと':'徒歩で'}移動"><canvas class="map-roads" aria-hidden="true"></canvas>${nodes.map(node=>{
    const loc=LOCATIONS.find(l=>l.id===node.locId),current=node.id===state.location,home=node.id===state.baseLocation,canMove=reachable.includes(node.id)&&!state.combat;
    const label=current?'現在地':home?'走る家':node.seen?loc.name.replace(/.*?の/,''):'未踏';
    return `<button class="map-node ${current?'current':''} ${canMove?'reachable':''} ${home?'home':''} ${node.seen?'known':'unknown'}" style="left:${node.x/720*100}%;top:${node.y/270*100}%" data-action="move" data-help-action="move" aria-describedby="ability-tooltip" data-value="${node.id}" ${canMove?'':'disabled'} aria-label="${e(node.seen?loc.name:'未踏の場所')}${current?'（現在地）':canMove?'へ移動':''}">${node.seen?landmarkArt(loc.kind):'<span class="unseen-mark" aria-hidden="true">?</span>'}<span class="map-label">${e(label)}</span>${current?'<span class="location-pin" aria-hidden="true"></span>':''}${home?'<span class="home-pin" aria-hidden="true">⌂</span>':''}</button>`;
  }).join('')}<span class="map-north" aria-hidden="true">N ↑</span></div></div>`;
}
let mapObserver;
// Only procedural connectivity is drawn. Terrain and facility artwork are generated images.
export function paintMap(container,state) {
  mapObserver?.disconnect();
  if(!container)return;
  const canvas=container.querySelector('canvas'),{roads}=mapLayout(state);
  const draw=()=>{
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return;
    const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineCap='round';
    const stroke=(road,color,lineWidth,dashed=false)=>{
      const {a,b}=road,x=width/720,y=height/270;
      ctx.beginPath();ctx.moveTo(a.x*x,a.y*y);
      ctx.bezierCurveTo((a.x+(b.x-a.x)*.3+8)*x,(a.y+(b.y-a.y)*.3-12)*y,(a.x+(b.x-a.x)*.7-8)*x,(a.y+(b.y-a.y)*.7+10)*y,b.x*x,b.y*y);
      ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.setLineDash(dashed?[4,6]:[]);ctx.stroke();
    };
    for(const road of roads){stroke(road,'#6e725aaa',7);stroke(road,'#efddad',4);}
    for(const road of roads.filter(r=>r.a.id===state.location||r.b.id===state.location))stroke(road,'#315842',2,true);
  };
  mapObserver=new ResizeObserver(draw);mapObserver.observe(container);draw();
}
