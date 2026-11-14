/* Calendário dos eventos. As datas móveis seguem a Páscoa (computus).
   Carnaval = terça, 47 dias antes da Páscoa. O mapa fica jogável o ano
   inteiro; só a aba e a skin do menu ligam na janela. */
const Events = {
  override: null,
  init() {
    const q = new URLSearchParams(location.search).get('event');
    if (q) this.override = q;
  },
  easter(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  },
  addDays(date, n) {
    const x = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    x.setDate(x.getDate() + n);
    return x;
  },
  today() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  },
  list: [
    { id: 'carnaval', name: 'Carnaval', skin: null, window(year) { const e = Events.easter(year); return { start: Events.addDays(e, -51), end: Events.addDays(e, -47) }; } },
    { id: 'pascoa', name: 'Páscoa', skin: null, window(year) { const e = Events.easter(year); return { start: Events.addDays(e, -2), end: Events.addDays(e, 1) }; } },
    { id: 'junina', name: 'Festa Junina', skin: null, window(year) { return { start: new Date(year, 5, 1), end: new Date(year, 5, 30) }; } },
    { id: 'criancas', name: 'Dia das Crianças', skin: null, window(year) { return { start: new Date(year, 9, 10), end: new Date(year, 9, 14) }; } },
    { id: 'halloween', name: 'Halloween', skin: 'halloween', window(year) { return { start: new Date(year, 9, 20), end: new Date(year, 10, 2) }; } },
    { id: 'natal', name: 'Natal', skin: 'natal', window(year) { return { start: new Date(year, 11, 1), end: new Date(year, 11, 26) }; } },
    { id: 'anonovo', name: 'Ano Novo', skin: null, window(year) { return { start: new Date(year, 11, 28), end: new Date(year + 1, 0, 2) }; } },
  ],
  span(ev, day) {
    const y = (day || this.today()).getFullYear();
    for (const yy of [y - 1, y, y + 1]) {
      const w = ev.window(yy);
      if (day >= w.start && day <= w.end) return w;
    }
    return null;
  },
  active(day) {
    if (this.override === 'off') return null;
    if (this.override) return this.list.find((e) => e.id === this.override) || null;
    const now = day || this.today();
    return this.list.find((e) => this.span(e, now)) || null;
  },
  upcoming(day) {
    const now = day || this.today();
    const y = now.getFullYear();
    const forced = this.override && this.override !== 'off' ? this.override : null;
    return this.list.map((ev) => {
      const live = this.span(ev, now);
      const on = forced ? ev.id === forced : !!live;
      let w = live || ev.window(y);
      if (!live && w.end < now) w = ev.window(y + 1);
      const daysLeft = live ? Math.max(0, Math.round((live.end - now) / 86400000)) : null;
      const daysUntil = live || on ? 0 : Math.max(0, Math.round((w.start - now) / 86400000));
      return { ev, window: w, active: !!on, live: !!live, daysLeft, daysUntil };
    });
  },
  fmt(date) {
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return date.getDate() + ' ' + months[date.getMonth()];
  },
};
Events.init();
