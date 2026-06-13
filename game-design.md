# Steel Rain: Vietnam '69 — Game Design Review

> วิเคราะห์โดยมุมมอง game designer สาย STG (shoot 'em up) — สิ่งที่เกมยังขาด เรียงตามผลกระทบ/ความคุ้มแรง
> อัปเดต: 2026-06-13

## สถานะปัจจุบัน
- Vertical shmup, AH-1 Cobra บินบุกป่าเวียดนาม
- Terrain แบบ horizontal strip (แม่น้ำ/พื้นดิน), background objects (rocks, plants)
- ศัตรู: เรือ (ในน้ำ), รถถัง (บนบก + ไล่ player), ป้อมปืน (อยู่กับที่)
- Boss boat ที่ 60 วินาที (multi-phase ตื้น)
- Player: HP 5, ammo 60 (ระบบ heat/regen), บอมบ์ 2 ลูก
- ระบบคะแนน + Firebase global leaderboard (top 10)
- Sound effects + music

---

## 🔴 สำคัญมาก — หัวใจของ STG ที่ยังไม่มี

1. **ระบบ Power-up / ไอเทมหล่นจากศัตรู** — ตอนนี้ player ยิงแบบเดียวตลอดเกม ไม่มีการเติบโต (ขาดมากที่สุด)
   - ดรอปไอเทมเมื่อทำลายศัตรู (อาวุธอัปเกรด, spread shot, laser, missile)
   - ระดับพลังยิง (power level 1-5) ที่หายเมื่อตาย
   - ไอเทมฟื้น HP / เติมระเบิด

2. **ไม่มี invincibility frame หลังโดนยิง** — โดนแล้วโดนซ้อนได้ทันที = ตายรัวไม่เป็นธรรม
   - ต้องมี i-frame 1-2 วินาที + กระพริบตัวละคร (มาตรฐาน genre)

3. **ระบบคะแนนตื้นเกินไป** — "ทำลาย = ได้แต้ม" คนเล่นเก่งไม่มีอะไรไล่ล่า
   - Combo / Chain — ทำลายต่อเนื่องได้ตัวคูณ
   - Grazing (เฉียดกระสุน = แต้ม) หรือ medal collection แบบ Cave
   - โบนัส no-miss / no-bomb ตอนจบ stage

## 🟡 สำคัญ — game feel & ความหลากหลาย

4. **ขาด "juice" ตอนกระทบ**
   - ไม่มี screen shake ตอนระเบิด/บอมบ์
   - ไม่มี hit-stop (หยุดเฟรมสั้นๆ ตอนฆ่าบอส) — เพิ่มน้ำหนักการกระทบมหาศาล
   - ไม่มี flash ขาวตอนศัตรูโดนยิง (damage feedback)

5. **Enemy pattern เดียว ไม่มี bullet pattern ที่จำได้** — ศัตรูยิงตรงเข้าหา player อย่างเดียว
   - ควรมี fan/spiral/aimed-burst ต่างกันตามชนิดศัตรู

6. **บอสมีแค่ตัวเดียว (boss_boat) และเฟสตื้น**
   - ควรมีบอสต่างชนิดต่อ mission
   - multi-phase ที่เปลี่ยน pattern ชัดเจน + telegraph ก่อนท่าใหญ่

## 🟢 ควรมี — โครงสร้างเกมระยะยาว

7. **ความยาก scale ด้วยตัวเลขล้วน (hp+mission)** — ไม่มีดีไซน์ความยากจริง
   - ควรมี difficulty curve ที่ออกแบบ + โหมด Easy/Normal/Hard

8. **ไม่มี onboarding / tutorial** — ผู้เล่นใหม่ไม่รู้เรื่อง heat/ammo regen, การใช้บอมบ์
   - ควรมี hint 2-3 บรรทัดตอนเริ่ม หรือ stage แรกที่สอนกลายๆ

9. **Mission แยกไม่ชัด (จบที่ 60 วิ → mission clear)** — ขาดความรู้สึก "ด่าน"
   - intro ชื่อด่าน, ฉากต่างกันต่อ mission (ตอนนี้ terrain สุ่มเหมือนกันหมด), ending

10. **Meta / retention**
    - ไม่มี persistent best score ของตัวเอง (มีแต่ global board)
    - ไม่มี unlock (ปลดเครื่องบินใหม่, สกิน) ให้กลับมาเล่น
    - ไม่มี daily challenge / seed

---

## ลำดับความสำคัญที่แนะนำให้ทำก่อน
ทำ 3 อย่างนี้คุ้มที่สุด เปลี่ยนเกมจาก "prototype ที่เล่นได้" เป็น "เกมที่รู้สึกดีตอนเล่น":
1. ข้อ 1 — Power-up / ไอเทมดรอป
2. ข้อ 2 — i-frame หลังโดนยิง
3. ข้อ 4 — screen shake + hit-stop
