// ============================================================
// VALIDAÇÃO INTENSIVA — PITOCO (pet secreto)
// ============================================================
const fs = require('fs');
const vm = require('vm');
const path = require('path');

let passed = 0;
let failed = 0;

function check(name, condition, extra = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${extra ? '| ' + extra : ''}`);
  }
}

// ---------- 1. Carregar pets.js ----------
console.log('\n📦 1. CARREGANDO CATÁLOGO DE PETS...');
const petsSrc = fs.readFileSync('js/data/pets.js', 'utf8');
const petsCtx = vm.createContext({ PETS: undefined });
vm.runInContext(petsSrc.replace('const PETS = ', 'PETS = '), petsCtx);
const PETS = petsCtx.PETS;

const pitoco = PETS.find(p => p.id === 'pitoco');
check('Pitoco registrado no catálogo', !!pitoco);
check('Pitoco é secreto', pitoco && pitoco.secret === true);
check('Pitoco tem row -2 (pet individual)', pitoco && pitoco.row === -2);
check('Pitoco tem fx.dodge 0.5 (esquiva 50%)', pitoco && pitoco.fx && pitoco.fx.dodge === 0.5);
check('Pitoco tem fx.regen 15/60', pitoco && pitoco.fx && Math.abs(pitoco.fx.regen * 60 - 15) < 0.01);
check('Pitoco tem fx.pitoco true', pitoco && pitoco.fx && pitoco.fx.pitoco === true);

// ---------- 2. Verificar asset ----------
console.log('\n🖼️  2. ASSET DO PITOCO...');
check('assets/pets/pitoco.png existe', fs.existsSync('assets/pets/pitoco.png'));
const pitocoSize = fs.statSync('assets/pets/pitoco.png').size;
check('assets/pets/pitoco.png não está vazio (>1KB)', pitocoSize > 1024, `${pitocoSize} bytes`);

// ---------- 3. Verificar fx.js registra atlas pitoco ----------
console.log('\n⚡ 3. ATLAS REGISTRADO EM fx.js...');
const fxSrc = fs.readFileSync('js/engine/fx.js', 'utf8');
check('fx.js registra atlas "pitoco"', fxSrc.includes("pitoco: { src: 'assets/pets/pitoco.png'"));
check('fx.js registra atlas "pets"', fxSrc.includes("pets: { src: 'assets/pets/pets.png'"));

// ---------- 4. Verificar correção fighter.js ----------
console.log('\n⚔️  4. CORREÇÃO DE RENDERIZAÇÃO (fighter.js)...');
const fighterSrc = fs.readFileSync('js/engine/fighter.js', 'utf8');
check('fighter.js não usa mais row >= 0 como condição exclusiva', !fighterSrc.includes('if (this.pet && this.pet.row >= 0 && this.alive)'));
check('fighter.js renderiza pets com row >= 0 via atlas "pets"', fighterSrc.includes("Art.cell(ctx, 'pets', this.pet.row"));
check('fighter.js renderiza pitoco via atlas "pitoco"', fighterSrc.includes("Art.cell(ctx, 'pitoco', 0"));
check('fighter.js verifica this.pet.id === "pitoco"', fighterSrc.includes('this.pet.id === \'pitoco\''));

// ---------- 5. Verificar correção CSS ----------
console.log('\n🎨 5. CORREÇÃO CSS (style.css)...');
const cssSrc = fs.readFileSync('css/style.css', 'utf8');
check('CSS não remove background: none de .pet-spr.none', !cssSrc.includes('.pet-spr.none { background: none;'));
check('CSS mantém .pet-spr.none com animation: none', cssSrc.includes('.pet-spr.none { animation: none;'));

// ---------- 6. Verificar desbloqueio P-I-T-O-C-O ----------
console.log('\n🔑 6. DESBLOQUEIO P-I-T-O-C-O...');
const uiSrc = fs.readFileSync('js/ui/ui.js', 'utf8');
check('ui.js implementa pitocoKey()', uiSrc.includes('pitocoKey(k)'));
check('ui.js sequencia P-I-T-O-C-O', uiSrc.includes("['KeyP', 'KeyI', 'KeyT', 'KeyO', 'KeyC', 'KeyO']"));
check('ui.js chama Profile.unlockPitoco()', uiSrc.includes('Profile.unlockPitoco'));
check('ui.js renderiza pitoco na tela custom', uiSrc.includes("if (this.screen === 'custom') this.renderPets()"));

const inputSrc = fs.readFileSync('js/engine/input.js', 'utf8');
check('input.js escuta pitocoKey na tela custom', inputSrc.includes("UI.screen === 'custom'"));

// ---------- 7. Verificar profile.js ----------
console.log('\n💾 7. PERFIL (profile.js)...');
const profileSrc = fs.readFileSync('js/core/profile.js', 'utf8');
check('profile.js tem unlockPitoco()', profileSrc.includes('unlockPitoco()'));
check('profile.js tem hasPitoco()', profileSrc.includes('hasPitoco()'));
check('profile.js persiste pitocoUnlocked', profileSrc.includes('this.data.pitocoUnlocked = true'));

// ---------- 8. Verificar lógica de esquiva e regeneração ----------
console.log('\n🛡️  8. MECÂNICAS EM COMBATE (fighter.js)...');
check('takeHit implementa esquiva 50% do pitoco', fighterSrc.includes('50% dos golpes erram sozinhos'));
check('_petRegen implementa regeneração 15 HP/s', fighterSrc.includes('regen do pet (o pitoco cura 15 HP/s'));
check('_petRegen chamado no loop de atualização', fighterSrc.includes('this._petRegen();'));

// ---------- 9. Verificar room-core sincronizado ----------
console.online = false;
console.log('\n🌐 9. SERVIDOR ONLINE (room-core)...');
const clientRoom = fs.readFileSync('js/net/room-core.js', 'utf8');
const serverRoom = fs.readFileSync('online-server/room-core.js', 'utf8');
check('room-core.js cliente e servidor são idênticos', clientRoom === serverRoom);

// ---------- Resumo ----------
console.log('\n' + '='.repeat(50));
console.log(`📊 RESULTADO: ${passed} aprovados, ${failed} falhas`);
console.log('='.repeat('50'));
process.exit(failed > 0 ? 1 : 0);