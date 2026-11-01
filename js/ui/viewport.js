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
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', schedule);
      visualViewport.addEventListener('scroll', schedule);
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
    const cs = this.insets ? getComputedStyle(this.insets) : null;
    const inset = (key) => cs ? parseFloat(cs[key]) || 0 : 0;
    let left = inset('paddingLeft') + 8;
    let right = inset('paddingRight') + 8;
    let top = inset('paddingTop') + 8;
    let bottom = inset('paddingBottom') + 8;
    const touch = document.getElementById('touch-controls');
    const controls = touch && !touch.classList.contains('hidden');
    if (controls) {
      const dpad = touch.querySelector('.dpad');
      const actions = touch.querySelector('.tbtns');
      if (landscape) {
        left += (dpad ? dpad.offsetWidth : 136) + 16;
        right += (actions ? actions.offsetWidth : 140) + 16;
        top += 40;
      } else {
        top += 52;
        bottom += Math.max(dpad ? dpad.offsetHeight : 136, actions ? actions.offsetHeight : 140) + 20;
      }
    }
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
