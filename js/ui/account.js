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
    _authMode: null,
    _authEmail: '',
    _authMessage: '',

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
      if (cloud.status === 'confirm-email') return 'Confirmação de email necessária';
      if (cloud.status === 'recovery-sent') return 'Confira seu email';
      if (cloud.passwordRecoveryPending) return 'Defina uma nova senha';
      if (cloud.status === 'signing-out') return 'Saindo…';
      if (cloud.status === 'loading' || cloud.status === 'signing') return 'Conectando…';
      return 'Não conectado';
    },

    _toast(text) {
      if (!text) return;
      const ui = typeof UI !== 'undefined' ? UI : null;
      if (ui && typeof ui.toast === 'function') ui.toast(text, 4200);
    },

    _busy(cloud) {
      return cloud.status === 'loading' || cloud.status === 'signing' || cloud.status === 'signing-out';
    },

    _emailAvailable(cloud) {
      return cloud.provider === 'supabase' && cloud.emailEnabled === true;
    },

    _signupAvailable(cloud) {
      return this._emailAvailable(cloud) && cloud.emailSignupEnabled !== false;
    },

    _captureAuthEmail() {
      if (!this.box) return;
      const field = this.box.querySelector('#account-email');
      if (field && typeof field.value === 'string') this._authEmail = field.value;
    },

    _clearAuthState() {
      this._authMode = null;
      this._authEmail = '';
      this._authMessage = '';
    },

    _focusEmail() {
      const field = this.box && this.box.querySelector('#account-email');
      if (field && typeof field.focus === 'function') {
        field.focus();
        if (typeof field.select === 'function') field.select();
      }
    },

    _openAuth(mode) {
      const cloud = global.Cloud;
      this._captureAuthEmail();
      this._authMode = mode;
      this._authMessage = '';
      if (cloud && cloud.error) cloud.error = '';
      this.render();
      this._focusEmail();
    },

    _closeAuth() {
      this._captureAuthEmail();
      this._authMode = null;
      this._authMessage = '';
      this.render();
    },

    _validationMessage(mode, email, password, confirmation) {
      if (mode === 'recovery') {
        if (!password) return 'Crie uma nova senha.';
        if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
        if (password !== confirmation) return 'As senhas não conferem.';
        return '';
      }
      if (!email) return 'Digite seu email.';
      if (!/^\S+@\S+\.\S+$/.test(email)) return 'Digite um email válido.';
      if (!password) return mode === 'signup' ? 'Crie uma senha.' : 'Digite sua senha.';
      if (mode === 'signup' && password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
      return '';
    },

    async _submitAuth(mode, email, password) {
      const cloud = global.Cloud;
      if (!cloud) return;
      const method = mode === 'signup' ? cloud.signUpWithEmail : cloud.signInWithEmail;
      if (typeof method !== 'function') {
        this._authMessage = 'O login por email não está disponível neste navegador.';
        this.render();
        return;
      }
      const ok = await method.call(cloud, email, password);
      // Auth methods normally emit their own status. This fallback keeps the
      // form feedback deterministic for small test doubles as well.
      if (!ok && this._authMode) this.render();
    },

    async _submitRecovery(password) {
      const cloud = global.Cloud;
      if (!cloud) return;
      const method = cloud.updatePassword;
      if (typeof method !== 'function') {
        this._authMessage = 'A recuperação de senha não está disponível neste navegador.';
        this.render();
        return;
      }
      const ok = await method.call(cloud, password);
      if (!ok && cloud.passwordRecoveryPending) this.render();
    },

    _renderRecoveryForm(cloud, status) {
      const busy = this._busy(cloud);
      const message = this._authMessage || cloud.error || '';
      const messageRole = message ? 'alert' : 'status';
      this._authMode = 'recovery';
      this.box.innerHTML = `
        <section class="account-card account-recovery-card" aria-labelledby="account-title">
          <h3 id="account-title">NOVA SENHA</h3>
          <p class="account-state" id="account-state">${this._escape(status)}</p>
          <form class="account-auth account-recovery-form" id="account-recovery-form" novalidate>
            <div class="account-auth-fields account-recovery-fields">
              <label class="account-label" for="account-new-password">Nova senha</label>
              <input class="account-input account-new-password" id="account-new-password" name="new-password" type="password" autocomplete="new-password" minlength="6" required aria-describedby="account-recovery-message" />
              <label class="account-label" for="account-new-password-confirm">Confirme a nova senha</label>
              <input class="account-input account-new-password-confirm" id="account-new-password-confirm" name="new-password-confirm" type="password" autocomplete="new-password" minlength="6" required aria-describedby="account-recovery-message" />
            </div>
            <p class="account-auth-message" id="account-recovery-message" role="${messageRole}" aria-live="polite">${this._escape(message)}</p>
            <button class="account-action account-auth-submit account-recovery-submit" id="account-recovery-submit" type="submit" ${busy ? 'disabled aria-disabled="true"' : ''}>${busy ? 'SALVANDO…' : 'ATUALIZAR SENHA'}</button>
          </form>
        </section>`;

      const form = this.box.querySelector('#account-recovery-form');
      if (form) form.addEventListener('submit', (event) => {
        event.preventDefault();
        const passwordField = form.querySelector('#account-new-password');
        const confirmationField = form.querySelector('#account-new-password-confirm');
        const password = String(passwordField && passwordField.value || '');
        const confirmation = String(confirmationField && confirmationField.value || '');
        const validation = this._validationMessage('recovery', '', password, confirmation);
        if (validation) {
          this._authMessage = validation;
          this.render();
          const nextField = validation === 'As senhas não conferem.' ? confirmationField : passwordField;
          if (nextField && typeof nextField.focus === 'function') nextField.focus();
          return;
        }
        this._authMessage = '';
        // Keep both passwords only in this active submit call. They are never
        // put in Account state, localStorage, markup, or a status callback.
        void this._submitRecovery(password);
      });
    },

    _renderEmailForm(cloud, status, signupAvailable) {
      const mode = this._authMode === 'signup' && signupAvailable ? 'signup' : 'signin';
      this._authMode = mode;
      const busy = this._busy(cloud);
      const message = this._authMessage || cloud.error || '';
      const messageRole = message ? 'alert' : 'status';
      const passwordAutocomplete = mode === 'signup' ? 'new-password' : 'current-password';
      const heading = mode === 'signup' ? 'CRIAR CONTA' : 'ENTRAR';
      const submitLabel = mode === 'signup' ? 'CRIAR CONTA' : 'ENTRAR';
      const switchLabel = mode === 'signup' ? 'JÁ TENHO CONTA' : (signupAvailable ? 'CRIAR CONTA' : '');
      this.box.innerHTML = `
        <section class="account-card account-email-card" aria-labelledby="account-title">
          <h3 id="account-title">${heading}</h3>
          <p class="account-state" id="account-state">${this._escape(status)}</p>
          <form class="account-auth" id="account-auth-form" novalidate>
            <div class="account-auth-fields">
              <label class="account-label" for="account-email">Email</label>
              <input class="account-input account-email" id="account-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false" required value="${this._escape(this._authEmail)}" aria-describedby="account-auth-message" />
              <label class="account-label" for="account-password">Senha</label>
              <input class="account-input account-password" id="account-password" name="password" type="password" autocomplete="${passwordAutocomplete}" minlength="6" required aria-describedby="account-auth-message" />
            </div>
            <p class="account-auth-message" id="account-auth-message" role="${messageRole}" aria-live="polite">${this._escape(message)}</p>
            <button class="account-action account-auth-submit" id="account-auth-submit" type="submit" ${busy ? 'disabled aria-disabled="true"' : ''}>${busy ? 'CONECTANDO…' : submitLabel}</button>
          </form>
          <div class="account-auth-actions" role="group" aria-label="Opções da conta">
            <button class="account-action account-auth-recovery" id="account-auth-recovery" type="button" ${busy ? 'disabled aria-disabled="true"' : ''}>ESQUECI A SENHA</button>
            ${switchLabel ? `<button class="account-action account-auth-switch" id="account-auth-switch" type="button" ${busy ? 'disabled aria-disabled="true"' : ''}>${switchLabel}</button>` : ''}
            <button class="account-action account-auth-cancel" id="account-auth-cancel" type="button" ${busy ? 'disabled aria-disabled="true"' : ''}>VOLTAR</button>
          </div>
        </section>`;

      const form = this.box.querySelector('#account-auth-form');
      if (form) form.addEventListener('submit', (event) => {
        event.preventDefault();
        const emailField = form.querySelector('#account-email');
        const passwordField = form.querySelector('#account-password');
        const email = String(emailField && emailField.value || '').trim().toLowerCase();
        const password = String(passwordField && passwordField.value || '');
        this._authEmail = email;
        const validation = this._validationMessage(mode, email, password);
        if (validation) {
          this._authMessage = validation;
          this.render();
          this._focusEmail();
          return;
        }
        this._authMessage = '';
        // Keep the password only in this active submit call. It is never put
        // in Account state, localStorage, markup, or a status callback.
        void this._submitAuth(mode, email, password);
      });

      const recovery = this.box.querySelector('#account-auth-recovery');
      if (recovery) recovery.addEventListener('click', () => {
        this._captureAuthEmail();
        const email = String(this._authEmail || '').trim().toLowerCase();
        const validation = this._validationMessage('signin', email, 'placeholder');
        if (validation && validation !== 'Digite sua senha.') {
          this._authMessage = validation;
          this.render();
          this._focusEmail();
          return;
        }
        this._authMode = 'signin';
        this._authMessage = '';
        this.render();
        const method = global.Cloud && global.Cloud.resetPasswordForEmail;
        if (typeof method === 'function') void method.call(global.Cloud, email);
      });

      const switchButton = this.box.querySelector('#account-auth-switch');
      if (switchButton) switchButton.addEventListener('click', () => {
        this._captureAuthEmail();
        this._authMode = mode === 'signup' ? 'signin' : 'signup';
        this._authMessage = '';
        this.render();
        this._focusEmail();
      });

      const cancel = this.box.querySelector('#account-auth-cancel');
      if (cancel) cancel.addEventListener('click', () => this._closeAuth());
    },

    _renderSignedOut(cloud, status, emailAvailable, signupAvailable) {
      const busy = this._busy(cloud);
      const googleDisabled = cloud.provider === 'supabase' && cloud.googleEnabled === false;
      const googleHelp = googleDisabled ?
        (emailAvailable ? 'Google está desativado. Use email e senha para sincronizar seu progresso.' : 'Supabase conectado. Falta ativar o provedor Google no painel do projeto.') :
        'Salve desbloqueios e estatísticas em qualquer dispositivo.';
      const emailHelp = emailAvailable ?
        (signupAvailable ? 'Entre ou crie uma conta com email e senha.' : 'O cadastro está desativado; contas existentes ainda podem entrar.') : '';
      this.box.innerHTML = `
        <section class="account-card" aria-labelledby="account-title">
          <h3 id="account-title">CONTA</h3>
          <p class="account-state" id="account-state">${this._escape(status)}</p>
          ${cloud.error ? `<p class="account-error" role="alert">${this._escape(cloud.error)}</p>` : `<p class="account-help">${this._escape(googleHelp)}</p>`}
          <button class="account-action account-signin" type="button" ${busy || googleDisabled ? 'disabled aria-disabled="true"' : ''}>${busy ? 'CONECTANDO…' : googleDisabled ? 'GOOGLE AGUARDANDO CONFIGURAÇÃO' : 'ENTRAR COM GOOGLE'}</button>
          ${emailAvailable ? `<div class="account-email-actions" role="group" aria-label="Acesso por email">
            <p class="account-help">${this._escape(emailHelp)}</p>
            <button class="account-action account-email-signin" id="account-email-signin" type="button" ${busy ? 'disabled aria-disabled="true"' : ''}>ENTRAR</button>
            ${signupAvailable ? '<button class="account-action account-email-signup" id="account-email-signup" type="button" ' + (busy ? 'disabled aria-disabled="true"' : '') + '>CRIAR CONTA</button>' : ''}
          </div>` : ''}
        </section>`;

      const googleButton = this.box.querySelector('.account-signin');
      if (googleButton) googleButton.addEventListener('click', () => { void global.Cloud.signIn(); });
      const emailSignin = this.box.querySelector('#account-email-signin');
      if (emailSignin) emailSignin.addEventListener('click', () => this._openAuth('signin'));
      const emailSignup = this.box.querySelector('#account-email-signup');
      if (emailSignup) emailSignup.addEventListener('click', () => this._openAuth('signup'));
    },

    _afterRender(cloud) {
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

    render() {
      if (!this.box || typeof global.Cloud === 'undefined') return;
      const cloud = global.Cloud;
      this._captureAuthEmail();
      if (!cloud.isConfigured()) {
        this._clearAuthState();
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
      const busy = this._busy(cloud);
      const status = this._statusText(cloud);
      if (cloud.passwordRecoveryPending) {
        this._renderRecoveryForm(cloud, status);
      } else if (user) {
        this._clearAuthState();
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
            ${cloud.error ? `<p class="account-error" role="alert">${this._escape(cloud.error)}</p>` : ''}
            <button class="account-action account-signout" type="button" ${busy ? 'disabled aria-disabled="true"' : ''}>${cloud.status === 'signing-out' ? 'SAINDO…' : 'SAIR'}</button>
          </section>`;
        const signout = this.box.querySelector('.account-signout');
        if (signout) signout.addEventListener('click', () => { void global.Cloud.signOut(); });
      } else if (this._authMode && this._emailAvailable(cloud)) {
        this._renderEmailForm(cloud, status, this._signupAvailable(cloud));
      } else {
        this._authMode = null;
        this._renderSignedOut(cloud, status, this._emailAvailable(cloud), this._signupAvailable(cloud));
      }
      this._afterRender(cloud);
    },
  };

  global.Account = Account;
  const start = () => setTimeout(() => Account.init(), 0);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})(window);
