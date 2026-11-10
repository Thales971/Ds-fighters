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

if (require.main === module) {
  touchSupabase().then((result) => {
    console.log(JSON.stringify(result));
  }).catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  });
}
