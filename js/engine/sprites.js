/* ============================================================
   DS FIGHTERS — Sistema de Sprites (Sprite Sheets + Fallback)
   ============================================================ */

const SpriteGen = {
  cache: new Map(),
  images: {},
  loaded: false,

  sheets: {
    du:        { src: 'assets/sprites/du.png',        frames: { idle: 4, walk: 4, punch: 4, kick: 4, jump: 4, hit: 4, crouch: 4 } },
    iales:     { src: 'assets/sprites/iales.png',     frames: { idle: 4, walk: 5, punch: 4, kick: 4, jump: 4, hit: 4, crouch: 4 } },
    felipinho: { src: 'assets/sprites/felipinho.png', frames: { idle: 4, walk: 5, punch: 5, kick: 4, jump: 4, hit: 4, crouch: 4 } },
    stack:     { src: 'assets/sprites/stack.png',     frames: { idle: 4, walk: 4, punch: 4, kick: 3, jump: 3, hit: 4, crouch: 3 } },
    gitmaster: { src: 'assets/sprites/gitmaster.png', frames: { idle: 4, walk: 4, punch: 3, kick: 4, jump: 4, hit: 3, crouch: 4 } },
    bughunter: { src: 'assets/sprites/bughunter.png', frames: { idle: 3, walk: 4, punch: 3, kick: 3, jump: 3, hit: 3, crouch: 3 } },
    frontend:  { src: 'assets/sprites/frontend.png',  frames: { idle: 4, walk: 4, punch: 4, kick: 4, jump: 4, hit: 4, crouch: 4 } },
    backend:   { src: 'assets/sprites/backend.png',   frames: { idle: 3, walk: 8, punch: 4, kick: 4, jump: 4, hit: 3, crouch: 3 } },
    devops:    { src: 'assets/sprites/devops.png',    frames: { idle: 3, walk: 5, punch: 3, kick: 4, jump: 3, hit: 4, crouch: 4 } },
    qa:        { src: 'assets/sprites/qa.png',        frames: { idle: 4, walk: 4, punch: 3, kick: 3, jump: 3, hit: 4, crouch: 4 } },
    scrum:     { src: 'assets/sprites/scrum.png',     frames: { idle: 4, walk: 4, punch: 4, kick: 4, jump: 3, hit: 3, crouch: 3 } },
    fullstack: { src: 'assets/sprites/fullstack.png', frames: { idle: 4, walk: 5, punch: 4, kick: 4, jump: 3, hit: 3, crouch: 3 } },
    senpai:    { src: 'assets/sprites/senpai.png',    frames: { idle: 4, walk: 4, punch: 4, kick: 4, jump: 3, hit: 4, crouch: 4 } },
  },

  async load() {
    const promises = Object.entries(this.sheets).map(([id, cfg]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.images[id] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = cfg.src;
      });
    });
    await Promise.all(promises);
    this.loaded = true;
  },

  get(def, pose, frame, dir) {
    const id = def.id;
    const sheet = this.sheets[id];
    const img = this.images[id];

    if (img && sheet && sheet.frames[pose]) {
      return this.getFromSheet(img, sheet, pose, frame, dir);
    }
    return this.getProcedural(def, pose, frame, dir);
  },

  getFromSheet(img, sheet, pose, frame, dir) {
    const key = `${img.src}|${pose}|${frame}|${dir}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const c = document.createElement('canvas');
    c.width = 140;
    c.height = 180;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const totalFrames = sheet.frames[pose] || 4;
    const frameIndex = Math.abs(frame) % totalFrames;

    const maxFrames = Math.max(...Object.values(sheet.frames));
    const fw = img.width / maxFrames;
    const fh = img.height / 7;
    const poseOrder = ['idle', 'walk', 'punch', 'kick', 'jump', 'hit', 'crouch'];
    const row = Math.max(0, poseOrder.indexOf(pose));
    const sx = frameIndex * fw;
    const sy = row * fh;

    ctx.save();
    if (dir === -1) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, sx, sy, fw, fh, 8, 8, 124, 164);
    ctx.restore();

    this.cache.set(key, c);
    return c;
  },

  getProcedural(def, pose, frame, dir) {
    const k = `proc|${def.id}|${pose}|${frame}|${dir}`;
    if (this.cache.has(k)) return this.cache.get(k);

    const c = document.createElement('canvas');
    c.width = 140;
    c.height = 180;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    this.drawProcedural(ctx, def, pose, frame, dir);
    this.cache.set(k, c);
    return c;
  },

  getFlash(def, pose, frame, dir) {
    const src = this.get(def, pose, frame, dir);
    const k = (src.src || 'proc') + '|flash|' + pose + '|' + frame + '|' + dir;
    if (this.cache.has(k)) return this.cache.get(k);

    const c = document.createElement('canvas');
    c.width = src.width;
    c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    this.cache.set(k, c);
    return c;
  },

  clear() { this.cache.clear(); },

  drawProcedural(ctx, def, pose, frame, dir) {
    const C = def.colors || {};
    const T = def.traits || {};
    ctx.save();
    ctx.translate(70, 168);
    if (dir === -1) ctx.scale(-1, 1);

    const bob = (pose === 'idle' || pose === 'walk') ? Math.sin(frame * 0.4) * 2 : 0;
    ctx.translate(0, -bob);

    ctx.fillStyle = C.pants || '#333';
    ctx.fillRect(-12, -60, 10, 60);
    ctx.fillRect(3, -60, 10, 60);

    ctx.fillStyle = C.shirt || '#666';
    ctx.fillRect(-16, -110, 32, 50);

    ctx.fillStyle = C.skin || '#d9a066';
    ctx.fillRect(-14, -140, 28, 28);

    if (T.bald) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-14, -140, 28, 6);
    }
    if (T.beard === 'full') {
      ctx.fillStyle = C.hair || '#3a2a1a';
      ctx.fillRect(-14, -126, 28, 16);
    }
    if (T.glasses) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -134, 10, 10);
      ctx.strokeRect(3, -134, 10, 10);
    }

    ctx.restore();
  },
};

SpriteGen.load();
