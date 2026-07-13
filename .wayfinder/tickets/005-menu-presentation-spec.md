<!-- label: wayfinder:prototype -->
<!-- status: closed -->
<!-- assignee: somphongw-x10 (this session) -->
<!-- blocked-by: 001 -->
# Spec: menu / presentation / transitions

## Question

title, transition ระหว่างฉาก, mission intro, ending, game over — ควรดูยังไงให้ต่อเนื่องและโปร? ล็อก: title screen ที่ขายเกมได้, transition (fade/wipe) แทนการตัดกระโดด, mission intro card, ending/victory screen, การจัด layout/typography รวม — สร้าง prototype ให้ดูจริง

## Resolution

ล็อก+ลงมือ M1-M5 ครบ verified ใน browser (ไม่มี console error):

- **M1 Fade transitions** — ระบบ fade (startFade + fade.onMid ที่ full black) ใช้ตอน title→play; overlay วาดทุก state
- **M2 Mission intro card** — banner "MISSION N / <ชื่อด่าน>" ทุกครั้งที่ขึ้นด่านใหม่ (รวมด่าน 1) — verified screenshot
- **M3 WARNING banner** — ป้ายกระพริบ "WARNING! BOSS APPROACHING" คู่เสียง A5 — verified screenshot
- **M4 Victory beat** — card "MISSION COMPLETE / ALL SECTORS CLEARED" ค้าง ~2.6s ก่อน handoff ไป name entry (victoryPending)
- **M5 Title upgrade** — tagline "RAIN STEEL ON THE JUNGLE WAR" + PRESS ENTER blink + difficulty selector — verified screenshot

