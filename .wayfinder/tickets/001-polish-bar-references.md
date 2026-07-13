<!-- label: wayfinder:prototype -->
<!-- status: closed -->
<!-- assignee: somphongw-x10 (this session) -->
<!-- blocked-by: -->
# ปักหมุด "polish bar" + เกมอ้างอิง

## Question

"production quality" สำหรับเกมนี้หน้าตาเป็นยังไง? เลือกเกม shmup/arcade อ้างอิง 2-3 เกมที่เป็นเป้าคุณภาพ แล้วสกัดออกมาเป็นเกณฑ์รูปธรรม (เช่น "hit feedback ต้องมี X", "พื้นหลังต้องมี Y ชั้น") ที่ทุก area spec จะอ้างอิงร่วมกัน — เพื่อไม่ให้แต่ละผิวนิยาม "ดีพอ" คนละมาตรฐาน

## Resolution

**เกมอ้างอิง:** 1943 และ Raiden (arcade classic military shmup)
**ทิศทาง:** "มันแบบตู้เกม arcade" ไม่ใช่ mobile premium

### THE POLISH BAR — หลักการแกน (ทุก area spec ต้องผ่าน 3 ข้อนี้)

1. **READABLE (อ่านง่าย)** — sprite/กระสุนอ่านออกเสมอแม้พื้นหลังรก; player bullet กับ enemy bullet แยกสีชัด; ตัวละครสำคัญคอนทราสต์สูงกับพื้นหลัง
2. **PUNCHY (กระแทกหนัก)** — ทุก impact ได้ feedback เกินจริง: ระเบิดใหญ่ เศษกระจาย จอสั่น flash; อาวุธรู้สึก "หนัก"
3. **IMMEDIATE (ทันที)** — feedback ออกทันทีที่กระทำ ไม่หน่วง ไม่ subtle; เสียงดังชัด; ไม่มี effect เนียนแบบ realistic

### เกณฑ์รูปธรรมต่อผิว (baseline ที่ area spec ขยายต่อได้)

- **Feel/juice** → hit-flash ศัตรูทุกครั้งที่โดน, death explosion มีเศษ/debris, big kill ได้ hit-stop สั้น + จอสั่น, powerup pickup มี flash
- **กราฟิก/VFX** → palette จัดจ้าน saturated (ไม่หม่น), พื้นหลังเลื่อนหลายชั้น (ทะเล/พื้นดิน), กระสุนสีตัดกันชัด, HUD คมแบบตู้เกม
- **เสียง** → sfx สั้น punchy ต่อ action, เสียงต่างกันต่ออาวุธ/ศัตรู, เพลง military loop, cue เตือน/powerup ดังชัด
- **Menu/presentation** → attract-mode title + "PRESS START", stage/mission intro banner, score เด่น, high-score table วิบแบบตู้, scanline/CRT ได้
- **Animation** → เครื่องบินเอียง/แบงก์ตอนเลี้ยว, explosion sprite sequence, น้ำวิบวับ, muzzle flash, boss telegraph ก่อนท่าใหญ่

### กฎเหล็ก (anti-goals)
- ห้าม subtle/realistic (ควันจาง แสงนวล) — arcade ต้อง bold
- ห้ามให้ effect บังจนอ่านเกมไม่ออก (readable ชนะ punchy เสมอเมื่อขัดกัน)

