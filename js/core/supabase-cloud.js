/* ============================================================
   DS FIGHTERS — Supabase Cloud provider override.
   Loaded after cloud.js. It is intentionally inert unless the
   authorized DS_SUPABASE_CONFIG is complete and points at the
   DS Fighters profile table.
   ============================================================ */
(function (global) {
  'use strict';

  const PROFILE_TABLE = 'ds_fighters_profiles';
  const DEFAULT_STORAGE_KEY = 'dsfighters.supabase.ownxbuailthavxgfxtem.auth.v1';
  const SETTINGS_KEYS = ['code', 'error', 'error_code', 'error_description', 'error_uri'];

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function readConfig() {
    const raw = global.DS_SUPABASE_CONFIG;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const url = text(raw.url);
    const publishableKey = text(raw.publishableKey);
    const table = text(raw.table);
    const storageKey = text(raw.storageKey);
    if (!/^https?:\/\//i.test(url) || !publishableKey || table !== PROFILE_TABLE || storageKey !== DEFAULT_STORAGE_KEY) return null;
    return { url: url.replace(/\/+$/, ''), publishableKey, table, storageKey };
  }

  const config = readConfig();
  if (!config || !global.Cloud) return;

  const Cloud = global.Cloud;
  const inheritedUid = typeof Cloud._uid === 'function' ? Cloud._uid : null;

  function projectRef() {
    const match = config.url.match(/^https?:\/\/([^./]+)\.supabase\.co(?:\/|$)/i);
    if (match) return match[1];
    try {
      const host = new (global.URL || URL)(config.url).hostname;
      return String(host || config.url).split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '-') || 'project';
    } catch (error) {
      return config.url.replace(/^https?:\/\//i, '').split(/[./]/)[0].replace(/[^a-zA-Z0-9_-]/g, '-') || 'project';
    }
  }

  function actualUid(user) {
    if (!user || typeof user !== 'object') return '';
    const uid = text(user.uid || user.id);
    return uid;
  }

  function normalizeUser(user) {
    const uid = actualUid(user);
    if (!uid) return null;
    const metadata = user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {};
    const displayName = text(user.displayName || metadata.full_name || metadata.name || metadata.user_name);
    const photoURL = text(user.photoURL || metadata.avatar_url || metadata.picture);
    return {
      uid,
      displayName: displayName || 'Jogador',
      photoURL,
    };
  }

  function sessionUser(session) {
    return session && typeof session === 'object' ? normalizeUser(session.user) : null;
  }

  function timestampMillis(value) {
    if (value && typeof value.toMillis === 'function') return Number(value.toMillis()) || 0;
    if (value && typeof value === 'object' && value.seconds != null) {
      const seconds = Number(value.seconds);
      const nanos = Number(value.nanoseconds || 0);
      return Number.isFinite(seconds) ? (seconds * 1000) + (nanos / 1000000) : 0;
    }
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && value.trim()) return numeric;
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  function errorWithStatus(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  function schedule(fn, delay) {
    return setTimeout(fn, delay == null ? 0 : delay);
  }

  Cloud.provider = 'supabase';
  Cloud.googleEnabled = null;
  Cloud._supabaseClient = null;
  Cloud._supabaseSubscription = null;
  Cloud._supabaseSettingsPromise = null;
  Cloud._saveRevision = 0;

  Cloud.isConfigured = function () {
    return !!readConfig();
  };

  Cloud._supabaseUid = function (user) {
    return actualUid(user);
  };

  Cloud._uid = function (user) {
    const uid = actualUid(user);
    return uid ? 'supabase:' + projectRef() + ':' + uid : '';
  };

  Cloud._friendlyError = function (error, action) {
    const code = error && error.code ? String(error.code).toLowerCase() : '';
    const status = Number(error && error.status) || 0;
    const message = String(error && (error.message || error.error_description || error.msg) || '').toLowerCase();
    if (code === 'providerdisabled' || code === 'provider_disabled' || message.includes('provider') && message.includes('not enabled')) {
      return 'O login com Google está desativado neste projeto Supabase. Ative o provedor Google no painel do projeto.';
    }
    if (code === 'invalid_credentials' || code === 'invalid_grant' || code === 'bad_jwt' || status === 401) {
      return 'A sessão do Supabase expirou ou é inválida. Tente entrar novamente.';
    }
    if (code === '42501' || code === 'pgrst301' || code === 'permission-denied' || status === 403 || message.includes('row-level security') || message.includes('rls')) {
      return 'O Supabase recusou o acesso ao perfil. Confira as políticas RLS da tabela ds_fighters_profiles.';
    }
    if (code === 'pgrst204' || status === 404 || message.includes('does not exist') || message.includes('schema cache')) {
      return 'O backend Supabase não encontrou a tabela de perfis autorizada. Confira a configuração do projeto.';
    }
    if (code === 'project_paused' || code === 'project_inactive' || status === 522 || message.includes('paused') || message.includes('inactive')) {
      return 'O projeto Supabase está inativo no momento. O jogo continua funcionando offline.';
    }
    if (code === 'network_error' || code === 'fetch_error' || code === 'failed_to_fetch' || status === 0 || message.includes('network') || message.includes('fetch')) {
      return 'Sem conexão com a nuvem. O jogo continua salvo neste navegador.';
    }
    return 'Não foi possível ' + (action || 'sincronizar o perfil') + '. O jogo continua funcionando offline.';
  };

  Cloud._settingsUrl = function () {
    return config.url + '/auth/v1/settings';
  };

  Cloud._readGoogleEnabled = function (settings) {
    const root = settings && typeof settings === 'object' ? settings : {};
    const external = root.external && typeof root.external === 'object' ? root.external : {};
    const providers = external.providers && typeof external.providers === 'object' ? external.providers :
      (root.providers && typeof root.providers === 'object' ? root.providers : {});
    const candidates = [providers.google, external.google, root.google];
    for (const value of candidates) if (typeof value === 'boolean') return value;
    return null;
  };

  Cloud._checkGoogleSettings = async function () {
    if (typeof this.googleEnabled === 'boolean') return this.googleEnabled;
    if (this._supabaseSettingsPromise) return this._supabaseSettingsPromise;
    const fetchFn = typeof global.fetch === 'function' ? global.fetch.bind(global) :
      (typeof fetch === 'function' ? fetch : null);
    if (!fetchFn) {
      this.googleEnabled = null;
      return null;
    }
    const task = (async () => {
      try {
        const response = await fetchFn(this._settingsUrl(), {
          method: 'GET',
          headers: { apikey: config.publishableKey },
        });
        if (!response || response.ok === false) throw errorWithStatus('settings request failed', response && response.status);
        const body = await response.json();
        this.googleEnabled = this._readGoogleEnabled(body);
        this._emit();
        return this.googleEnabled;
      } catch (error) {
        // A settings probe is advisory: it must not disable offline play or
        // make init permanently fail. Keeping null allows a later retry.
        this.googleEnabled = null;
        return null;
      } finally {
        this._supabaseSettingsPromise = null;
      }
    })();
    this._supabaseSettingsPromise = task;
    return task;
  };

  Cloud._stripOAuthParams = function () {
    const location = global.location;
    const history = global.history;
    if (!location || !history || typeof history.replaceState !== 'function') return;
    const search = String(location.search || '');
    if (!search) return;
    let nextSearch = search;
    const Params = global.URLSearchParams || (typeof URLSearchParams !== 'undefined' ? URLSearchParams : null);
    if (Params) {
      const params = new Params(search);
      let changed = false;
      SETTINGS_KEYS.forEach((key) => {
        if (params.has(key)) {
          params.delete(key);
          changed = true;
        }
      });
      if (!changed) return;
      const encoded = params.toString();
      nextSearch = encoded ? '?' + encoded : '';
    } else {
      const pieces = search.replace(/^\?/, '').split('&').filter((part) => {
        const key = decodeURIComponent(String(part).split('=')[0] || '').toLowerCase();
        return !SETTINGS_KEYS.includes(key);
      });
      if (pieces.length === search.replace(/^\?/, '').split('&').length) return;
      nextSearch = pieces.length ? '?' + pieces.join('&') : '';
    }
    history.replaceState(history.state || null, '', String(location.pathname || '/') + nextSearch + String(location.hash || ''));
  };

  Cloud._cleanupSupabase = function () {
    try {
      if (this._supabaseSubscription && typeof this._supabaseSubscription.unsubscribe === 'function') this._supabaseSubscription.unsubscribe();
    } catch (error) { /* limpeza best-effort */ }
    this._supabaseSubscription = null;
    this._supabaseClient = null;
    this._auth = null;
    this._db = null;
    this._deps = null;
    this._ready = false;
  };

  Cloud.init = async function () {
    if (this._initPromise) return this._initPromise;
    const currentConfig = readConfig();
    if (!currentConfig) {
      this._setStatus('unconfigured', 'Login com Google não configurado.');
      return false;
    }
    this._setStatus('loading');
    const task = (async () => {
      try {
        const sdk = global.supabase;
        if (!sdk || typeof sdk.createClient !== 'function') throw new Error('Supabase SDK indisponível');
        const client = sdk.createClient(currentConfig.url, currentConfig.publishableKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            flowType: 'pkce',
            detectSessionInUrl: true,
            storageKey: currentConfig.storageKey,
          },
        });
        if (!client || !client.auth) throw new Error('Supabase Auth indisponível');
        this._supabaseClient = client;
        this._auth = client.auth;
        this._db = client;
        this._deps = { supabase: true, client };
        this._ready = true;
        this._bindLifecycle();

        if (typeof this._auth.onAuthStateChange === 'function') {
          const subscriptionResult = this._auth.onAuthStateChange((event, session) => {
            // Supabase warns against awaiting another Auth request from this
            // callback. Defer the lifecycle work until the callback returns.
            schedule(() => { void this._handleUser(sessionUser(session)); }, 0);
          });
          this._supabaseSubscription = subscriptionResult && subscriptionResult.data && subscriptionResult.data.subscription ?
            subscriptionResult.data.subscription : subscriptionResult;
        }

        if (typeof this._auth.getSession === 'function') {
          const result = await this._auth.getSession();
          if (result && result.error) throw result.error;
          const session = result && result.data ? result.data.session : (result && result.session ? result.session : null);
          const seededUser = sessionUser(session);
          if (seededUser) await this._handleUser(seededUser);
        }
        await this._checkGoogleSettings();
        this._stripOAuthParams();
        if (!this.user && this.status === 'loading') this._setStatus('ready');
        return true;
      } catch (error) {
        this._cleanupSupabase();
        this._setStatus('error', this._friendlyError(error, 'carregar o Supabase'));
        return false;
      }
    })();
    this._initPromise = task;
    const result = await task;
    if (!result && this._initPromise === task) this._initPromise = null;
    return result;
  };

  Cloud.signIn = async function () {
    const initialized = await this.init();
    if (!initialized || !this._auth || !this._supabaseClient) {
      if (this.status !== 'error') this._setStatus('error', this._friendlyError(null, 'carregar o Supabase'));
      return false;
    }
    const googleEnabled = await this._checkGoogleSettings();
    if (googleEnabled === false) {
      this._setStatus('error', this._friendlyError({ code: 'providerdisabled' }, 'entrar com Google'));
      return false;
    }
    const profile = typeof Profile !== 'undefined' ? Profile : null;
    if (profile && typeof profile.save === 'function') profile.save();
    this.error = '';
    this._setStatus('signing');
    try {
      const location = global.location || {};
      const redirectTo = String(location.origin || '') + String(location.pathname || '/');
      const result = await this._auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (result && result.error) throw result.error;
      return true;
    } catch (error) {
      this._setStatus('error', this._friendlyError(error, 'entrar com Google'));
      return false;
    }
  };

  Cloud._payload = function (user) {
    const identity = user || this.user;
    const profile = this._profileForCloud();
    return {
      user_id: actualUid(identity),
      profile,
      name: profile.name || String(identity && identity.displayName || 'Jogador').slice(0, 64),
      photo: identity && identity.photoURL ? String(identity.photoURL).slice(0, 2048) : '',
      updated_at: new Date().toISOString(),
    };
  };

  Cloud._scheduleUpload = function (sessionId, uid, delay) {
    clearTimeout(this._saveTimer);
    this._saveTimer = schedule(() => {
      this._saveTimer = null;
      if (this._sessionId === sessionId && this._uid(this.user) === uid) void this._upload();
    }, delay == null ? 2000 : delay);
  };

  Cloud._upload = async function () {
    const user = this.user;
    const uid = this._uid(user);
    const remoteUid = actualUid(user);
    const sessionId = this._sessionId;
    const revision = this._saveRevision;
    if (!user || !uid || !remoteUid || !this._supabaseClient || !this._ready) return false;
    if (!this._isOnline()) {
      if (this._isCurrent(sessionId, user, uid)) this._setStatus('offline', 'Sem conexão. O progresso ficará salvo neste navegador.');
      return false;
    }
    if (this._uploadPromise && this._uploadPromise.sessionId === sessionId) return this._uploadPromise.promise;
    let task;
    task = (async () => {
      try {
        const payload = this._payload(user);
        if (this._isCurrent(sessionId, user, uid)) this._setStatus('syncing');
        const result = await this._supabaseClient.from(config.table).upsert(payload, { onConflict: 'user_id' });
        if (result && result.error) throw result.error;
        if (!this._isCurrent(sessionId, user, uid)) return false;
        this._touchLocal(uid);
        if (this._saveRevision === revision) {
          this._dirty = false;
          this._dirtyUid = '';
          this._setStatus('saved');
        } else {
          // A Profile.save() happened while the request was in flight. Keep
          // the dirty bit and ensure a second upload cannot be lost.
          this._dirty = true;
          this._dirtyUid = uid;
          if (!this._saveTimer) this._scheduleUpload(sessionId, uid, 0);
        }
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
  };

  Cloud.sync = async function (sessionId, user) {
    const expectedUser = user || this.user;
    const uid = this._uid(expectedUser);
    const remoteUid = actualUid(expectedUser);
    const expectedSession = sessionId == null ? this._sessionId : sessionId;
    if (!expectedUser || !uid || !remoteUid || !this._supabaseClient || !this._ready || !this._isCurrent(expectedSession, expectedUser, uid)) return false;
    if (!this._isOnline()) {
      this._setStatus('offline', 'Sem conexão. O jogo continua funcionando offline.');
      return false;
    }
    try {
      this._setStatus('syncing');
      const query = this._supabaseClient.from(config.table)
        .select('profile,name,photo,updated_at')
        .eq('user_id', remoteUid)
        .limit(1);
      const result = await query.maybeSingle();
      if (result && result.error) throw result.error;
      if (!this._isCurrent(expectedSession, expectedUser, uid)) return false;
      const row = result && result.data ? result.data : null;
      const remote = row ? {
        profile: row.profile,
        name: row.name,
        photo: row.photo,
        updatedAt: timestampMillis(row.updated_at),
      } : null;
      const profile = typeof Profile !== 'undefined' ? Profile : null;
      if (profile && typeof profile.applyCloud === 'function') {
        this._suppressQueue = true;
        try {
          profile.applyCloud(remote);
          if (typeof profile.save === 'function') profile.save();
        } finally {
          this._suppressQueue = false;
        }
      }
      if (!this._isCurrent(expectedSession, expectedUser, uid)) return false;
      return this._upload();
    } catch (error) {
      if (!this._isCurrent(expectedSession, expectedUser, uid)) return false;
      const msg = this._friendlyError(error, 'sincronizar o progresso');
      this._setStatus(this._isOnline() ? 'error' : 'offline', msg);
      return false;
    }
  };

  Cloud.queueSave = function () {
    if (this._suppressQueue) return;
    const uid = this._uid(this.user);
    this._touchLocal(uid);
    if (!this.user || !this._supabaseClient || !this._ready) return;
    this._dirty = true;
    this._dirtyUid = uid;
    this._saveRevision += 1;
    this._scheduleUpload(this._sessionId, uid, 2000);
  };

  Cloud.flush = async function () {
    clearTimeout(this._saveTimer);
    this._saveTimer = null;
    if (!this.user) return false;
    let result = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const revision = this._saveRevision;
      result = await this._upload();
      if (!this.user || !this._dirty || this._saveRevision === revision) return result;
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    return result;
  };

  Cloud.signOut = async function () {
    const currentUid = this._uid(this.user);
    if (currentUid) this._setStatus('signing-out');
    if (currentUid && (this._uploadPromise || this._saveTimer || this._dirty)) await this.flush();
    if (!this._auth) {
      if (currentUid) await this._handleUser(null);
      else {
        this.user = null;
        this._sessionId += 1;
        this._dirty = false;
        this._dirtyUid = '';
      }
      if (this.isConfigured()) this._setStatus('ready');
      return true;
    }
    try {
      const result = await this._auth.signOut({ scope: 'local' });
      if (result && result.error) throw result.error;
      // Auth callbacks are deferred, so clear this game's local account now.
      if (this._uid(this.user) === currentUid) await this._handleUser(null);
      return true;
    } catch (error) {
      this._setStatus('error', this._friendlyError(error, 'sair da conta'));
      return false;
    }
  };
})(window);
