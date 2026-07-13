<!-- label: wayfinder:prototype -->
<!-- status: closed -->
<!-- assignee: somphongw-x10 (this session) -->
<!-- blocked-by: 001 -->
# Spec: กราฟิก / VFX

## Question

ทำให้ภาพดูมีมิติและโปรขึ้นได้ยังไง ภายในข้อจำกัด asset ปัจจุบัน? ล็อก: พื้นหลังหลายชั้น (parallax), แสง/เงา, palette/สีสันต่อ mission, ปรับ HUD ให้ดูโปร (ไม่ใช่ debug text), overlay effect (scanline/vignette/สภาพอากาศ) — อันไหน reuse ของเดิม อันไหนต้อง asset ใหม่

## Resolution

**แนวทาง A** (overlay-only, ไม่แตะ base art — ลดความเสี่ยง sprite ตีกัน) ล็อก+ลงมือ 5 รายการ verified ใน browser:

- **G1 Parallax** — เงาเมฆลอยผ่านเร็วกว่า terrain (drawParallax) → มิติความลึก
- **G2 Vignette** — radial gradient ขอบมืด โฟกัสกลางจอ (cached)
- **G3 กระสุนอ่านชัด** — player = เหลือง+core ขาว+glow, enemy = แดง/ชมพู+glow (แยกกันชัด ไม่สับสน)
- **G4 HUD accent** — panel เข้มขึ้น + เส้น accent เขียวสไตล์ตู้เกม
- **G5 Atmosphere ต่อ mission** — tint ต่อด่าน: 1 กลางวัน (ไม่มี tint), 2 dusk อุ่น, 3 night น้ำเงินเย็น

ไม่ต้องใช้ asset ใหม่เลย — ทั้งหมดเป็น overlay/ปรับสีใน code

