/* ============================================================
   DS FIGHTERS — Perfil local (localStorage).
   Desbloqueios por código, mascotes, opções de áudio/vídeo e estatísticas.
   ============================================================ */
const Profile = {
  KEY: 'dsfighters.profile.v2',
  ACCOUNT_KEY_PREFIX: 'dsfighters.profile.account.v1.',
  DEVICE_SETTINGS_KEY: 'dsfighters.profile.device-settings.v1',
  SKINS_ENABLED: false,
  /* Du, Iales, Felipinho, Maximilian e Dolynho sao SECRETOS: so entram com codigo.
     Os codigos em si ficam so nas comparacoes abaixo — nunca em comentarios,
     README ou mensagens de erro (anti-vazamento, pedido do dono).
     Winx.exe e Qwen sao personagens NORMAIS (sem codigo). */
  SECRET_IDS: ['du', 'iales', 'felipinho', 'maximilian', 'dolynho', 'kernor'],
  LEGACY_IDS: ['du', 'iales', 'felipinho'],
  /* RECOMPENSA DE LOGIN: so libera com conta (email) conectada. Nao entram em
     codigo nenhum — sair da conta trava de novo. */
  LOGIN_IDS: ['captcha-guard'],
  LOGIN_PETS: ['firefox'],
  data: null,
  accountUid: null,

  defaults() {
    return {
      unlocked: [],
      pets: ['tux', 'none'],
      skins: {},
      name: 'Jogador',
      settings: { music: 0.35, sfx: 0.8, voice: 0.9, mute: false, reducedMotion: null, shake: true, touch: 'auto', serverUrl: '', quality: 'medium', shareStats: true },
      stats: { fights: 0, wins: 0, bestArcade: 0, bestSurvival: 0, maxCombo: 0 },
    };
  },

  _read(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; }
  },

  _write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
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
    let unlocked = [...new Set((Array.isArray(source.unlocked) ? source.unlocked : [])
      .filter((id) => typeof id === 'string' && id.length > 0))].slice(-64);
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
    /* RECORDES POR LUTADOR (survival) */
    const survivalBy = stats.survivalBy && typeof stats.survivalBy === 'object' && !Array.isArray(stats.survivalBy) ? stats.survivalBy : {};
    normalizedStats.survivalBy = survivalBy;
    if (Object.prototype.hasOwnProperty.call(stats, 'bestSurvival')) {
      normalizedStats.bestSurvival = this._number(stats.bestSurvival, 0);
    }
    /* RANKING: menor tempo (segundos de luta somados) pra fechar o torneio */
    if (this._number(stats.bestTourneySecs, 0) > 0) normalizedStats.bestTourneySecs = this._number(stats.bestTourneySecs, 0);
    const achievements = [...new Set((Array.isArray(source.achievements) ? source.achievements : []))].slice(-64);
    const earnedKernor = achievements.includes('trofeu-torneio') || achievements.includes('arcade-campeao');
    this._repairedKernor = earnedKernor && !unlocked.includes('kernor');
    if (this._repairedKernor) unlocked = [...unlocked, 'kernor'].slice(-64);
    return Object.assign({}, source, {
      achievements,
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
    if (this._repairedKernor) this.save();
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
    if (this._repairedKernor) this.save();
    return this.data;
  },

  /* Primeira vez que a conta entra: medalha + aviso do Captcha Guard e da raposa.
     Chamado pelo cartao de conta DEPOIS da sincronizacao (salvar no meio da troca
     de conta deixava o perfil local "mais novo" que o da nuvem). */
  loginReward() {
    if (!this.loggedIn() || !this.data || this.data.loginRewardSeen) return false;
    this.data.loginRewardSeen = true;
    if (typeof UI !== 'undefined' && UI.toast) {
      setTimeout(() => UI.toast('🔓 Conta conectada! Liberados: CAPTCHA GUARD e a RAPOSA DO FIREFOX.', 5200), 400);
    }
    this.grantAchievement('login-1');
    return true;
  },

  deactivateAccount(uid) {
    if (!this.accountUid) return this.data || this.load();
    if (uid && String(uid) !== this.accountUid) return this.data;
    this._write(this._accountKey(this.accountUid), this._normalize(this.data));
    this.accountUid = null;
    this.data = this._normalize(this._read(this.KEY));
    this._applyDeviceSettings(this.data);
    if (this._repairedKernor) this.save();
    return this.data;
  },

  save() {
    this.data = this._normalize(this.data);
    this._saveDeviceSettings();
    const profileOk = this.accountUid
      ? this._write(this._accountKey(this.accountUid), this.data)
      : this._write(this.KEY, this.data);
    if (typeof Cloud !== 'undefined' && Cloud && typeof Cloud.queueSave === 'function') Cloud.queueSave();
    return profileOk;
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
      .filter((id) => typeof id === 'string' && id.length > 0))].slice(-64);
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
    const bt = [this._number(ls.bestTourneySecs, 0), this._number(rs.bestTourneySecs, 0)].filter((v) => v > 0);
    if (bt.length) mergedStats.bestTourneySecs = Math.min(...bt);
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

  loggedIn() {
    return !!this.accountUid;
  },
  isLoginLocked(id) {
    return this.LOGIN_IDS.includes(id) && !this.loggedIn();
  },
  isUnlocked(id) {
    if (this.LOGIN_IDS.includes(id)) return this.loggedIn();
    return !this.SECRET_IDS.includes(id) || (this.data && Array.isArray(this.data.unlocked) && this.data.unlocked.includes(id));
  },

  /* Retorna { ok, msg, ids } — o código é verificado sem diferenciar maiúsculas. */
  redeem(code) {
    this.data = this._normalize(this.data || this.load());
    const c = String(code || '').trim().toLowerCase();
    if (!c) return { ok: false, msg: 'Digite um código.' };
    /* Ha um codigo padrao e um apelido legado (nomes so nas comparacoes abaixo);
       o legado ficou como apelido e libera os mesmos secretos (Du, Iales,
       Felipinho). NUNCA escreva os codigos em comentarios/README/msgs. */
    /* PITOCO: o unico mascote secreto — so ele pode ser resgatado por codigo */
    if (c === 'pitoco') {
      if (this.hasPitoco()) return { ok: true, already: true, msg: 'PITOCO já está desbloqueado.', pet: true };
      this.unlockPitoco();
      return { ok: true, msg: 'Desbloqueado: PITOCO! Ele apareceu na seleção de mascotes.', pet: true };
    }
    if (c === 'relogio') {
      const ids = ['maximilian'];
      const fresh = ids.filter((id) => !this.data.unlocked.includes(id));
      if (!fresh.length) return { ok: true, already: true, msg: 'MAXIMILIAN já está liberado.', ids };
      this.data.unlocked.push(...fresh);
      this.save();
      return { ok: true, msg: 'Desbloqueado: MAXIMILIAN!', ids: fresh };
    }
    if (c === 'kernel') {
      const ids = ['kernor'];
      const fresh = ids.filter((id) => !this.data.unlocked.includes(id));
      if (!fresh.length) return { ok: true, already: true, msg: 'KERNOR j\u00e1 est\u00e1 liberado.', ids };
      this.data.unlocked.push(...fresh);
      this.save();
      return { ok: true, msg: 'Desbloqueado: KERNOR, o chefe final!', ids: fresh };
    }
    if (c === 'dolly') {
      const ids = ['dolynho'];
      const fresh = ids.filter((id) => !this.data.unlocked.includes(id));
      if (!fresh.length) return { ok: true, already: true, msg: 'DOLYNHO j\u00e1 est\u00e1 liberado.', ids };
      this.data.unlocked.push(...fresh);
      this.save();
      return { ok: true, msg: 'Desbloqueado: DOLYNHO!', ids: fresh };
    }
    if (c === 'adm' || c === 'batata') {
      const ids = c === 'adm' ? this.LEGACY_IDS.concat(['maximilian']) : this.LEGACY_IDS.slice();
      const fresh = ids.filter((id) => !this.data.unlocked.includes(id));
      const names = (list) => list.map((id) => ((typeof FIGHTERS !== 'undefined' && FIGHTERS.find((f) => f.id === id)) || { name: id.toUpperCase() }).name).join(', ');
      if (!fresh.length) {
        const extra = c === 'batata' ? ' QWEN já entra sem código.' : '';
        return { ok: true, already: true, msg: names(ids) + ' já estão liberados.' + extra, ids };
      }
      this.data.unlocked.push(...fresh);
      this.save();
      const lead = c === 'batata' ? 'QWEN já é lutador padrão. BATATA liberou: ' : 'Desbloqueados: ';
      return { ok: true, msg: lead + names(fresh) + '!', ids: fresh };
    }
    /* NUNCA liste os codigos validos na msg de erro — vazaria o segredo na tela */
    return { ok: false, msg: 'Código inválido. 🤫 Dica: os códigos não aparecem em lugar nenhum — descubra jogando ou pergunte ao dono.' };
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
    const pet = PETS.find((p) => p.id === id) || PETS[0];
    /* pet secreto travado (ex.: PITOCO sem desbloquear) nao pode ser equipado */
    if (pet.secret && !this.hasPitoco()) return PETS[0];
    if (pet.login && !this.loggedIn()) return PETS[0]; /* raposa: so com conta */
    return pet;
  },

  setPet(slot, id) {
    if (slot !== 0 && slot !== 1) return;
    this.data = this._normalize(this.data || this.load());
    const pet = PETS.find((p) => p.id === String(id || 'none'));
    if (pet && pet.secret && !this.hasPitoco()) return; /* so desbloqueado pode equipar */
    if (pet && pet.login && !this.loggedIn()) return;
    this.data.pets[slot] = String(id || 'none');
    this.save();
  },

  /* CONQUISTAS: medalha unica, persistida, com toast */
  /* PITOCO: codigo PITOCO no resgate ou digitando P-I-T-O-C-O na tela de pets */
  unlockPitoco() {
    this.data = this._normalize(this.data || this.load());
    if (this.data.pitocoUnlocked) return false;
    this.data.pitocoUnlocked = true;
    this.save();
    this.grantAchievement('pitoco-1');
    return true;
  },
  hasPitoco() {
    return !!(this.data && this.data.pitocoUnlocked);
  },
  /* Troféu e o Kernor saem no mesmo save. Se o navegador recusar a gravação,
     o retorno é false e a tela não diz que o desbloqueio ficou salvo. */
  grantTournamentClear() {
    this.data = this._normalize(this.data || this.load());
    const ach = this.data.achievements;
    const fresh = [];
    for (const id of ['arcade-campeao', 'trofeu-torneio']) {
      if (!ach.includes(id)) { ach.push(id); fresh.push(id); }
    }
    if (!this.data.unlocked.includes('kernor')) this.data.unlocked.push('kernor');
    const stats = this.data.stats || (this.data.stats = {});
    stats.bestArcade = Math.max(this._number(stats.bestArcade, 0), 7);
    const wrote = this.save() === true;
    const raw = wrote ? this._read(this.accountUid ? this._accountKey(this.accountUid) : this.KEY) : null;
    const persisted = !!(raw && Array.isArray(raw.unlocked) && raw.unlocked.includes('kernor')
      && Array.isArray(raw.achievements) && raw.achievements.includes('trofeu-torneio'));
    if (typeof UI !== 'undefined' && UI.toast) {
      for (const id of fresh) {
        const a = (typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : []).find((x) => x.id === id);
        if (a) UI.toast('🏅 ' + a.name, 3200);
      }
    }
    return persisted;
  },
  /* Torneio fechado em `secs` segundos de luta: guarda o melhor (menor). */
  recordTourneyTime(secs) {
    const v = Math.round(Number(secs) || 0);
    if (v <= 0) return false;
    this.data = this._normalize(this.data || this.load());
    const cur = this._number(this.data.stats.bestTourneySecs, 0);
    if (cur && cur <= v) return false;
    this.data.stats.bestTourneySecs = v;
    this.save();
    return true;
  },
  grantAchievement(id) {
    if (!id) return false;
    this.data = this._normalize(this.data || this.load());
    if (!Array.isArray(this.data.achievements)) this.data.achievements = [];
    if (this.data.achievements.includes(id)) return false;
    this.data.achievements.push(id);
    this.save();
    const a = (typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS : []).find((x) => x.id === id);
    if (typeof UI !== 'undefined' && UI.toast && a) UI.toast('🏅 ' + a.name, 3200);
    return true;
  },
  hasAchievement(id) {
    return !!(this.data && Array.isArray(this.data.achievements) && this.data.achievements.includes(id));
  },
  /* RECORDES: survival por lutador + vitorias por lutador/elemento */
  recordSurvivalBy(fid, wins) {
    this.data = this._normalize(this.data || this.load());
    const by = this.data.stats.survivalBy || (this.data.stats.survivalBy = {});
    by[fid] = Math.max(by[fid] || 0, this._number(wins, 0));
    this.save();
  },
  recordWinBy(fid, element) {
    this.data = this._normalize(this.data || this.load());
    const w = this.data.winBy || (this.data.winBy = {});
    w[fid] = (w[fid] || 0) + 1;
    if (element) {
      const e = this.data.winElement || (this.data.winElement = {});
      e[element] = (e[element] || 0) + 1;
    }
    this.save();
  },
  /* palcos vencidos (para a conquista de turista) */
  recordStage(stageId) {
    if (!stageId) return;
    this.data = this._normalize(this.data || this.load());
    const w = this.data.winStage || (this.data.winStage = {});
    w[stageId] = (w[stageId] || 0) + 1;
    this.save();
    if (Object.keys(w).length >= 10) this.grantAchievement('estagios-10');
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
