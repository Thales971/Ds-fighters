import { newPage, connect } from './cdp.mjs';

const PORT = 8765;
const CDP = 9333;
try {
  const tab = await newPage(CDP, `http://127.0.0.1:${PORT}/index.html`);
  const page = await connect(tab.webSocketDebuggerUrl);
  await page.cmd('Page.enable');
  await page.cmd('Runtime.enable');
  const ok = await page.waitFor('window.DSGame && window.HUD && window.FIGHTERS', 45000);
  if (!ok) throw new Error('jogo não subiu');
  await page.evaluate(`(() => {
    const box = document.getElementById('loader');
    if (box) box.remove();
    const none = PETS.find((p) => p.id === 'none') || PETS[0];
    const g = window.DSGame;
    g.start({ mode: 'versus', teams: [['ponteiro'], ['larper']], stage: 'treino-dojo', cpu: [false, true], difficulty: 1, roundsToWin: 1, timer: 99, pets: [none, none] });
    for (let i = 0; i < 130; i++) g.tick();
    const me = g.teams[0].members[0];
    me.cd[0] = 150;
    me.spamShared = 90;
    me.cd[1] = 40;
    me.ultimate = 55;
    me.cd[4] = 120;
    HUD.reset(g);
    HUD.show();
    HUD.update(g);
    document.getElementById('stage-wrap').classList.add('on');
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('on'));
    const cool = document.querySelector('#skills-0 .skill .cool');
    return cool ? getComputedStyle(cool).height : 'sem barra';
  })()`);
  await page.screenshot('/opt/cursor/artifacts/cooldown-hud.png');
  console.log('shot ok', await page.evaluate(`document.querySelector('#skills-0 .skill .cool') && getComputedStyle(document.querySelector('#skills-0 .skill .cool')).height`));
  page.close();
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
