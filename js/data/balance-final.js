/* ============================================================
   TABELA UNICA DE BALANCEAMENTO (nov/2026, PR 127)
   Os numeros FINAIS de cada lutador normal: forca (dano), vida, velocidade,
   peso e ganho de medidor. Antes, cada valor passava por varias camadas
   (fighters*.js -> powers-balance-v6..v13 -> balance-v14 FORCA/AJUSTE/DANO)
   e ninguem sabia o numero real. Agora: quer mexer num lutador, mexe AQUI.
   Os de codigo (secretos) nao entram. As habilidades (dano de cada golpe)
   continuam nos arquivos de kit; o relatorio delas sai com:
     node tools/balance_snapshot.cjs --kits
   Primeira versao gerada por tools/balance_snapshot.cjs (le o resultado das
   camadas antigas). Depois de editar a mao, NAO rode o gerador de novo: ele
   sobrescreve a tabela com o resultado das camadas antigas. O relatorio de
   dano das habilidades (--kits) so le, nao grava, com --so-relatorio.
   ============================================================ */
const BALANCE_FINAL = {
  'stack': { power: 1.94, hp: 179, speed: 1.24, weight: 1, meterRate: 1.4 }, /* ET 1155 */
  'gitmaster': { power: 1.451, hp: 140, speed: 1.24, weight: 0.92, meterRate: 1.3 }, /* KAGE COMMIT */
  'bughunter': { power: 1.983, hp: 194, speed: 1.18, weight: 0.98, meterRate: 1.28 }, /* LYRA TRACE */
  'frontend': { power: 2.721, hp: 265, speed: 1.2, weight: 0.96, meterRate: 1.3 }, /* MIRA PIXEL */
  'backend': { power: 3.318, hp: 392, speed: 0.94, weight: 1.24, meterRate: 1.08 }, /* TITAN 500 */
  'devops': { power: 2.176, hp: 213, speed: 1.1, weight: 1.12, meterRate: 1.26 }, /* CID PIPE */
  'qa': { power: 2.772, hp: 299, speed: 1.1, weight: 1.04, meterRate: 1.18 }, /* ADA ASSERT */
  'scrum': { power: 1.273, hp: 126, speed: 1.24, weight: 0.96, meterRate: 1.38 }, /* KAIRO SPRINT */
  'fullstack': { power: 2.805, hp: 327, speed: 1.05, weight: 1, meterRate: 1.1 }, /* OMNI STACK */
  'kotlin': { power: 1.204, hp: 116, speed: 1.32, weight: 0.96, meterRate: 1.34 }, /* YUMI LAMBDA */
  'hacker': { power: 1.838, hp: 179, speed: 1.26, weight: 0.94, meterRate: 1.3 }, /* ROOT PHANTOM */
  'java': { power: 1.553, hp: 206, speed: 0.95, weight: 1.16, meterRate: 1.18 }, /* KAEL JVM */
  'merc': { power: 1.563, hp: 152, speed: 1.32, weight: 0.94, meterRate: 1.42 }, /* CROMO VX */
  'bhm': { power: 1.669, hp: 167, speed: 1.26, weight: 1.02, meterRate: 1.42 }, /* BHM NOIR */
  'gemini': { power: 0.904, hp: 89, speed: 1.26, weight: 1.04, meterRate: 1.42 }, /* GEMINI TWINBYTE */
  'meta': { power: 0.915, hp: 90, speed: 1.26, weight: 1.04, meterRate: 1.42 }, /* META */
  'mis': { power: 1.473, hp: 145, speed: 1.22, weight: 1, meterRate: 1.4 }, /* MIS, A BRASA MISTRAL */
  'dev-senior': { power: 1.147, hp: 109, speed: 1.08, weight: 1.12, meterRate: 1.38 }, /* DEV SENIOR, ENGENHEIRO DE NANOS */
  'urbano': { power: 1.528, hp: 141, speed: 1.1, weight: 1.2, meterRate: 1.36 }, /* URBANO TREMOR */
  'xeon': { power: 1.157, hp: 110, speed: 1.12, weight: 1.04, meterRate: 1.28 }, /* XEON */
  'qwen': { power: 0.841, hp: 80, speed: 1.14, weight: 0.98, meterRate: 1.28 }, /* QWEN ASTRA */
  'thl': { power: 1.496, hp: 140, speed: 1.1, weight: 1.1, meterRate: 1.44 }, /* VIGILANTE */
  'lobao': { power: 1.111, hp: 119, speed: 1, weight: 1.3, meterRate: 1.2 }, /* LOBÃO */
  'winx-exe': { power: 2.577, hp: 239, speed: 1.14, weight: 0.98, meterRate: 1.32 }, /* WINX.EXE */
  'dandara-query': { power: 2.049, hp: 205, speed: 1.2, weight: 1, meterRate: 1.38 }, /* DANDARA QUERY */
  'nina-vector': { power: 1.464, hp: 144, speed: 1.3, weight: 0.98, meterRate: 1.38 }, /* NINA VECTOR */
  'dev-veterano': { power: 1.586, hp: 161, speed: 1.14, weight: 1.14, meterRate: 1.4 }, /* DEV VETERANO */
  'hana': { power: 1.492, hp: 165, speed: 1.18, weight: 0.92, meterRate: 1.15 }, /* HANA */
  'cyber-psicopata': { power: 1.32, hp: 141, speed: 1.26, weight: 1.12, meterRate: 1.4 }, /* CYBER-PSICOPATA */
  'grika': { power: 1.914, hp: 179, speed: 1.16, weight: 1.02, meterRate: 1.36 }, /* GRIKA, A SONHADORA SOMBRIA */
  'guarda-digital': { power: 2.2, hp: 184, speed: 1.22, weight: 1.08, meterRate: 1.4 }, /* GUARDA DIGITAL */
  'engenheira-prompt': { power: 0.805, hp: 82, speed: 1.24, weight: 1.04, meterRate: 1.42 }, /* ENGENHEIRA DE PROMPT */
  'odette': { power: 1.02, hp: 103, speed: 1.22, weight: 1.06, meterRate: 1.42 }, /* ODETTE */
  'john-vibe': { power: 1.768, hp: 182, speed: 1.1, weight: 1.05, meterRate: 1.2 }, /* JOHN THE VIBE CODER */
  'nimbo': { power: 1.164, hp: 113, speed: 1.16, weight: 0.96, meterRate: 1.28 }, /* NIMBO */
  'emilio': { power: 0.85, hp: 75, speed: 1.16, weight: 1, meterRate: 1.34 }, /* EMILIO */
  'nunes': { power: 1.096, hp: 72, speed: 1.16, weight: 1.04, meterRate: 1.38 }, /* NUNES */
  'ponteiro': { power: 1.726, hp: 301, speed: 0.98, weight: 1, meterRate: 1.6 }, /* PONTEIRO */
  'lia': { power: 2.796, hp: 608, speed: 1.22, weight: 0.92, meterRate: 1.28 }, /* LIA */
  'nexo': { power: 3.154, hp: 752, speed: 1.06, weight: 1.04, meterRate: 1.12 }, /* NEXO */
  'henrico': { power: 1.061, hp: 100, speed: 1.28, weight: 1.08, meterRate: 1.5 }, /* HENRICO */
  'jess': { power: 2.486, hp: 335, speed: 1.3, weight: 0.85, meterRate: 1.36 }, /* JESS */
  'dev-virado': { power: 1.799, hp: 293, speed: 1.55, weight: 0.82, meterRate: 1.15 }, /* DEV VIRADO */
  'milena': { power: 2.569, hp: 390, speed: 1.08, weight: 1, meterRate: 1.15 }, /* MILENA */
  'kira': { power: 1.578, hp: 252, speed: 0.95, weight: 1.25, meterRate: 1 }, /* KIRA */
  'cracker': { power: 1.661, hp: 264, speed: 1.12, weight: 0.95, meterRate: 1.1 }, /* CRACKER */
  'rafael': { power: 1.609, hp: 260, speed: 0.85, weight: 1.3, meterRate: 0.95 }, /* RAFAEL */
  'lyra': { power: 2.421, hp: 324, speed: 1.08, weight: 0.9, meterRate: 1.25 }, /* LYRA */
  'larper': { power: 2.326, hp: 338, speed: 1.16, weight: 0.98, meterRate: 1.2 }, /* LARPER */
  'jester': { power: 2.835, hp: 394, speed: 1.15, weight: 0.95, meterRate: 1.3 }, /* JESTER */
  'domador': { power: 2.362, hp: 334, speed: 1.02, weight: 1.12, meterRate: 1.15 }, /* DOMADOR */
  'miko': { power: 2.474, hp: 349, speed: 1.12, weight: 0.9, meterRate: 1.25 }, /* MIKO */
  'kuno': { power: 2.106, hp: 291, speed: 1.3, weight: 0.85, meterRate: 1.3 }, /* KUNO */
  'stella': { power: 2.333, hp: 324, speed: 1.15, weight: 0.88, meterRate: 1.3 }, /* STELLA */
  'captcha-guard': { power: 2.45, hp: 340, speed: 1.12, weight: 1.06, meterRate: 1.32 }, /* CAPTCHA GUARD (so com login: acima da media de proposito) */
};
(() => {
  for (const f of FIGHTERS) {
    const s = BALANCE_FINAL[f.id];
    if (s && f.stats && !f.secret) Object.assign(f.stats, s);
  }
})();
