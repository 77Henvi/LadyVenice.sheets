# LadyVenice.bq

ระบบจัดการร้านดอกไม้และหน้า Catalog สาธารณะสำหรับลูกค้า สร้างขึ้นเพื่อใช้งานจริงในร้าน LadyVenice Bouquets

---

## โครงสร้างของโปรเจค

โปรเจคนี้แบ่งออกเป็น 2 ส่วนหลัก

**ฝั่งแม่ค้า (Admin)** — `index.html`  
จัดการสต็อก การเงิน ออเดอร์ และ catalog ผ่านระบบ login ที่ต้องมี account

**ฝั่งลูกค้า (Public)** — `catalog.html`  
หน้าดู catalog แบบ flipbook ไม่ต้องล็อกอิน เปิดจาก link ได้เลย

---

## Features

### Admin App
- **Stock** — เพิ่ม แก้ไข ลบสินค้า พร้อมคำนวณกำไรต่อหน่วยอัตโนมัติ
- **Finance** — บันทึกรายรับ/รายจ่าย ดูสรุปรายเดือน
- **Orders** — จัดการออเดอร์ลูกค้า ติดตามสถานะ (รอดำเนินการ / พร้อมส่ง / เสร็จแล้ว)
- **To-do List** — แพลนงานประจำวัน พร้อมระบบ archive เก็บประวัติรายวัน
- **Stats** — กราฟรายรับ-รายจ่ายรายปี คลิกดูรายละเอียดแต่ละเดือนได้
- **Catalog Admin** — จัดการสินค้าที่จะแสดงในหน้าลูกค้า พร้อมอัปโหลดรูปและเลือกส่วนประกอบดอกไม้

### Public Catalog
- **Splash Screen** — animation แบบ YSL pattern (JS-driven transition)
- **Hero Banner** — รูปดอกไม้ full-viewport + parallax scroll บน desktop
- **Info Section** — ข้อมูลการจัดส่งและราคา พร้อม size guide
- **Flipbook** — แสดงสินค้าแบบ flipbook พลิกหน้าได้ รองรับทั้ง swipe และปุ่ม
- **Bilingual** — สลับภาษาไทย / อังกฤษ ผ่านปุ่มลูกโลกมุมขวาบน
- **Butterfly Animation** — ผีเสื้อบินพื้นหลัง section flipbook

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | HTML, CSS, Vanilla JS (ES Modules) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Vercel |
| Flipbook | PageFlip.js |
| Icons | Lucide Icons |
| Fonts | Pinyon Script, Playfair Display, DM Sans, Cormorant Garamond |

---

## โครงสร้างไฟล์

```
/
├── index.html              # Admin app
├── catalog.html            # Public catalog
├── css/
│   ├── style.css           # Admin styles
│   └── catalog.css         # Catalog styles
├── js/
│   ├── app.js              # Entry point
│   ├── auth.js             # Login / logout
│   ├── main.js             # Realtime listeners + dashboard
│   ├── stock.js            # Stock management
│   ├── finance.js          # Finance management
│   ├── orders.js           # Order management
│   ├── todos.js            # To-do list
│   ├── stats.js            # Stats + chart
│   ├── catalog-admin.js    # Catalog admin
│   ├── catalog-public.js   # Public catalog + flipbook
│   ├── i18n.js             # Translation system
│   ├── supabase-config.js  # Supabase client
│   └── utils.js            # Shared helpers
└── images/
    ├── floral-bg.jpg        # Hero + splash background
    ├── white-butterflies.png
    └── sizeguide.png
```

---

## Supabase Tables

**`catalog`**
| Column | Type | คำอธิบาย |
|--------|------|----------|
| id | uuid | Primary key |
| name | text | ชื่อสินค้า (ไทย) |
| name_en | text | ชื่อสินค้า (อังกฤษ) |
| price | text | ราคา (free-form text) |
| desc | text | รายละเอียด (ไทย) |
| desc_en | text | รายละเอียด (อังกฤษ) |
| image | text | URL รูปจาก Supabase Storage |
| flowers | text[] | ส่วนประกอบดอกไม้ |
| order | integer | ลำดับการแสดง |

**`stock`** — สต็อกสินค้าร้าน  
**`finance`** — รายรับ/รายจ่าย  
**`orders`** — ออเดอร์ลูกค้า  
**`todos`** — รายการงานประจำวัน

---

## การ Deploy

โปรเจคนี้ deploy บน Vercel โดย connect กับ GitHub repository โดยตรง ทุกครั้งที่ push ขึ้น `main` branch จะ deploy อัตโนมัติ

**Environment ที่ต้องตั้งค่า:**  
Supabase URL และ Anon Key อยู่ใน `js/supabase-config.js` — ถ้า fork ไปใช้ต้องเปลี่ยนค่านี้ให้ตรงกับ Supabase project ของตัวเอง

---

## RLS Policy (Supabase)

หน้า catalog public ใช้ `anon` key อ่านข้อมูล catalog ได้  
การเขียน/แก้ไขทุกอย่างต้องผ่าน authenticated user เท่านั้น

```sql
-- อ่าน catalog ได้โดยไม่ต้อง login
CREATE POLICY "Public can read catalog"
ON catalog FOR SELECT TO anon
USING (true);
```

---

## หมายเหตุ

- ราคาที่แสดงใน catalog เป็นขนาด L ทุกช่อปรับขนาดได้ (S / M / L)
- ราคาอาจแตกต่างตามขนาดและชนิดดอกไม้
- รองรับการสั่ง Custom
- จัดส่งผ่าน EMS (130 บาท) และ Grab / LINE MAN / Bolt / Lalamove (ตามระยะทาง)