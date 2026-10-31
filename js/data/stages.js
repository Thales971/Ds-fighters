/* ============================================================
   DS FIGHTERS — 10 cenários do dono.
   O canvas só blita o frame do spritesheet (assets/stages).
   ============================================================ */

const STAGES = (typeof STAGE_SHEETS !== 'undefined' ? STAGE_SHEETS : []).map((s) => ({
  id: s.id,
  name: s.name,
  sheet: s.sheet,
  cols: s.cols,
  rows: s.rows,
  frames: s.frames,
  fps: s.fps,
  frameW: s.frameW,
  frameH: s.frameH,
  obstacles: [],
}));
