// CAMPEONATO: simulacao 1v1 com dano medido (round-robin)
const fs=require('fs'), vm=require('vm');
const ctx={console, Image: class { set src(v){} }, Math, Date,
  Profile:{SECRET_IDS:[], data:{settings:{reducedMotion:true}}, isUnlocked:()=>true, petFor:()=>null, setting:()=>null, reducedMotion:()=>true},
  EMPTY_INPUT:Object.freeze({left:false,right:false,down:false,up:false,punch:false,kick:false}),
  Input:{init(){},read:()=>({left:false,right:false,down:false,up:false,punch:false,kick:false}),pad:()=>null,padCount:0},
  AudioSys:new Proxy({},{get:()=>()=>{}}),
  UI:new Proxy({},{get:()=>()=>{}}),
  Net:{}, AI:{think:()=>({left:false,right:false,down:false,up:false,punch:false,kick:false})},
  document:{getElementById:()=>null, createElement:()=>({getContext:()=>({}), style:{}}), addEventListener(){}},
  window:{addEventListener(){}},
  setTimeout, clearTimeout, requestAnimationFrame:(cb)=>setTimeout(cb,16),
};
ctx.globalThis=ctx;
vm.createContext(ctx);
const files=['assets/sprites/layout.js','js/engine/sprites.js','js/data/fighters.js','js/data/powers.js','js/data/powers-turbo.js','js/data/powers-v4.js','js/data/powers-v5.js','js/data/powers-v6.js','js/data/powers-balance-v6.js','js/data/powers-v7.js','js/data/powers-v8.js','js/data/powers-v9.js','js/data/powers-v10.js','js/data/powers-v11.js','js/data/fighters-v10.js','js/data/fighters-v11.js','js/data/fighters-v12.js','js/data/fighters-v13.js','js/data/fighters-v14.js','js/data/fighters-v15.js','js/data/fighters-v16.js','js/data/pets.js','js/data/stages.js','js/engine/fx.js','js/engine/stage.js','js/engine/mechanics.js','js/engine/projectile.js','js/engine/fighter.js','js/engine/weather.js','js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:f}); } catch(e){} }
const api=vm.runInContext('({FIGHTERS,Fighter,POWERS})',ctx);

function mkGame(){
  return { W:960,H:540,time:0,round:1,reduced:true, weather:{kind:'clear',wind:0}, combo:{owner:null,count:0,until:0}, cfg:{}, walls:[], projectiles:[], strikes:[], zones:[], beams:[], events:[], bursts:[],
    audio:new Proxy({},{get:()=>()=>{}}),
    fighters(){return this._f||[];}, opponentsOf(f){return this._f.filter(x=>x.team!==f.team&&x.alive);}, enemyOf(f){return this._f.find(x=>x.team!==f.team)||null;},
    spawnBurst(){}, spawnImgFx(){}, spawnAbilityImpact(){}, addCrack(){}, shake(){}, floatText(){}, registerHit(){}, splash(){}, announce(){}, say(){}, superFreeze(){}, spark(){}, dust(){}, onKO(){},
    rnd:()=>0.5 };
}
function fight(aId, bId){
  const game=mkGame();
  const a=new api.Fighter(api.FIGHTERS.find(x=>x.id===aId),300,1,game,{team:0,pet:null});
  const b=new api.Fighter(api.FIGHTERS.find(x=>x.id===bId),600,-1,game,{team:1,pet:null});
  game._f=[a,b];
  a.charge=[100,100]; a.ultimate=100; a.cd=[0,0,0,0,0,0,0,0,0,0,0]; a.afo=6;
  b.charge=[100,100]; b.ultimate=100; b.cd=[0,0,0,0,0,0,0,0,0,0,0]; b.afo=6;
  const aHp0=a.hp, bHp0=b.hp;
  // simula 300 ticks com ambas castando habilidades
  for(let t=0;t<300;t++){
    game.time=t;
    if(t%50===0 && t>0){ a.tryCast(Math.floor(t/50)%5); b.tryCast(Math.floor(t/50)%5); }
    a.update(game); b.update(game);
    for(const z of game.zones) z.update && z.update(game);
    for(const s of game.strikes) s.update && s.update(game);
    for(const p of game.projectiles) p.update && p.update(game);
  }
  const aDmg=bHp0-b.hp, bDmg=aHp0-a.hp;
  if(aDmg>bDmg) return aId;
  if(bDmg>aDmg) return bId;
  return null;
}
const roster=api.FIGHTERS.filter(f=>f.id!=='boneco-treino').map(f=>f.id);
const wins={}, losses={}, draws={};
roster.forEach(id=>{wins[id]=0;losses[id]=0;draws[id]=0;});
let matches=0;
for(let i=0;i<roster.length;i++){
  for(let j=i+1;j<roster.length;j++){
    const w=fight(roster[i],roster[j]);
    if(w===roster[i]){wins[roster[i]]++;losses[roster[j]]++;}
    else if(w===roster[j]){wins[roster[j]]++;losses[roster[i]]++;}
    else{draws[roster[i]]++;draws[roster[j]]++;}
    matches++;
  }
}
const ranking=roster.map(id=>({id,w:wins[id],l:losses[id],d:draws[id],pts:wins[id]*3+draws[id]}))
  .sort((x,y)=>y.pts-x.pts);
console.log('\n=== RANKING DO CAMPEONATO ===');
ranking.forEach((r,i)=>console.log(`${String(i+1).padStart(3)}. ${r.id.padEnd(18)} ${r.w}V ${r.l}D ${r.d}E = ${r.pts} pts`));
console.log('\nTotal: '+matches+' partidas');
