/* ============================================================
   DS FIGHTERS — Perfil local (localStorage).
   Desbloqueios por código, mascotes, opções de áudio/vídeo e estatísticas.
   ============================================================ */
const Profile = {
  KEY: 'dsfighters.profile.v2',
  ACCOUNT_KEY_PREFIX: 'dsfighters.profile.account.v1.',
  DEVICE_SETTINGS_KEY: 'dsfighters.profile.device-settings.v1',
  SKINS_ENABLED: false,
  SECRET_IDS: ['du', 'iales', 'felipinho', 'qwen'],
  data: null,
  accountUid: null,

  defaults() {
    return {
      unlocked: [],
      pets: ['tux', 'none'],
      skins: {},
      name: 'Jogador',
      settings: { music: 0.35, sfx: 0.8, voice: 0.9, mute: false, reducedMotion: null, shake: true, touch: 'auto', serverUrl: '' },
      stats: { fights: 0, wins: 0, bestArcade: 0, bestSurvival: 0, maxCombo: 0 },
    };
  },

  _read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  },

  _write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado */ }
  },

  _accountKey(uid) {
    return this.ACCOUNT_KEY_PREFIX + encodeURIComponent(String(uid));
  },

  _number(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  },

  _settings(raw, base) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    return Object.assign({}, base || this.defaults().settings, source);
  },

  _skins(raw, base) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const skins = Object.assign({}, base || {});
    Object.keys(source).forEach((fid) => {
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(fid)) return;
      const hue = Number(source[fid]);
      if (hue === -1 || (Number.isFinite(hue) && hue >= 0 && hue <= 360)) skins[fid] = Math.round(hue);
    });
    return skins;
  },

  _normalize(raw) {
    const base = this.defaults();
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const unlocked = [...new Set((Array.isArray(source.unlocked) ? source.unlocked : [])
      .filter((id) => typeof id === 'string' && id.length > 0))].slice(0, 64);
    const pets = (Array.isArray(source.pets) ? source.pets : [])
      .filter((id) => typeof id === 'string' && id.length > 0).slice(0, 2);
    while (pets.length < 2) pets.push(base.pets[pets.length] || 'none');
    const stats = source.stats && typeof source.stats === 'object' && !Array.isArray(source.stats) ? source.stats : {};
    const name = typeof source.name === 'string' && source.name.trim() ? source.name.slice(0, 64) : base.name;
    const normalizedStats = {
      fights: this._number(stats.fights, 0),
      wins: this._number(stats.wins, 0),
      bestArcade: this._number(stats.bestArcade, 0),
      maxCombo: this._number(stats.maxCombo, 0),
    };
    if (Object.prototype.hasOwnProperty.call(stats, 'bestSurvival')) {
      normalizedStats.bestSurvival = this._number(stats.bestSurvival, 0);
    }
    return Object.assign({}, source, {
      unlocked,
      pets,
      skins: this._skins(source.skins, base.skins),
      name,
      settings: this._settings(source.settings, base.settings),
      stats: normalizedStats,
    });
  },

  _deviceSettings() {
    const stored = this._read(this.DEVICE_SETTINGS_KEY);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) return stored;
    const current = this.data && this.data.settings;
    return this._settings(current, this.defaults().settings);
  },

  _applyDeviceSettings(data) {
    data.settings = this._settings(this._deviceSettings(), this.defaults().settings);
    return data;
  },

  _saveDeviceSettings() {
    if (this.data && this.data.settings) this._write(this.DEVICE_SETTINGS_KEY, this.data.settings);
  },

  load() {
    this.accountUid = null;
    this.data = this._normalize(this._read(this.KEY));
    if (!this._read(this.DEVICE_SETTINGS_KEY)) this._saveDeviceSettings();
    else this._applyDeviceSettings(this.data);
    return this.data;
  },

  activateAccount(uid) {
    const nextUid = String(uid || '').trim();
    if (!nextUid) return this.data || this.load();
    if (this.accountUid === nextUid) return this.data;

    if (this.accountUid) this._write(this._accountKey(this.accountUid), this._normalize(this.data));
    const stored = this._read(this._accountKey(nextUid));
    this.accountUid = nextUid;
    // Uma conta que ainda não tem snapshot pode adotar o perfil anônimo local.
    this.data = this._normalize(stored || this._read(this.KEY));
    this._applyDeviceSettings(this.data);
    return this.data;
  },

  deactivateAccount(uid) {
    if (!this.accountUid) return this.data || this.load();
    if (uid && String(uid) !== this.accountUid) return this.data;
    this._write(this._accountKey(this.accountUid), this._normalize(this.data));
    this.accountUid = null;
    this.data = this._normalize(this._read(this.KEY));
    this._applyDeviceSettings(this.data);
    return this.data;
  },

  save() {
    this.data = this._normalize(this.data);
    this._saveDeviceSettings();
    if (this.accountUid) this._write(this._accountKey(this.accountUid), this.data);
    else this._write(this.KEY, this.data);
    if (typeof Cloud !== 'undefined' && Cloud && typeof Cloud.queueSave === 'function') Cloud.queueSave();
  },

  _localCloudUpdatedAt() {
    try {
      const meta = JSON.parse(localStorage.getItem('dsfighters.cloud.meta.v1') || 'null') || {};
      if (this.accountUid && meta.accounts && Object.prototype.hasOwnProperty.call(meta.accounts, this.accountUid)) {
        const entry = meta.accounts[this.accountUid];
        return Number(entry && typeof entry === 'object' ? entry.updatedAt : entry) || 0;
      }
      // Quando já existem metadados por conta, a ausência desta conta significa
      // que ela nunca sincronizou; não reutilize o relógio de outra conta.
      if (this.accountUid && meta.accounts) return 0;
      return Number(meta.updatedAt) || 0;
    } catch (e) {
      return 0;
    }
  },

  applyCloud(remoteData) {
    const remote = remoteData && remoteData.profile ? remoteData.profile : remoteData;
    if (!remote || typeof remote !== 'object' || Array.isArray(remote)) return this.data;
    const local = this._normalize(this.data || this.load());
    const unique = (list) => [...new Set((Array.isArray(list) ? list : [])
      .filter((id) => typeof id === 'string' && id.length > 0))].slice(0, 64);
    const stamp = remoteData && remoteData.updatedAt;
    const remoteTime = stamp && typeof stamp.toMillis === 'function' ? stamp.toMillis() :
      stamp && stamp.seconds != null ? Number(stamp.seconds) * 1000 : Number(stamp) || 0;
    const localTime = this._localCloudUpdatedAt();
    const remoteIsNewer = remoteTime > localTime || (remoteTime === 0 && localTime === 0);
    const localPets = (Array.isArray(local.pets) ? local.pets : []).filter((id) => typeof id === 'string').slice(0, 2);
    while (localPets.length < 2) localPets.push('none');
    const remotePets = (Array.isArray(remote.pets) ? remote.pets : [])
      .filter((id) => typeof id === 'string' && id.length > 0).slice(0, 2);
    const remoteHasPets = remotePets.length > 0;
    while (remotePets.length > 0 && remotePets.length < 2) remotePets.push('none');
    const ls = local.stats || {};
    const rs = remote.stats && typeof remote.stats === 'object' && !Array.isArray(remote.stats) ? remote.stats : {};
    const localSkins = this._skins(local.skins);
    const remoteSkins = this._skins(remote.skins);
    const mergedStats = {
      fights: Math.max(this._number(ls.fights, 0), this._number(rs.fights, 0)),
      wins: Math.max(this._number(ls.wins, 0), this._number(rs.wins, 0)),
      bestArcade: Math.max(this._number(ls.bestArcade, 0), this._number(rs.bestArcade, 0)),
      maxCombo: Math.max(this._number(ls.maxCombo, 0), this._number(rs.maxCombo, 0)),
    };
    if (Object.prototype.hasOwnProperty.call(ls, 'bestSurvival') || Object.prototype.hasOwnProperty.call(rs, 'bestSurvival')) {
      mergedStats.bestSurvival = Math.max(this._number(ls.bestSurvival, 0), this._number(rs.bestSurvival, 0));
    }
    const remoteName = typeof remote.name === 'string' && remote.name.trim() ? remote.name :
      (remoteData && typeof remoteData.name === 'string' && remoteData.name.trim() ? remoteData.name : '');
    this.data = this._normalize(Object.assign({}, local, {
      unlocked: unique([...(Array.isArray(local.unlocked) ? local.unlocked : []), ...unique(remote.unlocked)]),
      pets: remoteIsNewer && remoteHasPets ? remotePets : localPets,
      skins: Object.assign({}, localSkins, remoteIsNewer ? remoteSkins : {}),
      name: remoteIsNewer && remoteName ? remoteName.slice(0, 64) : local.name,
      // Configurações de dispositivo permanecem sempre locais.
      settings: Object.assign({}, local.settings || {}),
      stats: mergedStats,
    }));
    this._applyDeviceSettings(this.data);
    return this.data;
  },

  isUnlocked(id) {
    return !this.SECRET_IDS.includes(id) || (this.data && Array.isArray(this.data.unlocked) && this.data.unlocked.includes(id));
  },

  /* Retorna { ok, msg, ids } — o código é verificado sem diferenciar maiúsculas. */
  redeem(code) {
    this.data = this._normalize(this.data || this.load());
    const c = String(code || '').trim().toLowerCase();
    if (!c) return { ok: false, msg: 'Digite um código.' };
    if (c === 'batata') {
      const fresh = this.SECRET_IDS.filter((id) => !this.data.unlocked.includes(id));
      if (!fresh.length) return { ok: true, already: true, msg: 'Todos os secretos (DU, IALES, FELIPINHO e QWEN) já estão liberados.', ids: [] };
      this.data.unlocked.push(...fresh);
      this.save();
      return { ok: true, msg: 'Desbloqueados: ' + fresh.map((id) => ((typeof FIGHTERS !== 'undefined' && FIGHTERS.find((f) => f.id === id)) || { name: id.toUpperCase() }).name).join(', ') + '!', ids: fresh };
    }
    return { ok: false, msg: 'Código inválido.' };
  },

  setting(k, v) {
    this.data = this._normalize(this.data || this.load());
    if (v === undefined) return this.data.settings[k];
    this.data.settings[k] = v;
    this.save();
    return v;
  },

  reducedMotion() {
    const s = this.data.settings.reducedMotion;
    if (s === true || s === false) return s;
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  },

  skinFor(fid) {
    if (!this.SKINS_ENABLED) return 0;
    const sk = this.data && this.data.skins && this.data.skins[fid];
    return sk === -1 || (Number.isFinite(sk) && sk >= 0 && sk <= 360) ? sk : 0;
  },
  setSkin(fid, hue) {
    if (!this.SKINS_ENABLED) return false;
    this.data = this._normalize(this.data || this.load());
    const id = String(fid || '').trim();
    const value = Number(hue);
    if (!id || !(value === -1 || (Number.isFinite(value) && value >= 0 && value <= 360))) return;
    this.data.skins[id] = Math.round(value);
    this.save();
  },
  petFor(slot) {
    const id = this.data.pets[slot] || 'none';
    return PETS.find((p) => p.id === id) || PETS[0];
  },

  setPet(slot, id) {
    if (slot !== 0 && slot !== 1) return;
    this.data = this._normalize(this.data || this.load());
    this.data.pets[slot] = String(id || 'none');
    this.save();
  },

  record(stat, v) {
    this.data = this._normalize(this.data || this.load());
    const s = this.data.stats;
    const amount = this._number(v, 1);
    if (stat === 'maxCombo' || stat === 'bestArcade' || stat === 'bestSurvival') s[stat] = Math.max(s[stat] || 0, amount);
    else if (Object.prototype.hasOwnProperty.call(s, stat)) s[stat] = this._number(s[stat], 0) + amount;
    this.save();
  },
};
Profile.load();
