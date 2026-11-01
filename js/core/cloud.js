/* ============================================================
   DS FIGHTERS — Conta Google e sincronização Cloud Firestore.
   Script clássico: o SDK Firebase só é importado se houver configuração.
   ============================================================ */
(function (global) {
  'use strict';

  const FIREBASE_VERSION = '10.12.5';
  const FIREBASE_BASE = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
  const META_KEY = 'dsfighters.cloud.meta.v1';
  const URLS = {
    app: FIREBASE_BASE + 'firebase-app.js',
    auth: FIREBASE_BASE + 'firebase-auth.js',
    firestore: FIREBASE_BASE + 'firebase-firestore.js',
  };

  const Cloud = {
    user: null,
    status: 'uninitialized',
    error: '',
    _listeners: [],
    _initPromise: null,
    _ready: false,
    _db: null,
    _auth: null,
    _deps: null,
    _saveTimer: null,
    _uploadPromise: null,
    _suppressQueue: false,
    _lifecycleBound: false,

    isConfigured() {
      const c = global.DS_FIREBASE_CONFIG;
      return !!c && typeof c === 'object' &&
        ['apiKey', 'authDomain', 'projectId', 'appId'].every((key) => typeof c[key] === 'string' && c[key].trim());
    },

    onChange(fn) {
      if (typeof fn !== 'function') return () => {};
      this._listeners.push(fn);
      try { fn(this); } catch (e) { /* a UI listener nunca pode travar o jogo */ }
      return () => { this._listeners = this._listeners.filter((item) => item !== fn); };
    },

    _emit() {
      this._listeners.slice().forEach((fn) => {
        try { fn(this); } catch (e) { /* isolamento entre listeners */ }
      });
    },

    _setStatus(status, error) {
      this.status = status;
      this.error = error || '';
      this._emit();
    },

    _readMeta() {
      try {
        const value = JSON.parse(localStorage.getItem(META_KEY) || 'null');
        return value && typeof value === 'object' ? value : {};
      } catch (e) {
        return {};
      }
    },

    _touchLocal() {
      const meta = this._readMeta();
      meta.updatedAt = Date.now();
      try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* modo privado */ }
    },

    _localUpdatedAt() {
      const value = Number(this._readMeta().updatedAt);
      return Number.isFinite(value) ? value : 0;
    },

    _isOnline() {
      return typeof navigator === 'undefined' || navigator.onLine !== false;
    },

    _bindLifecycle() {
      if (this._lifecycleBound) return;
      this._lifecycleBound = true;
      const flush = () => { if (this.user) void this.flush(); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
      global.addEventListener('pagehide', flush);
    },

    async init() {
      if (this._initPromise) return this._initPromise;
      if (!this.isConfigured()) {
        this._setStatus('unconfigured', 'Login com Google não configurado.');
        return false;
      }

      this._setStatus('loading');
      this._initPromise = (async () => {
        try {
          // Importação dinâmica deliberada: sem configuração, nenhuma chamada ao CDN acontece.
          const modules = await Promise.all([
            import(URLS.app),
            import(URLS.auth),
            import(URLS.firestore),
          ]);
          const appFns = modules[0];
          const authFns = modules[1];
          const firestoreFns = modules[2];
          const app = appFns.initializeApp(global.DS_FIREBASE_CONFIG);
          const auth = authFns.getAuth(app);
          this._deps = { appFns, authFns, firestoreFns, app };
          this._auth = auth;
          this._db = firestoreFns.getFirestore(app);
          this._ready = true;
          this._bindLifecycle();

          authFns.onAuthStateChanged(auth, (nextUser) => { void this._handleUser(nextUser); });
          try {
            await authFns.getRedirectResult(auth);
          } catch (error) {
            this._setStatus('error', this._friendlyError(error, 'o retorno do login'));
          }
          if (!this.user && this.status === 'loading') this._setStatus('ready');
          return true;
        } catch (error) {
          this._setStatus('error', this._friendlyError(error, 'carregar o Firebase'));
          return false;
        }
      })();
      return this._initPromise;
    },

    async _handleUser(nextUser) {
      this.user = nextUser || null;
      if (!this.user) {
        if (this._ready && this.status !== 'error') this._setStatus('ready');
        return;
      }
      this._setStatus('syncing');
      await this.sync();
    },

    _friendlyError(error, action) {
      const code = error && error.code ? String(error.code) : '';
      if (code === 'auth/popup-closed-by-user') return 'Login cancelado.';
      if (code === 'auth/unauthorized-domain') return 'Este domínio não está autorizado no Firebase. Adicione-o em Authorized domains.';
      if (code === 'auth/network-request-failed' || code === 'unavailable' || code === 'failed-precondition') return 'Sem conexão com a nuvem. O jogo continua salvo neste navegador.';
      if (code === 'permission-denied') return 'O Firestore recusou o acesso. Confira as regras e o usuário do Firebase.';
      if (code === 'auth/invalid-api-key' || code === 'auth/invalid-credential') return 'A configuração do Firebase está inválida. Confira js/config/firebase-config.js.';
      return 'Não foi possível ' + action + '. O jogo continua funcionando offline.';
    },

    _shouldRedirect(error) {
      const code = error && error.code ? String(error.code) : '';
      return code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/web-storage-unsupported';
    },

    _isMobile() {
      return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
    },

    async signIn() {
      await this.init();
      if (!this._auth || !this._deps) {
        this._setStatus('unconfigured', 'Login com Google não configurado.');
        return false;
      }
      this.error = '';
      this._setStatus('signing');
      const provider = new this._deps.authFns.GoogleAuthProvider();
      try {
        if (this._isMobile()) {
          await this._deps.authFns.signInWithRedirect(this._auth, provider);
          return true;
        }
        await this._deps.authFns.signInWithPopup(this._auth, provider);
        return true;
      } catch (error) {
        if (this._shouldRedirect(error)) {
          try {
            await this._deps.authFns.signInWithRedirect(this._auth, provider);
            return true;
          } catch (redirectError) {
            this._setStatus('error', this._friendlyError(redirectError, 'iniciar o login por redirecionamento'));
            return false;
          }
        }
        this._setStatus('error', this._friendlyError(error, 'entrar com Google'));
        return false;
      }
    },

    async signOut() {
      if (!this._auth || !this._deps) {
        this.user = null;
        this._setStatus(this.isConfigured() ? 'ready' : 'unconfigured');
        return true;
      }
      try {
        await this._deps.authFns.signOut(this._auth);
        this.user = null;
        this._setStatus('ready');
        return true;
      } catch (error) {
        this._setStatus('error', this._friendlyError(error, 'sair da conta'));
        return false;
      }
    },

    _number(value, fallback) {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    },

    _profileForCloud() {
      const profile = typeof Profile !== 'undefined' ? Profile : null;
      const source = (profile && profile.data) || {};
      const settings = Object.assign({}, source.settings || {});
      // Estas opções dependem deste dispositivo e nunca saem do navegador.
      delete settings.serverUrl;
      delete settings.touch;
      const stats = source.stats || {};
      const unlocked = Array.isArray(source.unlocked) ? source.unlocked.filter((id) => typeof id === 'string').slice(0, 64) : [];
      const pets = Array.isArray(source.pets) ? source.pets.filter((id) => typeof id === 'string').slice(0, 2) : ['tux', 'none'];
      while (pets.length < 2) pets.push('none');
      return {
        unlocked: [...new Set(unlocked)],
        pets,
        name: String(source.name || 'Jogador').slice(0, 64),
        settings,
        stats: {
          fights: Math.max(0, this._number(stats.fights, 0)),
          wins: Math.max(0, this._number(stats.wins, 0)),
          bestArcade: Math.max(0, this._number(stats.bestArcade, 0)),
          maxCombo: Math.max(0, this._number(stats.maxCombo, 0)),
        },
      };
    },

    _payload() {
      const profile = this._profileForCloud();
      const displayName = this.user && this.user.displayName ? this.user.displayName : profile.name;
      return {
        profile,
        updatedAt: this._deps.firestoreFns.serverTimestamp(),
        name: profile.name || String(displayName || 'Jogador').slice(0, 64),
        photo: this.user && this.user.photoURL ? String(this.user.photoURL).slice(0, 2048) : '',
      };
    },

    async _upload() {
      if (!this.user || !this._db || !this._deps) return false;
      if (!this._isOnline()) {
        this._setStatus('offline', 'Sem conexão. O progresso ficará salvo neste navegador.');
        return false;
      }
      if (this._uploadPromise) return this._uploadPromise;
      this._uploadPromise = (async () => {
        try {
          this._setStatus('syncing');
          const ref = this._deps.firestoreFns.doc(this._db, 'players', this.user.uid);
          await this._deps.firestoreFns.setDoc(ref, this._payload());
          this._touchLocal();
          this._setStatus('saved');
          return true;
        } catch (error) {
          const msg = this._friendlyError(error, 'salvar o progresso');
          this._setStatus(this._isOnline() ? 'error' : 'offline', msg);
          return false;
        } finally {
          this._uploadPromise = null;
        }
      })();
      return this._uploadPromise;
    },

    async sync() {
      if (!this.user || !this._db || !this._deps) return false;
      if (!this._isOnline()) {
        this._setStatus('offline', 'Sem conexão. O jogo continua funcionando offline.');
        return false;
      }
      try {
        this._setStatus('syncing');
        const ref = this._deps.firestoreFns.doc(this._db, 'players', this.user.uid);
        const snapshot = await this._deps.firestoreFns.getDoc(ref);
        const remote = snapshot && typeof snapshot.exists === 'function' && snapshot.exists() ? snapshot.data() : null;
        const profile = typeof Profile !== 'undefined' ? Profile : null;
        if (profile && typeof profile.applyCloud === 'function') {
          this._suppressQueue = true;
          try {
            profile.applyCloud(remote);
            if (typeof profile.save === 'function') profile.save();
          } finally { this._suppressQueue = false; }
        }
        await this._deps.firestoreFns.setDoc(ref, this._payload());
        this._touchLocal();
        this._setStatus('saved');
        return true;
      } catch (error) {
        const msg = this._friendlyError(error, 'sincronizar o progresso');
        this._setStatus(this._isOnline() ? 'error' : 'offline', msg);
        return false;
      }
    },

    queueSave() {
      if (this._suppressQueue) return;
      this._touchLocal();
      if (!this.user || !this._db || !this._deps) return;
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => { this._saveTimer = null; void this._upload(); }, 2000);
    },

    async flush() {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      return this._upload();
    },
  };

  global.Cloud = Cloud;
})(window);
