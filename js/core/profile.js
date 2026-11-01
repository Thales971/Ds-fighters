/* ============================================================
   DS FIGHTERS — Perfil local (localStorage).
   Desbloqueios por código, mascotes, opções de áudio/vídeo e estatísticas.
   ============================================================ */
const Profile = {
  KEY: 'dsfighters.profile.v2',
  SECRET_IDS: ['du', 'iales', 'felipinho'],
  data: null,
  defaults() {
    return {
      unlocked: [],
      pets: ['tux', 'none'],
      name: 'Jogador',
      settings: { music: 0.55, sfx: 0.8, voice: 0.9, mute: false, reducedMotion: null, shake: true, touch: 'auto', serverUrl: '' },
      stats: { fights: 0, wins: 0, bestArcade: 0, maxCombo: 0 },
    };
  },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { d = null; }
    const base = this.defaults();
    this.data = Object.assign(base, d || {});
    this.data.settings = Object.assign(base.settings, (d && d.settings) || {});
    this.data.stats = Object.assign(base.stats, (d && d.stats) || {});
    if (!Array.isArray(this.data.pets) || this.data.pets.length < 2) this.data.pets = ['tux', 'none'];
    return this.data;
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* modo privado */ }
    if (typeof Cloud !== 'undefined' && Cloud && typeof Cloud.queueSave === 'function') Cloud.queueSave();
  },
  applyCloud(remoteData) {
    const remote = remoteData && remoteData.profile ? remoteData.profile : remoteData;
    if (!remote || typeof remote !== 'object') return this.data;
    const local = this.data || this.load();
    const unique = (list) => [...new Set((Array.isArray(list) ? list : []).filter((id) => typeof id === 'string'))];
    const localMeta = (() => {
      try { return JSON.parse(localStorage.getItem('dsfighters.cloud.meta.v1') || 'null') || {}; } catch (e) { return {}; }
    })();
    const stamp = remoteData && remoteData.updatedAt;
    const remoteTime = stamp && typeof stamp.toMillis === 'function' ? stamp.toMillis() : stamp && stamp.seconds ? Number(stamp.seconds) * 1000 : Number(stamp) || 0;
    const localTime = Number(localMeta.updatedAt) || 0;
    const remoteIsNewer = remoteTime > localTime || (!localTime && remoteTime > 0);
    const localPets = Array.isArray(local.pets) ? local.pets.slice(0, 2) : ['tux', 'none'];
    const remotePets = Array.isArray(remote.pets) ? remote.pets.filter((id) => typeof id === 'string').slice(0, 2) : [];
    while (localPets.length < 2) localPets.push('none');
    while (remotePets.length < 2) remotePets.push('none');
    const ls = local.stats || {};
    const rs = remote.stats || {};
    this.data = Object.assign({}, local, {
      unlocked: unique([...(local.unlocked || []), ...(remote.unlocked || [])]),
      pets: remoteIsNewer && remotePets.length ? remotePets : localPets,
      name: remoteIsNewer && (remote.name || (remoteData && remoteData.name)) ? String(remote.name || remoteData.name).slice(0, 64) : local.name,
      // Configurações de dispositivo (serverUrl/touch) permanecem sempre locais.
      settings: Object.assign({}, local.settings || {}),
      stats: {
        fights: Math.max(Number(ls.fights) || 0, Number(rs.fights) || 0),
        wins: Math.max(Number(ls.wins) || 0, Number(rs.wins) || 0),
        bestArcade: Math.max(Number(ls.bestArcade) || 0, Number(rs.bestArcade) || 0),
        maxCombo: Math.max(Number(ls.maxCombo) || 0, Number(rs.maxCombo) || 0),
      },
    });
    return this.data;
  },
  isUnlocked(id) {
    return !this.SECRET_IDS.includes(id) || this.data.unlocked.includes(id);
  },
  /* Retorna { ok, msg, ids } — o código é verificado sem diferenciar maiúsculas. */
  redeem(code) {
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
  petFor(slot) {
    const id = this.data.pets[slot] || 'none';
    return PETS.find((p) => p.id === id) || PETS[0];
  },
  setPet(slot, id) {
    this.data.pets[slot] = id;
    this.save();
  },
  record(stat, v) {
    const s = this.data.stats;
    if (stat === 'maxCombo' || stat === 'bestArcade') s[stat] = Math.max(s[stat] || 0, v);
    else s[stat] = (s[stat] || 0) + (v || 1);
    this.save();
  },
};
Profile.load();
