/* DS Fighters — carregador opcional do pacote de arte. Não altera regras de combate. */
(function (global) {
  'use strict';
  const images = new Map();
  let manifest = null;
  let base = 'assets/art-pack/';

  function loadImage(relativePath) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { images.set(relativePath, img); resolve(img); };
      img.onerror = () => reject(new Error('Não foi possível carregar: ' + base + relativePath));
      img.src = base + relativePath;
    });
  }

  const api = {
    async load(basePath = 'assets/art-pack/') {
      base = basePath.replace(/\/?$/, '/');
      images.clear();
      manifest = null;
      const response = await fetch(base + 'manifest.json');
      if (!response.ok) throw new Error('Manifesto indisponível: ' + response.status);
      const data = await response.json();
      const files = new Set(Object.values(data.sheets).map(sheet => sheet.file));
      data.maps.forEach(map => files.add(map.file));
      await Promise.all(Array.from(files, loadImage));
      manifest = data;
      return data;
    },

    get manifest() { return manifest; },

    draw(ctx, sheetName, row, frame, x, y, size = 128, options = {}) {
      if (!manifest || !ctx || !Number.isFinite(size) || size <= 0) return false;
      if (![row, frame, x, y].every(Number.isFinite)) return false;
      row = Math.floor(row);
      if (row < 0 || row >= manifest.rows) return false;
      const sheet = manifest.sheets[sheetName];
      if (!sheet) return false;
      const img = images.get(sheet.file);
      if (!img) return false;
      const col = ((Math.floor(frame) % manifest.columns) + manifest.columns) % manifest.columns;
      const fw = manifest.frameWidth;
      const fh = manifest.frameHeight;
      ctx.save();
      ctx.translate(x, y);
      if (options.flipX) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, col * fw, row * fh, fw, fh, -size / 2, -size / 2, size, size);
      ctx.restore();
      return true;
    },

    drawIcon(ctx, name, x, y, size = 48) {
      const icon = manifest && manifest.icons[name];
      if (!icon) return false;
      return api.draw(ctx, 'ai-symbols', icon.row, icon.column, x, y, size);
    },

    drawPlatform(ctx, name, x, y, size = 256) {
      const platform = manifest && manifest.platforms[name];
      if (!platform) return false;
      return api.draw(ctx, 'platforms', platform.row, platform.column, x, y, size);
    },

    drawMap(ctx, id, width, height) {
      if (!manifest || !ctx || ![width, height].every(Number.isFinite) || width <= 0 || height <= 0) return false;
      const map = manifest.maps.find(item => item.id === id);
      if (!map) return false;
      const img = images.get(map.file);
      if (!img) return false;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);
      ctx.restore();
      return true;
    }
  };

  global.DSArtPack = api;
})(typeof window !== 'undefined' ? window : globalThis);
