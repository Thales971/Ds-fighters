// TESTE DE TODOS OS MODOS
const fs=require('fs'), vm=require('vm');
const ctx={console, Image: class { set src(v){} }, Math, Date,
  Profile:{SECRET_IDS:[], data:{settings:{reducedMotion:false}, unlocked:[]}, isUnlocked:()=>true, petFor:()=>null, setting:()=>null, reducedMotion:()=>false},
  EMPTY_INPUT:Object.freeze({left:false,right:false,down:false,up:false,punch:false,kick:false}),
  Input:{init(){},read:()=>({left:false,right:false,down:false,up:false,punch:false,kick:false}),pad:()=>null,padCount:0},
  AudioSys:new Proxy({},{get:()=>()=>{}}),
  UI:{show(){},hide(){},banner(){},hud:new Proxy({},{get:()=>()=>{}}),toast(){}},
  Net:{}, AI:{think(){return {left:false,right:false,down:false,up:false,punch:false,kick:false};}},
  document:{getElementById:()=>null, createElement:()=>({getContext:()=>({}), style:{}}), addEventListener(){}},
  window:{addEventListener(){}},
  setTimeout, clearTimeout, requestAnimationFrame:(cb)=>setTimeout(cb,16),
};
ctx.globalThis=ctx;
vm.createContext(ctx);
const files=['assets/sprites/layout.js','js/engine/sprites.js','js/data/fighters.js','js/data/fighters-v10.js','js/data/fighters-v11.js','js/data/powers.js','js/data/powers-turbo.js','js/data/powers-v4.js','js/data/powers-v5.js','js/data/powers-v6.js','js/data/powers-balance-v6.js','js/data/powers-v7.js','js/data/powers-v8.js','js/data/powers-v9.js','js/data/powers-v10.js','js/data/powers-v11.js','js/data/fighters-v12.js','js/data/fighters-v13.js','js/data/fighters-v14.js','js/data/fighters-v15.js','js/data/fighters-v16.js','js/data/pets.js','js/data/stages.js','js/engine/stage.js','js/engine/mechanics.js','js/engine/fx.js','js/engine/projectile.js','js/engine/fighter.js','js/engine/weather.js','js/engine/game.js'];
for (const f of files) { try { vm.runInContext(fs.readFileSync(f,'utf8'), ctx, {filename:f}); } catch(e){ console.log('ERRO ao carregar', f, e.message.slice(0,60)); } }
const api=vm.runInContext('({Game,FIGHTERS})',ctx);
const fake2d=()=>({canvas:null,save(){},restore(){},clearRect(){},fillRect(){},drawImage(){},translate(){},scale(){},rotate(){},beginPath(){},ellipse(){},fill(){},fillText(){},measureText:()=>({width:10}),createLinearGradient:()=>({addColorStop(){}}),set imageSmoothingEnabled(v){},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})});
const canvas={width:960,height:540,getContext:()=>fake2d(),toBuffer:()=>Buffer.alloc(10)};
const modes=[['arcade',{mode:'arcade',teams:[['du'],['stack']],cpu:[false,true],roundsToWin:2,timer:99}],
             ['versus',{mode:'versus',teams:[['du'],['stack']],cpu:[false,false],roundsToWin:2,timer:99}],
             ['training',{mode:'training',teams:[['du'],['boneco-treino']],stage:'treino-dojo',cpu:[false,false],roundsToWin:99,timer:999,dummy:'stand',autoHeal:true}],
             ['tag',{mode:'tag',teams:[['du','iales'],['stack','qa']],cpu:[false,true],roundsToWin:2,timer:99}],
             ['survival',{mode:'survival',teams:[['du'],['stack']],cpu:[false,true],roundsToWin:99,timer:99}]];
let fails=0;
for (const [name,cfg] of modes){
  try {
    const g=new api.Game(canvas);
    g.start(cfg);
    for (let t=0;t<600;t++) g.tick();
    console.log(`MODO ${name}: OK (600 ticks, roundState=${g.roundState})`);
  } catch(e) { fails++; console.log(`MODO ${name}: FALHOU — ${String(e).slice(0,120)}`); }
}
console.log(fails===0?'TODOS OS MODOS OK':'FALHAS: '+fails);
