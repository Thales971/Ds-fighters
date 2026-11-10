'use strict';

const { touchSupabase } = require('../tools/supabase_keepalive');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const result = await touchSupabase();
    res.statusCode = 200;
    res.end(JSON.stringify(result));
  } catch (error) {
    const code = error && error.code ? error.code : 'keepalive_failed';
    const paused = code === 'project_paused' || code === 'supabase_unreachable';
    res.statusCode = paused ? 503 : (Number(error && error.status) || 500);
    res.end(JSON.stringify({
      ok: false,
      error: code,
      message: error && error.message ? error.message : 'Keep-alive falhou.',
    }));
  }
};
