# รายงานโครงการ IT Market Intelligence ฉบับละเอียด

จัดทำจากโค้ดในโฟลเดอร์ `D:\IT-Market` วันที่ 30 กันยายน 2569  
เอกสารอ้างอิง `D:\MiniProject_Python\REPORT.docx` ใช้เทียบโครงสร้างและระดับคำอธิบายเท่านั้น เนื้อหาด้านล่างอธิบายโครงการ IT Market Intelligence ตามไฟล์จริง  
เลขบรรทัดอ้างอิงเวอร์ชันที่ตรวจครั้งนี้ หากเพิ่มหรือลบบรรทัดภายหลัง ให้ค้นชื่อฟังก์ชันหรือข้อความที่กำกับ

## 1. ภาพรวมโครงการและขอบเขตข้อมูล

IT Market Intelligence เป็นเว็บ Dashboard สำรวจราคาอุปกรณ์ไอทีในประเทศไทย หน้าเว็บแสดงภาพรวมตลาด รายการสินค้า การเปรียบเทียบ แนวโน้มราคา ดีล และการประเมินราคาด้วยสูตรคำนวณ ข้อมูลสดมาจากผล Google Shopping ที่ Python ขอผ่าน SerpApi แล้วส่ง JSON ให้ JavaScript นำไปแสดง ผู้ใช้กรองตามหมวด แบรนด์ ร้านค้า ราคา และค้นชื่อสินค้าได้

**ขอบเขตที่ต้องจำ:** เมื่อ API ใช้งานไม่ได้ เว็บมีข้อมูลตัวอย่าง `fallbackProducts` อยู่ใน `dist/app.js:1-20` จำนวน 18 รายการ ข้อมูลตัวอย่างไม่ใช่ราคาตลาดปัจจุบัน ประวัติราคาสำหรับผลสดเก็บไว้เฉพาะใน `localStorage` ของเบราว์เซอร์ ไม่ใช่ข้อมูลย้อนหลังจากฐานข้อมูลกลาง ส่วนหน้า “ประเมินราคา” ใช้สูตรใน JavaScript ไม่ได้เรียกโมเดล AI

| ไฟล์/ส่วน | หน้าที่หลัก | จุดเริ่มตรวจ |
|---|---|---|
| `app/main.py` | ตั้งค่า FastAPI อ่านคีย์ ดึงและแปลงผล SerpApi ส่ง API พร้อม cache header | `CATEGORY_QUERIES:29`, `fetch_category:249`, `live_prices:335` |
| `dist/index.html` | วางโครงเมนู ตัวกรอง ปุ่มรีเฟรช และพื้นที่ผลลัพธ์ | เมนู 18-23, ปุ่ม 39, `#view-root` 48 |
| `dist/styles.css` | สี ฟอนต์ ระยะห่าง ตาราง กราฟ และ responsive layout | `:root` 3-16, `@media` 206-247 |
| `dist/app.js` | เรียก API จัดสถานะ กรอง คำนวณ วาดหน้าเว็บ เก็บประวัติในเบราว์เซอร์ | `loadLiveData:176`, `render:127` |
| `.env.example` | แม่แบบชื่อตัวแปร `SERPAPI_KEY`; ไม่มีคีย์จริง | บรรทัด 1 |
| `requirements.txt` / `pyproject.toml` | ไลบรารีและเวอร์ชัน Python (`>=3.13,<3.15`) | รายการ dependencies |
| `vercel.json` | กำหนด Vercel Function และ security headers | `functions.app/main.py` |
| `tests/test_api.py` / `tests/test_static.py` | ทดสอบ API ด้วย mock และตรวจไฟล์หน้าเว็บ | ฟังก์ชัน `test_*` |

ข้อมูลสินค้าใน API มี `id`, `category`, `brand`, `name`, `shop`, `price`, `original`, `source_url` และฟิลด์ประกอบอื่น ๆ คำว่า `stock=True` ที่ `app/main.py:219` เป็นค่าที่โค้ดกำหนด ไม่ใช่การตรวจสต็อกจริง ผู้ใช้ต้องตรวจจากร้านก่อนสั่งซื้อ

## 2. Flow การทำงานแยกตามไฟล์

### 2.1 `app/main.py` — เริ่มระบบและเปิด API

**Flow ช่วงเริ่มแอป**

- หาโฟลเดอร์หลักจากตำแหน่งไฟล์ `app/main.py:18` แล้วชี้ไปยังโฟลเดอร์หน้าเว็บ `dist` ที่บรรทัด 19
- `load_dotenv` บรรทัด 25 อ่านไฟล์ `.env` ถ้ามี; Vercel สามารถส่งตัวแปรแวดล้อมมาโดยไม่ต้องมีไฟล์นี้
- `CATEGORY_QUERIES` บรรทัด 29-36 กำหนดหกคำค้น: GPU, CPU, RAM, SSD, Notebook และ Monitor
- `KNOWN_BRANDS` บรรทัด 39-61 เป็นชื่อแบรนด์ที่ตรวจจากข้อความชื่อสินค้า
- `ERROR_MESSAGES` บรรทัด 65-74 กำหนดข้อความกลางสำหรับรหัสผิดพลาด; regex บรรทัด 79-97 ใช้คัดกรองสินค้ามือสอง/หมวด CPU และ GPU
- `FastAPI(...)` บรรทัด 106-112 เปิดบริการและเอกสาร Swagger UI ที่ `/api/docs`
- ก่อนเสิร์ฟหน้าเว็บ บรรทัด 406-410 ตรวจว่ามี `dist` แล้วใช้ `app.frontend("/", directory="dist")`

**Flow ของฟังก์ชันช่วยประมวลผล**

| ฟังก์ชัน / บรรทัด | รับอะไร | ทำอะไรและคืนอะไร | จุดแก้ที่เกี่ยวข้อง |
|---|---|---|---|
| `base36` 116, `text_hash` 127 | ข้อความอ้างอิงสินค้า | สร้าง hash และ id เช่น `LIVE-...` ให้สินค้ารายเดิมใช้ id คงที่ | เปลี่ยนสูตรแล้วข้อมูลเปรียบเทียบ/ประวัติที่ผูก id อาจไม่ตรงเดิม |
| `number_from` 139 | ราคา/คะแนนตัวเลขหรือข้อความ | ตัดอักขระที่ไม่ใช่ตัวเลขและจุด แล้วแปลงเป็นเลข; ผิดรูปแบบคืน `None` | ปรับวิธีอ่านราคาที่บรรทัด 146-153 |
| `detect_brand` 157 | ชื่อสินค้า | คืนแบรนด์แรกจาก `KNOWN_BRANDS` ที่พบในชื่อ มิฉะนั้น `Other` | เพิ่มแบรนด์ที่บรรทัด 39-61 |
| `collect_shopping_results` 163 | JSON จาก SerpApi | รวม `shopping_results`, `inline_shopping_results` และผลใน `categorized_shopping_results` | ปรับเมื่อโครง JSON เปลี่ยน |
| `matches_hardware_category` 181 | ชื่อและหมวด | CPU/GPU ตัดชื่อไม่ตรงหมวดหรือมือสอง; หมวดอื่นคืน `True` | ปรับ regex 79-97 หรือเงื่อนไขในฟังก์ชัน |
| `normalize_product` 195 | ผลค้นหาหนึ่งรายการ | ตรวจชื่อ/ราคา เลือกชื่อร้าน ราคาเดิม ลิงก์ รูป คะแนน แล้วคืน dict ที่เว็บใช้; รายการใช้ไม่ได้คืน `None` | เพิ่ม/แก้ฟิลด์ที่บรรทัด 210-230 |
| `classify_serpapi_error` 234 | HTTP status และข้อความ error | แปลงเป็น `SERPAPI_INVALID_KEY`, `SERPAPI_LIMIT_REACHED` ฯลฯ | ตรวจคู่กับ `ERROR_MESSAGES` |
| `fetch_category` 249 | หมวด คำค้น คีย์ HTTP client | ขอข้อมูล SerpApi หนึ่งหมวด ตรวจ JSON คัดซ้ำ จำกัด 8 รายการ แล้วคืน list | URL/พารามิเตอร์ 257-266, ส่งจริง 269, จำนวน 293 |
| `json_response` 302 | payload, status, cache seconds | สร้าง JSONResponse พร้อม `Cache-Control` และ `Vercel-CDN-Cache-Control` | เวลาแคชที่ `live_prices:398` |

**Flow ของ `GET /api/health`:** บรรทัด 320-329 ตอบชื่อบริการ runtime และ `live_data_configured` ซึ่งตรวจเพียงว่ามีค่าชื่อ `SERPAPI_KEY` อยู่หรือไม่ ค่า `true` ยังไม่พิสูจน์ว่าคีย์ถูกต้องหรือ SerpApi ใช้งานได้ ต้องลอง `/api/prices` ต่อ

**Flow ของ `GET /api/prices`:** บรรทัด 334-399 อ่านคีย์ ถ้าไม่มีตอบ 503; สร้าง HTTP client timeout 20 วินาที; เรียกหกหมวดพร้อมกันด้วย `asyncio.gather(..., return_exceptions=True)`; แยกหมวดที่สำเร็จ/ล้มเหลว; ถ้าไม่มีสินค้าเลยตอบ 502; ถ้ามีสินค้าอย่างน้อยหนึ่งหมวดตอบ 200 พร้อม warning เมื่อบางหมวดล้มเหลว; กำหนด CDN cache 900 หรือ 3600 วินาทีตามความครบของข้อมูล

### 2.2 `dist/app.js` — สถานะ กรอง คำนวณ และแสดงผล

**Flow เมื่อเปิดหน้าเว็บ**

- บรรทัด 1-20 เตรียมสินค้าตัวอย่าง; บรรทัด 22-28 สร้าง `products`, `dataSource` และ `state` รวมถึงรายการเปรียบเทียบที่เคยเก็บใน `localStorage`
- บรรทัด 39-57 สร้างตัวเลือกหมวด แบรนด์ ร้าน และช่วงราคาจากสินค้าที่มีอยู่
- บรรทัด 229 เรียก `render()` ให้เห็นหน้าจอทันที แล้วเริ่ม `loadLiveData(false)` และตั้งตัวตรวจซ้ำทุก 5 นาที
- `loadLiveData` บรรทัด 176-207 ส่ง `GET /api/prices` ที่บรรทัด 183; อ่าน JSON ตรวจผล และอัปเดตข้อมูลจริง
- เมื่อได้ผลสด `attachLocalHistory` บรรทัด 145-160 ต่อราคาล่าสุดเข้ากับประวัติในเครื่อง, `updateFilterOptions` ปรับตัวกรอง แล้ว `render` วาดหน้าใหม่
- หาก API ล้มเหลวก่อนเคยได้ผลสด เว็บใช้สินค้าตัวอย่าง; หากเคยได้ผลสดแล้ว เว็บยังคงข้อมูลครั้งล่าสุดในหน่วยความจำจนกว่าจะโหลดหน้าใหม่
- ปุ่มอัปเดตที่ `index.html:39` ผูกกับ `loadLiveData(true)` ที่ `app.js:216`; โหมดนี้เรียก `/api/prices?refresh=1`
- บรรทัด 218-227 ลงทะเบียน WebMCP เฉพาะเบราว์เซอร์ที่รองรับ; หากไม่รองรับ โค้ดออกจากฟังก์ชันโดยไม่กระทบหน้าเว็บ

**Flow ของหน้าและการคำนวณ**

| ชื่อใน JavaScript | บรรทัด | งานที่ทำ | จุดที่ควรรู้ |
|---|---|---|---|
| `filteredProducts` | 59-61 | กรองหมวด แบรนด์ ร้าน เพดานราคา และคำค้น | ค่าตัวกรองมาจาก `state` |
| `renderDashboard` | 84-90 | KPI ราคาเฉลี่ย/ต่ำสุด กราฟหมวด ดีล กราฟราคาที่บันทึก และรายการน่าจับตา | ใช้ข้อมูลหลังกรอง |
| `productTable` / `renderExplorer` | 91-97 | ตารางสินค้า ลิงก์ร้านค้า ช่องค้น และปุ่มเลือกเทียบ | `safeUrl` จำกัดลิงก์ http/https, `esc` ป้องกัน HTML ในหลายจุด |
| `renderCompare` / `toggleCompare` | 98-100,138-142 | เทียบได้สูงสุดสี่สินค้า; บันทึก id ใน `localStorage` | เมื่อผลสดใหม่ไม่พบ id เดิม รายการนั้นถูกนำออก |
| `renderTrends` / `lineChart` | 102-104,71-75 | กราฟและอันดับการเปลี่ยนราคา | เป็นจุดราคาที่บันทึกในเครื่อง ไม่ใช่รายเดือน |
| `renderDeals` / `discount` | 106-109,33 | เรียงส่วนลดจาก `original` และ `price` | ราคาเดิมอาจมาจากผลค้นหา ไม่ควรสรุปว่าเป็นดีลดีที่สุดจริง |
| `analyze` / `renderAI` | 110-124 | คำนวณคะแนนเทียบราคาเฉลี่ยหมวดและแนวโน้ม | เป็นสูตร ไม่ใช่ AI model |
| `bindAlert` | 125 | บันทึกราคาเป้าหมายใน `localStorage` | ไม่มีการส่งแจ้งเตือนภายนอก |

สูตรสำคัญ: `ส่วนลด = (ราคาเดิม − ราคาปัจจุบัน) / ราคาเดิม × 100` ที่ `discount:33`; `การเปลี่ยนราคา = (ราคาปัจจุบัน − ราคาจุดแรกที่เก็บ) / ราคาจุดแรก × 100` ที่ `movement:34`; คะแนนที่ `analyze:111` คือ `round(86 − diff×0.9 − trend×0.35)` แล้วบังคับให้อยู่ระหว่าง 20 ถึง 98 โดย `diff` เปรียบเทียบราคาที่ผู้ใช้กรอกกับราคาเฉลี่ยของทั้งหมวด จึงไม่ใช่การเทียบรุ่นเดียวกันทุกกรณี

### 2.3 `dist/index.html` และ `dist/styles.css` — โครงหน้าและรูปลักษณ์

HTML บรรทัด 18-23 สร้างปุ่มเมนูแต่ละหน้า; บรรทัด 34 สร้างหัวข้อ; บรรทัด 37-39 สร้างสถานะข้อมูลและปุ่มอัปเดต; บรรทัด 43-46 สร้างตัวกรอง; บรรทัด 48 เป็น `#view-root` ที่ JavaScript ใส่เนื้อหาตามหน้า; บรรทัด 52 โหลด `app.js`

CSS บรรทัด 3-16 กำหนดสี/เงาผ่านตัวแปร; บรรทัด 25-26 จัด layout สองส่วนและ sidebar; บรรทัด 77 จัดตัวกรอง; บรรทัด 95 จัดการ์ด; บรรทัด 118-124 จัดกราฟ; บรรทัด 206-247 มี media queries ปรับหน้าจอเล็กและลด motion สำหรับผู้ใช้ที่ตั้งค่าไว้

### 2.4 ไฟล์ตั้งค่าและทดสอบ

- `requirements.txt` ระบุ FastAPI, HTTPX, python-dotenv, Uvicorn; `requirements-dev.txt` เพิ่ม pytest และ pytest-asyncio
- `pyproject.toml` ระบุ Python `>=3.13,<3.15` และตั้งค่า pytest; `vercel.json` กำหนดเวลา Function สูงสุด 60 วินาทีและ security headers
- `.env.example` แสดงชื่อ `SERPAPI_KEY` พร้อม placeholder; `.gitignore` ไม่ให้ `.env` ติด Git
- `tests/test_api.py` ใช้ mock ของ HTTPX เพื่อตรวจการแปลงผล ความล้มเหลวบางหมวด คีย์หาย รีเฟรช และการไม่เผยค่าคีย์
- `tests/test_static.py` ตรวจว่า URL `/`, `/styles.css` และ `/app.js` ถูกส่งถึงเบราว์เซอร์ได้

## 3. ขั้นตอนดึง API แบบละเอียด

**จุดส่งคำขอออกอินเทอร์เน็ตจริงคือ `app/main.py:269`**: `await client.get(endpoint, ...)`. ส่วน `dist/app.js:183` เรียก API ภายในเว็บของเรา ไม่ได้เรียก SerpApi โดยตรง

1. ผู้ใช้เปิดเว็บ หรือกด “อัปเดตราคา” ที่ `dist/index.html:39`
2. `dist/app.js:183` ส่ง `GET /api/prices`; หากกดปุ่ม ใช้ `GET /api/prices?refresh=1`
3. FastAPI route ที่ `app/main.py:334-335` รับคำขอ แล้ว `os.getenv("SERPAPI_KEY")` บรรทัด 337 อ่านคีย์
4. ถ้าไม่มีคีย์ บรรทัด 338-339 ตอบ HTTP 503; เบราว์เซอร์แสดงข้อมูลสำรองหรือผลล่าสุดที่ยังมี
5. ถ้ามีคีย์ `CATEGORY_QUERIES` บรรทัด 29-36 ให้หกคู่หมวด/คำค้น; `asyncio.gather` บรรทัด 346-349 เรียก `fetch_category` พร้อมกัน
6. แต่ละ `fetch_category` สร้าง URL ที่บรรทัด 257-266 โดย `urlencode` รวม `engine=google_shopping`, `q=คำค้น`, `gl=th`, `hl=th`, `location=Thailand` และ `api_key`
7. `client.get` บรรทัด 269 ส่ง HTTPS GET ไป `https://serpapi.com/search.json` โดยใช้ timeout 20 วินาทีจาก client ที่สร้างในบรรทัด 344
8. บรรทัด 270-282 แยก timeout เครือข่าย JSON ที่อ่านไม่ได้ และ error/status จาก SerpApi ให้เป็นรหัสผิดพลาด
9. บรรทัด 284-297 รวมรายการหลายฟิลด์ แปลงสินค้า ตัดซ้ำ จำกัดแปดรายการต่อหมวด; ถ้าไม่มีผลที่ใช้ได้ถือว่าหมวดนั้นล้มเหลว
10. `live_prices` บรรทัด 351-395 รวมผลทุกหมวด ถ้าเหลือสินค้าอย่างน้อยหนึ่งหมวดจะส่ง JSON พร้อม `failed_categories` เมื่อจำเป็น; ถ้าไม่มีเลยตอบ HTTP 502
11. บรรทัด 397-399 ตั้ง CDN cache 60 นาทีเมื่อครบทุกหมวด, 15 นาทีเมื่อบางหมวดล้ม และ `no-store` เมื่อ `refresh=1`
12. เบราว์เซอร์อ่าน JSON ที่ `dist/app.js:184-197` ผูกประวัติราคาในเครื่อง อัปเดตแถบสถานะ ตัวกรอง และวาดหน้าจอ

ตัวอย่างพารามิเตอร์ที่โค้ดสร้าง (ไม่ใส่คีย์จริง):

```text
GET https://serpapi.com/search.json
  engine=google_shopping
  q=การ์ดจอ
  gl=th
  hl=th
  location=Thailand
  api_key=<ค่าจาก SERPAPI_KEY ฝั่ง Python>
```

ตัวอย่างโครงคำตอบของ API ภายในเว็บ:

```json
{
  "ok": true,
  "provider": "SerpApi / Google Shopping Thailand",
  "generated_at": "2026-09-30T00:00:00Z",
  "products": [
    {
      "id": "LIVE-ตัวอย่าง",
      "category": "GPU",
      "brand": "Zotac",
      "name": "ชื่อสินค้าจากผลค้นหา",
      "shop": "ชื่อร้าน",
      "price": 16400,
      "source_url": "https://example.com/product"
    }
  ],
  "categories": [{"name": "GPU", "count": 1}]
}
```

`generated_at` เป็นเวลาที่เซิร์ฟเวอร์สร้างคำตอบ ไม่ได้แปลว่าร้านค้าเพิ่งเปลี่ยนราคา ณ วินาทีนั้น และ `cached` ใน JSON ต้นทางเป็น `false`; JavaScript ตรวจ header `x-vercel-cache` เพิ่มเพื่อบอกว่าคำตอบมาจาก CDN หรือไม่

## 4. ปัญหาและข้อจำกัด แยกตามขั้นตอน

Repository ที่ตรวจมี commit ที่อ่านได้หนึ่งรายการและไม่มีบันทึกเหตุการณ์การพัฒนา หัวข้อนี้จึงแยก “สิ่งที่โค้ดรองรับแล้ว” ออกจาก “ข้อจำกัดที่ตรวจพบ” ไม่กล่าวอ้างว่าปัญหาทั้งหมดเคยเกิดขึ้นบน production

| ขั้นตอน | ปัญหา/ข้อจำกัดและหลักฐาน | วิธีที่โค้ดรับมืออยู่ | แนวทางปรับปรุงหากต้องการ |
|---|---|---|---|
| ตั้งค่าก่อนรัน | ไม่พบไฟล์ `.env` ใน workspace ที่ตรวจ; `.env.example` มี placeholder | `/api/prices` ตอบ 503 เมื่อไม่มี `SERPAPI_KEY`; หน้าเว็บใช้ข้อมูลสำรอง | ขอคีย์จากบัญชี SerpApi แล้วตั้งใน `.env` หรือ Vercel Environment Variables |
| ยืนยันคีย์ | `/api/health` ตรวจเพียงมีชื่อค่าหรือไม่; คีย์ผิดยังขึ้น `live_data_configured=true` | `fetch_category` ตรวจ error/status และแปลงเป็น `SERPAPI_INVALID_KEY` | ทดสอบ `/api/prices` หลังตั้งคีย์ทุกครั้ง |
| โควตาและเครือข่าย | มีหกคำค้นต่อรอบ; อาจเจอ 429, timeout หรือเชื่อมต่อไม่ได้ | ตั้ง timeout 20 วินาที, แยก error รายหมวด, แคช CDN 15/60 นาที | ติดตาม usage ของบัญชี, ลดหมวด/ความถี่ตามความจำเป็น |
| โครง JSON เปลี่ยน | SerpApi อาจคืนผลใน `shopping_results`, `inline_shopping_results` หรือกลุ่ม categorized | `collect_shopping_results` รวมทั้งสามแบบ; ตรวจว่า JSON เป็น object | เพิ่ม test จาก payload ตัวอย่างเมื่อพบรูปแบบใหม่ |
| ผลค้นหาไม่ตรงหมวด | CPU/GPU อาจปนคอมทั้งชุดหรือสินค้ามือสอง; RAM/SSD/Notebook/Monitor ยังไม่ได้กรองละเอียด | regex กรอง CPU/GPU ที่ `matches_hardware_category` | เพิ่มกฎรายหมวดและทดสอบ title จริงหลายรูปแบบ |
| การแปลงราคา | `number_from` ลบอักขระอื่นนอกจากเลข/จุด; ข้อความแปลก เช่นเครื่องหมายลบ อาจถูกตีความผิด | ตัดค่าไม่มีราคา/ราคาไม่เป็นบวกหลังแปลง | ใช้การ parse ราคาและสกุลเงินอย่างชัดเจนก่อนแสดง |
| ราคาเดิม/ส่วนลด | ถ้าไม่มีราคาเดิม `normalize_product` ใช้ราคาปัจจุบัน; ถ้ามีราคาเดิมก็พึ่งข้อมูลผู้ให้บริการ | `original = max(old,current)` ป้องกันราคาเดิมต่ำกว่าปัจจุบัน | ให้ผู้ใช้เปิดแหล่งสินค้าเพื่อตรวจโปรโมชั่นจริง |
| สต็อกสินค้า | `stock=True` ที่ `app/main.py:219` เป็นค่าคงที่; delivery ไม่ยืนยันสินค้ามีจริง | หน้าเว็บแสดงคำเตือนให้ตรวจร้านค้า | อ่านสถานะสต็อกจากแหล่งที่เชื่อถือได้ หรือแสดง “ไม่ทราบ” |
| ความสดของข้อมูล | CDN เก็บผลได้ 15/60 นาที; `refresh=1` ไม่ส่ง `no_cache=true` ไป SerpApi | ปุ่มรีเฟรชข้ามแคช CDN; แถบสถานะแสดงเวลาและแคช | ถ้าต้องการผลใหม่จาก SerpApi จริง ให้พิจารณา `no_cache` และโควตา |
| ประวัติราคา | `localStorage` เก็บห้าจุดล่าสุดต่อ id ไม่ได้เก็บเวลาแต่ละจุดเป็นประวัติกลาง | มีกราฟเพื่อดูการเปลี่ยนราคาบนเครื่องเดียว | เพิ่มฐานข้อมูลและงานเก็บ snapshot ตามเวลา |
| ประเมินราคา | `analyze` เปรียบเทียบกับราคาเฉลี่ยทั้งหมวด และใช้สูตรคงที่ | หน้าเว็บเขียนว่า “สูตรคำนวณราคา” | ถ้าต้องการประเมินระดับรุ่น ให้จับคู่รุ่น/สเปกและวัดความคลาดเคลื่อน |
| ผลสดล้มเหลว | ไม่มีข้อมูลบางหมวดหรือทุกหมวด | บางหมวดสำเร็จยังตอบ 200 พร้อม warning; ทั้งหมดล้มตอบ 502; JS ใช้ข้อมูลสำรอง/ผลที่อยู่ในหน่วยความจำ | เพิ่มการเก็บข้อมูลล่าสุดบนเซิร์ฟเวอร์เพื่อให้ข้ามการรีโหลดหน้าได้ |
| ข้อมูลจากผู้ให้บริการใน UI | `productTable` ใช้ `esc` และ `safeUrl` แต่ `showToast` ใช้ `innerHTML` กับข้อความที่อาจมีชื่อสินค้า | จุดหลักหลายแห่ง escape แล้ว | เปลี่ยน toast เป็น `textContent` หรือ escape ทุกข้อความก่อนใส่ HTML |

## 5. Python ทำงานส่วนไหน และต้องมีส่วนใดช่วย

Python ในโครงการนี้เป็นศูนย์กลางของ API: รับ HTTP request อ่าน environment variable ส่งคำขอออกไป SerpApi จัดรูป JSON และตอบข้อมูลให้หน้าเว็บ ภาษามีเครื่องมือมาตรฐานสำหรับไฟล์ เวลา regex และ URL แต่แอปเลือกไลบรารีเฉพาะทางเพื่อทำงานได้สะดวกและชัดเจนขึ้น

| ส่วน | ใช้ทำอะไรในโปรเจกต์ | ขอบเขตและเหตุผลที่ใช้ร่วมกัน |
|---|---|---|
| Python standard library | `os` อ่านคีย์, `pathlib` หาไฟล์, `re` กรองชื่อ, `datetime` เวลาคำตอบ, `urlencode` สร้าง query string, `asyncio` ส่งงานพร้อมกัน | ส่ง HTTP เองได้ แต่ต้องเขียนการจัดการคำขอและเว็บ API มากขึ้น |
| FastAPI | เปิด `/api/health`, `/api/prices` และ Swagger UI; ส่ง JSONResponse | เป็น framework สำหรับ HTTP API ไม่ใช่แหล่งราคาสินค้า |
| HTTPX | ส่ง HTTPS GET แบบ asynchronous และตั้ง timeout | เป็น HTTP client; ไม่ได้แปลง Google Shopping ให้เป็น JSON เอง |
| python-dotenv | อ่าน `.env` ตอนพัฒนาในเครื่อง | บน Vercel ใช้ Environment Variables ได้โดยไม่ต้องมีไฟล์ `.env` |
| SerpApi | รับคำค้น Google Shopping และส่งผล JSON กลับ | เป็นบริการภายนอก มีคีย์/โควตา/เงื่อนไขข้อมูลของผู้ให้บริการ; [เอกสาร Google Shopping API](https://serpapi.com/google-shopping-api) |
| HTML | วางปุ่ม เมนู ตัวกรอง และพื้นที่แสดงผล | Python ฝั่งเซิร์ฟเวอร์ไม่ได้จัดหน้าตาที่ผู้ใช้เห็นโดยตรงในสถาปัตยกรรมนี้ |
| CSS | สี ฟอนต์ การ์ด ตาราง กราฟ responsive layout | กฎหน้าตาอยู่ในเบราว์เซอร์ |
| JavaScript | fetch API, จัดการ DOM, คำนวณ KPI/คะแนน, เก็บ `localStorage` | การโต้ตอบและข้อมูลเฉพาะเครื่องผู้ใช้ต้องทำในเบราว์เซอร์ |
| Vercel CDN | แคชคำตอบตาม header จาก Python และส่งไฟล์หน้าเว็บ | ลดคำขอไปยัง SerpApi แต่ทำให้ข้อมูลอาจไม่ใช่วินาทีล่าสุด |
| ฐานข้อมูลกลาง (ยังไม่มี) | หากเพิ่มในอนาคต จะเก็บราคาตามเวลาและใช้ข้ามเครื่องได้ | `localStorage` ปัจจุบันไม่ตอบโจทย์ประวัติราคาระยะยาว |

ดังนั้นข้อจำกัดหลักไม่ได้เกิดจาก “Python ทำไม่ได้” แต่เกิดจากหน้าที่คนละฝั่งและแหล่งข้อมูล: Python บนเซิร์ฟเวอร์ไม่เห็น DOM ของเบราว์เซอร์โดยตรง, SerpApi เป็นแหล่งข้อมูลที่มีโควตา, และระบบนี้ยังไม่ได้สร้างฐานข้อมูลประวัติราคา

## 6. จุดแก้ไขเว็บและโค้ด พร้อมคำที่ต้องค้น

ใน `app/main.py:412-427` มีคอมเมนต์ “แผนที่แก้ไข” และในแต่ละฟังก์ชันมีคอมเมนต์อธิบายใกล้จุดทำงานจริง ส่วน `dist/app.js:231`, `dist/index.html:56` และ `dist/styles.css:251` มีแผนที่แก้ไขของแต่ละไฟล์

| อยากแก้อะไร | เปิดไฟล์/บรรทัด | ค้นและแก้อย่างไร | ตรวจผลหลังแก้ |
|---|---|---|---|
| คีย์ API ในเครื่อง | `.env` บรรทัด 1 | แทน placeholder หลัง `SERPAPI_KEY=` ด้วยค่าจริง; ไม่แก้ตัวอักษร `SERPAPI_KEY` ใน Python | `/api/health` และ `/api/prices` |
| คีย์ API บน Vercel | Project Settings → Environment Variables | ตั้งชื่อ `SERPAPI_KEY` และ Redeploy | URL production `/api/health` และ `/api/prices` |
| เพิ่มหมวดสินค้า | `app/main.py:29-36` | เพิ่มคู่ `"ชื่อหมวด": "คำค้น"` ใน `CATEGORY_QUERIES` | จำนวนหมวดใน JSON, ตัวกรองหน้าเว็บ, โควตา |
| เปลี่ยนคำค้น | `app/main.py:29-36` | แก้ข้อความด้านขวาของ `"GPU"`, `"CPU"` ฯลฯ | เปิด `/api/prices?refresh=1` |
| เพิ่มชื่อแบรนด์ | `app/main.py:39-61` | เพิ่มคำใน `KNOWN_BRANDS` | ฟิลด์ `brand` ใน JSON |
| เปลี่ยนกฎมือสอง/ผิดหมวด | `app/main.py:79-97,181-190` | แก้ `USED_PRODUCT_PATTERN`, `GPU_PATTERN`, `NON_CPU_PATTERN`, `CPU_PATTERN` | `tests/test_api.py` และรายการจริง |
| เปลี่ยนการอ่านราคา | `app/main.py:139-153,195-204` | แก้ `number_from` หรือฟิลด์ `extracted_price`/`price` | ทดสอบข้อความราคาไทย/อังกฤษ |
| เปลี่ยนชื่อฟิลด์สินค้าที่ส่งให้เว็บ | `app/main.py:210-230` | แก้ dict ที่ `normalize_product` return และแก้จุดอ่านใน `dist/app.js` | ตาราง/กราฟ/เปรียบเทียบ |
| เปลี่ยน endpoint SerpApi | `app/main.py:257` | แก้ URL หลัง `endpoint =` และรูปแบบ response ให้ตรงผู้ให้บริการ | API mock และ `/api/prices` |
| เปลี่ยนประเทศ/ภาษา | `app/main.py:259-264` | แก้ `gl`, `hl`, `location` ใน `urlencode` | ผลค้นหาและสกุลเงิน |
| เปลี่ยนจำนวนต่อหมวด | `app/main.py:293` | แก้เลข 8 ใน `if len(products) == 8` | จำนวน `products` ที่ตอบ |
| เปลี่ยนข้อความ error | `app/main.py:65-74` | แก้ข้อความด้านขวาของรหัสใน `ERROR_MESSAGES` | คำตอบ 502 และข้อความบนเว็บ |
| เปลี่ยน URL API ภายใน | `app/main.py:334`, `dist/app.js:183` | แก้ `@app.get("/api/prices")` และ URL ใน `fetch` ให้ตรงกัน | เปิดหน้าเว็บและ Network tab |
| เปลี่ยน timeout | `app/main.py:344` | แก้เลข `20.0` ใน `httpx.Timeout` | ทดสอบกรณีบริการช้า |
| เปลี่ยนเวลาที่ CDN เก็บ | `app/main.py:398` | แก้ `900`/`3600` วินาที | ตรวจ response header |
| เปลี่ยนชื่อเว็บ/เมนู | `dist/index.html:15-23`, `dist/app.js:29` | แก้ข้อความ `brand-name`/ปุ่ม `data-view` และ `titles` หากชื่อหัวหน้าต้องตรงกัน | คลิกทุกเมนู |
| เปลี่ยนหัวหน้า/ปุ่มอัปเดต | `dist/index.html:34,39` | แก้ข้อความใน `page-title` หรือ `refresh-live` | เปิดหน้าเว็บ |
| เปลี่ยนสีพื้น/การ์ด/ตัวกรอง | `dist/styles.css:3-16,77,95` | แก้ `--bg`/ตัวแปรสี หรือ selector `.filters`/`.card` | ตรวจเดสก์ท็อปและมือถือ |
| เปลี่ยนตาราง/กราฟ | `dist/app.js:71-104` | ค้น `lineChart`, `renderDashboard`, `productTable`, `renderTrends` | กรองข้อมูลและดูทุกหน้า |
| เปลี่ยนสูตรคะแนน | `dist/app.js:110-116` | แก้ `analyze` และข้อความผลใน `aiResult` | ทดลองราคาเหนือ/ต่ำกว่าค่าเฉลี่ย |
| เปลี่ยนจำนวนสินค้าเทียบ | `dist/app.js:139` และข้อความ `dist/app.js:95,99-100` | แก้เลข 4 ทั้งเงื่อนไขและข้อความบน UI | เลือกเกินจำนวนใหม่ |
| เปลี่ยนการเก็บประวัติราคา | `dist/app.js:145-160` | แก้ `attachLocalHistory` และ key `itmi-price-history` | โหลดราคาหลายรอบ |
| เปลี่ยนรอบตรวจอัตโนมัติ | `dist/app.js:229` | แก้ `5*60*1000` หน่วยมิลลิวินาที | ตรวจ Network/โควตา |
| เปลี่ยนข้อมูลสำรอง | `dist/app.js:1-20` | แก้ `fallbackProducts` โดยรักษาชื่อฟิลด์ที่หน้าเว็บใช้ | ปิด/จำลอง API แล้วเปิดหน้าเว็บ |

ตัวอย่างการแก้คำค้น: ถ้าต้องการให้หมวด SSD ค้นความจุ 2 TB ให้เปิด `app/main.py:33` แล้วเปลี่ยนค่าด้านขวาของ `"SSD"` จาก `"SSD NVMe 1TB"` เป็นคำค้นใหม่ เช่น `"SSD NVMe 2TB"` จากนั้นรีสตาร์ตแอปหรือ redeploy แล้วดู `/api/prices?refresh=1`

## 7. วิธีขอ API key ใส่คีย์ และรันทดสอบ

### 7.1 ขอคีย์จาก SerpApi

1. สมัครหรือเข้าสู่ระบบที่ [SerpApi](https://serpapi.com/)
2. เปิดหน้า [Manage API Key](https://serpapi.com/manage-api-key) แล้วคัดลอก “Your Private API Key” ตาม [คู่มือ SerpApi](https://serpapi.com/blog/how-to-connect-serpapi-mcp-to-claude-desktop/)
3. อย่าวางคีย์ใน `app/main.py`, `dist/app.js`, Word, Git หรือภาพหน้าจอที่เผยแพร่

ขณะจัดทำรายงาน ไม่พบไฟล์ `.env` ใน workspace ที่ตรวจ จึงไม่มีคีย์จริงในโค้ดหรือรายงานนี้ ตัวอย่างทุกจุดใช้ placeholder เท่านั้น

### 7.2 ใส่คีย์และเริ่มเว็บในเครื่อง

เปิด PowerShell ที่ `D:\IT-Market` แล้วรัน:

```powershell
# ถ้ายังไม่มี virtual environment ให้สร้างและติดตั้งไลบรารี
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt

# คัดลอกไฟล์แม่แบบ แล้วเปิด .env เพื่อแทน placeholder ด้วยคีย์จริง
Copy-Item .env.example .env
notepad .env

# เริ่ม FastAPI
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

เนื้อหา `.env` ที่ต้องได้มีรูปแบบนี้เท่านั้น:

```dotenv
SERPAPI_KEY=<คีย์จริงจากบัญชี SerpApi>
```

อีกทางหนึ่ง หากต้องการตั้งคีย์เฉพาะหน้าต่าง PowerShell ปัจจุบัน ให้ใช้ `$env:SERPAPI_KEY = "คีย์จริง"` ก่อนเริ่มแอป วิธีนี้หายไปเมื่อปิดหน้าต่าง PowerShell และไม่ต้องสร้าง `.env`

เปิด `http://127.0.0.1:8000/api/health` แล้วดู `live_data_configured=true` จากนั้นเปิด `http://127.0.0.1:8000/api/prices` เพื่อยืนยันว่าคีย์ใช้ได้จริง และเปิด `http://127.0.0.1:8000` เพื่อดูหน้าเว็บ หากแก้ `.env` ขณะเซิร์ฟเวอร์เปิดอยู่ ให้รีสตาร์ตเพื่ออ่านค่าใหม่

### 7.3 ใส่คีย์บน Vercel

เลือก Project → Settings → Environment Variables → Add โดยตั้ง Name เป็น `SERPAPI_KEY`, Value เป็นคีย์จริง และเลือก Environment ที่ต้องใช้ เช่น Production/Preview จากนั้นสร้าง deployment ใหม่หรือ Redeploy เพราะการแก้ค่าไม่ย้อนหลังไปยัง deployment ที่มีอยู่ ตาม [เอกสาร Vercel](https://vercel.com/docs/environment-variables)

### 7.4 ตรวจปัญหาตามผลลัพธ์

- `/api/health` ตอบ `live_data_configured=false`: ยังไม่พบชื่อตัวแปรคีย์ ตรวจ `.env` หรือ Environment Variables
- `/api/prices` ตอบ 503: คีย์ยังไม่ถูกอ่านในโปรเซสที่รัน
- `/api/prices` ตอบ 502 และ `SERPAPI_INVALID_KEY`: คีย์ถูกปฏิเสธ ตรวจคีย์จากบัญชีและ redeploy/restart
- ตอบ 502 และ `SERPAPI_LIMIT_REACHED`: ตรวจ usage/โควตาของ SerpApi
- ตอบ 200 แต่มี `failed_categories`: บางหมวดยังล้มเหลว ดู `failed_category_reasons`
- ตอบ 200 แต่หน้าเว็บบอกข้อมูลแคช: ตรวจ `x-vercel-cache`; ใช้ปุ่มอัปเดตเพื่อข้ามแคชของเว็บ โดยไม่ถือว่าเป็นการข้ามแคชของ SerpApi

## 8. ตัวอย่างโค้ดจากจุดสำคัญ

ตัวอย่าง 1 — อ่านคีย์ในเครื่องและตอบเมื่อไม่มีคีย์ (`app/main.py:25,337-339`):

```python
load_dotenv(PROJECT_ROOT / ".env")

api_key = os.getenv("SERPAPI_KEY")
if not api_key:
    return json_response(
        {"ok": False, "error": "SERPAPI_KEY is not configured"},
        503,
    )
```

ตัวอย่าง 2 — สร้างคำขอและส่งไป SerpApi (`app/main.py:257-269`):

```python
endpoint = "https://serpapi.com/search.json?" + urlencode({
    "engine": "google_shopping",  # เลือก Google Shopping API
    "q": query,                  # คำค้นจาก CATEGORY_QUERIES
    "gl": "th",                  # ประเทศไทย
    "hl": "th",                  # ภาษาไทย
    "location": "Thailand",
    "api_key": api_key,          # คีย์จาก environment
})
response = await client.get(endpoint, headers={"accept": "application/json"})
```

ตัวอย่าง 3 — รับ JSON และคัดรายการ (`app/main.py:275-297`):

```python
payload = response.json()
if not isinstance(payload, dict):
    raise MarketDataError("SERPAPI_INVALID_RESPONSE")

for item in collect_shopping_results(payload):
    product = normalize_product(item, category)
    if product is None or product["id"] in seen:
        continue
    seen.add(product["id"])
    products.append(product)
    if len(products) == 8:
        break
```

ตัวอย่าง 4 — เบราว์เซอร์เรียก API ภายในเว็บ (`dist/app.js:180-184`):

```javascript
const requestOptions = {headers: {accept: 'application/json'}};
if (force) requestOptions.cache = 'no-store';
const response = await fetch(
  force ? '/api/prices?refresh=1' : '/api/prices',
  requestOptions
);
const payload = await response.json();
```

ตัวอย่างเหล่านี้ตัดเฉพาะจุดสำคัญเพื่ออธิบายลำดับ การรันจริงให้ใช้ไฟล์ในโครงการ เพราะมีส่วนจัดการข้อผิดพลาด การแปลงผล และการแสดงสถานะเพิ่มเติม

## 9. สิ่งที่ได้เรียนรู้และผลตรวจสอบ

1. การแยก backend, frontend และแหล่งข้อมูลภายนอกทำให้ระบุจุดแก้ไขได้ชัด: Python จัดข้อมูลและป้องกันคีย์, JavaScript โต้ตอบกับผู้ใช้, CSS จัดหน้าตา
2. API key ต้องอยู่ใน environment variable ฝั่งเซิร์ฟเวอร์; การเก็บใน JavaScript ทำให้ผู้ใช้ทุกคนดาวน์โหลดคีย์ได้
3. ผลค้นหาภายนอกต้องตรวจ JSON, ราคา หมวด และรายการซ้ำก่อนนำไปคำนวณ
4. การตอบผลบางหมวดดีกว่าทิ้งข้อมูลทั้งหมด แต่ต้องบอกผู้ใช้ว่าข้อมูลขาดหมวดใด
5. แคชช่วยลดจำนวนคำขอและเวลารอ แต่การแสดงคำว่า “ล่าสุด” ต้องอธิบายความสดตามจริง
6. จุดราคาห้าค่าใน `localStorage` ไม่ใช่ชุดข้อมูลราคาตลาดย้อนหลังที่น่าเชื่อถือสำหรับวิเคราะห์ระยะยาว
7. คะแนนจากสูตรต้องบอกชัดว่าเป็นสูตรคำนวณ และควรทดสอบความแม่นยำก่อนใช้ตัดสินใจซื้อ

**ผลตรวจสอบโค้ด:** รัน `.\.venv\Scripts\python.exe -m pytest -q` ผ่าน 9 tests, `py_compile app/main.py` ผ่าน และ `node --check dist/app.js` ผ่าน การทดสอบใช้ mock ไม่ได้ใช้โควตา SerpApi จริง ขณะตรวจไม่มี `.env` จึงไม่ได้ทดสอบราคาสดด้วยคีย์จริง คำเตือน deprecation จาก `starlette.testclient` ไม่ทำให้ tests ล้มเหลว

**แหล่งข้อมูลภายนอกที่ใช้ตรวจวิธีตั้งค่า:** [SerpApi Google Shopping API](https://serpapi.com/google-shopping-api), [SerpApi Manage API Key](https://serpapi.com/manage-api-key), [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
