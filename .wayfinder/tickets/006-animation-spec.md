<!-- label: wayfinder:prototype -->
<!-- status: closed -->
<!-- assignee: somphongw-x10 (this session) -->
<!-- blocked-by: 001 -->
# Spec: animation

## Question

sprite และ environment ควรมีชีวิตขึ้นตรงไหน? ล็อก: animation ศัตรู (idle/เคลื่อนไหว/ตาย), น้ำไหว, ควัน/ไฟ, ต้นไม้/พืชโยกตามลม, animation player (เอียงตอนเลี้ยว, ใบพัด), telegraph ก่อนศัตรูยิง — อันไหนใช้ frame ที่ asset มีอยู่ อันไหนต้องทำเพิ่ม

## Resolution

ล็อก+ลงมือ N1-N5 ครบ verified ใน browser (ไม่มี console error). ของเดิมที่ animate อยู่แล้ว: boat 4-frame, tank hull/gun หมุน, cannon เล็ง, heli rotor:

- **N1 Heli banking** — player.tilt ตาม move direction, drawPlayerHeli หมุนตาม (ease กลับระดับ) — verified
- **N2 Enemy muzzle flash** — e.muzzle ตอนศัตรูยิง, วาด flash เหลือง+ขาว หันเข้า player — verified
- **N3 Water shimmer + foliage sway** — river shimmer มีอยู่แล้ว + เพิ่ม sway ลม foliage streak ตาม time
- **N4 Boss telegraph** — กรอบแดงกระพริบรอบบอสตอน windup (shootTimer < 0.45) — verified screenshot
- **N5 Enemy entrance** — scale-in 55%→100% ใน 0.28s ตอนศัตรูโผล่ — verified

ไม่ต้องใช้ asset ใหม่ — ทั้งหมดใช้ transform/frame ที่มี

