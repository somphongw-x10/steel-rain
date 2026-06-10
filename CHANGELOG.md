# CHANGELOG — Steel Rain: Vietnam '69

## [1.0.0] — 2026-06-08

### 🎮 เกมเริ่มต้น (Initial Build)
- สร้างเกม Vertical Shoot 'em Up แนว Vietnam War ด้วย HTML5 Canvas
- ขนาด Canvas: 320×480 px (SFC 16-bit style)
- อิงแนวคิดจาก `story.md`: AH-1 Cobra vs ศัตรูในป่าเวียดนาม

---

## [1.1.0] — 2026-06-08

### 🖼️ ใส่ Pixel Art Assets จากโฟลเดอร์ `assets/`

**Sprites ที่ใช้:**
| Asset | ใช้แทน |
|---|---|
| `Boat1–4_water_animation_color1` (4 frames) | ศัตรูเรือลาดตระเวน (animated) |
| `Boat4_water_animation_color1` | Boss Gunboat |
| `Cannon1–3_color1` | ปืน AA Gun (rotate หาผู้เล่น realtime) |
| `Fire1–4` (3 frames each) | เอฟเฟกต์ไฟเมื่อ boss ถูกโจมตี |
| `Broken_asset_water` (8 frames) | Death animation เมื่อเรือจม |
| `Tileset/tile_0074–0101` (28 water tiles) | พื้นผิวแม่น้ำในฉาก Mekong Delta |
| `Shadows/` | Shadow ใต้ sprite (optional layer) |

**ระบบ Sprite:**
- `drawSprite(key, x, y, w, h, flipX, angle)` — helper หลัก
- เรือ: animation 4 frames วน loop ตามเวลา (`boatFrame()`)
- ปืน: `ctx.rotate()` ชี้หาผู้เล่นทุก frame
- แม่น้ำ: tile จากชุด water tileset เรียงตาม scrollY
- Fallback: วาด rect สีหากภาพยังไม่โหลด

**ศัตรู 3 ประเภท:**
- `boat` (variants 1–3): เรือเคลื่อนที่แนวนอน ยิงตามผู้เล่น
- `cannon`: ปืนเคลื่อนลงมาจากด้านบน หมุนชี้เป้า
- `boss_boat` (Boat4): boss ขนาดใหญ่ 2 phase พร้อม spread shot

---

## [1.2.0] — 2026-06-08

### 🎵 ระบบ Audio

**Music (loop):**
| ไฟล์ | ใช้เมื่อ |
|---|---|
| `Game_menu_theme_loopable.mp3` | Title Screen |
| `Battle_theme_loopable.mp3` | Mission 1–2 |
| `Main_theme_night_city_loopable.mp3` | Mission 3 (กลางคืน) |

**SFX:**
| ไฟล์ | Event |
|---|---|
| `Laser_shot.wav` | ยิงกระสุน (Z/Space) |
| `Tank_shot.wav` | ทิ้งระเบิด (X) |
| `Tech_death_1/2.wav` | ศัตรูตาย (สุ่ม) |
| `Truck_gun_shot.wav` | Boss ยิง |
| `Walkie_talkie.wav` | ผู้เล่นโดนยิง |
| `Helicopter_walk.wav` | เฮลิบิน (loop ตลอด) |
| `Helicopter_engine_start/stop.wav` | เริ่ม / จบเกม |
| `Collect_sound.wav` | เก็บของ |

**ระบบเสียง:**
- ใช้ `cloneNode()` เพื่อให้เสียงซ้อนทับกันได้
- `playMusic(key)` / `stopHeliLoop()` จัดการ fade-in/out
- Unlock audio ครั้งแรกเมื่อ user กดปุ่ม (browser autoplay policy)
- Music เปลี่ยนอัตโนมัติเมื่อผ่าน Mission 2 → 3

---

## [1.3.0] — 2026-06-08

### 🏆 Game Over — Name Entry + Leaderboard + Share

**Name Entry (3 ตัวอักษร):**
- `↑` / `↓` — เปลี่ยนตัวอักษร (A–Z, 0–9)
- `←` / `→` — เลื่อนระหว่างช่อง
- พิมพ์ตรงได้ (A-Z / 0-9) แล้วเลื่อนช่องอัตโนมัติ
- `Backspace` — ถอยหลัง reset ช่อง
- `Enter` — ยืนยันชื่อ

**Leaderboard:**
- เก็บ Top 5 ใน `localStorage` key `sr69_board`
- แสดง: อันดับ / ชื่อ / คะแนน / Mission ที่ถึง
- ชื่อของรอบนี้ไฮไลท์สีทอง

**Share Buttons (HTML overlay เหนือ canvas):**
- 📘 **Facebook** → `facebook.com/sharer/sharer.php?quote=...`
- 💬 **LINE** → `line.me/R/msg/text/?...`
- 🔄 **เล่นใหม่** → reset เกมทันที
- ปุ่มหายอัตโนมัติเมื่อกด Enter หรือ "เล่นใหม่"

**States เพิ่ม:**
- `STATE.NAME_ENTRY = 5` (ทั้ง Game Over และ Mission Complete ใช้ state เดียวกัน)
- `nameEntryFromClear` flag: ปรับ header สี/ข้อความตามผลลัพธ์

---

## [1.4.0] — 2026-06-08

### 💣 ระบบระเบิดทั้งฉาก (Screen Bomb)

**การเปลี่ยนแปลง:**
- เปลี่ยนปุ่ม `X` จาก "ยิงจรวด" → **"ทิ้งระเบิดทั้งฉาก"**
- จำนวนเริ่มต้น: **2 ลูก** ต่อ game (ไม่ reload)

**ผลของ Bomb:**
- ศัตรูทุกตัวบนจอ: ตายทันที + spawn wreckage + particle explosion
- Boss: ลด HP ลง 50% (ไม่ตายทันที)
- คะแนน: ได้ point จากศัตรูทุกตัวที่ตาย

**Visual Effects:**
- Screen flash สีส้มแบบ fade out
- Shockwave ring ขยายออกจากกลางจอ
- Particle burst 40 จุดกระจายรัศมี 360°
- Fire sprite จาก asset แสดง ณ จุดระเบิด

**SFX:**
- เสียงระเบิดซ้อน 3 ชั้น (`Tank_shot` + `Tech_death_1/2`) ห่างกัน 80ms

**HUD:**
- แสดง 2 ไอคอนวงกลมสีส้มแทน text "RKT"
- ไอคอนสีจางเมื่อใช้ไปแล้ว

---

## [1.5.0] — 2026-06-09

### 🔄 แก้ทิศทาง Terrain — บินไปข้างหน้าถูกต้อง

**ปัญหา:**
- หลังจาก redesign terrain เป็น horizontal strip system (v1.4.x)
- `worldY = scrollY + sy` ทำให้ top=worldY ต่ำ, bottom=worldY สูง
- Zone ใหม่ปรากฏจาก **ด้านล่าง** และเลื่อนขึ้น = รู้สึกเหมือนบินถอยหลัง

**วิธีแก้:**
- เปลี่ยน formula เป็น `worldY = scrollY + H - sy`
- top (sy=0): worldY = scrollY+H = ข้างหน้า (เหนือ) ✓
- bottom (sy=H): worldY = scrollY = ตำแหน่งปัจจุบัน ✓
- Zone ใหม่ปรากฏจาก **ด้านบน** ไหลลงสู่ด้านล่าง = บินไปข้างหน้าถูกต้อง

**ไฟล์ที่แก้ (`Terrain` class ใน `game.js`):**
- `draw()`: `worldY = scrollY + H - sy`
- `_drawFoliage()`: `worldY = scrollY + H - sy`
- `isRiver()`: `this._zoneBlend(scrollY + H - screenY)`

---

## [1.6.0] — 2026-06-09

### 🪨🌿 Background Objects — Rock, Plant, Reed, Water Lily

**ระบบ Object ใหม่ (`_drawObjects`):**
- วาด object ตาม **worldY anchor** (ไม่ใช่ per-strip) → ทรงสามมิติ ไม่เป็นแถบ

**Object ตามโซน:**
| Object | โซน | คำอธิบาย |
|---|---|---|
| 🪨 Rock | Jungle | กลุ่ม rect ไม่สม่ำเสมอ + เงา + เส้นแตก |
| 🌿 Bush/Plant | Jungle | ellipse ซ้อน 3 ชั้น + ไฮไลท์ + เงาล่าง + ก้าน |
| 🌾 Reed | ริมแม่น้ำ (x<55, x>W-55) | ต้นกก 2 เส้น + หัว reed สีน้ำตาล |
| 🪸 Water Lily | กลางแม่น้ำ | ellipse ใบ + กลีบดอกสีขาว/ชมพู |

**Technical:**
- `STEP = 28` world-unit ต่อแถว, 1–3 object ต่อแถว (deterministic hash)
- ตำแหน่ง X/size/type ทุกอย่าง deterministic จาก `row` + `i` → ไม่กระตุก
- `screenY = H - (anchorWorldY - scrollY)` แปลงกลับจาก worldY
- Reed มี sway เล็กน้อยตาม hash → ดูเป็นธรรมชาติ
- **v1.6.1**: เปลี่ยนจาก canvas shapes → sprite images จริง
  - Rocks: `Rock1_1.png`–`Rock8_1.png` (64×64, 8 แบบ) ลบพื้นขาวด้วย `removeWhiteBg()`
  - Plants: `Plants.png` (768×432, grid 12×6, cell 64×72) 6 cell ที่เลือก (bush/leaf/aloe)
  - Fallback: canvas shapes เมื่อรูปยังโหลดไม่เสร็จ

---

## [1.7.0] — 2026-06-09

### 🪖 ระบบศัตรูใหม่ — ถูกโซนพื้นที่

**กฎโซน:**
| ศัตรู | โซน | พฤติกรรม |
|---|---|---|
| 🚢 เรือ (boat) | แม่น้ำเท่านั้น (`onRiver = true`) | เคลื่อนแนวนอน + drift ลงเล็กน้อย |
| 🪖 รถถัง (tank) | บกเท่านั้น (`onRiver = false`) | เลื่อนลงพร้อม terrain + ลาดตระเวน L/R |
| 🔫 ป้อมปืน (cannon) | บกเท่านั้น | **อยู่กับที่** — เลื่อนลงตาม terrain (90px/s) |

**รถถัง (ใหม่):**
- Sprite: `Hulls_Color_C/Hull_01.png` (256×256, สีเขียวทหาร) + `Weapon_Color_A/Gun_01.png`
- ลบพื้นขาวด้วย `removeWhiteBg()` → `tankHullCanvas` + `tankGunCanvas`
- Hull หมุนตามทิศลาดตระเวน (ซ้าย/ขวา)
- Gun turret หมุนชี้ผู้เล่นอิสระ
- HP: 6 + mission×2 (แข็งแกร่งกว่าเรือ)

**ป้อมปืน:**
- เปลี่ยนจาก `speed = 20` (เลื่อนลงช้า) → `speed = SCROLL_SPEED (90)` → ดูอยู่กับที่บนพื้น
- ยังคง rotate หมุนชี้ผู้เล่นเหมือนเดิม

**`SCROLL_SPEED = 90`** — constant shared ระหว่าง terrain และ enemy physics

---

## [1.8.0] — 2026-06-09

### 🪖 รถถัง — แก้ปืนหันผิดด้าน + วิ่งไล่ player

**แก้ทิศป้อมปืน (Gun turret):**
- ปัญหา: `Math.atan2(gdy, gdx) - Math.PI/2` → barrel ชี้ขึ้น (เหนือ) แทนที่จะชี้หา player
- แก้เป็น `Math.atan2(gdx, -gdy)` (atan2 แบบ "north-facing" sprite)
  - player อยู่ใต้ (gdy>0): angle = π → barrel ชี้ลง ✓
  - player อยู่ขวา: angle = π/2 → barrel ชี้ขวา ✓

**รถถังวิ่งไล่ player:**
- เปลี่ยนจาก patrol bounce ซ้าย-ขวา → **chase player.x** อัจฉริยะ
- `targetVx = sign(player.x - tank.cx) * maxVx`
- smooth acceleration: `vx += (targetVx - vx) * 3.5 * dt` → เบรก/เร่งเป็นธรรมชาติ
- `maxVx = 38 + mission×4` (เร็วขึ้นตาม mission)

**Hull หมุนตามทิศที่วิ่งจริง:**
- `hullAngle = Math.atan2(vx, -SCROLL_SPEED)`
- วิ่งขวา → hull หันขวา | วิ่งซ้าย → hull หันซ้าย | straight down → hull หันใต้

---

## [1.9.0] — 2026-06-10

### 🖥️ ขยายหน้าจอ 1.5× + ตัวหนังสือชัดขึ้น + ศัตรูเพิ่ม 2×

**ขยายหน้าจอ 1.5× (แบบคมชัด):**
- เปลี่ยน canvas จริงจาก `320×480` → `480×720` px (`index.html`)
- เพิ่ม `ctx.scale(1.5, 1.5)` ครั้งเดียวหลัง `getContext('2d')` (`game.js`)
- ผล: ทุก draw call ยังใช้พิกัด W=320/H=480 เหมือนเดิม 100% ไม่ต้องแก้โค้ดที่เหลือ
- Text, sprites, HUD render ที่ความละเอียดจริง → **ไม่เบลอ** (ต่างจาก CSS scale)

**ตัวหนังสือชัดขึ้น:**
- ก่อนหน้า: canvas 320×480 แสดงผลด้วย CSS width/height 480×720 → browser scale → เบลอ
- หลังแก้: canvas render ที่ 480×720 จริง → `image-rendering: pixelated` ใช้งานที่ scale 1:1

**ศัตรูเพิ่ม 2×:**
- `enemyTimer` ลดจาก `1.4–2.8 วิ` → `0.7–1.4 วิ` → spawn rate เพิ่มเป็น 2 เท่า

---

## [Backlog / TODO]

- [ ] Power-up drops จาก supply units (fuel, ammo, bomb refill)
- [ ] Destructible environment (พุ่มไม้ไหม้, กระท่อมพัง)
- [ ] Mission briefing screen ก่อนเริ่มแต่ละ mission
- [ ] High score sync กับ server
- [ ] Mobile touch controls
- [ ] Port เป็น Godot 4.x GDScript
