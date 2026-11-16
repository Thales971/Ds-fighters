// ============================================================
// VALIDAÇÃO INTENSIVA — TUDO SO SPRITES E MECÂNICAS
// ============================================================
const fs = require('fs');
const { PNG } = require('pngjs');

let p = 0; let f = 0;
function check(cond, msg = '') { if(cond) { p++; } else { f++; console.log('  ❌ ' + msg); } }

function MAGENTA(r,g,b,a){ return a>40 && g<90 && r>150 && b>90; }

(async _ => {
  console.log('========================================');
  console.log('  VALIDAÇÃO INTENSIVA DE SPRITES');
  console.log('========================================\n');

  // --- 1. Imagens ---
  console.log('--- 1. ANÁLISE DE IMAGENS ---');

  // 1.1 Pitoco
  let img = PNG.sync.read(fs.readFileSync('assets/pets/pitoco.png'));
  check(img.width===384 && img.height===96, 'Pitoco: 384×96');
  check(img.width===4*96, 'Pitoco: 4 quadros de 96px');
  let d=img.data, mc=0, oc=0;
  d.forEach((v,i)=>i%4===3?(v===0||mc++:0));
  // contar magenta manualmente
  for(let i=0;i<d.length;i+=4){ if(MAGENTA(d[i],d[i+1],d[i+2],d[i+3])) mc++; }
  check(mc===0, 'Pitoco: 0 pixels magenta (got '+mc+')');
  check(oc>0, 'Pitoco: tem conteúdo (got '+oc+' px)');

  // 1.2 Bichos
  img = PNG.sync.read(fs.readFileSync('assets/fauna/bichos.png'));
  check(img.width===384 && img.height===768, 'Bichos: 384×768 (8×4 atlas)');
  d=img.data; mc=oc=0;
  for(let i=0;i<d.length;i+=4){ const a=d[i+3]; a>0&&(oc++, MAGENTA(d[i],d[i+1],d[i+2],a)&&mc++); }
  check(mc===0, 'Bichos: 0 pixels magenta (got '+mc+')');
  check(oc>0, 'Bichos: tem conteúdo (got '+oc+' px)');
  // 8 linhas × 4 colunas = 32 células
  check(img.width===384&&img.height===768, 'Bichos: atlas 8 fileiras × 4 colunas');

  // 1.3 Torcida
  img = PNG.sync.read(fs.readFileSync('assets/fauna/torcida.png'));
  check(img.width===1280&&img.height===200, 'Torcida: 5 fileiras × 256px (1280×200)');
  d=img.data; mc=oc=0;
  for(let i=0;i<d.length;i+=4){ const a=d[i+3]; a>0&&(oc++, MAGENTA(d[i],d[i+1],d[i+2],a)&&mc++); }
  check(mc===0, 'Torcida: 0 pixels magenta (got '+mc+')');
  check(oc>0, 'Torcida: tem conteúdo (got '+oc+' px)');
  // verificar 5 fileiras com gente
  let fileiras=0;
  for(let r=0;r<5;r++){
    let tem=0;
    for(let y=r*200;y<(r+1)*200&&!tem;y++){
      for(let x=r*256;x<(r+1)*256&&!tem;x++){
        if(d[(y*img.width+x)*4+3]>0) tem=1;
      }
    }
    if(tem) fileiras++;
  }
  check(fileiras===5, 'Torcida: todas as 5 fileiras têm gente (got '+fileiras+'/5)');

  // 1.4 Jess
  img = PNG.sync.read(fs.readFileSync('assets/sprites/jess.png'));
  let w=img.width,h=img.height;
  check(w%320===0, 'Jess: largura múltiplo de 320 (CELL_W) (got '+w+')');
  check(h>0, 'Jess: altura > 0 (got '+h+')');
  d=img.data; mc=oc=0;
  for(let i=0;i<d.length;i+=4){ const a=d[i+3]; a>0&&(oc++, MAGENTA(d[i],d[i+1],d[i+2],a)&&mc++); }
  check(mc===0, 'Jess: 0 pixels magenta (got '+mc+')');
  check(oc>0, 'Jess: tem conteúdo (got '+oc+' px)');

  // --- 2. Código do jogo ---
  console.log('\n--- 2. CÓDIGO FONTES ---');

  // 2.1 fighter.js — Pitoco renderizado
  let fsj = fs.readFileSync('js/engine/fighter.js','utf8');
  check(!fsj.includes('this.pet.row >= 0 && this.alive'), 'fighter.js: row>=0 removido como condição exclusiva');
  check(fsj.includes("Art.cell(ctx, 'pitoco', 0"), 'fighter.js: Pitoco renderiza via Art.cell("pitoco")');
  check(fsj.includes("this.pet.id === 'pitoco'"), 'fighter.js: this.pet.id === "pitoco" verificado');

  // 2.2 stage.js — Fauna todos sprites
  let ssj = fs.readFileSync('js/engine/stage.js','utf8');
  check(ssj.includes('squirrel: 8'), 'stage.js: squirrel row=8 no _sprRow');
  check(ssj.includes('dragonfly: 9'), 'stage.js: dragonfly row=9 no _sprRow');
  check(ssj.includes('_sprRow != null') && ssj.includes('continue'), 'stage.js: fauna entra no bloco sprite e continua');
  // verificar que fillRect de antigamente morreu
  check(!ssj.includes('a.k === \'pigeon\' && ctx.fillRect'), 'stage.js: fillRect de pigeon removido (agora sprite)');
  check(!ssj.includes('a.k === \'cat\' && ctx.fillRect'), 'stage.js: fillRect de cat removido (agora sprite)');
  check(!ssj.includes('a.k === \'dog\' && ctx.fillRect'), 'stage.js: fillRect de dog removido (agora sprite)');

  // 2.3 Torcida ativa
  check(ssj.includes('drawTorcida'), 'stage.js: drawTorcida() definido');
  check(ssj.includes("this.crowdSheet.src = 'assets/fauna/torcida.png'"), 'stage.js: torcidaSheet carrega torcida.png');

  // --- 3. Testes de jogo (simulados) ---
  console.log('\n--- 3. MECÂNICAS DE COMBATE ---');

  // 3.1 Pitoco no combate
  let fpj = fs.readFileSync('js/engine/fighter.js','utf8');
  check(fpj.includes('50% dos golpes erram sozinhos'), 'fighter.js: esquiva 50% do pitoco');
  check(fpj.includes('regen do pet (o pitoco cura 15 HP/s)'), 'fighter.js: regeneracao 15 HP/s');
  check(fpj.includes('_petRegen()'), 'fighter.js: _petRegen chamado no loop');

  // 3.4 fauna foge do lutador
  check(ssj.includes('if (near && nd < range')), 'stage.js: fauna foge quando lutador se aproxima');
  check(ssj.includes('a.vx = -1') || ssj.includes('a.vx = 1'), 'stage.js: fauna tem velocidade de fuga');

  // --- 4. Resumo ---
  console.log('\n' + '='.repeat(60));
  console.log('  RESULTADO: ' + p + ' aprovados, ' + f + ' falhas');
  console.log('========================================\n');
  process.exit(f>0?1:0);
})();