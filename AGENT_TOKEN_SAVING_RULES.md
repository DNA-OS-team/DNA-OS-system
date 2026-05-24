# AGENT_TOKEN_SAVING_RULES.md

# Token Saving Rules for AI Agent

อ่านไฟล์นี้ก่อนเริ่มทำงานทุกครั้ง

## เป้าหมาย

ใช้ token ให้น้อยที่สุด  
ลดการอ่านไฟล์ซ้ำ  
ลดการ retry ซ้ำ  
ทำเฉพาะ task ที่สั่งเท่านั้น

---

## Core Rules

1. ห้ามอ่านทั้งโปรเจกต์ถ้าไม่จำเป็น
2. อ่านเฉพาะไฟล์ที่เกี่ยวข้องกับ task ปัจจุบัน
3. อ่าน `PROJECT_PROGRESS.md` ก่อนเสมอ
4. ถ้าทำ API ให้อ่านเฉพาะ section ที่เกี่ยวข้องใน `API_DESCRIPTION.md`
5. ถ้าทำ database ให้อ่านเฉพาะ model ที่เกี่ยวข้องใน `DATABASE_SCHEMA.md`
6. ถ้าทำ LINE ให้อ่านเฉพาะ section ที่เกี่ยวข้องใน `LINE_FIRST_DESIGN.md`
7. ถ้าทำ workflow ให้อ่านเฉพาะ section ที่เกี่ยวข้องใน `WORKFLOW_AND_ROLE_RULES.md`
8. ห้าม refactor ไฟล์อื่นที่ไม่เกี่ยวข้อง
9. ห้ามสร้าง feature เพิ่มเอง
10. ห้าม retry เกิน 1 ครั้ง ถ้า error ยังอยู่ให้หยุดและสรุป error

---

## Work Process

ทุก task ให้ทำตามลำดับนี้:

```txt
1. อ่าน PROJECT_PROGRESS.md
2. อ่านไฟล์ที่เกี่ยวข้องกับ task เท่านั้น
3. สรุปแผนสั้น ๆ ไม่เกิน 5 ข้อ
4. แก้เฉพาะไฟล์ที่จำเป็น
5. run test/build เฉพาะส่วนที่เกี่ยวข้อง
6. อัปเดต PROJECT_PROGRESS.md เฉพาะสิ่งที่ทำจริง
7. หยุดทันที