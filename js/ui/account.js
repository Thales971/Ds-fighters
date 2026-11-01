/* ============================================================
   DS FIGHTERS — Cartão de conta no menu principal.
   ============================================================ */
(function (global) {
  'use strict';

  const Account = {
    box: null,
    _unsubscribe: null,
    _started: false,
    _lastError: '',

    init() {
      if (this._started) return;
      this._started = true;
      this.box = document.getElementById('account-box');
      if (!this.box || typeof global.Cloud === 'undefined') return;
      this._unsubscribe = global.Cloud.onChange(() => this.render());
      this.render();
      void global.Cloud.init();
    },

    _escape(value) {
      return String(value == null ? '' : value).replace(/[&<>'"]/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
      })[char]);
    },

    _statusText(cloud) {
      if (cloud.status === 'syncing') return 'Sincronizando…';
      if (cloud.status === 'saved') return 'Salvo na nuvem';
      if (cloud.status === 'offline') return 'Offline';
      if (cloud.status === 'error') return cloud.error || 'Não foi possível sincronizar.';
      if (cloud.status === 'signing-out') return 'Saindo…';
      if (cloud.status === 'loading' || cloud.status === 'signing') return 'Conectando…';
      return 'Não conectado';
    },

    _toast(text) {
      if (!text) return;
      const ui = typeof UI !== 'undefined' ? UI : null;
      if (ui && typeof ui.toast === 'function') ui.toast(text, 4200);
    },

    render() {
      if (!this.box || typeof global.Cloud === 'undefined') return;
      const cloud = global.Cloud;
      if (!cloud.isConfigured()) {
        this.box.innerHTML = `
          <section class="account-card account-disabled" aria-labelledby="account-title">
            <h3 id="account-title">CONTA</h3>
            <p class="account-state">LOGIN COM GOOGLE NÃO CONFIGURADO</p>
            <p class="account-help">O dono do jogo precisa configurar o Supabase ou Firebase para ativar a nuvem.</p>
            <button class="account-action" type="button" disabled aria-disabled="true">LOGIN COM GOOGLE NÃO CONFIGURADO</button>
          </section>`;
        return;
      }

      const user = cloud.user;
      const busy = cloud.status === 'loading' || cloud.status === 'signing' || cloud.status === 'signing-out';
      const status = this._statusText(cloud);
      if (user) {
        const profile = typeof Profile !== 'undefined' ? Profile : null;
        const name = this._escape(user.displayName || (profile && profile.data && profile.data.name) || 'Jogador');
        const photo = user.photoURL ? this._escape(user.photoURL) : '';
        this.box.innerHTML = `
          <section class="account-card account-signed" aria-labelledby="account-title">
            <div class="account-head">
              ${photo ? `<img class="account-avatar" src="${photo}" alt="Avatar de ${name}" />` : '<span class="account-avatar account-avatar-fallback" aria-hidden="true">★</span>'}
              <div><h3 id="account-title">${name}</h3><p class="account-state">${this._escape(status)}</p></div>
            </div>
            <p class="account-cloud-status" role="status" aria-live="polite">${this._escape(status)}</p>
            ${cloud.error ? `<p class="account-error">${this._escape(cloud.error)}</p>` : ''}
            <button class="account-action account-signout" type="button" ${busy ? 'disabled aria-disabled="true"' : ''}>${cloud.status === 'signing-out' ? 'SAINDO…' : 'SAIR'}</button>
          </section>`;
        this.box.querySelector('.account-signout').addEventListener('click', () => { void global.Cloud.signOut(); });
      } else {
        const googleDisabled = cloud.provider === 'supabase' && cloud.googleEnabled === false;
        const help = googleDisabled ? 'Supabase conectado. Falta ativar o provedor Google no painel do projeto.' : 'Salve desbloqueios e estatísticas em qualquer dispositivo.';
        this.box.innerHTML = `
          <section class="account-card" aria-labelledby="account-title">
            <h3 id="account-title">CONTA</h3>
            <p class="account-state">${this._escape(status)}</p>
            ${cloud.error ? `<p class="account-error">${this._escape(cloud.error)}</p>` : `<p class="account-help">${this._escape(help)}</p>`}
            <button class="account-action account-signin" type="button" ${busy || googleDisabled ? 'disabled aria-disabled="true"' : ''}>${busy ? 'CONECTANDO…' : googleDisabled ? 'GOOGLE AGUARDANDO CONFIGURAÇÃO' : 'ENTRAR COM GOOGLE'}</button>
          </section>`;
        const button = this.box.querySelector('.account-signin');
        if (button) button.addEventListener('click', () => { void global.Cloud.signIn(); });
      }

      const ui = typeof UI !== 'undefined' ? UI : null;
      const profile = typeof Profile !== 'undefined' ? Profile : null;
      if (ui && typeof ui.buildMenuSide === 'function' && profile) {
        try { ui.buildMenuSide(); } catch (e) { /* cartão não pode impedir o jogo */ }
      }
      if (cloud.error && cloud.error !== this._lastError) {
        this._lastError = cloud.error;
        this._toast(cloud.error);
      } else if (!cloud.error) {
        this._lastError = '';
      }
    },
  };

  global.Account = Account;
  const start = () => setTimeout(() => Account.init(), 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
