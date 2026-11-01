/* ============================================================
   DS FIGHTERS — Conta Google e sincronização Cloud Firestore.
   Script clássico: o SDK Firebase só é importado se houver configuração.
   ============================================================ */
(function (global) {
  'use strict';

  const FIREBASE_VERSION = '10.12.5';
  const FIREBASE_BASE = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
  const META_KEY = 'dsfighters.cloud.meta.v1';
  const CLOUD_SETTINGS = ['music', 'sfx', 'voice', 'mute', 'reducedMotion', 'shake', 'fpsCap', 'smooth', 'showFps', 'difficulty', 'netTransport'];
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
    _sessionId: 0,
    _dirty: false,
    _dirtyUid: '',

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
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      } catch (e) {
        return {};
      }
    },

    _touchLocal(uid) {
      const meta = this._readMeta();
      const now = Date.now();
      meta.updatedAt = now; // compatibilidade com instalações anteriores.
      if (uid) {
        if (!meta.accounts || typeof meta.accounts !== 'object' || Array.isArray(meta.accounts)) meta.accounts = {};
        meta.accounts[String(uid)] = { updatedAt: now };
      }
      try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* modo privado */ }
    },

    _localUpdatedAt(uid) {
      const meta = this._readMeta();
      if (uid && meta.accounts && Object.prototype.hasOwnProperty.call(meta.accounts, String(uid))) {
        const entry = meta.accounts[String(uid)];
        return Number(entry && typeof entry === 'object' ? entry.updatedAt : entry) || 0;
      }
      if (uid && meta.accounts) return 0;
      const value = Number(meta.updatedAt);
      return Number.isFinite(value) ? value : 0;
    },

    _isOnline() {
      return typeof navigator === 'undefined' || navigator.onLine !== false;
    },

    _uid(user) {
      return user && typeof user.uid === 'string' && user.uid ? user.uid : '';
    },

    _isCurrent(sessionId, user, uid) {
      return sessionId === this._sessionId && this.user === user && this._uid(this.user) === uid;
    },

    _bindLifecycle() {
      if (this._lifecycleBound) return;
      this._lifecycleBound = true;
      const flush = () => { if (this.user) void this.flush(); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
      global.addEventListener('pagehide', flush);
      global.addEventListener('online', flush);
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
      const incoming = nextUser || null;
      const previous = this.user;
      const previousUid = this._uid(previous);
      const incomingUid = this._uid(incoming);
      if (previousUid === incomingUid && (!!previous === !!incoming)) {
        if (!incoming && this._ready && this.status !== 'error') this._setStatus('ready');
        return false;
      }

      this._sessionId += 1;
      const sessionId = this._sessionId;
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      // A promessa antiga continua podendo terminar no SDK, mas nunca bloqueia
      // a fila da nova conta nem pode atualizar seu estado.
      this._uploadPromise = null;
      this._dirty = false;
      this._dirtyUid = '';
      this.user = incoming;

      if (!incoming) {
        const profile = typeof Profile !== 'undefined' ? Profile : null;
        if (profile && typeof profile.deactivateAccount === 'function') profile.deactivateAccount(previousUid);
        if (this._ready && this.status !== 'error') this._setStatus('ready');
        return true;
      }

      const profile = typeof Profile !== 'undefined' ? Profile : null;
      if (profile && typeof profile.activateAccount === 'function') profile.activateAccount(incomingUid);
      this._setStatus('syncing');
      await this.sync(sessionId, incoming);
      return true;
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
        if (!this.isConfigured()) this._setStatus('unconfigured', 'Login com Google não configurado.');
        else if (this.status !== 'error') this._setStatus('error', 'Não foi possível carregar o Firebase. O jogo continua funcionando offline.');
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
      const currentUid = this._uid(this.user);
      if (currentUid) this._setStatus('signing-out');
      if (currentUid && (this._uploadPromise || this._saveTimer || this._dirty)) await this.flush();
      if (!this._auth || !this._deps) {
        const profile = typeof Profile !== 'undefined' ? Profile : null;
        if (profile && typeof profile.deactivateAccount === 'function') profile.deactivateAccount(currentUid || profile.accountUid);
        this.user = null;
        this._sessionId += 1;
        clearTimeout(this._saveTimer);
        this._saveTimer = null;
        this._uploadPromise = null;
        this._dirty = false;
        this._dirtyUid = '';
        this._setStatus(this.isConfigured() ? 'ready' : 'unconfigured');
        return true;
      }
      try {
        await this._deps.authFns.signOut(this._auth);
        // O mock e alguns ambientes podem atrasar o callback do Auth; não deixe
        // o perfil antigo nem a fila visíveis nesse intervalo.
        if (this._uid(this.user) === currentUid) await this._handleUser(null);
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
      const rawSettings = source.settings && typeof source.settings === 'object' && !Array.isArray(source.settings) ? source.settings : {};
      const settings = {};
      CLOUD_SETTINGS.forEach((key) => {
        const value = rawSettings[key];
        if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value.length <= 256)) settings[key] = value;
      });
      const stats = source.stats && typeof source.stats === 'object' ? source.stats : {};
      const unlocked = Array.isArray(source.unlocked) ? source.unlocked.filter((id) => typeof id === 'string' && id.length > 0).slice(0, 64) : [];
      const pets = Array.isArray(source.pets) ? source.pets.filter((id) => typeof id === 'string' && id.length > 0).slice(0, 2) : ['tux', 'none'];
      while (pets.length < 2) pets.push('none');
      return {
        unlocked: [...new Set(unlocked)].slice(0, 64),
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

    _payload(user) {
      const profile = this._profileForCloud();
      const identity = user || this.user;
      const displayName = identity && identity.displayName ? identity.displayName : profile.name;
      return {
        profile,
        updatedAt: this._deps.firestoreFns.serverTimestamp(),
        name: profile.name || String(displayName || 'Jogador').slice(0, 64),
        photo: identity && identity.photoURL ? String(identity.photoURL).slice(0, 2048) : '',
      };
    },

    async _upload() {
      const user = this.user;
      const uid = this._uid(user);
      const sessionId = this._sessionId;
      if (!user || !uid || !this._db || !this._deps) return false;
      if (!this._isOnline()) {
        if (this._isCurrent(sessionId, user, uid)) this._setStatus('offline', 'Sem conexão. O progresso ficará salvo neste navegador.');
        return false;
      }
      if (this._uploadPromise && this._uploadPromise.sessionId === sessionId) return this._uploadPromise.promise;
      let task;
      task = (async () => {
        try {
          const ref = this._deps.firestoreFns.doc(this._db, 'players', uid);
          const payload = this._payload(user);
          if (this._isCurrent(sessionId, user, uid)) this._setStatus('syncing');
          await this._deps.firestoreFns.setDoc(ref, payload);
          if (!this._isCurrent(sessionId, user, uid)) return false;
          this._touchLocal(uid);
          this._dirty = false;
          this._dirtyUid = '';
          this._setStatus('saved');
          return true;
        } catch (error) {
          if (!this._isCurrent(sessionId, user, uid)) return false;
          const msg = this._friendlyError(error, 'salvar o progresso');
          this._setStatus(this._isOnline() ? 'error' : 'offline', msg);
          return false;
        } finally {
          if (this._uploadPromise && this._uploadPromise.promise === task) this._uploadPromise = null;
        }
      })();
      this._uploadPromise = { sessionId, promise: task };
      return task;
    },

    async sync(sessionId, user) {
      const expectedUser = user || this.user;
      const uid = this._uid(expectedUser);
      const expectedSession = sessionId == null ? this._sessionId : sessionId;
      if (!expectedUser || !uid || !this._db || !this._deps || !this._isCurrent(expectedSession, expectedUser, uid)) return false;
      if (!this._isOnline()) {
        this._setStatus('offline', 'Sem conexão. O jogo continua funcionando offline.');
        return false;
      }
      try {
        this._setStatus('syncing');
        const ref = this._deps.firestoreFns.doc(this._db, 'players', uid);
        const snapshot = await this._deps.firestoreFns.getDoc(ref);
        if (!this._isCurrent(expectedSession, expectedUser, uid)) return false;
        const remote = snapshot && typeof snapshot.exists === 'function' && snapshot.exists() ? snapshot.data() : null;
        const profile = typeof Profile !== 'undefined' ? Profile : null;
        if (profile && typeof profile.applyCloud === 'function') {
          this._suppressQueue = true;
          try {
            profile.applyCloud(remote);
            if (typeof profile.save === 'function') profile.save();
          } finally { this._suppressQueue = false; }
        }
        if (!this._isCurrent(expectedSession, expectedUser, uid)) return false;
        await this._deps.firestoreFns.setDoc(ref, this._payload(expectedUser));
        if (!this._isCurrent(expectedSession, expectedUser, uid)) return false;
        this._touchLocal(uid);
        this._dirty = false;
        this._dirtyUid = '';
        this._setStatus('saved');
        return true;
      } catch (error) {
        if (!this._isCurrent(expectedSession, expectedUser, uid)) return false;
        const msg = this._friendlyError(error, 'sincronizar o progresso');
        this._setStatus(this._isOnline() ? 'error' : 'offline', msg);
        return false;
      }
    },

    queueSave() {
      if (this._suppressQueue) return;
      const uid = this._uid(this.user);
      this._touchLocal(uid);
      if (!this.user || !this._db || !this._deps) return;
      this._dirty = true;
      this._dirtyUid = uid;
      clearTimeout(this._saveTimer);
      const sessionId = this._sessionId;
      this._saveTimer = setTimeout(() => {
        this._saveTimer = null;
        if (this._sessionId === sessionId && this._uid(this.user) === uid) void this._upload();
      }, 2000);
    },

    async flush() {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
      if (!this.user) return false;
      return this._upload();
    },
  };

  global.Cloud = Cloud;
})(window);
