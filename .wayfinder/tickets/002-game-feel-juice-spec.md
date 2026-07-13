<!-- label: wayfinder:prototype -->
<!-- status: closed -->
<!-- assignee: somphongw-x10 (this session) -->
<!-- blocked-by: 001 -->
# Spec: game feel / juice

## Question

juice ที่มีอยู่ (screen shake, hit-stop, particle, muzzle flash) ยังหยาบตรงไหน และควรเพิ่ม/ปรับอะไรบ้างให้ถึง bar? ล็อกรายการรูปธรรม: death animation ศัตรู, hit feedback (flash/knockback), การสั่นจอที่ไม่เวียนหัว, particle การยิง/ระเบิด, feedback ตอนเก็บ item — พร้อมระดับความแรงของแต่ละอัน

## Resolution

ล็อกทั้ง 6 รายการ (ผ่าน polish bar READABLE+PUNCHY+IMMEDIATE) — ลงมือแก้โค้ดจริงใน session นี้:

- **J1 ศัตรูตายได้ระเบิดจริง** — ใช้ Fire sprite ที่มี, เล่น explosion sequence + จอสั่นเบาทุก kill
- **J2 hit-stop ทุก kill** — freeze สั้น (normal ~0.04s, boss คงเดิม 0.09s)
- **J3 particle เป็นเศษ chunky** — เศษมี gravity + หมุน + fade curve
- **J4 player โดนยิง = flash แดง + จอสั่น** — เพิ่มจาก i-frame blink เดิม
- **J5 muzzle flash + recoil** — เครื่องบินสะท้อนถอยเล็กน้อยตอนยิง
- **J6 powerup pickup pop** — flash + ตัวอักษรเด้ง

กฎ: readable ชนะ punchy — effect ห้ามบังจนอ่านเกมไม่ออก

