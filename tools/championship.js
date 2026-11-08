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
const files=['assets/sprites/layout.js','js/engine/sprites.js','js/data/fighters.js','js/data/powers.js','js/data/powers-turbo.js','js/data/powers-v4.js','js/data/powers-v5.js','js/data/powers-v6.js','js/data/powers-balance-v6.js','js/data/powers-balance-v7.js','js/data/powers-balance-v8.js','js/data/powers-balance-v9.js','js/data/powers-v7.js','js/data/powers-v8.js','js/data/powers-v9.js','js/data/powers-v10.js','js/data/powers-v11.js','js/data/fighters-v10.js','js/data/fighters-v11.js','js/data/fighters-v12.js','js/data/fighters-v13.js','js/data/fighters-v14.js','js/data/fighters-v15.js','js/data/fighters-v16.js','js/data/fighters-v17.js','js/data/fighters-v18.js','js/data/fighters-v19.js','js/data/fighters-v20.js','js/data/pets.js','js/data/stages.js','js/engine/fx.js','js/engine/stage.js','js/engine/mechanics.js','js/engine/projectile.js','js/engine/fighter.js','js/engine/weather.js','js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:f}); } catch(e){ console.log('ERRO CARGA', f, String(e).slice(0,60)); } }
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
  let aDeath=-1, bDeath=-1;
  // simula 500 ticks com ambas castando o KIT COMPLETO em ciclo (o Iales tem 10).
  // Habilidades de ROUBO sao taticas, nao de dano — numa corrida de dano so
  // atrapalham (roubado, o lutador casta o kit do RIVAL, mais fraco pra ele).
  const castList = (f) => f.currentKit().map((p, i) => ({ p, i })).filter((x) => x.p.kind !== 'steal' && x.p.kind !== 'shadowport').map((x) => x.i);
  const aList = castList(a), bList = castList(b);
  for(let t=0;t<500;t++){
    game.time=t;
    /* MOVIMENTO basico: quem esta longe anda na direcao do rival — sem isso
       dashes/rushes/melee sao subestimados e zoners superestimados. */
    const dist0 = Math.abs(b.x - a.x);
    if (dist0 > 130) { a.x += Math.sign(b.x - a.x) * 3.2; b.x += Math.sign(a.x - b.x) * 3.2; }
    if(t%40===0 && t>0){ const k=Math.floor(t/40)-1; a.tryCast(aList[k%aList.length]); b.tryCast(bList[k%bList.length]); }
    /* ANTI-STUNLOCK: jogador real escapa do hitstun (rolamento/burst) — o sim
       tambem: 80 ticks preso em hit/blockstun = escape. Sem isso, quem entra
       em melee primeiro ganha a luta inteira por stunlock (artefato). */
    for (const [ff, oo] of [[a, b], [b, a]]) {
      const preso = ['hit', 'blockstun', 'down', 'thrown', 'throw', 'cast', 'rush'].includes(ff.state);
      if (preso && ff.alive) {
        ff._stunT = (ff._stunT || 0) + 1;
        if (ff._stunT > 70) { ff.state = 'idle'; ff.stateTime = 0; ff.hitstun = 0; ff.cast = null; ff.rush = null; ff.attack = null; ff._stunT = 0; ff.x += (ff.x < oo.x ? -70 : 70); }
      } else ff._stunT = 0;
    }
    a.update(game); b.update(game);
    if (aDeath<0 && a.hp<=0) aDeath=t;
    if (bDeath<0 && b.hp<=0) bDeath=t;
    for(const z of game.zones) z.update && z.update(game);
    for(const s of game.strikes) s.update && s.update(game);
    for(const p of game.projectiles) p.update && p.update(game);
  }
  const aDmg=bHp0-b.hp, bDmg=aHp0-a.hp;
  /* K.O. vale mais que dano acumulado: nocauteou primeiro, venceu.
     (Antes, quando os dois caiam, quem tinha MAIS vida perdia a corrida
     de dano — um artefato que punia o lutador mais tanque.) */
  if (aDeath>=0 && bDeath>=0) return aDeath===bDeath ? null : (aDeath<bDeath ? bId : aId);
  if (b.hp<=0) return aId;
  if (a.hp<=0) return bId;
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
