// Steel Rain - Vietnam '69
// Vertical Shoot 'em Up — uses real pixel art assets

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 320, H = 480;
// Canvas จริง 480×720 → scale 1.5× ให้ทุก draw call ใช้พิกัด 320×480 เหมือนเดิม
// แต่ render ที่ความละเอียดสูงกว่า → ตัวหนังสือชัด ไม่เบลอ
ctx.scale(1.5, 1.5);

// ========================
// AUDIO ENGINE
// ========================
const sfx = {};
const music = {};
let musicVol = 0.45, sfxVol = 0.55;
let currentMusic = null;

function loadSfx(key, path, volume = 1.0) {
  const a = new Audio(path);
  a.volume = volume * sfxVol;
  sfx[key] = a;
}

function loadMusic(key, path) {
  const a = new Audio(path);
  a.loop = true;
  a.volume = musicVol;
  music[key] = a;
}

// A3 — crossfade between tracks instead of a hard cut
function playMusic(key) {
  if (currentMusic === key) return;
  const prev = currentMusic;
  currentMusic = key;
  const next = music[key];
  if (next) {
    next.currentTime = 0;
    next.volume = 0;
    next.play().catch(() => {});
  }
  const prevTrack = prev && music[prev];
  const steps = 12, dur = 40;
  let n = 0;
  const fade = setInterval(() => {
    n++;
    const t = n / steps;
    if (next) next.volume = musicVol * musicDuck * t;
    if (prevTrack) prevTrack.volume = musicVol * musicDuck * (1 - t);
    if (n >= steps) {
      clearInterval(fade);
      if (prevTrack) { prevTrack.pause(); prevTrack.currentTime = 0; }
    }
  }, dur);
}

// A2 — duck music under big moments (bomb / boss / death), then ramp back
let musicDuck = 1;
let duckTimer = null;
function duckMusic(amount = 0.35, holdMs = 500) {
  musicDuck = amount;
  if (currentMusic && music[currentMusic]) music[currentMusic].volume = musicVol * musicDuck;
  if (duckTimer) clearInterval(duckTimer);
  setTimeout(() => {
    duckTimer = setInterval(() => {
      musicDuck = Math.min(1, musicDuck + 0.06);
      if (currentMusic && music[currentMusic]) music[currentMusic].volume = musicVol * musicDuck;
      if (musicDuck >= 1) { clearInterval(duckTimer); duckTimer = null; }
    }, 40);
  }, holdMs);
}

// A1 — randomized explosion sound (death sfx + occasional blast layer)
function playExplosionSfx() {
  playSfx(Math.random() < 0.5 ? 'enemy_die1' : 'enemy_die2', 0.3);
  if (Math.random() < 0.5) playSfx(Math.random() < 0.5 ? 'blast1' : 'blast2', 0.25);
}

function playSfx(key, pitchVariance = 0) {
  const src = sfx[key];
  if (!src) return;
  // Clone node for overlapping sounds
  try {
    const clone = src.cloneNode();
    clone.volume = src.volume * (0.85 + Math.random() * 0.3);
    if (pitchVariance > 0) clone.playbackRate = 1 + (Math.random() - 0.5) * pitchVariance;
    clone.play().catch(() => {});
  } catch(e) {}
}

// Music
loadMusic('menu',   'assets/Music/MP3/Game_menu_theme_loopable.mp3');
loadMusic('battle', 'assets/Music/MP3/Battle_theme_loopable.mp3');
loadMusic('night',  'assets/Music/MP3/Main_theme_night_city_loopable.mp3');

// SFX — mapped to game events
loadSfx('gun',        'assets/Sounds/Laser_shot.wav',         0.35);
loadSfx('rocket',     'assets/Sounds/Tank_shot.wav',          0.7);
loadSfx('enemy_die1', 'assets/Sounds/Tech_death_1.wav',       0.6);
loadSfx('enemy_die2', 'assets/Sounds/Tech_death_2.wav',       0.6);
loadSfx('boss_shot',  'assets/Sounds/Truck_gun_shot.wav',     0.5);
loadSfx('heli_fly',   'assets/Sounds/Helicopter_walk.wav',    0.3);
loadSfx('heli_start', 'assets/Sounds/Helicopter_engine_start.wav', 0.6);
loadSfx('heli_stop',  'assets/Sounds/Helicopter_engine_stop.wav',  0.6);
loadSfx('player_hit', 'assets/Sounds/Walkie_talkie.wav',      0.55);
loadSfx('collect',    'assets/Sounds/Collect_sound.wav',      0.5);
loadSfx('coin',       'assets/Sounds/Coin_drop.wav',          0.4);
// A1 — extra explosion layers for variety
loadSfx('blast1',     'assets/Sounds/Crate_open_1.wav',       0.5);
loadSfx('blast2',     'assets/Sounds/Crate_open_2_steam.wav', 0.5);
// A4 — arcade / UI feedback
loadSfx('coin_in',    'assets/Sounds/Insert_coin.wav',        0.6);
loadSfx('ui_move',    'assets/Sounds/Neon_1.wav',             0.4);
loadSfx('ui_confirm', 'assets/Sounds/Print_ticket.wav',       0.5);
// A5 — warning
loadSfx('warning',    'assets/Sounds/Police_signal.wav',      0.5);

// Helicopter ambient (continuous loop)
let heliLoop = null;
function startHeliLoop() {
  if (heliLoop) return;
  heliLoop = sfx['heli_fly'] ? sfx['heli_fly'].cloneNode() : null;
  if (heliLoop) { heliLoop.loop = true; heliLoop.volume = 0.25; heliLoop.play().catch(() => {}); }
}
function stopHeliLoop() {
  if (heliLoop) { heliLoop.pause(); heliLoop = null; }
}

// ========================
// ASSET LOADER
// ========================
const imgs = {};
let assetsLoaded = 0, assetsTotal = 0;

function loadImg(key, path) {
  assetsTotal++;
  const img = new Image();
  img.onload = () => assetsLoaded++;
  img.onerror = () => assetsLoaded++; // count even on failure
  img.src = path;
  imgs[key] = img;
}

function ready(key) {
  return imgs[key] && imgs[key].complete && imgs[key].naturalWidth > 0;
}

// Boats (animated, 4 frames)
for (let f = 1; f <= 4; f++) {
  loadImg(`boat1_${f}`, `assets/PNG/Boat1_water_animation_color1/Boat1_water_frame${f}.png`);
  loadImg(`boat2_${f}`, `assets/PNG/Boat2_water_animation_color/Boat2_water_frame${f}.png`);
  loadImg(`boat3_${f}`, `assets/PNG/Boat3_water_animation_color1/Boat3_water_frame${f}.png`);
  loadImg(`boat4_${f}`, `assets/PNG/Boat4_water_animation_color1/Boat4_water_frame${f}.png`);
}
// Static boat sprites
for (let f = 1; f <= 4; f++) {
  loadImg(`boat_s1_${f}`, `assets/PNG/Boats_color1/Boat_color1_${f}.png`);
  loadImg(`boat_s2_${f}`, `assets/PNG/Boats_color2/Boat_color2_${f}.png`);
  loadImg(`boat_s3_${f}`, `assets/PNG/Boats_color3/Boat_color3_${f}.png`);
}
// Cannons (cannon2 has 3 frames, others have 4)
for (let f = 1; f <= 4; f++) {
  loadImg(`cannon1_${f}`, `assets/PNG/Cannon1_color1/Cannon1_color1_${f}.png`);
  loadImg(`cannon3_${f}`, `assets/PNG/Cannon3_color1/Cannon3_color1_${f}.png`);
}
for (let f = 1; f <= 3; f++) {
  loadImg(`cannon2_${f}`, `assets/PNG/Cannon2_color1/Cannon2_color1_${f}.png`);
}
// Fire / Explosion (3 frames each)
for (let t = 1; t <= 4; t++) {
  const maxF = 3;
  for (let f = 1; f <= maxF; f++) {
    loadImg(`fire${t}_${f}`, `assets/PNG/Fire${t}/Fire${t}_${f}.png`);
  }
}
// Broken asset (death animation, 8 frames)
for (let f = 1; f <= 8; f++) {
  loadImg(`broken_water_${f}`, `assets/PNG/Broken_asset_water/Broken_asset_water${f}.png`);
  loadImg(`broken_${f}`, `assets/PNG/Broken_asset/Broken_asset${f}.png`);
}
// Water tiles (64x64, 28 tiles numbered water1..water28)
for (let f = 1; f <= 28; f++) {
  const num = String(74 + f - 1).padStart(4, '0');
  loadImg(`water_${f}`, `assets/PNG/Tileset/tile_${num}_water${f}.png`);
}
// Shadows
for (let f = 1; f <= 4; f++) {
  loadImg(`shadow_boat_${f}`, `assets/PNG/Shadows/Boat_color1_${f}.png`);
}

// Player helicopter sprite sheet
// 1536×1024 — 4 frames แนวนอน, แต่ละ frame 384×1024
const HELI_FRAME_W = 384;
const HELI_FRAME_H = 1024;
const HELI_DST_W   = 44;                                               // กว้างบนจอ
const HELI_DST_H   = Math.round(HELI_DST_W * HELI_FRAME_H / HELI_FRAME_W); // ~117px

let heliCanvas = null; // offscreen canvas พื้นใส

function buildHeliCanvas(srcImg) {
  // สร้าง offscreen canvas ขนาดเท่า spritesheet แล้วลบพื้นขาวออก
  const oc   = document.createElement('canvas');
  oc.width   = srcImg.width;
  oc.height  = srcImg.height;
  const octx = oc.getContext('2d');
  octx.drawImage(srcImg, 0, 0);
  const imgData = octx.getImageData(0, 0, oc.width, oc.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    // ลบพื้นขาว/เทาอ่อน (threshold 230)
    if (r > 230 && g > 230 && b > 230) d[i+3] = 0;
    // anti-alias edge: semi-transparent ตามความสว่าง
    else if (r > 200 && g > 200 && b > 200)
      d[i+3] = Math.round(255 * (1 - (Math.min(r,g,b) - 200) / 55));
  }
  octx.putImageData(imgData, 0, 0);
  heliCanvas = oc;
}

// โหลด spritesheet แล้ว process เมื่อโหลดเสร็จ
(function() {
  const img = new Image();
  img.onload = () => buildHeliCanvas(img);
  img.src = 'assets/PNG/heli-spi.png';
  imgs['heli_sheet'] = img;
})();

// ========================
// BACKGROUND OBJECT SPRITES
// ========================

// ลบพื้นขาว/เทาออกจาก Image → คืน offscreen Canvas พื้นใส
function removeWhiteBg(srcImg, threshold = 230) {
  const oc = document.createElement('canvas');
  oc.width = srcImg.width; oc.height = srcImg.height;
  const oc2 = oc.getContext('2d');
  oc2.drawImage(srcImg, 0, 0);
  const id = oc2.getImageData(0, 0, oc.width, oc.height);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    if (r > threshold && g > threshold && b > threshold) {
      d[i+3] = 0;
    } else if (r > threshold - 30 && g > threshold - 30 && b > threshold - 30) {
      d[i+3] = Math.round(255 * (1 - (Math.min(r,g,b) - (threshold-30)) / 30));
    }
  }
  oc2.putImageData(id, 0, 0);
  return oc;
}

// Rocks — Rock1_1 … Rock8_1  (64×64 per image)
const rockCanvases = [];  // [0..7] processed canvases
(function() {
  for (let n = 1; n <= 8; n++) {
    const idx = n - 1;
    const img = new Image();
    img.onload = () => { rockCanvases[idx] = removeWhiteBg(img, 220); };
    img.src = `assets/PNG/Objects_separately/Rock${n}_1.png`;
  }
})();

// Tank sprites (Color_C = green/jungle camo, Hull 256×256, Gun 94×212)
let tankHullCanvas = null, tankGunCanvas = null;
(function() {
  const hImg = new Image();
  hImg.onload = () => { tankHullCanvas = removeWhiteBg(hImg, 240); };
  hImg.src = 'assets/PNG/tank-assets/PNG/Hulls_Color_C/Hull_01.png';
  const gImg = new Image();
  gImg.onload = () => { tankGunCanvas = removeWhiteBg(gImg, 240); };
  gImg.src = 'assets/PNG/tank-assets/PNG/Weapon_Color_A/Gun_01.png';
})();

// Plants sprite sheet  768×432 — grid 12 cols × 6 rows, cell 64×72
// เลือกเฉพาะ cell ที่เหมาะกับป่า/ทุ่งเวียดนาม
let plantsCanvas = null;
const PLANT_CW = 64, PLANT_CH = 72;
// cell พิกัด (col, row) → (srcX, srcY) ที่ต้องการใช้
const PLANT_CELLS = [
  [0, 2],  // 0: flat 2-leaf bush (ป่า)
  [0, 3],  // 1: wide leaf cluster
  [1, 2],  // 2: small round green bush
  [1, 3],  // 3: oval green shrub
  [0, 5],  // 4: aloe / grass cluster
  [1, 5],  // 5: small weeds/mushrooms
];
(function() {
  const img = new Image();
  img.onload = () => { plantsCanvas = removeWhiteBg(img, 235); };
  img.src = 'assets/PNG/Plants.png';
})();

let heliAnimFrame = 0;
let heliAnimTimer  = 0;

function tickHeliAnim(dt) {
  heliAnimTimer += dt;
  if (heliAnimTimer >= 0.1) {
    heliAnimTimer = 0;
    heliAnimFrame = (heliAnimFrame + 1) % 4;
  }
}

function drawPlayerHeli(cx, cy, alpha = 1) {
  const src = heliCanvas || imgs['heli_sheet'];
  if (!src || (src instanceof HTMLImageElement && (!src.complete || !src.naturalWidth))) {
    drawPixels(HELI_PIXELS, Math.round(cx - 8), Math.round(cy - 7), 2);
    return;
  }
  const sx   = heliAnimFrame * HELI_FRAME_W;
  ctx.save();
  ctx.globalAlpha = alpha;
  // N1 — banking tilt
  const tilt = (player && player.tilt) || 0;
  ctx.translate(Math.round(cx), Math.round(cy));
  if (tilt) ctx.rotate(tilt);
  ctx.drawImage(src, sx, 0, HELI_FRAME_W, HELI_FRAME_H, -HELI_DST_W / 2, -HELI_DST_H / 2, HELI_DST_W, HELI_DST_H);
  ctx.restore();
}

// ========================
// SPRITE HELPER
// ========================
function drawSprite(key, x, y, w, h, flipX = false, angle = 0) {
  const img = imgs[key];
  if (!img || !img.complete || !img.naturalWidth) return false;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (angle) ctx.rotate(angle);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

// Soft drop shadow under a unit — grounds sprites above the terrain
function drawShadow(cx, cy, w, h, alpha = 0.24) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx + 2, cy + h * 0.32, w * 0.42, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Animated boat frame (0–3) based on time
function boatFrame() { return Math.floor(Date.now() / 150) % 4 + 1; }
function fireFrame(offset = 0) { return Math.floor((Date.now() + offset * 80) / 100) % 3 + 1; }
function brokenFrame(t) { return Math.min(8, Math.floor(t * 8) + 1); }

// ========================
// PIXEL ART PLAYER HELICOPTER (no matching asset)
// ========================
function drawPixels(pixels, x, y, scale = 2) {
  pixels.forEach(([px, py, color]) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
  });
}

const HELI_PIXELS = [
  [0,0,'#888'],[1,0,'#888'],[2,0,'#888'],[3,0,'#888'],[4,0,'#888'],[5,0,'#888'],[6,0,'#888'],[7,0,'#888'],
  [3,1,'#4a7c3f'],[4,1,'#4a7c3f'],
  [2,2,'#5a9c4f'],[3,2,'#6db35a'],[4,2,'#6db35a'],[5,2,'#5a9c4f'],
  [2,3,'#4a7c3f'],[3,3,'#8fbc6a'],[4,3,'#8fbc6a'],[5,3,'#4a7c3f'],
  [3,4,'#5a9c4f'],[4,4,'#5a9c4f'],
  [3,5,'#3d6b35'],[4,5,'#3d6b35'],
  [3,6,'#3d6b35'],[4,6,'#3d6b35'],
  [2,6,'#666'],[5,6,'#666'],
  [1,3,'#555'],[6,3,'#555'],
  [0,3,'#444'],[7,3,'#444'],
  [3,1,'#333'],[4,1,'#333'],
];

// ========================
// TERRAIN with water tiles
// ========================
class Terrain {
  constructor() {
    // โซนแผนที่: แต่ละโซนมีความยาวเป็น world-pixel
    this.zones = [
      { start:    0, end: 2400, type: 'jungle' },  // Mission 1: LZ
      { start: 2400, end: 2800, type: 'trans_jr' }, // transition jungle→river
      { start: 2800, end: 4200, type: 'river'   },  // Mission 2: Mekong
      { start: 4200, end: 4600, type: 'trans_rj' }, // transition river→jungle
      { start: 4600, end: 6600, type: 'jungle'  },  // Mission 3: jungle night
      { start: 6600, end: 7000, type: 'trans_jr' },
      { start: 7000, end: 8000, type: 'river'   },
    ];
    this.totalLen = 8000;
  }

  // คืนค่า 0-1 ของแต่ละ type ณ ตำแหน่ง worldY (สำหรับ blend)
  _zoneBlend(worldY) {
    const wy = ((worldY % this.totalLen) + this.totalLen) % this.totalLen;
    for (const z of this.zones) {
      if (wy >= z.start && wy < z.end) {
        const t = (wy - z.start) / (z.end - z.start); // 0→1 ภายใน zone
        if (z.type === 'trans_jr') return { river: t };          // jungle→river
        if (z.type === 'trans_rj') return { river: 1 - t };      // river→jungle
        if (z.type === 'river')    return { river: 1 };
        return { river: 0 };
      }
    }
    return { river: 0 };
  }

  // สีพื้นดิน ณ ตำแหน่ง worldY (ไม่มี grid)
  _groundColor(worldY) {
    const blend = this._zoneBlend(worldY);
    const r = blend.river || 0;

    // noise หลายความถี่ → เนื้อสัมผัสธรรมชาติ ไม่เป็นก้อน
    const n1 = Math.sin(worldY * 0.031 + 1.7) * 0.5 + 0.5;
    const n2 = Math.sin(worldY * 0.097 + 0.4) * 0.25 + 0.25;
    const n  = n1 * 0.7 + n2 * 0.3;

    // สีป่า (jungle) — richer, wider tonal range for depth
    const jR =  18 + n * 26 | 0;
    const jG =  60 + n * 58 | 0;
    const jB =  12 + n * 14 | 0;

    // สีแม่น้ำ (river) — shimmer ตาม time
    const shimmer = Math.sin(worldY * 0.15 + Date.now() * 0.002) * 0.12 + 0.88;
    const wR = 14  * shimmer | 0;
    const wG = (55 + n * 18) * shimmer | 0;
    const wB = (105 + n * 30) * shimmer | 0;

    // blend linear
    const fR = jR + (wR - jR) * r | 0;
    const fG = jG + (wG - jG) * r | 0;
    const fB = jB + (wB - jB) * r | 0;
    return `rgb(${fR},${fG},${fB})`;
  }

  draw(scrollY) {
    // top = ข้างหน้า (worldY สูง = ยิ่งบินไปข้างหน้า)
    // bottom = ข้างหลัง (worldY ต่ำ = ผ่านมาแล้ว)
    // formula: worldY = scrollY + H - sy
    const STRIP = 3;
    for (let sy = 0; sy <= H; sy += STRIP) {
      const worldY = scrollY + H - sy;
      ctx.fillStyle = this._groundColor(worldY);
      ctx.fillRect(0, sy, W, STRIP + 1);
    }
    this._drawFoliage(scrollY);
    this._drawObjects(scrollY);
  }

  _drawFoliage(scrollY) {
    // แถบใบไม้/ร่มเงาป่า (overlay streak)
    for (let sy = -8; sy < H + 8; sy += 6) {
      const worldY = scrollY + H - sy;
      const blend  = this._zoneBlend(worldY);
      if (blend.river > 0.6) continue;

      const hash = Math.sin(worldY * 0.37 + 4.1);
      if (hash < 0.25) {
        // N3 — gentle wind sway on the foliage streaks
        const sway  = Math.sin(worldY * 0.21 + Date.now() * 0.0011) * 3;
        const x1    = (Math.sin(worldY * 1.13) * 0.5 + 0.5) * W + sway;
        const w     = 15 + (Math.sin(worldY * 2.71) * 0.5 + 0.5) * 30;
        const alpha = (0.08 + (Math.sin(worldY * 0.89) * 0.5 + 0.5) * 0.10) * (1 - blend.river);
        ctx.fillStyle = `rgba(0,30,0,${alpha.toFixed(2)})`;
        ctx.fillRect(x1, sy, w, 6);
      }
    }
  }

  // วาด rock / plant / reed แบบ object จริงโดยใช้ sprite images
  _drawObjects(scrollY) {
    const STEP = 28; // world-unit ระหว่างแต่ละแถว object
    const startRow = Math.floor(scrollY / STEP) - 1;
    const endRow   = Math.ceil((scrollY + H) / STEP) + 1;

    for (let row = startRow; row <= endRow; row++) {
      const anchorW = row * STEP;
      const sy = H - (anchorW - scrollY); // worldY → screenY
      if (sy < -48 || sy > H + 48) continue;

      const blend = this._zoneBlend(anchorW);
      const river = blend.river || 0;

      // 1–3 object ต่อแถว (deterministic)
      const numObj = 1
        + (Math.abs(Math.sin(row * 7.31 + 0.5)) > 0.5 ? 1 : 0)
        + (Math.abs(Math.sin(row * 11.7  + 2.1)) > 0.7 ? 1 : 0);

      for (let i = 0; i < numObj; i++) {
        const hx    = Math.sin(row * 17.39 + i * 8.13 + 1.27);
        const htype = Math.sin(row * 5.71  + i * 11.37 + 3.41);
        const hsz   = Math.sin(row * 23.11 + i * 6.49  + 7.33);
        const x     = (hx * 0.5 + 0.5) * W;
        const sz01  = hsz * 0.5 + 0.5; // 0–1

        if (river < 0.4) {
          /* ===== JUNGLE: rock & plant ===== */
          if (htype > 0.15) {
            // 🪨 Rock sprite (Rock1–8)
            const rockIdx = Math.abs(Math.floor(Math.sin(row * 31.7 + i * 13.1) * 8)) % 8;
            const rc = rockCanvases[rockIdx];
            const dw = 14 + sz01 * 18; // 14–32px on screen
            const dh = dw;
            if (rc) {
              ctx.globalAlpha = 0.80 + sz01 * 0.15;
              ctx.drawImage(rc, 0, 0, 64, 64, x - dw / 2, sy - dh, dw, dh);
              ctx.globalAlpha = 1;
            } else {
              // fallback: rect
              const br = 55 + sz01 * 35 | 0;
              ctx.fillStyle = `rgba(${br+10},${br+3},${br-6},0.75)`;
              ctx.fillRect(x - dw/2, sy - dh, dw, dh);
            }

          } else if (htype < -0.15) {
            // 🌿 Plant sprite (PLANT_CELLS)
            const cellIdx = Math.abs(Math.floor(Math.sin(row * 19.3 + i * 7.9) * 6)) % PLANT_CELLS.length;
            const [col, prow] = PLANT_CELLS[cellIdx];
            const srcX = col * PLANT_CW;
            const srcY = prow * PLANT_CH;
            const dw = 18 + sz01 * 22; // 18–40px on screen
            const dh = Math.round(dw * PLANT_CH / PLANT_CW);
            if (plantsCanvas) {
              ctx.globalAlpha = 0.78 + sz01 * 0.18;
              ctx.drawImage(plantsCanvas, srcX, srcY, PLANT_CW, PLANT_CH,
                            x - dw / 2, sy - dh, dw, dh);
              ctx.globalAlpha = 1;
            } else {
              // fallback: ellipse
              const g = 65 + sz01 * 40 | 0;
              ctx.fillStyle = `rgba(10,${g},8,0.70)`;
              ctx.beginPath();
              ctx.ellipse(x, sy - dw * 0.4, dw * 0.55, dw * 0.42, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }

        } else if (river > 0.65) {
          /* ===== RIVER: reed ริมน้ำ + water lily ===== */
          if (x < 58 || x > W - 58) {
            // 🌾 Reed — วาด canvas (ไม่มี sprite เฉพาะ)
            const rh = 8 + sz01 * 13;
            const sway = Math.sin(row * 3.1 + i) * 1.5;
            ctx.fillStyle = `rgba(38,90,22,0.72)`;
            ctx.fillRect(x + sway - 1, sy - rh,        2, rh);
            ctx.fillStyle = `rgba(28,68,16,0.56)`;
            ctx.fillRect(x + sway + 2, sy - rh * 0.7,  1, rh * 0.7);
            ctx.fillStyle = `rgba(85,58,16,0.78)`;
            ctx.fillRect(x + sway - 1, sy - rh - 4, 2, 5);
          } else if (sz01 > 0.58) {
            // 🪷 Water lily — plant cell 4 (aloe ใช้แทน lily)
            const dw = 12 + sz01 * 12;
            const dh = Math.round(dw * PLANT_CH / PLANT_CW);
            if (plantsCanvas) {
              const [col, pr] = PLANT_CELLS[4]; // aloe/grass ริมน้ำ
              ctx.globalAlpha = 0.60;
              ctx.drawImage(plantsCanvas, col * PLANT_CW, pr * PLANT_CH,
                            PLANT_CW, PLANT_CH, x - dw/2, sy - dh, dw, dh);
              ctx.globalAlpha = 1;
            }
          }
        }
      }
    }
  }

  isRiver(scrollY, screenY) {
    const b = this._zoneBlend(scrollY + H - screenY);
    return (b.river || 0) > 0.5;
  }
}

// ========================
// GAME STATE
// ========================
const STATE = { TITLE: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3, MISSION_CLEAR: 4, NAME_ENTRY: 5 };

// Difficulty presets — scale player survivability and enemy pressure
const DIFFICULTY = {
  EASY:   { label: 'EASY',   hp: 7, ammo: 80, spawn: 1.35, enemyHp: 0.8, bulletSpeed: 0.8,  desc: 'Relaxed — more HP, fewer enemies' },
  NORMAL: { label: 'NORMAL', hp: 5, ammo: 60, spawn: 1.0,  enemyHp: 1.0, bulletSpeed: 1.0,  desc: 'Balanced challenge' },
  HARD:   { label: 'HARD',   hp: 3, ammo: 50, spawn: 0.72, enemyHp: 1.35, bulletSpeed: 1.25, desc: 'For veterans — deadly bullets' },
};
const DIFF_ORDER = ['EASY', 'NORMAL', 'HARD'];
let diffIndex = 1;                 // default NORMAL
let diff = DIFFICULTY.NORMAL;      // active preset

let state, player, bullets, enemies, particles, wreckages, score;
let bombFlash = 0;
let scrollY, mission, missionTimer, bossSpawned, boss;
let keys = {}, lastTime = 0, terrain;
let enemyTimer = 0;
let items = [];
let comboCount = 0, comboTimer = 0, comboDisplay = 0;
let screenShakeTrauma = 0;
let hitStop = 0;
let explosions = [];      // J1 — fire-sprite blasts on kill
let popups = [];          // J6 — floating pickup text
let playerHitFlash = 0;   // J4 — red screen flash when player is hit
// Presentation (ticket 005)
let fade = { a: 0, target: 0, onMid: null, midDone: true };  // M1 — screen fade
let missionCardTimer = 0; // M2/M4 — mission intro / victory banner
let missionCardText = '';
let missionCardSub = '';
let warningTimer = 0;     // M3 — boss WARNING banner
let victoryPending = false; // M4 — hold before name entry on final clear

// Name entry
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let playerName = ['A', 'A', 'A'];
let nameCursor = 0;
let nameConfirmed = false;
let nameEntryFromClear = false; // true = mission clear, false = game over

// ========================
// FIREBASE GLOBAL LEADERBOARD
// ========================
const FB_DB = 'https://steel-rain-8c8c2-default-rtdb.asia-southeast1.firebasedatabase.app';
let boardCache = [];      // top 10 โหลดจาก Firebase
let boardLoading = false; // แสดง "กำลังโหลด..."

async function fetchBoard() {
  boardLoading = true;
  try {
    const res = await fetch(`${FB_DB}/scores.json`);
    const data = await res.json();
    if (data && typeof data === 'object') {
      boardCache = Object.values(data)
        .filter(e => e && e.score != null)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } else {
      boardCache = [];
    }
  } catch {
    // fallback: ใช้ localStorage ถ้า Firebase ไม่ตอบสนอง
    try { boardCache = JSON.parse(localStorage.getItem('sr69_board') || '[]'); } catch {}
  }
  boardLoading = false;
}

function loadBoard() { return boardCache; }

async function addToBoard(name, sc, mission) {
  const entry = { name, score: sc, mission, ts: Date.now() };
  // Optimistic update: แสดงคะแนนตัวเองทันทีโดยไม่รอ Firebase
  boardCache = [...boardCache, entry].sort((a, b) => b.score - a.score).slice(0, 10);
  try {
    await fetch(`${FB_DB}/scores.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    // Refresh จาก Firebase เพื่อดึงคะแนนคนอื่นด้วย
    await fetchBoard();
  } catch {
    // Fallback: บันทึก localStorage ถ้า Firebase ล้มเหลว
    localStorage.setItem('sr69_board', JSON.stringify(boardCache));
  }
}

// โหลด leaderboard ครั้งแรกตอนเปิดเกม
fetchBoard();

// HTML Share buttons (injected over canvas)
let shareContainer = null;
function createShareButtons(name, sc) {
  removeShareButtons();
  const rect = canvas.getBoundingClientRect();
  shareContainer = document.createElement('div');
  shareContainer.id = 'share-btns';
  Object.assign(shareContainer.style, {
    position: 'fixed',
    left: rect.left + 'px',
    top: (rect.top + rect.height * 0.78) + 'px',
    width: rect.width + 'px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    pointerEvents: 'auto',
    zIndex: '100',
  });

  const gameUrl  = 'https://game.no-os.com/';
  const fbQuote  = `Steel Rain: Vietnam '69\n` +
                   `I just scored ${sc.toLocaleString()} as ${name}!\n` +
                   `Can you beat me?`;
  const lineText = `Steel Rain: Vietnam '69\n` +
                   `${name} scored ${sc.toLocaleString()}!\n` +
                   `Challenge me! ${gameUrl}`;

  const fbBtn = document.createElement('button');
  fbBtn.textContent = '📘 Facebook';
  styleShareBtn(fbBtn, '#1877f2');
  fbBtn.onclick = () => window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(fbQuote)}`,
    '_blank'
  );

  const lineBtn = document.createElement('button');
  lineBtn.textContent = '💬 LINE';
  styleShareBtn(lineBtn, '#06c755');
  lineBtn.onclick = () => window.open(`https://line.me/R/msg/text/?${encodedText}`, '_blank');

  const retryBtn = document.createElement('button');
  retryBtn.textContent = '🔄 Play Again';
  styleShareBtn(retryBtn, '#555');
  retryBtn.onclick = () => { removeShareButtons(); initGame(); };

  shareContainer.append(fbBtn, lineBtn, retryBtn);
  document.body.appendChild(shareContainer);
}
function styleShareBtn(btn, bg) {
  Object.assign(btn.style, {
    background: bg, color: '#fff', border: 'none',
    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
    fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
  });
}
function removeShareButtons() {
  if (shareContainer) { shareContainer.remove(); shareContainer = null; }
}

function initGame() {
  diff = DIFFICULTY[DIFF_ORDER[diffIndex]];
  state = STATE.PLAYING;
  terrain = new Terrain();
  scrollY = 0; mission = 1; missionTimer = 0; bossSpawned = false; boss = null; score = 0;
  playMusic('battle');
  playSfx('heli_start');
  setTimeout(startHeliLoop, 800);
  player = {
    x: W/2 - 8, y: H - 80, w: 16, h: 14,
    speed: 120, hp: diff.hp, maxHp: diff.hp,
    ammo: diff.ammo, maxAmmo: diff.ammo, bombs: 2, maxBombs: 2,
    shootCooldown: 0, bombCooldown: 0, invincible: 0, heatTimer: 0,
    powerLevel: 1, recoil: 0, muzzle: 0,
  };
  bullets = []; enemies = []; particles = []; wreckages = []; items = [];
  explosions = []; popups = []; playerHitFlash = 0;
  warningTimer = 0; victoryPending = false;
  showMissionCard();   // M2 — intro card for mission 1
  bombFlash = 0;
  enemyTimer = 0;
  comboCount = 0; comboTimer = 0; comboDisplay = 0;
  screenShakeTrauma = 0; hitStop = 0;
}

// ========================
// SPAWN
// ========================
const SCROLL_SPEED = 90; // px/s — ความเร็ว terrain (ต้องตรงกับ scrollY += 90*dt)

function spawnWave(dt) {
  enemyTimer -= dt;
  if (enemyTimer > 0) return;
  enemyTimer = (0.7 + Math.random() * 0.7) / diff.spawn; // scaled by difficulty (EASY slower, HARD faster)

  const onRiver = terrain.isRiver(scrollY, 80); // ตรวจที่ส่วนบนของจอ (ข้างหน้า)
  const roll = Math.random();

  if (onRiver) {
    /* ===== โซนแม่น้ำ: เรือเท่านั้น ===== */
    if (roll < 0.65) {
      // เรือลาดตระเวน 1 ลำ
      const dir = Math.random() < 0.5 ? 1 : -1;
      const variant = Math.floor(Math.random() * 3) + 1;
      const boatPattern = variant === 1 ? 'aimed' : variant === 2 ? 'fan3' : 'fan3';
      enemies.push({
        type: 'boat', variant,
        x: dir > 0 ? -60 : W + 10,
        y: 60 + Math.random() * (H - 220),
        w: 48, h: 48,
        hp: Math.ceil((5 + mission) * diff.enemyHp), maxHp: Math.ceil((5 + mission) * diff.enemyHp),
        speed: 55 + mission * 5, dir,
        shootTimer: 1 + Math.random(), shootRate: 1.4,
        points: 500, animOffset: Math.random() * 4 | 0,
        pattern: boatPattern,
      });
    } else {
      // กลุ่มเรือ 2–3 ลำ
      const count = 2 + (roll < 0.85 ? 0 : 1);
      const dir = Math.random() < 0.5 ? 1 : -1;
      for (let i = 0; i < count; i++) {
        enemies.push({
          type: 'boat', variant: 2,
          x: dir > 0 ? -60 - i * 65 : W + 10 + i * 65,
          y: 80 + Math.random() * (H - 280),
          w: 40, h: 40,
          hp: Math.ceil(3 * diff.enemyHp), maxHp: Math.ceil(3 * diff.enemyHp),
          speed: 58, dir,
          shootTimer: 1.5 + i * 0.4, shootRate: 1.8,
          points: 400, animOffset: i, pattern: 'aimed',
        });
      }
    }
  } else {
    /* ===== โซนบก: รถถัง + ป้อมปืน ===== */
    if (roll < 0.55) {
      // 🪖 รถถัง — เคลื่อนลงตามความเร็ว terrain + ลาดตระเวนแนวนอนเบาๆ
      const dir = Math.random() < 0.5 ? 1 : -1;
      enemies.push({
        type: 'tank',
        x: 20 + Math.random() * (W - 80),
        y: -50,
        w: 38, h: 38,
        hp: Math.ceil((6 + mission * 2) * diff.enemyHp), maxHp: Math.ceil((6 + mission * 2) * diff.enemyHp),
        vx: 0,                          // velocity X (ไล่ตาม player)
        maxVx: 38 + mission * 4,        // ความเร็วสูงสุดแนวนอน
        shootTimer: 1.2 + Math.random(), shootRate: 1.6 - mission * 0.1,
        points: 600, pattern: 'burst',
      });
    } else {
      // 🔫 ป้อมปืน AA — อยู่กับที่บนพื้น เลื่อนลงพร้อม terrain
      const variant = Math.floor(Math.random() * 3) + 1;
      const cannonPattern = variant === 1 ? 'cone' : variant === 2 ? 'fan3' : 'fan5';
      enemies.push({
        type: 'cannon', variant,
        x: 20 + Math.random() * (W - 80),
        y: -50,
        w: 40, h: 40,
        hp: Math.ceil((3 + mission) * diff.enemyHp), maxHp: Math.ceil((3 + mission) * diff.enemyHp),
        shootTimer: 0.8 + Math.random(), shootRate: 1.3 - mission * 0.1,
        points: 300, pattern: cannonPattern,
        // cannon ไม่มี speed — เลื่อนพร้อมพื้นดิน
      });
    }
  }
}

function spawnBoss() {
  bossSpawned = true;
  playSfx('warning');      // A5 — boss approach alert
  duckMusic(0.4, 800);     // A2
  warningTimer = 2.2;      // M3 — WARNING banner
  boss = {
    type: 'boss_boat',
    x: W / 2 - 40, y: -100,
    w: 80, h: 80,
    hp: Math.ceil((40 + mission * 10) * diff.enemyHp), maxHp: Math.ceil((40 + mission * 10) * diff.enemyHp),
    speed: 45, phase: 0, dir: 1,
    shootTimer: 0, phaseTimer: 0,
    points: 5000 + mission * 1000,
  };
}

// ========================
// BULLETS & ROCKETS
// ========================
function firePlayerBullet() {
  if (player.ammo <= 0 || player.shootCooldown > 0) return;
  const pl = player.powerLevel;
  player.ammo--;
  player.shootCooldown = pl >= 5 ? 0.08 : 0.1;
  player.recoil = 2.5;   // J5 — kickback
  player.muzzle = 0.06;  // J5 — muzzle flash timer
  playSfx('gun', 0.15);
  const cx = player.x + player.w / 2;
  const by = player.y - 4;
  if (pl === 1) {
    bullets.push({ x: cx - 4, y: by, vy: -420, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx + 2, y: by, vy: -420, owner: 'player', w: 2, h: 7 });
  } else if (pl === 2) {
    bullets.push({ x: cx - 5, y: by, vy: -420, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx,     y: by - 2, vy: -420, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx + 3, y: by, vy: -420, owner: 'player', w: 2, h: 7 });
  } else if (pl === 3) {
    bullets.push({ x: cx - 6, y: by, vx: -40, vy: -420, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx - 2, y: by - 2, vy: -430, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx + 2, y: by - 2, vy: -430, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx + 6, y: by, vx:  40, vy: -420, owner: 'player', w: 2, h: 7 });
  } else if (pl === 4) {
    bullets.push({ x: cx - 8, y: by, vx: -80, vy: -400, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx - 4, y: by - 2, vx: -25, vy: -430, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx,     y: by - 4, vy: -440, owner: 'player', w: 3, h: 9 });
    bullets.push({ x: cx + 4, y: by - 2, vx:  25, vy: -430, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx + 8, y: by, vx:  80, vy: -400, owner: 'player', w: 2, h: 7 });
  } else {
    bullets.push({ x: cx - 9, y: by, vx: -110, vy: -390, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx - 4, y: by - 2, vx:  -30, vy: -440, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx,     y: by - 5, vy: -460, owner: 'player', w: 3, h: 10 });
    bullets.push({ x: cx + 4, y: by - 2, vx:   30, vy: -440, owner: 'player', w: 2, h: 7 });
    bullets.push({ x: cx + 9, y: by, vx:  110, vy: -390, owner: 'player', w: 2, h: 7 });
  }
}
function dropBomb() {
  if (player.bombs <= 0 || player.bombCooldown > 0) return;
  player.bombs--;
  player.bombCooldown = 1.2;

  // Screen flash + shake
  bombFlash = 1.0;
  addTrauma(0.85);
  duckMusic(0.3, 600);   // A2

  // Kill ALL enemies on screen
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    spawnWreckage(e);
    // Big explosion at each enemy
    for (let k = 0; k < 3; k++) {
      spawnParticle(e.x + e.w/2 + (Math.random()-0.5)*20, e.y + e.h/2 + (Math.random()-0.5)*20, '#ff6600', 12);
      spawnParticle(e.x + e.w/2, e.y + e.h/2, '#ffaa00', 8);
    }
    score += e.points;
    enemies.splice(i, 1);
    playSfx(Math.random() < 0.5 ? 'enemy_die1' : 'enemy_die2', 0.3);
  }

  // Heavy damage to boss (ถ้ามี boss ให้ลด HP ครึ่งหนึ่ง)
  if (boss) {
    const dmg = Math.ceil(boss.maxHp * 0.5);
    boss.hp -= dmg;
    spawnParticle(boss.x + boss.w/2, boss.y + boss.h/2, '#ff4400', 20);
    spawnParticle(boss.x + boss.w/2, boss.y + boss.h/2, '#ffffff', 8);
  }

  // Massive center shockwave particles
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const speed = 80 + Math.random() * 180;
    particles.push({
      x: W/2, y: H/2,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      color: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ff8800' : '#ffdd00',
      life: 0.6 + Math.random() * 0.4, size: 3 + Math.random() * 4,
    });
  }

  // Sounds
  playSfx('rocket', 0.0);
  setTimeout(() => playSfx('enemy_die1', 0), 80);
  setTimeout(() => playSfx('enemy_die2', 0), 160);
  setTimeout(() => playSfx('rocket', 0), 200);
}
function fireEnemyBullet(e) {
  const cx = e.x + e.w / 2, cy = e.y + e.h * 0.7;
  const dx = player.x + 8 - cx;
  const dy = player.y + 7 - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ndx = dx / dist, ndy = dy / dist;
  const speed = (160 + mission * 10) * diff.bulletSpeed;
  const pattern = e.pattern || 'aimed';

  const push = (vx, vy, sz = 4) =>
    bullets.push({ x: cx, y: cy, vx, vy, owner: 'enemy', w: sz, h: sz });

  const rot = (nx, ny, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [nx * c - ny * s, nx * s + ny * c];
  };

  if (pattern === 'aimed') {
    push(ndx * speed, ndy * speed);
  } else if (pattern === 'fan3') {
    // 3-shot fan cone toward player
    for (const a of [-0.38, 0, 0.38]) {
      const [rx, ry] = rot(ndx, ndy, a);
      push(rx * speed, ry * speed);
    }
  } else if (pattern === 'fan5') {
    // 5-shot wide fan
    for (const a of [-0.65, -0.3, 0, 0.3, 0.65]) {
      const [rx, ry] = rot(ndx, ndy, a);
      push(rx * (speed * 0.85), ry * (speed * 0.85));
    }
  } else if (pattern === 'burst') {
    // 2-shot quick burst (slight spread)
    push(ndx * speed - 12, ndy * speed);
    push(ndx * speed + 12, ndy * speed);
  } else if (pattern === 'cone') {
    // 3-shot downward cone (cannon)
    for (const a of [-0.5, 0, 0.5]) {
      const [rx, ry] = rot(ndx, ndy, a);
      push(rx * speed * 0.8, ry * speed * 0.8);
    }
  }
}

function addTrauma(amount) {
  screenShakeTrauma = Math.min(1, screenShakeTrauma + amount);
}

function spawnParticle(x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 90;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      color, life: 0.4 + Math.random() * 0.6, size: 2 + Math.random() * 3,
    });
  }
}

// J1 — fire-sprite explosion on kill. size ~ enemy size.
function spawnExplosion(x, y, size = 32) {
  const variant = 1 + (Math.random() * 4 | 0); // fire1..fire4
  explosions.push({ x, y, size, variant, frame: 0, timer: 0 });
}

// J3 — chunky metal debris: heavier, spins, tumbles.
function spawnDebris(x, y, color, count = 6) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 130;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40,
      color, life: 0.5 + Math.random() * 0.7, size: 2 + Math.random() * 4,
      grav: 220, rot: Math.random() * Math.PI, vr: (Math.random() * 2 - 1) * 12, kind: 'debris',
    });
  }
}

// J6 — floating reward text on pickup.
function spawnPopup(x, y, text, color) {
  popups.push({ x, y, text, color, life: 0.9, scale: 1.6 });
}

// M1 — start a fade-out; onMid runs at full black, then it fades back in
function startFade(onMid) {
  fade.target = 1; fade.onMid = onMid; fade.midDone = false;
}

// M2/M4 — show a mission/victory banner
const MISSION_NAMES = ['', 'LZ JUNGLE', 'MEKONG DELTA', 'HO CHI MINH'];
function showMissionCard(text, sub) {
  missionCardText = text || `MISSION ${mission}`;
  missionCardSub = sub !== undefined ? sub : (MISSION_NAMES[mission] || '');
  missionCardTimer = 2.6;
}

function spawnWreckage(e) {
  wreckages.push({
    x: e.x, y: e.y, w: e.w, h: e.h,
    type: e.type === 'boat' || e.type === 'boss_boat' ? 'water' : 'land',
    frame: 0, timer: 0, done: false,
  });
}

// ========================
// COLLISION
// ========================
function overlap(a, b, pad = 0) {
  return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x &&
         a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
}

// ========================
// UPDATE
// ========================
function update(dt) {
  if (state !== STATE.PLAYING) return;

  scrollY += 90 * dt;
  missionTimer += dt;

  // Boss at 60s per mission
  if (missionTimer > 60 && !bossSpawned) spawnBoss();

  // Player move
  let moveDir = 0;
  if ((keys['ArrowLeft'] || keys['a']) && player.x > 0) { player.x -= player.speed * dt; moveDir = -1; }
  if ((keys['ArrowRight'] || keys['d']) && player.x + player.w < W) { player.x += player.speed * dt; moveDir = 1; }
  if ((keys['ArrowUp'] || keys['w']) && player.y > 20) player.y -= player.speed * dt;
  if ((keys['ArrowDown'] || keys['s']) && player.y + player.h < H - 10) player.y += player.speed * dt;
  // N1 — bank toward move direction, ease back to level
  player.tilt = (player.tilt || 0) + (moveDir * 0.32 - (player.tilt || 0)) * Math.min(1, dt * 10);

  player.shootCooldown   = Math.max(0, player.shootCooldown - dt);
  player.bombCooldown    = Math.max(0, player.bombCooldown - dt);
  player.invincible      = Math.max(0, player.invincible - dt);
  bombFlash              = Math.max(0, bombFlash - dt * 4);
  screenShakeTrauma      = Math.max(0, screenShakeTrauma - dt * 2.8);
  tickHeliAnim(dt);

  if (keys['z'] || keys[' ']) firePlayerBullet();
  if (keys['x']) dropBomb();
  if (keys['r'] && player.ammo < player.maxAmmo) {
    player.ammo = player.maxAmmo;
    player.heatTimer = 0;
    playSfx('collect', 0.3);
  }

  // Slow ammo regen
  if (player.ammo < player.maxAmmo) {
    player.heatTimer += dt;
    if (player.heatTimer > 4) { player.ammo = Math.min(player.maxAmmo, player.ammo + 8); player.heatTimer = 0; }
  }

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += (b.vx || 0) * dt;
    b.y += b.vy * dt;
    if (b.y < -15 || b.y > H + 15 || b.x < -15 || b.x > W + 15) { bullets.splice(i, 1); continue; }

    if (b.owner === 'player') {
      let hit = false;
      for (const e of enemies) {
        if (overlap(b, { x: e.x, y: e.y, w: e.w, h: e.h }, 4)) {
          e.hp--;
          e.flashTimer = 0.08;
          spawnParticle(b.x, b.y, '#ff8800', 2);
          hit = true; break;
        }
      }
      if (!hit && boss && overlap(b, { x: boss.x, y: boss.y, w: boss.w, h: boss.h }, 6)) {
        boss.hp--;
        boss.flashTimer = (boss.flashTimer || 0) + 0.06;
        addTrauma(0.12);
        spawnParticle(b.x, b.y, '#ff4400', 2);
        hit = true;
      }
      if (hit) { bullets.splice(i, 1); continue; }
    }

    if (b.owner === 'enemy' && player.invincible <= 0) {
      if (overlap(b, { x: player.x + 3, y: player.y + 3, w: player.w - 6, h: player.h - 6 })) {
        player.hp--;
        player.invincible = 1.5;
        addTrauma(0.5);
        playerHitFlash = 1;                                          // J4
        hitStop = Math.max(hitStop, 0.05);
        playSfx('player_hit', 0.2);
        duckMusic(0.45, 300);                                       // A2
        if (player.hp === 1) playSfx('warning');                    // A5 — low HP alert
        spawnParticle(player.x + 8, player.y + 7, '#ff0000', 12);
        spawnDebris(player.x + 8, player.y + 7, '#faa', 5);
        bullets.splice(i, 1);
        if (player.hp <= 0) {
          player.powerLevel = 1;
          stopHeliLoop();
          playSfx('heli_stop');
          if (music['battle']) { music['battle'].pause(); music['battle'].currentTime = 0; }
          currentMusic = null;
          playerName = ['A','A','A']; nameCursor = 0; nameConfirmed = false; nameEntryFromClear = false;
          state = STATE.NAME_ENTRY;
        }
        continue;
      }
    }
  }

  // Enemies
  spawnWave(dt);
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (e.type === 'boat') {
      // เรือ: เคลื่อนแนวนอน
      e.x += e.speed * e.dir * dt;
      if (e.x > W + 80 || e.x < -80) { enemies.splice(i, 1); continue; }
      e.y += SCROLL_SPEED * 0.15 * dt; // drift ลงเล็กน้อยตาม terrain

    } else if (e.type === 'tank') {
      // รถถัง: เลื่อนลงพร้อม terrain + ไล่ตาม player ในแนวนอน
      e.y += SCROLL_SPEED * dt;
      // ไล่ player.x: เร่ง vx เข้าหา target
      const targetVx = Math.sign(player.x - (e.x + e.w/2)) * e.maxVx;
      e.vx += (targetVx - e.vx) * Math.min(1, dt * 3.5); // smooth acceleration
      e.x += e.vx * dt;
      if (e.x < 5)           e.x = 5;
      if (e.x > W - e.w - 5) e.x = W - e.w - 5;

    } else if (e.type === 'cannon') {
      // ป้อมปืน: เลื่อนลงพร้อม terrain — ดูเหมือนอยู่กับที่บนพื้น
      e.y += SCROLL_SPEED * dt;
    }

    if (e.flashTimer > 0) e.flashTimer -= dt;
    if (e.spawnT === undefined) e.spawnT = 0.28;   // N5
    else if (e.spawnT > 0) e.spawnT = Math.max(0, e.spawnT - dt);
    e.shootTimer -= dt;
    if (e.shootTimer <= 0) { e.shootTimer = e.shootRate; fireEnemyBullet(e); e.muzzle = 0.09; }  // N2
    if (e.muzzle > 0) e.muzzle -= dt;
    if (e.y > H + 60) { enemies.splice(i, 1); continue; }
    if (e.hp <= 0) {
      spawnWreckage(e);
      spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.w * 1.2);       // J1
      spawnDebris(e.x + e.w / 2, e.y + e.h / 2, '#caa', 7);          // J3
      spawnParticle(e.x + e.w / 2, e.y + e.h / 2, '#ff6600', 8);
      playExplosionSfx();   // A1
      addTrauma(0.16);
      hitStop = Math.max(hitStop, 0.035);                           // J2
      // Combo
      comboCount++;
      comboTimer = 3.0;
      comboDisplay = 1.4;
      const mult = 1 + Math.floor(comboCount / 3);
      score += e.points * mult;
      // Item drop
      const drop = Math.random();
      const ix = e.x + e.w / 2 - 6, iy = e.y + e.h / 2;
      if (drop < 0.18)       items.push({ type: 'P', x: ix, y: iy, w: 12, h: 12, timer: 7 });
      else if (drop < 0.26)  items.push({ type: 'H', x: ix, y: iy, w: 12, h: 12, timer: 7 });
      else if (drop < 0.32)  items.push({ type: 'B', x: ix, y: iy, w: 12, h: 12, timer: 7 });
      enemies.splice(i, 1);
    }
  }

  // Boss
  if (boss) {
    boss.phaseTimer += dt;
    boss.shootTimer -= dt;
    if (boss.y < 70) boss.y += 60 * dt;
    else {
      boss.x += boss.speed * boss.dir * dt;
      if (boss.x > W - boss.w - 10 || boss.x < 10) boss.dir *= -1;
    }
    if (boss.shootTimer <= 0) {
      boss.shootTimer = boss.phase === 0 ? 1.0 : 0.55;
      playSfx('boss_shot', 0.1);
      const angles = boss.phase === 0 ? [-0.35, 0, 0.35] : [-0.6, -0.25, 0, 0.25, 0.6];
      angles.forEach(a => {
        const sp = 190;
        bullets.push({ x: boss.x + boss.w / 2, y: boss.y + boss.h, vx: Math.sin(a) * sp, vy: Math.cos(a) * sp, owner: 'enemy', w: 5, h: 5 });
      });
    }
    if (boss.hp <= 0) {
      spawnWreckage(boss);
      spawnParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ff4400', 20);
      spawnParticle(boss.x + boss.w / 2, boss.y + boss.h / 2, '#ffaa00', 16);
      playSfx('enemy_die1', 0);
      playSfx('enemy_die2', 0);
      playSfx('blast1', 0.2); playSfx('blast2', 0.2);   // A1 — layered boss blast
      duckMusic(0.25, 900);                              // A2
      addTrauma(1.0);
      hitStop = 0.09;
      score += boss.points;
      // Boss drop: guaranteed power + random HP
      items.push({ type: 'P', x: boss.x + boss.w/2 - 6, y: boss.y + boss.h/2, w: 12, h: 12, timer: 10 });
      items.push({ type: 'H', x: boss.x + boss.w/2 + 8, y: boss.y + boss.h/2, w: 12, h: 12, timer: 10 });
      boss = null; bossSpawned = false;
      mission++;
      missionTimer = 0;
      enemyTimer = 3;
      if (mission > 3) {
        // M4 — victory beat, then hand off to name entry
        victoryPending = true;
        showMissionCard('MISSION COMPLETE', 'ALL SECTORS CLEARED');
      } else {
        // Mission 3 = night theme
        if (mission === 3) { playMusic('night'); }
        showMissionCard();   // M2 — intro card for the new mission
      }
    }
    if (boss && boss.hp < boss.maxHp * 0.45 && boss.phase === 0) {
      boss.phase = 1; boss.speed = 80;
    }
  }

  // Items (power-ups)
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    it.y += SCROLL_SPEED * dt;
    it.timer -= dt;
    if (overlap(it, { x: player.x, y: player.y, w: player.w, h: player.h }, 5)) {
      if (it.type === 'P') player.powerLevel = Math.min(5, player.powerLevel + 1);
      else if (it.type === 'H') player.hp = Math.min(player.maxHp, player.hp + 1);
      else if (it.type === 'B') player.bombs = Math.min(player.maxBombs, player.bombs + 1);
      playSfx('collect', 0.2);
      const col = it.type === 'P' ? '#0ff' : it.type === 'H' ? '#f44' : '#f80';
      spawnParticle(it.x + 6, it.y + 6, col, 10);
      const label = it.type === 'P' ? 'POWER UP!' : it.type === 'H' ? '+1 HP' : '+1 BOMB'; // J6
      spawnPopup(it.x + 6, it.y, label, col);
      addTrauma(0.08);
      items.splice(i, 1);
      continue;
    }
    if (it.y > H + 20 || it.timer <= 0) items.splice(i, 1);
  }

  // Combo timer decay
  if (comboCount > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) comboCount = 0;
  }
  if (comboDisplay > 0) comboDisplay -= dt;

  // Wreckages
  for (let i = wreckages.length - 1; i >= 0; i--) {
    const w = wreckages[i];
    w.timer += dt;
    w.frame = Math.min(7, Math.floor(w.timer * 10));
    if (w.timer > 1.2) { wreckages.splice(i, 1); }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 60) * dt; p.life -= dt;
    if (p.kind === 'debris') { p.rot += p.vr * dt; p.vx *= 0.98; }
    if (p.life <= 0) particles.splice(i, 1);
  }

  // J1 — explosions (fire sprite sequence, 3 frames)
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    ex.timer += dt;
    ex.frame = Math.floor(ex.timer / 0.05);
    if (ex.frame >= 3) explosions.splice(i, 1);
  }

  // J6 — pickup popups float up and fade
  for (let i = popups.length - 1; i >= 0; i--) {
    const pu = popups[i];
    pu.y -= 22 * dt; pu.life -= dt; pu.scale += (1 - pu.scale) * 0.2;
    if (pu.life <= 0) popups.splice(i, 1);
  }

  // J4/J5 — timed feedback decay
  playerHitFlash = Math.max(0, playerHitFlash - dt * 3);
  player.recoil = Math.max(0, player.recoil - dt * 30);
  player.muzzle = Math.max(0, player.muzzle - dt);

  // M2/M3/M4 — presentation timers
  if (missionCardTimer > 0) {
    missionCardTimer -= dt;
    if (missionCardTimer <= 0 && victoryPending) {
      // M4 — victory card finished → go to name entry
      victoryPending = false;
      stopHeliLoop();
      playSfx('heli_stop');
      if (music['battle']) { music['battle'].pause(); music['battle'].currentTime = 0; }
      currentMusic = null;
      playerName = ['A','A','A']; nameCursor = 0; nameConfirmed = false; nameEntryFromClear = true;
      state = STATE.NAME_ENTRY;
    }
  }
  if (warningTimer > 0) warningTimer -= dt;
}

// ========================
// GRAPHICS OVERLAYS (ticket 003, approach A — overlays, no base-art changes)
// ========================

// G1 — cloud shadows scrolling faster than terrain for a parallax depth cue
function drawParallax(scrollY) {
  const off = scrollY * 1.5;
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#000';
  for (let i = 0; i < 5; i++) {
    const seed = i * 137.5;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * (W + 120)) - 60;
    const y = (((off * 0.5 + i * 190) % (H + 240)) - 120);
    const rx = 45 + (Math.sin(seed * 2.3) * 0.5 + 0.5) * 55;
    const ry = 22 + (Math.sin(seed * 1.7) * 0.5 + 0.5) * 20;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// G5 — per-mission atmosphere tint (day / dusk / night)
const MISSION_TINT = {
  1: null,                         // LZ Jungle — bright day, no tint
  2: 'rgba(255,150,60,0.14)',      // Mekong Delta — dusk warm
  3: 'rgba(40,60,150,0.22)',       // Ho Chi Minh — night cool
};
function drawMissionTint() {
  const t = MISSION_TINT[mission];
  if (t) { ctx.fillStyle = t; ctx.fillRect(0, 0, W, H); }
}

// G2 — vignette (darkened corners focus the eye toward center)
let _vignette = null;
function drawVignette() {
  if (!_vignette) {
    _vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.72);
    _vignette.addColorStop(0, 'rgba(0,0,0,0)');
    _vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
  }
  ctx.fillStyle = _vignette;
  ctx.fillRect(0, 0, W, H);
}

// ========================
// DRAW
// ========================
function draw() {
  ctx.clearRect(0, 0, W, H);
  if (state === STATE.TITLE) { drawTitle(); return; }
  if (state === STATE.NAME_ENTRY) { drawNameEntry(); return; }

  // Screen shake transform (world only — HUD stays fixed)
  const shakeAmt = screenShakeTrauma * screenShakeTrauma;
  const shX = (Math.random() * 2 - 1) * shakeAmt * 8;
  const shY = (Math.random() * 2 - 1) * shakeAmt * 8;
  ctx.save();
  ctx.translate(shX, shY);

  // Terrain
  terrain.draw(scrollY);

  // G1 — parallax cloud shadows drifting faster than the ground (depth)
  drawParallax(scrollY);

  // Particles (back)
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
    ctx.fillStyle = p.color;
    if (p.kind === 'debris') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    } else {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  });
  ctx.globalAlpha = 1;

  // J1 — explosions (fire sprite) over particles
  explosions.forEach(ex => {
    const s = ex.size;
    drawSprite(`fire${ex.variant}_${ex.frame + 1}`, ex.x - s / 2, ex.y - s / 2, s, s);
  });

  // Wreckages (death anim)
  wreckages.forEach(w => {
    const f = w.frame + 1;
    const key = w.type === 'water' ? `broken_water_${f}` : `broken_${f}`;
    const drawn = drawSprite(key, w.x, w.y, w.w, w.h);
    if (!drawn) {
      ctx.globalAlpha = 0.6 - w.timer * 0.5;
      ctx.fillStyle = '#ff4400';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.globalAlpha = 1;
    }
  });

  // Enemies
  enemies.forEach(e => {
    // N5 — entrance scale-in (pop from 55% to full over ~0.28s)
    const spawnScale = e.spawnT > 0 ? 0.55 + 0.45 * (1 - e.spawnT / 0.28) : 1;
    const scaled = spawnScale < 0.999;
    if (scaled) {
      const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
      ctx.save();
      ctx.translate(ecx, ecy);
      ctx.scale(spawnScale, spawnScale);
      ctx.translate(-ecx, -ecy);
    }
    drawShadow(e.x + e.w / 2, e.y + e.h / 2, e.w, e.h);
    // Damage flash: brighten the sprite itself (follows sprite shape, not a rect)
    const flashB = e.flashTimer > 0 ? 1 + Math.min(0.9, e.flashTimer * 11) * 10 : 1;
    if (flashB > 1) ctx.filter = `brightness(${flashB})`;

    if (e.type === 'boat') {
      const f = (boatFrame() + (e.animOffset || 0)) % 4 + 1;
      const key = `boat${e.variant || 1}_${f}`;
      const flipX = e.dir < 0;
      const drawn = drawSprite(key, e.x, e.y, e.w, e.h, flipX);
      if (!drawn) {
        ctx.fillStyle = '#4a6a30';
        ctx.fillRect(e.x + 4, e.y + 4, e.w - 8, e.h - 8);
      }
    } else if (e.type === 'tank') {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
      const hullAngle = Math.atan2(e.vx || 0, -SCROLL_SPEED);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(hullAngle);
      if (tankHullCanvas) ctx.drawImage(tankHullCanvas, -e.w / 2, -e.h / 2, e.w, e.h);
      else { ctx.fillStyle = '#3a5c2a'; ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h); }
      ctx.restore();

      const gdx = player.x - cx, gdy = player.y - cy;
      const gunAngle = Math.atan2(gdx, -gdy);
      const gw = e.w * 0.38, gh = e.h * 0.85;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(gunAngle);
      if (tankGunCanvas) ctx.drawImage(tankGunCanvas, -gw / 2, -gh * 0.65, gw, gh);
      else { ctx.fillStyle = '#2a3d1e'; ctx.fillRect(-gw/2, -gh*0.65, gw, gh); }
      ctx.restore();

    } else if (e.type === 'cannon') {
      const dx = player.x - (e.x + e.w/2);
      const dy = player.y - (e.y + e.h/2);
      const angle = Math.atan2(dy, dx) - Math.PI / 2;
      const key = `cannon${e.variant || 1}_1`;
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
      ctx.rotate(angle);
      const img = imgs[key];
      if (img && img.complete && img.naturalWidth) ctx.drawImage(img, -e.w / 2, -e.h / 2, e.w, e.h);
      else { ctx.fillStyle = '#555'; ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h); }
      ctx.restore();
    }

    if (flashB > 1) ctx.filter = 'none';

    // N2 — enemy muzzle flash toward the player
    if (e.muzzle > 0) {
      const ecx = e.x + e.w / 2, ecy = e.y + e.h / 2;
      const mdx = player.x + 8 - ecx, mdy = player.y + 7 - ecy;
      const md = Math.hypot(mdx, mdy) || 1;
      const fx = ecx + (mdx / md) * (e.h * 0.45);
      const fy = ecy + (mdy / md) * (e.h * 0.45);
      ctx.save();
      ctx.globalAlpha = Math.min(1, e.muzzle * 11);
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath(); ctx.arc(fx, fy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // HP bar for multi-hp enemies
    if (e.maxHp > 1) {
      ctx.fillStyle = '#111';
      ctx.fillRect(e.x, e.y - 6, e.w, 4);
      const hpColor = e.hp > e.maxHp * 0.5 ? '#2f2' : e.hp > e.maxHp * 0.25 ? '#fa0' : '#f22';
      ctx.fillStyle = hpColor;
      ctx.fillRect(e.x, e.y - 6, e.w * (e.hp / e.maxHp), 4);
    }
    if (scaled) ctx.restore();   // N5 — end entrance scale
  });

  // Boss
  if (boss) {
    const f = boatFrame();
    // N4 — telegraph: pulsing red glow while winding up to fire
    if (boss.y >= 70 && boss.shootTimer < 0.45 && boss.shootTimer > 0) {
      const pulse = (0.45 - boss.shootTimer) / 0.45;
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 40) * 0.15 * pulse;
      ctx.strokeStyle = '#ff3030';
      ctx.lineWidth = 2 + pulse * 3;
      ctx.strokeRect(boss.x - 3, boss.y - 3, boss.w + 6, boss.h + 6);
      ctx.restore();
    }
    drawShadow(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.w, boss.h, 0.3);
    const bossFlashB = boss.flashTimer > 0 ? 1 + Math.min(0.9, boss.flashTimer * 9) * 8 : 1;
    if (bossFlashB > 1) ctx.filter = `brightness(${bossFlashB})`;
    const drawn = drawSprite(`boat4_${f}`, boss.x, boss.y, boss.w, boss.h);
    if (!drawn) {
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    }
    if (bossFlashB > 1) { ctx.filter = 'none'; boss.flashTimer = Math.max(0, boss.flashTimer - 0.016); }
    // Fire from damaged boss (phase 1)
    if (boss.phase === 1) {
      const ff = fireFrame();
      drawSprite(`fire2_${ff}`, boss.x + boss.w * 0.1, boss.y + boss.h * 0.1, 32, 32);
      drawSprite(`fire3_${fireFrame(2)}`, boss.x + boss.w * 0.5, boss.y + boss.h * 0.3, 28, 28);
    }
    // Boss HP bar
    ctx.fillStyle = '#200';
    ctx.fillRect(10, 10, W - 20, 8);
    ctx.fillStyle = boss.phase === 0 ? '#d00' : '#f80';
    ctx.fillRect(10, 10, (W - 20) * (boss.hp / boss.maxHp), 8);
    ctx.strokeStyle = '#f44';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, W - 20, 8);
    ctx.fillStyle = '#fff';
    ctx.font = '8px monospace';
    const bossNames = ['', 'ARMORED GUNBOAT', 'MONITOR WARSHIP', 'RIVER FORTRESS'];
    const bname = bossNames[mission] || 'BOSS';
    ctx.fillText(bname, W / 2 - ctx.measureText(bname).width / 2, 17);
  }

  // Enemy bullets
  bullets.forEach(b => {
    if (b.owner === 'player') {
      // G3 — bright warm tracer with glow + white-hot core (readable)
      ctx.fillStyle = 'rgba(255,240,120,0.28)';
      ctx.fillRect(b.x - 2, b.y - 3, b.w + 4, b.h + 6);
      ctx.fillStyle = '#ffee44';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x + b.w / 2 - 0.5, b.y, 1, b.h);
    } else {
      // G3 — enemy round shifted to red/pink so it never reads as a player shot
      ctx.fillStyle = 'rgba(255,0,60,0.32)';
      ctx.fillRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
      ctx.fillStyle = '#ff2a4a';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#ff9ab0';
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }
  });

  // Bomb screen flash
  if (bombFlash > 0) {
    ctx.fillStyle = `rgba(255,200,80,${bombFlash * 0.55})`;
    ctx.fillRect(0, 0, W, H);
    // Shockwave ring
    const ringR = (1 - bombFlash) * W;
    ctx.strokeStyle = `rgba(255,120,0,${bombFlash * 0.8})`;
    ctx.lineWidth = 4 * bombFlash;
    ctx.beginPath(); ctx.arc(W/2, H/2, ringR, 0, Math.PI*2); ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Items (power-ups) — draw before player
  items.forEach((it, idx) => {
    const bob = Math.sin(Date.now() * 0.006 + idx * 1.7) * 2;
    const y = it.y + bob;
    const colors = { P: '#0ff', H: '#f44', B: '#f80' };
    const labels = { P: 'P', H: '♥', B: 'B' };
    const col = colors[it.type];
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(it.x, y, it.w, it.h);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(it.x, y, it.w, it.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = col;
    ctx.font = 'bold 7px monospace';
    const lbl = labels[it.type];
    ctx.fillText(lbl, it.x + it.w/2 - ctx.measureText(lbl).width/2, y + it.h - 2);
    ctx.restore();
  });

  // Combo display (mid-screen)
  if (comboDisplay > 0 && comboCount >= 2) {
    const alpha = Math.min(1, comboDisplay * 1.5);
    const mult = 1 + Math.floor(comboCount / 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    const comboCol = comboCount >= 9 ? '#f80' : comboCount >= 6 ? '#ff4' : '#0ff';
    ctx.fillStyle = comboCol;
    ctx.font = `bold ${Math.min(14, 9 + Math.floor(comboCount / 3))}px monospace`;
    const txt = `COMBO ×${comboCount}`;
    ctx.fillText(txt, W/2 - ctx.measureText(txt).width/2, H/2 - 16);
    if (mult > 1) {
      ctx.fillStyle = '#f80';
      ctx.font = '8px monospace';
      const mtxt = `×${mult} SCORE BONUS`;
      ctx.fillText(mtxt, W/2 - ctx.measureText(mtxt).width/2, H/2 - 4);
    }
    ctx.restore();
  }

  // Player helicopter
  const heliAlpha = (player.invincible <= 0 || Math.floor(player.invincible * 8) % 2 === 0) ? 1 : 0;
  if (heliAlpha > 0) {
    const hcx = player.x + player.w / 2;
    const hcy = player.y + player.h / 2 + player.recoil;  // J5 — kickback
    drawShadow(hcx, hcy, HELI_DST_W, HELI_DST_H, 0.28);
    // J5 — muzzle flash at the nose
    if (player.muzzle > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, player.muzzle * 14);
      ctx.fillStyle = '#ffe680';
      ctx.beginPath();
      ctx.ellipse(hcx, player.y - 4, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(hcx, player.y - 3, 1.8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawPlayerHeli(hcx, hcy, 1);
  }

  // J6 — pickup popups
  popups.forEach(pu => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, pu.life * 1.5);
    ctx.fillStyle = pu.color;
    ctx.font = `bold ${Math.round(7 * pu.scale)}px monospace`;
    ctx.fillText(pu.text, pu.x - ctx.measureText(pu.text).width / 2, pu.y);
    ctx.restore();
  });
  ctx.globalAlpha = 1;

  ctx.restore(); // end screen shake — HUD drawn in stable space

  // G5/G2 — atmosphere tint then vignette (screen space, over the whole scene)
  drawMissionTint();
  drawVignette();

  // J4 — red damage flash
  if (playerHitFlash > 0) {
    ctx.fillStyle = `rgba(200,0,0,${playerHitFlash * 0.35})`;
    ctx.fillRect(0, 0, W, H);
  }

  drawHUD();
  drawTutorialHints();
  drawMissionCard();   // M2/M4
  drawWarningBanner(); // M3

  if (state === STATE.PAUSED) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('PAUSED', W / 2 - 40, H / 2);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText('Press P to continue', W / 2 - 55, H / 2 + 20);
  }

}

// Contextual onboarding — timed hints during the first mission only.
// Teaches move / shoot / reload / bomb without blocking gameplay.
const TUTORIAL_HINTS = [
  { t: 0.5, until: 4.5,  text: 'WASD or ARROW KEYS to move' },
  { t: 4.5, until: 8.5,  text: 'Hold Z or SPACE to fire' },
  { t: 8.5, until: 12.5, text: 'AMMO overheats — press R to reload instantly' },
  { t: 12.5, until: 16.5, text: 'Press X to drop a bomb (clears the screen)' },
];
function drawTutorialHints() {
  if (state !== STATE.PLAYING || mission !== 1) return;
  const hint = TUTORIAL_HINTS.find(h => missionTimer >= h.t && missionTimer < h.until);
  if (!hint) return;
  // fade in/out at the edges of each window
  const inFade = Math.min(1, (missionTimer - hint.t) / 0.4);
  const outFade = Math.min(1, (hint.until - missionTimer) / 0.4);
  const alpha = Math.min(inFade, outFade);
  const y = H - 90;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '9px monospace';
  const w = ctx.measureText(hint.text).width + 20;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(W / 2 - w / 2, y - 12, w, 18);
  ctx.strokeStyle = 'rgba(200,220,140,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(W / 2 - w / 2, y - 12, w, 18);
  ctx.fillStyle = '#dfffa8';
  ctx.fillText(hint.text, W / 2 - ctx.measureText(hint.text).width / 2, y);
  ctx.restore();
}

// M2/M4 — mission / victory banner card (slides in, holds, fades)
function drawMissionCard() {
  if (missionCardTimer <= 0) return;
  const t = missionCardTimer;
  const alpha = Math.min(1, t < 0.5 ? t * 2 : (t > 2.1 ? (2.6 - t) * 2 : 1));
  const cy = H / 2 - 30;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, cy - 22, W, 56);
  ctx.fillStyle = '#8fd86a';
  ctx.fillRect(0, cy - 23, W, 1);
  ctx.fillRect(0, cy + 34, W, 1);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(missionCardText, W / 2 - ctx.measureText(missionCardText).width / 2, cy + 2);
  if (missionCardSub) {
    ctx.fillStyle = '#8fd86a';
    ctx.font = '10px monospace';
    ctx.fillText(missionCardSub, W / 2 - ctx.measureText(missionCardSub).width / 2, cy + 22);
  }
  ctx.restore();
}

// M3 — flashing WARNING banner when a boss approaches
function drawWarningBanner() {
  if (warningTimer <= 0) return;
  if (Math.floor(warningTimer * 6) % 2 === 0) return; // blink
  const cy = 90;
  ctx.save();
  ctx.fillStyle = 'rgba(120,0,0,0.55)';
  ctx.fillRect(0, cy - 12, W, 26);
  ctx.fillStyle = '#ff3a3a';
  ctx.font = 'bold 14px monospace';
  const txt = 'WARNING!';
  ctx.fillText(txt, W / 2 - ctx.measureText(txt).width / 2, cy);
  ctx.fillStyle = '#ffb0b0';
  ctx.font = '8px monospace';
  const sub = 'BOSS APPROACHING';
  ctx.fillText(sub, W / 2 - ctx.measureText(sub).width / 2, cy + 10);
  ctx.restore();
}

function drawHUD() {
  // G4 — panel with arcade accent bar
  ctx.fillStyle = 'rgba(6,10,8,0.82)';
  ctx.fillRect(0, H - 38, W, 38);
  ctx.fillStyle = '#3a5a2a';
  ctx.fillRect(0, H - 39, W, 1);
  ctx.fillStyle = '#8fd86a';
  ctx.fillRect(0, H - 40, W, 1);

  // HP hearts
  ctx.font = '8px monospace';
  ctx.fillStyle = '#f44';
  ctx.fillText('HP', 5, H - 24);
  for (let i = 0; i < player.maxHp; i++) {
    ctx.fillStyle = i < player.hp ? '#f44' : '#332';
    ctx.fillRect(22 + i * 11, H - 31, 9, 9);
  }

  // Ammo bar
  ctx.fillStyle = '#ff8';
  ctx.fillText('AMMO', 5, H - 12);
  ctx.fillStyle = '#333';
  ctx.fillRect(36, H - 18, 70, 6);
  ctx.fillStyle = player.ammo > 20 ? '#ff8' : '#f44';
  ctx.fillRect(36, H - 18, 70 * (player.ammo / player.maxAmmo), 6);

  // Bombs
  ctx.fillStyle = player.bombs > 0 ? '#f80' : '#444';
  for (let i = 0; i < player.maxBombs; i++) {
    ctx.fillStyle = i < player.bombs ? '#f80' : '#333';
    ctx.fillRect(112 + i * 14, H - 19, 10, 10);
    // Bomb icon (circle)
    ctx.strokeStyle = i < player.bombs ? '#fa0' : '#444';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(117 + i * 14, H - 14, 5, 0, Math.PI*2); ctx.stroke();
  }
  ctx.fillStyle = '#f80';
  ctx.font = '7px monospace';
  ctx.fillText('BOMB', 112, H - 22);

  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '9px monospace';
  ctx.fillText(`${score}`, W - 50, H - 12);

  // Mission label
  const mnames = ['', 'LZ JUNGLE', 'MEKONG DELTA', 'HO CHI MINH'];
  ctx.fillStyle = '#8f8';
  ctx.font = '7px monospace';
  ctx.fillText(mnames[mission] || `MISSION ${mission}`, W - 75, H - 22);

  // Power level indicator
  ctx.fillStyle = '#0cc';
  ctx.font = '7px monospace';
  ctx.fillText('PWR', 146, H - 22);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < player.powerLevel ? '#0ff' : '#1a2a2a';
    ctx.fillRect(168 + i * 9, H - 29, 7, 6);
    ctx.strokeStyle = i < player.powerLevel ? '#0cc' : '#223';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(168 + i * 9, H - 29, 7, 6);
  }

  // Ammo reload warning
  if (player.ammo === 0) {
    const blink = Math.sin(Date.now() / 120) > 0;
    if (blink) {
      ctx.fillStyle = '#f44';
      ctx.font = '9px monospace';
      ctx.fillText('RELOADING...', W / 2 - 38, H - 44);
    }
  }
}

// ========================
// SCREENS
// ========================
function drawTitle() {
  // Dark jungle bg
  ctx.fillStyle = '#0a150a';
  ctx.fillRect(0, 0, W, H);
  // Scanlines
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, y, W, 1);
  }
  // Animated boat on title
  const tf = boatFrame();
  ctx.globalAlpha = 0.5;
  drawSprite(`boat3_${tf}`, W / 2 - 30, 200, 60, 60);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#c8a050';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('STEEL RAIN', W / 2 - 68, 110);
  ctx.fillStyle = '#8a7030';
  ctx.font = '12px monospace';
  ctx.fillText("VIETNAM '69", W / 2 - 38, 130);

  // M5 — tagline
  ctx.fillStyle = '#6a8a4a';
  ctx.font = '8px monospace';
  const tag = 'RAIN STEEL ON THE JUNGLE WAR';
  ctx.fillText(tag, W / 2 - ctx.measureText(tag).width / 2, 146);

  // Heli on title
  drawPlayerHeli(W / 2, 190, 0.9);

  // Difficulty selector
  ctx.fillStyle = '#aaa';
  ctx.font = '8px monospace';
  ctx.fillText('DIFFICULTY   (< > to change)', W / 2 - 78, 250);

  const boxW = 66, gap = 6, totalW = boxW * 3 + gap * 2;
  let bx = W / 2 - totalW / 2;
  DIFF_ORDER.forEach((key, i) => {
    const sel = i === diffIndex;
    const d = DIFFICULTY[key];
    ctx.fillStyle = sel ? '#3a5a2a' : '#1a1a1a';
    ctx.fillRect(bx, 258, boxW, 20);
    ctx.strokeStyle = sel ? '#8fd86a' : '#444';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(bx, 258, boxW, 20);
    ctx.fillStyle = sel ? '#cfffa8' : '#888';
    ctx.font = (sel ? 'bold ' : '') + '9px monospace';
    ctx.fillText(d.label, bx + boxW / 2 - ctx.measureText(d.label).width / 2, 272);
    bx += boxW + gap;
  });
  // Selected difficulty description
  ctx.fillStyle = '#7a9';
  ctx.font = '7px monospace';
  const desc = DIFFICULTY[DIFF_ORDER[diffIndex]].desc;
  ctx.fillText(desc, W / 2 - ctx.measureText(desc).width / 2, 290);

  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  if (Math.floor(Date.now() / 550) % 2) ctx.fillText('PRESS ENTER TO START', W / 2 - 68, 318);

  ctx.fillStyle = '#888';
  ctx.font = '8px monospace';
  ctx.fillText('WASD: Move   Z/SPACE: Gun   X: BOMB   R: Reload', W / 2 - 96, 348);
  ctx.fillText('P: Pause', W / 2 - 24, 362);

  ctx.fillStyle = '#4a6';
  ctx.font = '7px monospace';
  ctx.fillText('3 MISSIONS  |  DESTROY ALL ENEMIES', W / 2 - 75, 392);
}

function drawNameEntry() {
  // Background
  ctx.fillStyle = nameEntryFromClear ? 'rgba(0,20,0,0.95)' : 'rgba(10,0,0,0.95)';
  ctx.fillRect(0, 0, W, H);

  // Scanlines
  for (let y = 0; y < H; y += 3) { ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, y, W, 1); }

  // Header
  if (nameEntryFromClear) {
    ctx.fillStyle = '#8f8';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('MISSION COMPLETE!', W / 2 - 70, 48);
  } else {
    ctx.fillStyle = '#f44';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('MISSION FAILED', W / 2 - 62, 48);
  }

  // Score
  ctx.fillStyle = '#ff8';
  ctx.font = 'bold 13px monospace';
  const scoreLabel = `SCORE: ${score}`;
  ctx.fillText(scoreLabel, W / 2 - ctx.measureText(scoreLabel).width / 2, 70);

  if (!nameConfirmed) {
    // Name entry prompt
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('ENTER YOUR NAME (3 CHARS)', W / 2 - 74, 108);
    ctx.fillStyle = '#888';
    ctx.font = '8px monospace';
    ctx.fillText('Arrow keys or A-Z / 0-9  |  ENTER to confirm', W / 2 - 100, 122);

    // 3 character boxes
    const boxW = 36, boxH = 46, gap = 10;
    const totalW = boxW * 3 + gap * 2;
    const startX = (W - totalW) / 2;
    const boxY = 136;

    for (let i = 0; i < 3; i++) {
      const bx = startX + i * (boxW + gap);
      const active = i === nameCursor && !nameConfirmed;
      // Box bg
      ctx.fillStyle = active ? '#2a2a00' : '#1a1a1a';
      ctx.fillRect(bx, boxY, boxW, boxH);
      // Border
      ctx.strokeStyle = active ? '#ff8' : '#555';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(bx, boxY, boxW, boxH);
      // Character
      ctx.fillStyle = active ? '#ff8' : '#ccc';
      ctx.font = `bold 28px monospace`;
      ctx.fillText(playerName[i], bx + boxW / 2 - ctx.measureText(playerName[i]).width / 2, boxY + 33);
      // Cursor blink under active
      if (active && Math.floor(Date.now() / 400) % 2) {
        ctx.fillStyle = '#ff8';
        ctx.fillRect(bx + 8, boxY + boxH - 5, boxW - 16, 2);
      }
    }

    // Arrow hint
    ctx.fillStyle = '#666';
    ctx.font = '8px monospace';
    ctx.fillText('UP/DOWN: Change char   LEFT/RIGHT: Select', W / 2 - 90, 198);

    // Enter hint blink
    if (Math.floor(Date.now() / 600) % 2) {
      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText('ENTER = Confirm', W / 2 - 40, 218);
    }
  }

  // Leaderboard
  const board = loadBoard();
  const boardY = nameConfirmed ? 90 : 240;

  ctx.fillStyle = '#f80';
  ctx.font = 'bold 9px monospace';
  ctx.fillText('-- GLOBAL TOP 10 --', W / 2 - 52, boardY);

  if (boardLoading) {
    ctx.fillStyle = '#888';
    ctx.font = '9px monospace';
    ctx.fillText('Loading...', W / 2 - 24, boardY + 20);
  } else if (board.length === 0) {
    ctx.fillStyle = '#555';
    ctx.font = '9px monospace';
    ctx.fillText('No scores yet', W / 2 - 30, boardY + 20);
  } else {
    board.forEach((entry, idx) => {
      const myName = playerName.join('');
      const isMe = nameConfirmed && entry.name === myName && entry.score === score;
      ctx.fillStyle = isMe ? '#ff8' : (idx === 0 ? '#ffd' : '#aaa');
      ctx.font = isMe ? 'bold 9px monospace' : '9px monospace';
      const rank = `${idx + 1}.`;
      const nameStr = (entry.name || '???').padEnd(3);
      const missionStr = `M${entry.mission || 1}`;
      const scoreStr = String(entry.score).padStart(7, ' ');
      const line = `${rank} ${nameStr}  ${scoreStr}  ${missionStr}`;
      ctx.fillText(line, W / 2 - 68, boardY + 14 + idx * 13);
    });
  }

  // After confirm: show keyboard prompt to retry
  if (nameConfirmed) {
    ctx.fillStyle = '#555';
    ctx.font = '8px monospace';
    ctx.fillText('Share via buttons below   |   ENTER = Play again', W / 2 - 100, H - 12);
  }
}

// ========================
// INPUT
// ========================
document.addEventListener('keydown', e => {
  keys[e.key] = true;

  // Name entry handling
  if (state === STATE.NAME_ENTRY) {
    if (!nameConfirmed) {
      if (e.key === 'ArrowUp') {
        const idx = CHARS.indexOf(playerName[nameCursor]);
        playerName[nameCursor] = CHARS[(idx + 1) % CHARS.length];
      } else if (e.key === 'ArrowDown') {
        const idx = CHARS.indexOf(playerName[nameCursor]);
        playerName[nameCursor] = CHARS[(idx - 1 + CHARS.length) % CHARS.length];
      } else if (e.key === 'ArrowRight') {
        nameCursor = Math.min(2, nameCursor + 1);
      } else if (e.key === 'ArrowLeft') {
        nameCursor = Math.max(0, nameCursor - 1);
      } else if (/^[A-Za-z0-9]$/.test(e.key)) {
        // Type a character directly and advance cursor
        playerName[nameCursor] = e.key.toUpperCase();
        if (nameCursor < 2) nameCursor++;
      } else if (e.key === 'Backspace') {
        if (nameCursor > 0) nameCursor--;
        playerName[nameCursor] = 'A';
      } else if (e.key === 'Enter') {
        // Confirm name
        nameConfirmed = true;
        playSfx('ui_confirm');   // A4
        const name = playerName.join('');
        addToBoard(name, score, mission);
        createShareButtons(name, score);
      }
    } else {
      // After confirm: Enter = retry (ad already shown on win/lose event)
      if (e.key === 'Enter') {
        removeShareButtons();
        initGame();
      }
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    return;
  }

  if (e.key === 'p' || e.key === 'P') {
    if (state === STATE.PLAYING) state = STATE.PAUSED;
    else if (state === STATE.PAUSED) state = STATE.PLAYING;
  }
  if (state === STATE.TITLE) {
    if (e.key === 'ArrowLeft')  { diffIndex = (diffIndex + DIFF_ORDER.length - 1) % DIFF_ORDER.length; playSfx('ui_move', 0.15); } // A4
    if (e.key === 'ArrowRight') { diffIndex = (diffIndex + 1) % DIFF_ORDER.length; playSfx('ui_move', 0.15); }                     // A4
    if (e.key === 'Enter') { playSfx('coin_in'); startFade(() => initGame()); }   // A4/M1
  }
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ========================
// MAIN LOOP
// ========================
function frame(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  if (hitStop > 0) {
    hitStop -= dt;
  } else {
    update(dt);
  }
  // M1 — fade drive (runs in all states)
  fade.a += (fade.target - fade.a) * Math.min(1, dt * 9);
  if (!fade.midDone && fade.a > 0.92) {
    fade.midDone = true;
    if (fade.onMid) { fade.onMid(); fade.onMid = null; }
    fade.target = 0; // fade back in
  }
  draw();
  // M1 — fade overlay on top of everything (all states)
  if (fade.a > 0.01) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, fade.a)})`;
    ctx.fillRect(0, 0, W, H);
  }
  requestAnimationFrame(frame);
}

// Init title screen
state = STATE.TITLE;
terrain = new Terrain();
score = 0; mission = 1;

// Start menu music on first user interaction (browser autoplay policy).
// The first ad is shown on SDK_READY in index.html, not here.
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  playMusic('menu');
}
document.addEventListener('keydown', unlockAudio, { once: false });
canvas.addEventListener('click', unlockAudio, { once: true });

requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(frame); });
