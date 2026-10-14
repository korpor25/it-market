# รายงานการทำงานของโครงการ IT Market Intelligence

วันที่ตรวจสอบ: 30 กันยายน 2569 (2026)  
ขอบเขต: โค้ดใน workspace `D:\IT-Market` ณ วันที่จัดทำรายงาน  
หมายเหตุ: รายงานอ้างเลขบรรทัดหลังเพิ่มคอมเมนต์แล้ว หากแก้ไฟล์ภายหลังให้ค้นชื่อฟังก์ชันหรือคำที่ระบุประกอบ

## 1. ภาพรวมโครงการ

เว็บนี้ติดตามราคาอุปกรณ์ไอทีในประเทศไทย โดยใช้ Python และ FastAPI เป็นฝั่งเซิร์ฟเวอร์ ใช้ HTTPX เรียก SerpApi เพื่อรับผล Google Shopping และใช้ HTML, CSS, JavaScript แสดงข้อมูลในเบราว์เซอร์ หน้าจอมีภาพรวมตลาด สำรวจสินค้า เปรียบเทียบ แนวโน้ม ดีล และประเมินราคา

| ส่วน | ไฟล์หลัก | หน้าที่ |
|---|---|---|
| Backend และ API | `app/main.py` | อ่านคีย์ เรียก SerpApi คัดกรองสินค้า ส่ง JSON และกำหนดแคช |
| โครงหน้าเว็บ | `dist/index.html` | เมนู ปุ่ม ตัวกรอง และพื้นที่แสดงผล |
| รูปลักษณ์ | `dist/styles.css` | สี ระยะห่าง ตาราง กราฟ และหน้าจอมือถือ |
| พฤติกรรมหน้าเว็บ | `dist/app.js` | เรียก `/api/prices` คำนวณ/แสดงผลและเก็บข้อมูลบางส่วนในเบราว์เซอร์ |
| ทดสอบ | `tests/test_api.py`, `tests/test_static.py` | ตรวจ API และการเสิร์ฟหน้าเว็บ |
| ตั้งค่าปล่อยเว็บ | `vercel.json`, `requirements.txt` | Vercel Function, HTTP headers และไลบรารี Python |

## 2. Flow การทำงาน

### 2.1 ภาพรวมตั้งแต่เปิดเว็บถึงเห็นราคา

```text
ผู้ใช้เปิด /
  ↓ app/main.py:410 ส่งไฟล์จาก dist/
dist/index.html โหลด styles.css และ app.js
  ↓ dist/app.js:229 เรียก render() แล้ว loadLiveData(false)
dist/app.js:183 เรียก GET /api/prices
  ↓ app/main.py:334 เข้าฟังก์ชัน live_prices()
app/main.py:337 อ่าน SERPAPI_KEY จาก environment
  ↓ app/main.py:346 ส่งคำขอ 6 หมวดพร้อมกันผ่าน fetch_category()
app/main.py:257,269 ส่ง GET ไป SerpApi Google Shopping
  ↓ app/main.py:163,181,195 รวมผล คัดกรอง แปลงข้อมูลสินค้า
app/main.py:398 กำหนดแคชและส่ง JSON กลับ
  ↓ dist/app.js:184-197 รับ JSON เก็บประวัติราคาเฉพาะเครื่องและ render หน้าจอ
```

เมื่อกดปุ่ม “อัปเดตราคา” ที่ `dist/index.html:39`, ตัวรับคลิก `dist/app.js:216` เรียก `loadLiveData(true)` แล้วส่ง `GET /api/prices?refresh=1` ที่ `dist/app.js:183` เพื่อข้ามแคช CDN ของเว็บ คำขอนี้ยังอาจได้รับข้อมูลแคชจาก SerpApi เพราะโค้ดไม่ได้ส่ง `no_cache=true` ไปยังผู้ให้บริการ

### 2.2 Flow ของ Python (`app/main.py`)

1. เริ่มระบบ: `load_dotenv` บรรทัด 25 อ่าน `.env` ในเครื่อง; `CATEGORY_QUERIES` บรรทัด 29 กำหนด 6 หมวดและคำค้น; `app = FastAPI(...)` กำหนด API และเอกสาร `/api/docs`
2. รับคำขอ: `/api/health` บรรทัด 320 ตรวจสถานะและบอกเพียงว่ามีคีย์หรือไม่; `/api/prices` บรรทัด 334 เป็น API ราคาที่หน้าเว็บเรียก
3. ตรวจคีย์: `os.getenv("SERPAPI_KEY")` บรรทัด 337 อ่านค่าจริง หากไม่มีตอบ HTTP 503 โดยไม่เรียก SerpApi
4. ขอข้อมูล: `asyncio.gather` บรรทัด 346 เรียก `fetch_category` บรรทัด 249 พร้อมกันทุกหมวด; สร้าง URL พร้อม `engine=google_shopping` และพารามิเตอร์ไทยที่บรรทัด 257-266; `client.get` บรรทัด 269 ส่ง HTTP GET จริง
5. ตรวจผล: แปลง JSON, จัดประเภทข้อผิดพลาด, รวมผล `shopping_results` หลายรูปแบบ, คัดสินค้าที่ไม่เกี่ยวข้องบางหมวด, ลบรายการซ้ำ และจำกัด 8 รายการต่อหมวด (`collect_shopping_results` บรรทัด 163, `matches_hardware_category` บรรทัด 181, `normalize_product` บรรทัด 195)
6. ตอบเว็บ: หากบางหมวดล้มเหลวส่ง `failed_categories` พร้อมสินค้าที่หาได้; หากไม่มีสินค้าเลยตอบ 502; กำหนดแคช CDN 15 นาทีเมื่อสำเร็จบางส่วน หรือ 60 นาทีเมื่อครบทุกหมวด (`json_response` บรรทัด 302, `cache_seconds` บรรทัด 398)

### 2.3 Flow ของหน้าเว็บ

1. `dist/index.html:18-23` สร้างเมนู; บรรทัด 37-48 สร้างแถบสถานะ ตัวกรอง และพื้นที่ `#view-root`; บรรทัด 52 โหลด JavaScript
2. `dist/app.js:1` เตรียมสินค้าตัวอย่างสำรอง; บรรทัด 59 กรองข้อมูลตามตัวเลือก; บรรทัด 84, 94, 98, 102, 106, 118 แสดงหน้าแต่ละประเภท
3. `dist/app.js:176-205` เรียก Python API, ตรวจผลและแสดงสถานะ หากดึงข้อมูลไม่ได้จะใช้ข้อมูลสำรอง หรือคงผลสดครั้งล่าสุดที่โหลดสำเร็จ
4. `dist/app.js:145-160` เก็บจุดราคาใน `localStorage` ของเบราว์เซอร์; บรรทัด 110 คำนวณคะแนนประเมินราคาจากสูตร ไม่ได้เรียกโมเดล AI
5. `dist/app.js:218-227` ลงทะเบียนเครื่องมือ WebMCP ในเบราว์เซอร์ที่รองรับ เพื่ออ่านสรุปตลาด กรองสินค้า ประเมินราคา และสั่งรีเฟรช; หากเบราว์เซอร์ไม่รองรับ หน้าหลักยังทำงานตามปกติ
6. `dist/styles.css:3` กำหนดตัวแปรสี; ส่วน `.sidebar`, `.filters`, `.card` ใช้จัดหน้าจอและองค์ประกอบต่าง ๆ

### 2.4 Flow ของไฟล์ตั้งค่าและทดสอบ

`.env.example:1` เป็นแม่แบบชื่อตัวแปรคีย์; `.gitignore` กัน `.env` ไม่ให้ติด Git; `requirements.txt` ระบุ FastAPI, HTTPX, python-dotenv และ Uvicorn; `vercel.json` กำหนด Function และ security headers; `tests/test_api.py` จำลอง SerpApi เพื่อตรวจคีย์หาย การแปลงราคา ผลบางหมวด และการไม่เปิดเผยคีย์; `tests/test_static.py` ตรวจหน้าแรกและไฟล์ CSS/JS

## 3. Python ทำส่วนไหน และต้องใช้ส่วนอื่นช่วยอะไร

Python รับคำขอจากเว็บ เก็บคีย์ไว้ฝั่งเซิร์ฟเวอร์ ส่งคำขอไป SerpApi ตรวจ JSON จัดรูปสินค้า จัดการข้อผิดพลาด และตอบข้อมูลให้เบราว์เซอร์ งานนี้ต้องใช้ `httpx` เพื่อส่ง HTTP และ `FastAPI` เพื่อเปิด endpoint; ตัวภาษา Python เพียงอย่างเดียวไม่มีบริการค้นหาสินค้า Google Shopping ที่พร้อมใช้งาน จึงใช้ SerpApi เป็นแหล่งข้อมูลภายนอก ข้อจำกัดนี้เป็นเรื่องแหล่งข้อมูลและสถาปัตยกรรม ไม่ใช่ว่า Python ส่ง HTTP ไม่ได้

Python ที่ทำงานบนเซิร์ฟเวอร์ไม่ได้ควบคุม DOM, ปุ่ม และ `localStorage` ของเบราว์เซอร์โดยตรง จึงใช้ JavaScript จัดการการโต้ตอบ ใช้ HTML วางโครงหน้า และ CSS จัดรูปแบบ ข้อมูลแนวโน้มราคาในโค้ดปัจจุบันเก็บใน `localStorage` ของเครื่องผู้ใช้ ไม่มีฐานข้อมูลกลาง หากต้องการประวัติราคาที่ย้อนหลังข้ามเครื่อง ต้องเพิ่มฐานข้อมูลและงานบันทึกราคาตามเวลา แคชที่ขอบเครือข่ายใช้ Vercel CDN ร่วมกับ header ที่ Python ส่ง

## 4. ปัญหา/ข้อจำกัดที่พบในขั้นตอนต่าง ๆ และวิธีจัดการ

ตารางนี้เป็นสิ่งที่ตรวจพบจากโค้ดและการทดสอบ ไม่ได้อ้างว่าเคยเกิดเหตุจริงบนระบบ production เพราะ repository มีประวัติ commit ที่ตรวจได้เพียงหนึ่งรายการ

| ขั้นตอน | ปัญหา/ข้อจำกัด | วิธีที่โค้ดจัดการ / วิธีแก้เพิ่มเติม |
|---|---|---|
| ตั้งค่าก่อนรัน | ไม่มีไฟล์ `.env` ใน workspace ปัจจุบัน จึงไม่มีคีย์สำหรับดึงข้อมูลจริงในเครื่องนี้ | คัดลอก `.env.example` เป็น `.env` แล้วใส่คีย์; API ตอบ 503 เมื่อคีย์หาย และเว็บแสดงข้อมูลสำรอง |
| เรียก SerpApi | คีย์ผิด โควตาหมด เครือข่ายล้มเหลว หรือบริการตอบเกิน 20 วินาที | `classify_serpapi_error` แปลงเป็นรหัส; `fetch_category` จับ timeout/HTTP error; ส่งข้อมูลหมวดที่ยังสำเร็จ หากล้มทั้งหมดตอบ 502 |
| คัดผลค้นหา | Google Shopping อาจคืนสินค้าที่ไม่ตรงหมวดหรือมือสอง | `matches_hardware_category` และ regex กรอง CPU/GPU; หมวด RAM/SSD/Notebook/Monitor ยังไม่มีตัวกรองละเอียด ควรเพิ่มกฎพร้อมทดสอบ |
| แสดงราคา | ผลค้นหา/ราคา/สต็อกอาจเปลี่ยนหลังดึงข้อมูล; `stock=True` ใน `normalize_product` ไม่ได้ยืนยันสต็อกจริง | หน้าเว็บเตือนให้ตรวจร้านค้า; หากต้องการความแม่นยำต้องอ่านข้อมูลสต็อกจากแหล่งที่เชื่อถือได้และเปลี่ยนการกำหนด `stock` |
| รีเฟรชและโควตา | การขอสดทุกครั้งใช้เวลาและอาจใช้โควตา; `?refresh=1` ข้ามเฉพาะแคชของเว็บ | แคช CDN 60/15 นาที; หน้าเว็บตรวจทุก 5 นาทีแต่ CDN อาจตอบจากแคช; ติดตามโควตาที่บัญชี SerpApi |
| กราฟแนวโน้ม | ประวัติราคาเก็บเฉพาะในเบราว์เซอร์เดียว และรายการเดิมซ้ำในข้อมูลสำรอง | ใช้ `localStorage` เป็นวิธีชั่วคราว; เพิ่มฐานข้อมูลกลางและบันทึก snapshot ตามเวลาหากต้องการกราฟตลาดจริง |
| ประเมินราคา | หน้า “AI” เป็นสูตรคำนวณจากราคาเฉลี่ยหมวดและแนวโน้ม ไม่ใช่โมเดล AI | โค้ดแสดงคำว่า “สูตรคำนวณราคา”; หากต้องการ AI จริง ต้องออกแบบข้อมูลฝึก/ประเมินใหม่และอธิบายความคลาดเคลื่อน |
| ความปลอดภัยคีย์ | คีย์เป็นข้อมูลลับ; หากใส่ใน JavaScript จะส่งถึงผู้ใช้ | ใช้ `SERPAPI_KEY` ฝั่ง Python และตั้งใน Vercel Environment Variables; `.gitignore` กัน `.env`; รายงานนี้ไม่บันทึกค่าคีย์ |

## 5. API key อยู่ตรงไหน และวิธีขอ/ใส่คีย์

**ตำแหน่ง:** คีย์จริงไม่ถูกเก็บใน source code และไม่พบไฟล์ `.env` ใน workspace ที่ตรวจครั้งนี้ `.env.example:1` มีเพียง placeholder ชื่อ `SERPAPI_KEY`. Python โหลด `.env` ที่ `app/main.py:25`, อ่านคีย์ที่ `app/main.py:337`, ส่งค่าเป็นพารามิเตอร์ `api_key` ที่ `app/main.py:264` และส่งคำขอจริงที่ `app/main.py:269`. JavaScript ที่ `dist/app.js:183` เรียก API ของโปรเจกต์ ไม่ได้ถือคีย์ SerpApi

**วิธีขอคีย์ SerpApi:** สมัคร/เข้าสู่ระบบ SerpApi แล้วเปิดหน้า [Manage API Key](https://serpapi.com/manage-api-key) จากนั้นคัดลอก “Your Private API Key” ตาม [คู่มือ SerpApi](https://serpapi.com/blog/how-to-connect-serpapi-mcp-to-claude-desktop/) เอกสาร [Google Shopping API](https://serpapi.com/google-shopping-api) ระบุว่า `api_key` และ `engine=google_shopping` เป็นพารามิเตอร์ของคำขอ

**ตั้งค่าในเครื่อง:**

```powershell
Copy-Item .env.example .env
# เปิดไฟล์ .env แล้วแทนคำว่า replace_with_your_serpapi_key ด้วยคีย์จริง
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

ตัวอย่างเนื้อหา `.env` (เป็นตัวอย่างเท่านั้น ห้ามนำคีย์จริงไปใส่ในรายงานหรือ Git):

```dotenv
SERPAPI_KEY=<คีย์จริงที่คัดลอกจากบัญชี SerpApi>
```

ทดสอบที่ `http://127.0.0.1:8000/api/health` โดย `live_data_configured` ต้องเป็น `true` แล้วเปิด `http://127.0.0.1:8000/api/prices` เพื่อดู JSON หากแก้ `.env` ขณะเซิร์ฟเวอร์รัน ให้รีสตาร์ตเซิร์ฟเวอร์

**ตั้งค่าบน Vercel:** ไปที่ Project → Settings → Environment Variables เพิ่ม Name = `SERPAPI_KEY`, Value = คีย์จริง และเลือก Environment ที่ต้องการ เช่น Production/Preview จากนั้นสร้าง deployment ใหม่หรือ Redeploy เพราะการเปลี่ยนตัวแปรไม่ย้อนหลังไปยัง deployment เก่า ตาม [เอกสาร Vercel](https://vercel.com/docs/environment-variables) ไม่ต้องสร้าง `.env` บน Vercel

## 6. โค้ดตัวอย่างที่สำคัญ

ตัวอย่างฝั่ง Python จาก `app/main.py` (ย่อเฉพาะจุดหลัก; คีย์ไม่มีค่าจริงในตัวอย่าง):

```python
# app/main.py:25 อ่าน .env ในเครื่อง
load_dotenv(PROJECT_ROOT / ".env")

# app/main.py:337 อ่านคีย์เมื่อ /api/prices ถูกเรียก
api_key = os.getenv("SERPAPI_KEY")
if not api_key:
    return json_response({"ok": False, "error": "SERPAPI_KEY is not configured"}, 503)

# app/main.py:257-269 สร้าง URL และส่งคำขอ SerpApi
endpoint = "https://serpapi.com/search.json?" + urlencode({
    "engine": "google_shopping",
    "q": query,
    "gl": "th",
    "hl": "th",
    "location": "Thailand",
    "api_key": api_key,
})
response = await client.get(endpoint, headers={"accept": "application/json"})
```

ตัวอย่างฝั่ง JavaScript จาก `dist/app.js:183-184`:

```javascript
// เบราว์เซอร์เรียก API ของเราเท่านั้น ไม่มี SerpApi key
const response = await fetch(
  `/api/prices${force ? '?refresh=1' : ''}`,
  requestOptions
);
const payload = await response.json();
```

## 7. หากอยากแก้เว็บ ให้แก้ตรงไหน

| สิ่งที่อยากแก้ | ไฟล์/บรรทัด | คำที่ควรค้นและวิธีแก้ |
|---|---|---|
| ชื่อเว็บ/ข้อความเมนู | `dist/index.html:15-23` | ค้น `brand-name` หรือ `data-view` แล้วแก้ข้อความระหว่างแท็ก |
| ข้อความหัวหน้า/ปุ่มรีเฟรช | `dist/index.html:34-39` | ค้น `page-title` หรือ `refresh-live` แล้วแก้ข้อความ |
| สีหลัก/พื้นหลัง | `dist/styles.css:3-18` | ค้น `:root` และแก้ค่าตัวแปร เช่น `--bg`; สีบางจุดอยู่ใน selector ด้านล่าง |
| รูปแบบ sidebar/การ์ด | `dist/styles.css:25-36, 95-101` | ค้น `.sidebar`, `.card` แล้วแก้ CSS |
| คำค้น/หมวดสินค้า | `app/main.py:29-36` | แก้ค่าด้านขวาของ `"GPU"`, `"CPU"` ฯลฯ; หมวดใหม่อาจต้องปรับตัวกรอง JavaScript |
| กฎตัดสินค้ามือสอง/ผิดหมวด | `app/main.py:79-110,181` | ค้น `USED_PRODUCT_PATTERN`, `CPU_PATTERN`, `GPU_PATTERN` และเพิ่ม test |
| จำนวนสินค้าต่อหมวด | `app/main.py:293` | ค้น `if len(products) == 8` แล้วแก้เลข 8 |
| ฟิลด์ที่ API ส่ง | `app/main.py:195-231` | ค้น `normalize_product` แล้วแก้ dict ที่ return; ตรวจการใช้ฟิลด์ใน `dist/app.js` |
| ตาราง/หน้าแต่ละเมนู | `dist/app.js:84-120` | ค้น `renderDashboard`, `renderExplorer`, `renderCompare`, `renderTrends`, `renderDeals`, `renderAI` |
| สูตรประเมินราคา | `dist/app.js:110-116` | ค้น `function analyze` แล้วปรับสูตรและข้อความผลลัพธ์ |
| จุดเรียก API/รีเฟรช | `dist/app.js:176-205` | ค้น `loadLiveData` และ `fetch(`; หากเปลี่ยนเส้นทางให้แก้ `@app.get("/api/prices")` ใน Python ด้วย |
| API key | `.env.example:1` → `.env`; `app/main.py:25,337` | แทน placeholder ใน `.env`; บน Vercel ตั้ง Environment Variable; ไม่แก้ค่าคีย์ใน Python |

## 8. สิ่งที่ได้เรียนรู้

1. แยกความรับผิดชอบระหว่าง Python backend, SerpApi, JavaScript และ HTML/CSS ทำให้หาไฟล์ที่ต้องแก้ได้เร็วขึ้น
2. เก็บคีย์ API ใน environment variable และเรียกผู้ให้บริการจากเซิร์ฟเวอร์ ช่วยไม่ให้คีย์ไปอยู่ในไฟล์ที่เบราว์เซอร์ดาวน์โหลด
3. ข้อมูลภายนอกมีโอกาสผิดหมวด ขาดฟิลด์ หรือใช้ไม่ได้ จึงต้องตรวจ JSON คัดกรอง แปลงรูป และจัดการความล้มเหลวแยกตามหมวด
4. แคชช่วยลดเวลาและการใช้โควตา แต่ต้องบอกผู้ใช้ว่าข้อมูลอาจไม่ใช่ราคาวินาทีล่าสุด
5. ข้อมูลราคาเพียงไม่กี่จุดใน `localStorage` ไม่เพียงพอสำหรับแนวโน้มตลาดระยะยาว และคะแนนสูตรคำนวณควรอธิบายตามจริง
6. การทดสอบแบบจำลอง API ช่วยยืนยันกรณีคีย์หาย ผลบางหมวด และการไม่เปิดเผยคีย์ โดยไม่ใช้โควตาจริง

## 9. ผลการตรวจสอบ

รัน `.\.venv\Scripts\python.exe -m pytest -q` ผ่าน 9 tests และ `.\.venv\Scripts\python.exe -m py_compile app\main.py` ผ่าน ไม่ได้ทดสอบการเรียก SerpApi จริง เพราะไม่มี `.env`/คีย์ใน workspace ที่ตรวจ การทดสอบมีคำเตือน deprecation จากไลบรารี `starlette.testclient` แต่ไม่ทำให้ tests ล้มเหลว

## 10. ขั้นตอนการดึง API แบบละเอียด (อ่านตามลำดับจริง)

หัวข้อนี้อธิบายว่า “ตัวดึง API” มีสองชั้น: JavaScript ส่งคำขอจากเบราว์เซอร์มายัง Python API ของเว็บ และ Python จึงส่งคำขอออกไปยัง SerpApi คีย์จริงอยู่ฝั่ง Python เท่านั้น

```text
ผู้ใช้เปิดเว็บ / กดอัปเดตราคา
  ↓ dist/app.js:229 หรือ 216 เรียก loadLiveData()
  ↓ dist/app.js:183 ส่ง GET /api/prices[?refresh=1]
  ↓ app/main.py:334-335 รับคำขอที่ live_prices()
  ↓ app/main.py:337-339 อ่าน/ตรวจ SERPAPI_KEY
  ↓ app/main.py:343-348 เรียก fetch_category() พร้อมกัน 6 หมวด
  ↓ app/main.py:257-269 ส่ง HTTPS GET ไป SerpApi
  ↓ app/main.py:276-297 ตรวจ JSON และจัดรูปสินค้า
  ↓ app/main.py:351-399 รวมผล/ข้อผิดพลาดและส่ง JSON กลับ
  ↓ dist/app.js:184-197 รับ JSON และวาดหน้าเว็บ
```

| ลำดับ | จุดในโค้ด | ข้อมูลเข้า → งานที่ทำ → ข้อมูลออก |
|---|---|---|
| 1 | `dist/app.js:229,216` | เปิดหน้าเว็บหรือกดปุ่ม “อัปเดตราคา” → เรียก `loadLiveData(false/true)` |
| 2 | `dist/app.js:180-183` | สร้าง request → `fetch("/api/prices")`; เมื่อ `force=true` เพิ่ม `?refresh=1` และ `cache=no-store` |
| 3 | `app/main.py:334-339` | FastAPI รับ `/api/prices` → อ่าน `SERPAPI_KEY`; ถ้าไม่มี ส่ง HTTP 503 |
| 4 | `app/main.py:29-36,343-348` | อ่านคำค้น 6 หมวด → ใช้ `httpx.AsyncClient` timeout 20 วินาที และ `asyncio.gather` เรียกพร้อมกัน |
| 5 | `app/main.py:249,257-266` | ต่อหนึ่งหมวด สร้าง URL `https://serpapi.com/search.json` พร้อม `engine=google_shopping`, `q`, `gl=th`, `hl=th`, `location=Thailand` และ `api_key` |
| 6 | `app/main.py:269` | `client.get(...)` ส่ง HTTPS GET ไป SerpApi จริง → รับ HTTP response |
| 7 | `app/main.py:270-282` | จัดการ timeout/เครือข่าย ตรวจ `response.json()` และ status; หากผิดพลาดแปลงเป็นรหัสที่เว็บเข้าใจ |
| 8 | `app/main.py:163-230,284-297` | รวมรายการจาก JSON → คัดสินค้าผิดหมวด/ราคาผิดปกติ → แปลงชื่อ ราคา ร้านค้า และ URL → ตัดซ้ำ/จำกัด 8 รายการต่อหมวด |
| 9 | `app/main.py:351-399` | รวมหมวดที่สำเร็จ → ถ้าบางหมวดล้มเหลวแนบ `failed_categories`; ถ้าล้มทั้งหมดตอบ 502; กำหนด cache 900/3600 วินาที |
| 10 | `dist/app.js:184-205` | อ่าน JSON → เก็บประวัติราคาในเครื่อง → อัปเดตสถานะและแสดงหน้าเว็บ; ถ้าดึงไม่ได้ใช้ข้อมูลสำรองหรือผลล่าสุดที่เคยโหลด |

ตัวอย่างคำขอที่ Python สร้าง (ตัวอย่างเพื่ออธิบายเท่านั้น; ห้ามใส่คีย์จริงในเอกสารหรือเปิด URL นี้ให้ผู้อื่นเห็น):

```text
GET https://serpapi.com/search.json
    ?engine=google_shopping
    &q=การ์ดจอ
    &gl=th
    &hl=th
    &location=Thailand
    &api_key=<คีย์จาก SERPAPI_KEY>
```

ตัวอย่างคำตอบที่หน้าเว็บคาดหวังจาก Python API (ย่อ):

```json
{
  "ok": true,
  "provider": "SerpApi / Google Shopping Thailand",
  "products": [
    {
      "category": "GPU",
      "name": "ชื่อสินค้าจากผลค้นหา",
      "shop": "ชื่อร้าน",
      "price": 16400,
      "source_url": "https://example.com/product"
    }
  ],
  "categories": [{"name": "GPU", "count": 1}]
}
```

**วิธีไล่ตรวจเมื่อดึงข้อมูลไม่ขึ้น:** เปิด `/api/health` ก่อน หาก `live_data_configured=false` ให้ตั้ง `SERPAPI_KEY`; จากนั้นเปิด `/api/prices` ถ้าได้ 503 แปลว่าไม่มีคีย์, ถ้าได้ 502 ให้ดู `code`/`error` (เช่น คีย์ผิด โควตาเต็ม หรือไม่มีสินค้า); ถ้าได้ 200 แต่บางหมวดหาย ให้ดู `failed_categories`. ทดสอบปุ่มรีเฟรชด้วย `/api/prices?refresh=1` โดยทราบว่าการข้ามแคช CDN ไม่ได้บังคับให้ SerpApi ข้ามแคชของตนเอง
