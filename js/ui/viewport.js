/* Mantém os menus em pixels da tela; somente game-view recebe escala 16:9. */
const AppViewport = {
  ready: false,
  _pending: false,
  init() {
    this.ready = true;
    const schedule = () => {
      if (this._pending) return;
      this._pending = true;
      requestAnimationFrame(() => {
        this._pending = false;
        if (typeof UI !== 'undefined') UI.updateTouch(); else this.fit();
        const focused = document.activeElement;
        if (document.body.classList.contains('mobile') && focused && /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)) focused.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', () => { Input.releaseAll(); schedule(); });
    /* entrar/sair de tela cheia nao dispara resize em todo navegador */
    document.addEventListener('fullscreenchange', schedule);
    document.addEventListener('webkitfullscreenchange', schedule);
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', schedule);
      visualViewport.addEventListener('scroll', schedule);
    }
    /* fallback: qualquer mudanca de tamanho do documento refaz o fit */
    if (typeof ResizeObserver !== 'undefined') {
      try { new ResizeObserver(schedule).observe(document.documentElement); } catch (e) {}
    }
    this.insets = document.createElement('div');
    this.insets.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
    document.body.appendChild(this.insets);
    this.fit();
  },
  fit() {
    const app = document.getElementById('app');
    if (!app) return;
    const vv = window.visualViewport;
    const width = Math.max(1, Math.min(vv ? vv.width : innerWidth, document.documentElement.clientWidth || innerWidth));
    const height = Math.max(1, vv ? vv.height : innerHeight);
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const mobile = width < 760 || ((coarse || navigator.maxTouchPoints > 0) && width < 1200);
    const landscape = width > height;
    document.body.classList.toggle('mobile', mobile);
    document.body.classList.toggle('landscape', landscape);
    app.style.setProperty('--viewport-width', width + 'px');
    app.style.setProperty('--viewport-height', height + 'px');
    app.style.setProperty('--viewport-left', (vv ? vv.offsetLeft : 0) + 'px');
    app.style.setProperty('--viewport-top', (vv ? vv.offsetTop : 0) + 'px');
    if (!mobile) {
      app.style.setProperty('--scale', Math.min(width / 960, height / 540).toFixed(5));
      return;
    }
    /* FUNDO VIVO no celular em pe: a luta de demonstracao cobre a tela toda
       atras do START e do menu (sem faixa preta em cima e embaixo). A escala
       "cover" corta as laterais; o main.js desliza o recorte atras da luta. */
    const coverScale = Math.max(width / 960, height / 540);
    this.cover = { scale: coverScale, width };
    app.style.setProperty('--cover-scale', coverScale.toFixed(6));
    app.style.setProperty('--cover-top', ((height - 540 * coverScale) / 2).toFixed(2) + 'px');
    const cs = this.insets ? getComputedStyle(this.insets) : null;
    const inset = (key) => cs ? parseFloat(cs[key]) || 0 : 0;
    let left = inset('paddingLeft') + 8;
    let right = inset('paddingRight') + 8;
    let top = inset('paddingTop') + 8;
    let bottom = inset('paddingBottom') + 8;
    const touch = document.getElementById('touch-controls');
    const controls = touch && !touch.classList.contains('hidden');
    let full = false;
    if (controls) {
      const dpad = touch.querySelector('.dpad');
      const stick = touch.querySelector('.stick');
      const mover = dpad && !dpad.hidden && dpad.offsetWidth ? dpad : stick;
      const actions = touch.querySelector('.tbtns');
      if (landscape) {
        /* ARENA CHEIA (nov/2026): antes reservava uma coluna fixa pra cada
           lado dos controles + faixa em cima e a luta ficava com ~1/3 da tela
           (430x242 num celular de 844x390). Agora a arena usa a ALTURA toda e
           os controles ficam por cima das bordas, semitransparentes, como nos
           jogos de luta de celular (~82% da tela). */
        full = true;
        left = inset('paddingLeft');
        right = inset('paddingRight');
        top = inset('paddingTop');
        bottom = inset('paddingBottom');
      } else {
        top += 52;
        bottom += Math.max(dpad ? dpad.offsetHeight : 136, actions ? actions.offsetHeight : 140) + 20;
      }
    }
    document.body.classList.toggle('arena-full', full);
    const availableWidth = Math.max(120, width - left - right);
    const availableHeight = Math.max(68, height - top - bottom);
    const scale = Math.min(availableWidth / 960, availableHeight / 540);
    app.style.setProperty('--arena-scale', scale.toFixed(6));
    app.style.setProperty('--arena-left', (left + (availableWidth - 960 * scale) / 2).toFixed(2) + 'px');
    app.style.setProperty('--arena-top', (top + (availableHeight - 540 * scale) / 2).toFixed(2) + 'px');
  },
  async fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) { if (typeof UI !== 'undefined') UI.toast('Se a tela cheia não estiver disponível, gire o celular para paisagem.'); }
  },
};
