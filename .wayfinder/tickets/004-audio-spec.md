<!-- label: wayfinder:grilling -->
<!-- status: closed -->
<!-- assignee: somphongw-x10 (this session) -->
<!-- blocked-by: 001 -->
# Spec: เสียง

## Question

soundscape ปัจจุบัน (sfx + music loop) ยังขาด polish ตรงไหน? ล็อก: layering/variation ของ sfx (ยิง/ระเบิดไม่ซ้ำเดิมทุกครั้ง), dynamic mixing (ลดเพลงตอน action, duck), music transition ระหว่าง mission/boss, เสียง feedback UI — อันไหนทำได้ด้วย asset ที่มี อันไหนต้องหาเพิ่ม

## Resolution

ล็อก+ลงมือ A1-A5 ครบ (ใช้ sound asset ที่มีอยู่ทั้งหมด ไม่ต้องหาเพิ่ม) verified ใน browser (sfx โหลดครบ, ทุก path ไม่ throw):

- **A1 SFX variation** — playExplosionSfx() สุ่ม death sfx + occasional blast layer (Crate_open), pitch variance; boss ตายมี layered blast
- **A2 Dynamic ducking** — duckMusic() หรี่เพลงแล้ว ramp กลับ ตอน bomb / boss มา / boss ตาย / player โดนยิง
- **A3 Music transition** — playMusic() crossfade 12-step แทนตัดกระโดด
- **A4 UI/arcade feedback** — "insert coin" ตอนเริ่ม (Insert_coin), beep เลื่อน difficulty (Neon_1), confirm ชื่อ (Print_ticket)
- **A5 Warning cues** — Police_signal ตอน boss มา + ตอน HP เหลือ 1

หมายเหตุ: sound asset ที่มีพอครบ ไม่ต้องซื้อ/หาเพิ่ม

