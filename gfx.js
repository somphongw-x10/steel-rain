// Steel Rain - Vietnam '69
// GFX — 16-bit arcade art layer: procedural pixel-art terrain + crisp sprite pipeline.
// 1 art pixel = 1 game unit (320×480). Everything is drawn with smoothing OFF.

const GFX = (() => {
  // ========================
  // PALETTE (one shared set so every layer reads as the same game)
  // ========================
  const PAL = {
    outline:  [12, 20, 14],
    // jungle canopy (dark → light)
    can0: [12, 28, 20], can1: [20, 44, 30], can2: [28, 62, 36], can3: [42, 84, 42],
    can4: [62, 106, 50], can5: [94, 134, 62],
    // ground / clearing grass
    grs0: [40, 70, 36], grs1: [54, 88, 42], grs2: [70, 104, 48], grs3: [92, 122, 56],
    // dirt / road / craters
    drt0: [52, 38, 26], drt1: [78, 58, 36], drt2: [104, 80, 48], drt3: [136, 108, 66],
    // rice paddy
    pad0: [58, 96, 70], pad1: [74, 116, 82], padRice: [118, 160, 70], padDike: [110, 104, 60],
    // water
    wat0: [22, 58, 76], wat1: [30, 78, 94], wat2: [42, 100, 110], wat3: [64, 128, 126],
    foam: [168, 212, 200], glint: [226, 246, 238],
    // sand / mud bank
    snd0: [96, 84, 52], snd1: [140, 124, 80], snd2: [176, 160, 108],
    // huts
    roof0: [120, 92, 46], roof1: [164, 132, 72], roof2: [196, 168, 100],
  };
  const css = c => `rgb(${c[0]},${c[1]},${c[2]})`;

  // ========================
  // DETERMINISTIC NOISE
  // ========================
  function hash(x, y) {
    let h = (x | 0) * 374761393 + (y | 0) * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) {
    return vnoise(x, y) * 0.57 + vnoise(x * 2.03 + 17, y * 2.03 + 9) * 0.29 + vnoise(x * 4.1 + 41, y * 4.1 + 3) * 0.14;
  }
  // 4×4 Bayer matrix for 16-bit style ordered dithering
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  // pick from a ramp using value t∈[0,1] with ordered dithering between steps
  function ramp(colors, t, x, y) {
    const f = Math.max(0, Math.min(0.9999, t)) * (colors.length - 1);
    const i = Math.floor(f);
    return colors[Math.min(colors.length - 1, i + (f - i > dith(x, y) ? 1 : 0))];
  }

  // ========================
  // PRE-RENDERED DECALS (trees, huts, craters)
  // ========================
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  // Round canopy tree, lit from the top-left, hard pixel edge + outline
  function makeTree(r, seed) {
    const s = r * 2 + 4;
    const c = makeCanvas(s, s);
    const g = c.getContext('2d');
    const id = g.createImageData(s, s);
    const cx = s / 2, cy = s / 2;
    const set = (x, y, col) => {
      const i = (y * s + x) * 4;
      id.data[i] = col[0]; id.data[i + 1] = col[1]; id.data[i + 2] = col[2]; id.data[i + 3] = 255;
    };
    const inside = (x, y) => {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const ang = Math.atan2(dy, dx);
      const wob = 1 + 0.12 * Math.sin(ang * 5 + seed * 7) + 0.07 * Math.sin(ang * 9 + seed * 3);
      return dx * dx + dy * dy <= (r * wob) * (r * wob);
    };
    const ramp5 = [PAL.can1, PAL.can2, PAL.can3, PAL.can4, PAL.can5];
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      if (inside(x, y)) {
        // light from top-left; leaf clumps via noise
        const dx = (x + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r;
        const light = 0.55 - dx * 0.32 - dy * 0.42 + (vnoise(x * 0.45 + seed * 13, y * 0.45) - 0.5) * 0.55;
        set(x, y, ramp(ramp5, light, x, y));
      } else if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) {
        set(x, y, PAL.can0);
      }
    }
    g.putImageData(id, 0, 0);
    return c;
  }
  const TREES = [];
  const TREE_R = [5, 6, 7, 8, 9, 11];
  for (let i = 0; i < TREE_R.length * 2; i++) TREES.push(makeTree(TREE_R[i % TREE_R.length], i + 1));

  function makeHut(seed) {
    const w = 14, h = 12;
    const c = makeCanvas(w + 2, h + 2);
    const g = c.getContext('2d');
    g.fillStyle = css(PAL.outline); g.fillRect(0, 0, w + 2, h + 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      // thatch roof: ridge down the middle, lit left side
      const col = x < w / 2 ? (y % 3 === 0 ? PAL.roof1 : PAL.roof2) : (y % 3 === 0 ? PAL.roof0 : PAL.roof1);
      g.fillStyle = css(x === Math.floor(w / 2) ? PAL.roof0 : col);
      g.fillRect(x + 1, y + 1, 1, 1);
    }
    if (seed % 2) { g.fillStyle = css(PAL.drt0); g.fillRect(3, 9, 3, 3); }
    return c;
  }
  const HUTS = [makeHut(0), makeHut(1)];

  function makeCrater(r) {
    const s = r * 2 + 2;
    const c = makeCanvas(s, s);
    const g = c.getContext('2d');
    const id = g.createImageData(s, s);
    const cx = s / 2, cy = s / 2;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy) / r;
      if (d > 1) continue;
      let col;
      if (d > 0.78) col = (dx + dy < 0) ? PAL.drt1 : PAL.drt3;   // rim: lit lower-right edge
      else col = (dx + dy < 0) ? PAL.drt0 : PAL.drt1;              // bowl: shadow upper-left
      const i = (y * s + x) * 4;
      id.data[i] = col[0]; id.data[i + 1] = col[1]; id.data[i + 2] = col[2]; id.data[i + 3] = 255;
    }
    g.putImageData(id, 0, 0);
    return c;
  }
  const CRATERS = [makeCrater(4), makeCrater(6), makeCrater(8)];

  // Reed clump for river edges: vertical blades with a lit side
  function makeReeds(seed) {
    const w = 11, h = 12;
    const c = makeCanvas(w, h), g = c.getContext('2d');
    for (let i = 0; i < 7; i++) {
      const bx = 1 + Math.floor(hash(seed, i) * (w - 2));
      const bh = 5 + Math.floor(hash(i, seed + 3) * (h - 5));
      g.fillStyle = css(PAL.outline); g.fillRect(bx - 1, h - bh - 1, 3, bh + 1);
      g.fillStyle = css(i & 1 ? PAL.can3 : PAL.can4); g.fillRect(bx, h - bh, 1, bh);
      if (hash(seed + i, 9) > 0.6) { g.fillStyle = css(PAL.drt2); g.fillRect(bx, h - bh - 1, 1, 2); }
    }
    return c;
  }
  const REEDS = [0, 1, 2, 3].map(makeReeds);

  // Lily-pad cluster floating on the water
  function makeLilies(seed) {
    const s = 12;
    const c = makeCanvas(s, s), g = c.getContext('2d');
    for (let i = 0; i < 4; i++) {
      const px = 2 + Math.floor(hash(seed, i * 2) * 7), py = 2 + Math.floor(hash(i * 2, seed) * 7);
      g.fillStyle = css(PAL.can1); g.beginPath(); g.arc(px + 1.5, py + 1.5, 2.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = css(PAL.can4); g.fillRect(px, py, 2, 2);
      if (i === 0 && seed & 1) { g.fillStyle = 'rgb(226,160,190)'; g.fillRect(px + 1, py, 1, 1); }
    }
    return c;
  }
  const LILIES = [0, 1, 2].map(makeLilies);

  // ========================
  // TERRAIN — chunked, cached pixel-art map
  // ========================
  const CW = 320, CH = 64;   // chunk size in art pixels (= game units)

  // riverAt(worldY) → 0..1 is supplied by the game (same zones as gameplay)
  function createTerrain(riverAt) {
    const cache = new Map();   // chunkIndex → { frames:[canvas,canvas], glints:[[x,y],...] }
    const roadX = wy => 160 + Math.sin(wy * 0.0061 + 1.3) * 78 + Math.sin(wy * 0.017) * 26;

    // effective water amount with a wavy shoreline (keeps isRiver row semantics within a few px)
    const waterAt = (x, wy, r) => r + (fbm(x * 0.03 + 5, wy * 0.03) - 0.5) * 0.42 - 0.5;

    function buildChunk(ci) {
      const y0 = ci * CH;                 // world Y at chunk bottom row
      const frames = [makeCanvas(CW, CH), makeCanvas(CW, CH)];
      const ids = frames.map(f => f.getContext('2d').createImageData(CW, CH));
      const glints = [];
      // low-frequency fields are sampled every STEP px and interpolated (≈4× cheaper)
      const STEP = 4, NS = CW / STEP + 2;
      const sDense = new Float32Array(NS), sPaddy = new Float32Array(NS);
      const sShore = new Float32Array(NS), sCur = new Float32Array(NS);
      const lerpRow = (arr, x) => { const f = x / STEP, i = f | 0; return arr[i] + (arr[i + 1] - arr[i]) * (f - i); };
      for (let py = 0; py < CH; py++) {
        // canvas row py=0 is the TOP of the chunk = highest worldY
        const wy = y0 + (CH - 1 - py);
        const r = riverAt(wy);
        const rx = roadX(wy);
        for (let k = 0; k < NS; k++) {
          const sx = k * STEP;
          if (r > 0) {
            sShore[k] = fbm(sx * 0.03 + 5, wy * 0.03);
            sCur[k] = fbm(sx * 0.012 + 70, wy * 0.006);
          }
          if (r < 1) {
            sDense[k] = fbm(sx * 0.028 + 100, wy * 0.028);
            sPaddy[k] = fbm(sx * 0.012 + 300, wy * 0.012 + 50);
          }
        }
        for (let x = 0; x < CW; x++) {
          let col, colB = null;
          const w = r > 0 ? r + (lerpRow(sShore, x) - 0.5) * 0.42 - 0.5 : -1;
          if (w > 0) {
            // ---- WATER: deeper toward the middle of the river band
            // shallow near the bank, then broad current bands from low-frequency noise
            const depth = Math.min(1, w * 5) * (0.3 + lerpRow(sCur, x) * 0.75) + (vnoise(x * 0.05, wy * 0.05) - 0.5) * 0.2;
            col = ramp([PAL.wat3, PAL.wat2, PAL.wat1, PAL.wat0], depth, x, wy);
            // two animation frames: ripple dashes drift sideways
            const rip = (s) => Math.sin(wy * 0.55 + Math.sin(x * 0.05 + wy * 0.02) * 2 + s) > 0.93 && hash(x >> 2, wy) > 0.45;
            colB = col;
            if (rip(0)) col = depth < 0.35 ? PAL.foam : PAL.wat3;
            if (rip(1.6)) colB = depth < 0.35 ? PAL.foam : PAL.wat3;
            if (w < 0.03) { col = PAL.foam; colB = (x + wy) % 3 ? PAL.foam : PAL.wat3; }   // surf line
            if (depth > 0.3 && hash(x, wy) > 0.9985) glints.push([x, py]);
          } else if (r > 0 && w > -0.07) {
            // ---- SAND / MUD BANK
            col = ramp([PAL.snd0, PAL.snd1, PAL.snd2], 0.6 + w * 6 + (hash(x, wy) - 0.5) * 0.4, x, wy);
          } else {
            // ---- LAND
            const dense = lerpRow(sDense, x);
            const paddy = lerpRow(sPaddy, x);
            const onRoad = Math.abs(x - rx) < 4.5 && r < 0.05;
            const grassT = 0.35 + (vnoise(x * 0.08, wy * 0.08) - 0.5) * 0.8 + (hash(x, wy) - 0.5) * 0.12;
            if (onRoad) {
              const edge = Math.abs(x - rx) > 3.5;
              col = edge ? PAL.drt1 : (Math.abs(x - rx) < 0.9 || Math.abs(Math.abs(x - rx) - 2.4) < 0.5 ? PAL.drt1 : ramp([PAL.drt2, PAL.drt3], hash(x, wy) * 0.6, x, wy));
            } else if (paddy > 0.6 && dense < 0.58) {
              // rice paddies: grid of flooded plots separated by earthen dikes
              const gx = ((x + 1000) % 22), gy = ((wy + 1000) % 15);
              if (gx === 0 || gy === 0) col = PAL.padDike;
              else {
                const plot = hash(Math.floor((x + 1000) / 22), Math.floor((wy + 1000) / 15));
                col = plot > 0.55 ? ((x + wy * 2) % 4 === 0 ? PAL.padRice : PAL.pad1)
                                  : (hash(x, wy) > 0.97 ? PAL.foam : PAL.pad0);
              }
            } else {
              col = ramp([PAL.grs0, PAL.grs1, PAL.grs2, PAL.grs3], grassT - Math.max(0, dense - 0.5) * 3, x, wy);
            }
            if (r > 0) {
              // land under a fading river zone darkens toward the bank (wet soil)
              const wet = Math.min(1, (w + 0.25) / 0.18);
              if (wet > dith(x, wy)) col = PAL.grs0;
            }
          }
          if (!colB) colB = col;
          const i = (py * CW + x) * 4;
          const a = ids[0].data, b = ids[1].data;
          a[i] = col[0]; a[i + 1] = col[1]; a[i + 2] = col[2]; a[i + 3] = 255;
          b[i] = colB[0]; b[i + 1] = colB[1]; b[i + 2] = colB[2]; b[i + 3] = 255;
        }
      }
      frames.forEach((f, k) => f.getContext('2d').putImageData(ids[k], 0, 0));

      // ---- DECALS: deterministic per world cell; cells from neighbouring chunks are
      // included so trees that straddle a chunk edge are drawn in both halves.
      const decals = [];
      const CELL = 9;
      const cy0 = Math.floor((y0 - 16) / CELL), cy1 = Math.floor((y0 + CH + 16) / CELL);
      for (let gy = cy0; gy <= cy1; gy++) {
        for (let gx = -2; gx <= Math.ceil(CW / CELL) + 1; gx++) {
          const hx = hash(gx * 3 + 7, gy * 5 + 1), hy = hash(gx * 11 + 3, gy * 7 + 9);
          const x = gx * CELL + hx * CELL, wy = gy * CELL + hy * CELL;
          const r = riverAt(wy);
          if (r > 0 && waterAt(x, wy, r) > 0.02) {
            const pick = hash(gx * 13 + 1, gy * 17 + 5);
            if ((x < 16 || x > CW - 16) && pick > 0.25) decals.push({ img: REEDS[Math.floor(pick * 9) % REEDS.length], x, wy, z: 1 });
            else if (pick > 0.975) decals.push({ img: LILIES[Math.floor(pick * 80) % LILIES.length], x, wy, z: 0 });
            continue;
          }
          if (r > 0 && waterAt(x, wy, r) > -0.12) continue;          // keep off banks
          if (Math.abs(x - roadX(wy)) < 9 && r < 0.05) {              // huts sit beside the road
            if (hash(gx, gy * 3) > 0.93) decals.push({ img: HUTS[(gx + gy) & 1], x: x + (x < roadX(wy) ? -10 : 6), wy, z: 1 });
            continue;
          }
          const dense = fbm(x * 0.028 + 100, wy * 0.028);
          const paddy = fbm(x * 0.012 + 300, wy * 0.012 + 50);
          if (paddy > 0.6 && dense < 0.58) continue;
          const pick = hash(gx * 13 + 1, gy * 17 + 5);
          if (dense > 0.54 && pick > 0.12) {
            const big = dense > 0.64 ? 6 : 0;
            decals.push({ img: TREES[(Math.floor(pick * 6) + big) % TREES.length], x, wy, z: 2, tree: true });
          } else if (dense > 0.45 && pick > 0.8) {
            decals.push({ img: TREES[Math.floor(pick * 4) % 4], x, wy, z: 2, tree: true });
          } else if (pick > 0.985) {
            decals.push({ img: CRATERS[Math.floor(pick * 300) % 3], x, wy, z: 0 });
          }
        }
      }
      decals.sort((a, b) => a.z - b.z || b.wy - a.wy);
      for (const f of frames) {
        const g = f.getContext('2d');
        // tree shadows first (offset down-right), then craters/huts, then canopies
        g.fillStyle = 'rgba(6,14,8,0.45)';
        for (const d of decals) if (d.tree) {
          const py = (y0 + CH - 1 - d.wy);
          g.beginPath();
          g.ellipse(Math.round(d.x + 3), Math.round(py + 4), d.img.width / 2 - 1, d.img.height / 2 - 2, 0, 0, Math.PI * 2);
          g.fill();
        }
        for (const d of decals) {
          const py = (y0 + CH - 1 - d.wy);
          g.drawImage(d.img, Math.round(d.x - d.img.width / 2), Math.round(py - d.img.height / 2));
        }
        // knock the map back a step so units, bullets and pickups always read on top
        g.fillStyle = 'rgba(10,20,14,0.24)';
        g.fillRect(0, 0, CW, CH);
      }
      return { frames, glints };
    }

    function getChunk(ci) {
      let c = cache.get(ci);
      if (!c) {
        c = buildChunk(ci);
        cache.set(ci, c);
        if (cache.size > 16) cache.delete(cache.keys().next().value);
      }
      return c;
    }

    // screenY = H - (worldY - scrollY)  (same mapping the game uses)
    function draw(ctx, scrollY, H) {
      const prevSmooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      const t = performance.now();
      const frame = Math.floor(t / 420) & 1;
      const ciLo = Math.floor(scrollY / CH) - 1, ciHi = Math.floor((scrollY + H) / CH) + 1;
      // sub-pixel scroll snapped to the device-pixel grid (canvas is 1.5×) to avoid shimmer
      const snap = v => Math.round(v * 1.5) / 1.5;
      for (let ci = ciLo; ci <= ciHi; ci++) {
        const c = getChunk(ci);
        const topWorld = ci * CH + CH - 1;
        const sy = snap(H - (topWorld - scrollY) - 1);
        ctx.drawImage(c.frames[frame], 0, sy);
        // twinkling glints on deep water
        for (const [gx, gy] of c.glints) {
          const ph = (t * 0.004 + gx * 0.37 + gy) % 6;
          if (ph < 1) {
            ctx.fillStyle = css(PAL.glint);
            ctx.fillRect(gx - (ph < 0.5 ? 0 : 1), sy + gy, ph < 0.5 ? 1 : 3, 1);
            if (ph >= 0.5) ctx.fillRect(gx, sy + gy - 1, 1, 3);
          }
        }
      }
      ctx.imageSmoothingEnabled = prevSmooth;
    }
    // Warm the cache ahead of the camera during idle time (avoids hitches on mobile)
    function prefetch(scrollY, H) {
      const ahead = Math.floor((scrollY + H) / CH) + 2;
      if (!cache.has(ahead)) getChunk(ahead);
    }
    return { draw, prefetch };
  }

  // ========================
  // SPRITES — crisp pixel version of any source image at its on-screen size
  // ========================
  const spriteCache = new Map();
  // Downscale with area-averaging, harden alpha, add a 1px dark outline and build white
  // (hit flash) and dark (ground shadow) silhouettes.  Returns { img, flash, shadow, w, h }.
  function pixelize(src, sx, sy, sw, sh, w, h, key) {
    const ck = `${key}|${w}|${h}`;
    let p = spriteCache.get(ck);
    if (p) return p;
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    // step-down resample (halving) keeps fine detail instead of aliasing
    let cur = src, cw = sw, ch = sh, cx = sx, cy = sy;
    while (cw / 2 >= w * 1.5 && ch / 2 >= h * 1.5) {
      const nw = Math.ceil(cw / 2), nh = Math.ceil(ch / 2);
      const t = makeCanvas(nw, nh), tg = t.getContext('2d');
      tg.imageSmoothingEnabled = true; tg.imageSmoothingQuality = 'high';
      tg.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
      cur = t; cx = 0; cy = 0; cw = nw; ch = nh;
    }
    const small = makeCanvas(w, h), sg = small.getContext('2d');
    sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high';
    sg.drawImage(cur, cx, cy, cw, ch, 0, 0, w, h);
    let id;
    try { id = sg.getImageData(0, 0, w, h); } catch { return null; }   // tainted (file://)
    const d = id.data;
    const out = makeCanvas(w + 2, h + 2), og = out.getContext('2d');
    const od = og.createImageData(w + 2, h + 2);
    const fl = makeCanvas(w + 2, h + 2), fg = fl.getContext('2d');
    const fd = fg.createImageData(w + 2, h + 2);
    const shd = makeCanvas(w + 2, h + 2), shg = shd.getContext('2d');
    const sd = shg.createImageData(w + 2, h + 2);
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] >= 110;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      const o = ((y + 1) * (w + 2) + (x + 1)) * 4;
      if (solid(x, y)) {
        const i = (y * w + x) * 4, a = d[i + 3] / 255;
        // un-premultiply edge pixels and add a touch of contrast
        for (let k = 0; k < 3; k++) {
          const v = Math.min(255, d[i + k] / Math.max(a, 0.4));
          od.data[o + k] = Math.max(0, Math.min(255, (v - 128) * 1.16 + 138));   // lift units off the map
        }
        od.data[o + 3] = 255;
        fd.data[o] = fd.data[o + 1] = fd.data[o + 2] = 255; fd.data[o + 3] = 255;
        sd.data[o] = 4; sd.data[o + 1] = 10; sd.data[o + 2] = 6; sd.data[o + 3] = 255;
      } else if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        od.data[o] = PAL.outline[0]; od.data[o + 1] = PAL.outline[1]; od.data[o + 2] = PAL.outline[2];
        od.data[o + 3] = 235;
        fd.data[o] = fd.data[o + 1] = fd.data[o + 2] = 255; fd.data[o + 3] = 255;
      }
    }
    og.putImageData(od, 0, 0);
    fg.putImageData(fd, 0, 0);
    shg.putImageData(sd, 0, 0);
    p = { img: out, flash: fl, shadow: shd, w: w + 2, h: h + 2 };
    if (spriteCache.size > 800) spriteCache.clear();   // bound memory if sizes vary a lot
    spriteCache.set(ck, p);
    return p;
  }

  // ========================
  // PIXEL FONT — 5×7 bitmap glyphs, drawn at integer scales with a drop shadow.
  // installPixelFont(ctx) re-routes ctx.fillText / ctx.measureText so every string
  // in the game uses it without touching the call sites.
  // ========================
  const GLYPHS = {
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'C': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    'G': ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'I': ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
    'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
    '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
    ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
    ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
    ';': ['.....', '.##..', '.##..', '.....', '.##..', '..#..', '.#...'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
    '"': ['.#.#.', '.#.#.', '.....', '.....', '.....', '.....', '.....'],
    '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '|': ['..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
    ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
    '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
    ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
    '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
    '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
    '%': ['##...', '##..#', '...#.', '..#..', '.#...', '#..##', '...##'],
    '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '#####', '.#.#.', '.#.#.'],
    '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
    '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
    '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
    '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
    '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.###.'],
    '~': ['.....', '.....', '.#...', '#.#.#', '...#.', '.....', '.....'],
    '^': ['..#..', '.#.#.', '#...#', '.....', '.....', '.....', '.....'],
    '—': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
    '▲': ['.....', '..#..', '.###.', '#####', '.....', '.....', '.....'],
    '▼': ['.....', '.....', '.....', '#####', '.###.', '..#..', '.....'],
    '★': ['..#..', '..#..', '#####', '.###.', '.###.', '##.##', '#...#'],
    '♥': ['.....', '##.##', '#####', '#####', '.###.', '..#..', '.....'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  };
  const FONT_CHARS = Object.keys(GLYPHS);
  const GW = 5, GH = 7, ADV = 6;   // glyph size + advance at scale 1
  // White atlas: one row of glyphs, scale 1
  const fontAtlas = makeCanvas(FONT_CHARS.length * ADV, GH);
  {
    const g = fontAtlas.getContext('2d');
    g.fillStyle = '#fff';
    FONT_CHARS.forEach((ch, i) => GLYPHS[ch].forEach((row, y) => {
      for (let x = 0; x < GW; x++) if (row[x] === '#') g.fillRect(i * ADV + x, y, 1, 1);
    }));
  }
  const glyphIndex = new Map(FONT_CHARS.map((c, i) => [c, i]));
  const tinted = new Map();   // fillStyle → tinted atlas (bounded LRU)
  function tintAtlas(color) {
    let a = tinted.get(color);
    if (a) { tinted.delete(color); tinted.set(color, a); return a; }
    a = makeCanvas(fontAtlas.width, fontAtlas.height);
    const g = a.getContext('2d');
    g.drawImage(fontAtlas, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, a.width, a.height);
    tinted.set(color, a);
    if (tinted.size > 48) tinted.delete(tinted.keys().next().value);
    return a;
  }
  // map a CSS font size to an integer glyph scale (8–12px → 1, 14–20px → 2, 24–28px → 3)
  function fontScale(font) {
    const m = /(\d+(?:\.\d+)?)px/.exec(font);
    const px = m ? parseFloat(m[1]) : 10;
    return Math.max(1, Math.round(px / 9));
  }
  function installPixelFont(ctx) {
    const SHADOW = 'rgba(8,12,8,0.85)';
    ctx.measureText = function (text) {
      return { width: String(text).length * ADV * fontScale(this.font) - fontScale(this.font) };
    };
    ctx.fillText = function (text, x, y) {
      text = String(text).toUpperCase();
      const s = fontScale(this.font);
      const style = this.fillStyle;
      if (typeof style !== 'string') return;
      const atlas = tintAtlas(style), shadow = tintAtlas(SHADOW);
      const bold = /bold/.test(this.font) && s === 1;
      const prev = this.imageSmoothingEnabled;
      this.imageSmoothingEnabled = false;
      // snap to the device-pixel grid (canvas is 1.5×) so glyphs stay crisp
      let cx = Math.round(x * 1.5) / 1.5;
      const top = Math.round((y - GH * s) * 1.5) / 1.5;
      for (const ch of text) {
        const gi = glyphIndex.get(ch);
        if (gi !== undefined && ch !== ' ') {
          this.drawImage(shadow, gi * ADV, 0, GW, GH, cx + s, top + s, GW * s, GH * s);
          this.drawImage(atlas, gi * ADV, 0, GW, GH, cx, top, GW * s, GH * s);
          if (bold) this.drawImage(atlas, gi * ADV, 0, GW, GH, cx + 0.67, top, GW * s, GH * s);
        }
        cx += ADV * s;
      }
      this.imageSmoothingEnabled = prev;
    };
  }

  return { PAL, css, hash, vnoise, fbm, createTerrain, pixelize, makeCanvas, installPixelFont };
})();
