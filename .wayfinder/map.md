<!-- label: wayfinder:map -->
# Map: ยกระดับ polish ของ Steel Rain ให้เหมือน production

## Destination

polish spec ที่จัดลำดับความสำคัญแล้ว ครอบคลุม 5 ผิว (game feel/juice, กราฟิก/VFX, เสียง, menu/presentation, animation) — ทุกการตัดสินใจล็อกว่าจะทำอะไร ที่ระดับ (bar) ไหน อ้างอิงอะไร — พร้อมส่งมอบให้ session ลงมือทำจริง ปลายทางคือ "รู้ชัดว่าต้องทำอะไรบ้างเพื่อให้เกมไม่ดูเหมือน prototype" ไม่ใช่ขัดจบใน session เดียว

## Notes

- โดเมน: HTML5 Canvas 2D vertical shmup (Steel Rain: Vietnam '69). โค้ดหลัก [game.js](../game.js)
- เป้าหมายพอร์ทระยะยาว: Poki/CrazyGames/GameDistribution (GameMonetize ปฏิเสธเกม AI แล้ว)
- ความคืบหน้าเกม: item 1-5, 7, 8 ใน [game-design.md](../game-design.md) เสร็จแล้ว
- Skills ที่ควรใช้ต่อ ticket: `/grilling` + `/domain-modeling` (default), `/prototype` สำหรับ "ควรดู/รู้สึกยังไง"
- ⚙️ **Override (ตกลงกับ user):** carry execution เข้า map ได้ — แต่ละ area spec เมื่อ grill/ล็อกเสร็จ ให้ **ลงมือแก้โค้ดจริงในรอบเดียวกัน** ไม่ใช่แค่ decision (ทำทีละผิว: spec → build → verify)
- ▶️ ใบสุดท้าย: 007 (ประกอบ+จัดลำดับ = destination) — area spec ทั้ง 5 เสร็จแล้ว unblocked

## Decisions so far

- [ปักหมุด polish bar + เกมอ้างอิง](tickets/001-polish-bar-references.md) — อ้างอิง 1943/Raiden, ทิศทาง arcade; polish bar = READABLE + PUNCHY + IMMEDIATE (ทุก area spec ต้องผ่าน 3 ข้อนี้)
- [Spec: game feel / juice](tickets/002-game-feel-juice-spec.md) — ล็อก+ลงมือ J1-J6: explosion บน kill, hit-stop ทุก kill, chunky debris, red hit flash, muzzle+recoil, pickup popup — verified ใน browser
- [Spec: กราฟิก / VFX](tickets/003-graphics-vfx-spec.md) — แนว A overlay-only, ลงมือ G1-G5: parallax, vignette, กระสุนแยกสี (player เหลือง/enemy แดง), HUD accent, mission tint (day/dusk/night) — verified, ไม่ใช้ asset ใหม่
- [Spec: เสียง](tickets/004-audio-spec.md) — ลงมือ A1-A5: sfx variation+blast layer, music ducking, crossfade transition, arcade UI (insert-coin/beep/confirm), boss+low-HP warning — verified, ใช้ asset ที่มี
- [Spec: menu/presentation](tickets/005-menu-presentation-spec.md) — ลงมือ M1-M5: fade transitions, mission intro card, WARNING banner, victory beat, title tagline — verified ใน browser
- [Spec: animation](tickets/006-animation-spec.md) — ลงมือ N1-N5: heli banking, enemy muzzle flash, foliage sway, boss telegraph, enemy scale-in entrance — verified, ไม่ใช้ asset ใหม่

## Not yet specified

- การจัดลำดับ backlog รวม (ผิวไหนทำก่อน คุ้มสุด) — จะคมพอ ticket ได้หลัง area spec ทั้ง 5 เสร็จ
- งบ performance (particle/parallax เยอะแค่ไหนก่อน fps ตก บนมือถือ) — ขึ้นกับผลของ juice/graphics spec
- แหล่ง asset ใหม่ vs reuse ของเดิม (ต้องซื้อ/หา art เพิ่มไหม) — ขึ้นกับ graphics/animation spec
- มาตรฐานคุณภาพเฉพาะของ Poki/CrazyGames ที่แตะเรื่อง polish — อาจ research แยกถ้าเล็งพอร์ทเจาะจง

## Out of scope

<!-- gameplay depth (boss variety, mission structure, meta) = game-design.md item 6/9/10 — คนละ effort -->
- Boss variety / mission structure / meta-retention (game-design item 6, 9, 10) — เป็น "depth" ไม่ใช่ "visible polish" อยู่นอกปลายทางแผนนี้
