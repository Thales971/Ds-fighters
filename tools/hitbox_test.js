// TESTE INTENSIVO DE HITBOX: soco, chute e 5 habilidades de TODOS os lutadores
const fs=require('fs'), vm=require('vm');
const ctx={console, Image: class { set src(v){} }, Math, Date,
  Profile:{SECRET_IDS:[], data:{settings:{reducedMotion:false}}},
  EMPTY_INPUT:Object.freeze({left:false,right:false,down:false,up:false,punch:false,kick:false})};
vm.createContext(ctx);
const files=['assets/sprites/layout.js','js/data/fighters.js','js/data/fighters-v10.js','js/data/fighters-v11.js','js/data/powers.js','js/data/powers-turbo.js','js/data/powers-v4.js','js/data/powers-v5.js','js/data/powers-v6.js','js/data/powers-balance-v6.js','js/data/powers-v7.js','js/data/powers-v8.js','js/data/powers-v9.js','js/data/powers-v10.js','js/data/powers-v11.js','js/data/fighters-v12.js','js/data/fighters-v13.js','js/data/fighters-v14.js','js/data/fighters-v15.js','js/data/fighters-v16.js','js/data/pets.js','js/data/stages.js','js/engine/fx.js','js/engine/projectile.js','js/engine/fighter.js','js/engine/weather.js'];
for (const f of files) vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:f});
const api=vm.runInContext('({FIGHTERS,POWERS,Fighter})',ctx);

function mkGame(){
  return { W:960,H:540,time:0,round:1,reduced:true, weather:{kind:'clear',wind:0}, combo:{owner:null,count:0,until:0}, cfg:{}, walls:[], projectiles:[], strikes:[], zones:[], beams:[], events:[], bursts:[],
    audio:new Proxy({},{get:()=>()=>{}}),
    fighters(){return this._f||[];}, opponentsOf(f){return this._f.filter(x=>x.team!==f.team&&x.alive);}, enemyOf(f){return this._f.find(x=>x.team!==f.team)||null;},
    spawnBurst(){}, spawnImgFx(){}, spawnAbilityImpact(){}, addCrack(){}, shake(){}, floatText(){}, registerHit(){}, splash(){}, announce(){}, say(){}, superFreeze(){}, spark(){}, dust(){}, onKO(){},
    rnd:()=>0.5 };
}
function fresh(id, dist){
  const game=mkGame();
  const f=new api.Fighter(api.FIGHTERS.find(x=>x.id===id),300,1,game,{team:0,pet:null});
  const o=new api.Fighter(api.FIGHTERS.find(x=>x.id==='du'),300+dist,-1,game,{team:1,pet:null});
  game._f=[f,o];
  f.charge=[100,100]; f.ultimate=100; f.cd=[0,0,0,0,0,0,0,0,0,0]; f.afo=6;
  return {game,f,o};
}
function runTicks(game, ticks){
  for(let t=0;t<ticks;t++){ game.time=t;
    for(const fg of game._f){ fg.update(game); }
    for(const z of game.zones) z.update && z.update(game);
    for(const s of game.strikes) s.update && s.update(game);
    for(const p of game.projectiles) p.update && p.update(game);
  }
}
const results=[];
const all=api.FIGHTERS.map(f=>f.id);
for (const id of all){
  const kit=api.POWERS[id] ? api.POWERS[id].powers : null;
  const row={id, punch:'-', kick:'-', abilities:[]};
  // === SOCO: a alcance do soco (moves.punch.range) ===
  {
    const def=api.FIGHTERS.find(x=>x.id===id);
    const range=(def.moves&&def.moves.punch&&def.moves.punch.range)||50;
    const {game,f,o}=fresh(id, range-10);
    const hp0=o.hp;
    f.startAttack('punch');
    runTicks(game, 40);
    row.punch = Math.round(hp0-o.hp);
  }
  // === CHUTE ===
  {
    const def=api.FIGHTERS.find(x=>x.id===id);
    const range=(def.moves&&def.moves.kick&&def.moves.kick.range)||62;
    const {game,f,o}=fresh(id, range-10);
    const hp0=o.hp;
    f.startAttack('kick');
    runTicks(game, 45);
    row.kick = Math.round(hp0-o.hp);
  }
  // === HABILIDADES ===
  if (kit) {
    for (let i=0;i<kit.length;i++){
      const p=kit[i];
      const {game,f,o}=fresh(id, 130); // media distancia
      const hp0=o.hp;
      let ok=false;
      try { ok=f.tryCast(i); } catch(e) { row.abilities.push(`H${i+1}:ERRO(${String(e).slice(0,40)})`); continue; }
      runTicks(game, p.kind==='aura'?40:140);
      const dmg=Math.round(hp0-o.hp);
      const fx=[];
      for (const k of ['bleed','burn','slow','chill','vuln','paralyze','stun','shock','poison','blind','freeze','lock','glitch']) if (o.has(k)) fx.push(k);
      const aura=!!f.aura;
      row.abilities.push(`H${i+1}(${p.kind}):${ok?'ok':'FALHOU'} dano=${dmg}${fx.length?' fx='+fx.join(','):''}${aura?' aura':''}`);
    }
  } else row.abilities.push('(kit legado: special/super)');
  results.push(row);
}
// relatorio
console.log('===== TESTE DE HITBOX — '+all.length+' LUTADORES =====');
let problems=0;
for (const r of results){
  const badPunch = r.punch==='-' || r.punch<=0;
  const badKick = r.kick==='-' || r.kick<=0;
  const badAb = r.abilities.some(a=>a.includes('ERRO')||a.includes('FALHOU'));
  const flag = (badPunch||badKick||badAb)?' <<<':'';
  if (flag) problems++;
  console.log(`${r.id}:${flag} soco=${r.punch} chute=${r.kick}`);
  for (const a of r.abilities) console.log(`   ${a}`);
}
console.log(`\nTOTAL: ${all.length} lutadores | ${problems} com problemas potenciais`);
