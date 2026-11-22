#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readPublicConfig() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY) {
    return {
      url: String(process.env.SUPABASE_URL).replace(/\/+$/, ''),
      key: String(process.env.SUPABASE_PUBLISHABLE_KEY),
    };
  }
  const file = path.join(__dirname, '..', 'js', 'config', 'supabase-config.js');
  const text = fs.readFileSync(file, 'utf8');
  const url = (text.match(/url:\s*'([^']+)'/) || [])[1];
  const key = (text.match(/publishableKey:\s*'([^']+)'/) || [])[1];
  if (!url || !key) {
    throw Object.assign(new Error('Não achei url ou publishableKey em js/config/supabase-config.js.'), { code: 'config_missing' });
  }
  return { url: url.replace(/\/+$/, ''), key };
}

function pausedText(status, body) {
  const blob = typeof body === 'string' ? body : JSON.stringify(body || '');
  return /paused|inactive|is currently paused|project is paused/i.test(blob)
    || status === 521
    || status === 522
    || status === 540;
}

async function touchSupabase() {
  const { url, key } = readPublicConfig();
  const headers = {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  let response;
  try {
    response = await fetch(url + '/rest/v1/rpc/ds_fighters_touch', {
      method: 'POST',
      headers,
      body: '{}',
    });
  } catch (error) {
    throw Object.assign(
      new Error('Sem conexão com o Supabase (' + (error && error.message ? error.message : 'falha de rede') + '). O projeto ownxbuailthavxgfxtem pode estar pausado.'),
      { code: 'supabase_unreachable' }
    );
  }
  const raw = await response.text();
  let body = raw;
  try { body = raw ? JSON.parse(raw) : null; } catch (e) { body = raw; }
  if (pausedText(response.status, body)) {
    throw Object.assign(
      new Error('Projeto Supabase PAUSADO. Abra o painel, restaure ownxbuailthavxgfxtem e rode o SQL de supabase/migrations/20261110_ds_fighters_keepalive.sql. HTTP ' + response.status + ' ' + String(raw).slice(0, 400)),
      { code: 'project_paused', status: response.status }
    );
  }
  if (!response.ok) {
    throw Object.assign(
      new Error('Keep-alive falhou HTTP ' + response.status + ' ' + String(raw).slice(0, 500) + ' — se a função ainda não existe, rode o SQL em SUPABASE.md.'),
      { code: 'keepalive_failed', status: response.status }
    );
  }
  return { ok: true, touchedAt: body, status: response.status };
}

module.exports = { touchSupabase, readPublicConfig };

/* Chamada reserva: se a funcao ds_fighters_touch nao existir (404), uma leitura
   simples na API REST ja conta como atividade do projeto. */
async function fallbackPing() {
  const { url, key } = readPublicConfig();
  const r = await fetch(url + '/rest/v1/ds_fighters_profiles?select=uid&limit=1', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
  if (pausedText(r.status, await r.text())) throw Object.assign(new Error('Projeto Supabase PAUSADO (HTTP ' + r.status + '). Restaure no painel.'), { code: 'project_paused' });
  return { ok: r.status < 500, fallback: true, status: r.status };
}

/* 3 tentativas com espera (falha de rede passageira nao derruba o dia) */
async function main() {
  let last;
  for (let i = 0; i < 3; i++) {
    try { return await touchSupabase(); } catch (e) {
      last = e;
      if (e && e.code === 'keepalive_failed' && e.status === 404) { try { return await fallbackPing(); } catch (e2) { last = e2; } }
      if (e && e.code === 'project_paused') break;
      await new Promise((r) => setTimeout(r, 15000 * (i + 1)));
    }
  }
  throw last;
}

/* Diagnostico do LOGIN (so leitura, chave publica): mostra no log do Actions se
   o provedor de email esta ligado, se o cadastro esta aberto, se exige
   confirmacao por email e se as tabelas do ranking existem. Nunca derruba o job. */
async function authReport() {
  const { url, key } = readPublicConfig();
  const out = {};
  try {
    const r = await fetch(url + '/auth/v1/settings', { headers: { apikey: key } });
    const b = await r.json();
    const ext = b.external || {};
    out.auth = { http: r.status, email: ext.email, google: ext.google, signupAberto: b.disable_signup === false || b.disable_signup === undefined ? true : !b.disable_signup, exigeConfirmarEmail: b.mailer_autoconfirm === undefined ? null : !b.mailer_autoconfirm };
  } catch (e) { out.auth = { erro: String(e && e.message || e) }; }
  for (const t of ['ds_fighters_profiles', 'ds_fighters_ranking']) {
    try {
      const r = await fetch(url + '/rest/v1/' + t + '?select=*&limit=1', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
      out[t] = r.status;
    } catch (e) { out[t] = 'erro'; }
  }
  return out;
}

module.exports.authReport = authReport;

if (require.main === module) {
  main().then(async (result) => {
    console.log(JSON.stringify(result));
    try { console.log('LOGIN/RANKING:', JSON.stringify(await authReport())); } catch (e) { /* so diagnostico */ }
  }).catch((error) => {
    console.error(error && error.message ? error.message : error);
    console.error('>> Se o projeto estiver pausado: supabase.com/dashboard -> projeto ownxbuailthavxgfxtem -> Restore. O keep-alive so impede NOVAS pausas.');
    process.exit(1);
  });
}
