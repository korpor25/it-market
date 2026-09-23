# IT Market Intelligence

แดชบอร์ดติดตามและเปรียบเทียบราคาอุปกรณ์ไอทีในประเทศไทย โดยใช้ **Python + FastAPI** เป็น backend หลัก อ่านข้อมูล Google Shopping ผ่าน SerpApi และใช้ HTML, CSS และ JavaScript สำหรับหน้าเว็บ

โปรเจกต์นี้เตรียมไว้สำหรับเก็บ source code บน GitHub และ deploy อัตโนมัติด้วย Vercel

## เทคโนโลยี

- Python 3.13
- FastAPI และ HTTPX
- HTML, CSS และ Vanilla JavaScript
- pytest
- Vercel Functions และ Vercel CDN

## โครงสร้างโปรเจกต์

```text
app/
  main.py              FastAPI, SerpApi client และ API routes
dist/
  index.html           หน้าเว็บ
  styles.css           รูปแบบหน้าเว็บ
  app.js               การโต้ตอบใน browser
tests/                  ชุดทดสอบ Python
.env.example            ตัวอย่าง environment variable
pyproject.toml          ข้อมูลโปรเจกต์และ Python version
requirements.txt        dependencies สำหรับ production
requirements-dev.txt    dependencies สำหรับพัฒนาและทดสอบ
vercel.json             การตั้งค่า Vercel Function และ security headers
```

## API

- `GET /api/health` ตรวจสอบสถานะระบบและการตั้งค่า `SERPAPI_KEY`
- `GET /api/prices` อ่านราคาล่าสุด โดย Vercel CDN แคชผลสมบูรณ์ 1 ชั่วโมง
- `GET /api/prices?refresh=1` ขอข้อมูลใหม่และไม่ใช้ CDN cache
- `GET /api/docs` เปิดเอกสาร API แบบ Swagger UI

หากบางหมวดสินค้าโหลดไม่สำเร็จ API จะส่งหมวดที่เหลือพร้อม `failed_categories` และแคชผลไว้ 15 นาที หากทุกหมวดล้มเหลว API จะตอบรหัสข้อผิดพลาดโดยไม่เปิดเผย API key หรือข้อความลับจากผู้ให้บริการ

## ใช้งานในเครื่อง

ติดตั้ง Python 3.13 แล้วเปิด PowerShell ในโฟลเดอร์โปรเจกต์:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

เปิด `.env` แล้วแทนค่าตัวอย่างด้วย SerpApi key จริง:

```dotenv
SERPAPI_KEY=your_real_serpapi_key
```

เริ่มเว็บ:

```powershell
python -m uvicorn app.main:app --reload
```

เปิด `http://127.0.0.1:8000` และตรวจ API ได้ที่ `http://127.0.0.1:8000/api/health`

รันชุดทดสอบ:

```powershell
python -m pytest
```

ไฟล์ `.env` ถูกกันออกจาก Git แล้ว ห้าม commit หรือส่ง SerpApi key ขึ้น GitHub

## อัปโปรเจกต์ขึ้น GitHub

1. เข้า GitHub แล้วสร้าง repository ใหม่ โดยไม่ต้องเพิ่ม README หรือ `.gitignore` จากหน้าเว็บ
2. เปิด PowerShell ที่โฟลเดอร์นี้ แล้วรันคำสั่งต่อไปนี้ โดยเปลี่ยน URL ให้เป็น repository ของคุณ:

```powershell
git init
git add .
git commit -m "Migrate backend to Python FastAPI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

ตรวจด้วย `git status` ก่อน push ว่าไม่มี `.env` อยู่ในรายการไฟล์ที่จะส่งขึ้น GitHub

## Deploy บน Vercel

1. เข้า [vercel.com](https://vercel.com/) และเข้าสู่ระบบด้วย GitHub
2. เลือก **Add New → Project**
3. เลือก **Import** repository ที่เพิ่งสร้าง
4. ใช้ Root Directory เป็น `./` และไม่ต้องกำหนด Build Command หรือ Output Directory เอง Vercel จะตรวจพบ FastAPI จาก `app/main.py` และ dependencies โดยอัตโนมัติ
5. เปิดส่วน **Environment Variables** แล้วเพิ่ม:

   - Name: `SERPAPI_KEY`
   - Value: SerpApi key จริง
   - Environment: เลือก Production และ Preview ตามที่ต้องการ

6. กด **Deploy**
7. หลัง deploy สำเร็จ เปิด `https://ชื่อโปรเจกต์.vercel.app/api/health` ค่า `live_data_configured` ต้องเป็น `true`
8. เปิด `/api/prices` เพื่อตรวจว่ารับข้อมูลสินค้าได้ แล้วกลับไปเปิดหน้าแรก

หากเพิ่มหรือแก้ Environment Variable หลังจาก deploy แล้ว ให้เปิดหน้า **Deployments** และเลือก **Redeploy** เพื่อให้ deployment ใหม่ใช้ค่าล่าสุด

## อัปเดตเว็บไซต์ครั้งต่อไป

เมื่อเชื่อม GitHub กับ Vercel แล้ว ทุกครั้งที่ push ไปยัง `main` Vercel จะ deploy production ให้อัตโนมัติ:

```powershell
git add .
git commit -m "Describe your change"
git push
```

Branch และ pull request อื่นจะได้ Preview Deployment แยกจาก production

## หมายเหตุเรื่องแคช

API ตั้ง `Vercel-CDN-Cache-Control` เพื่อแคชข้อมูลที่ edge และลดการใช้โควตา SerpApi:

- ข้อมูลครบทุกหมวด: 60 นาที
- ข้อมูลสำเร็จเพียงบางหมวด: 15 นาที
- คำขอ `?refresh=1`: ไม่แคช

Vercel CDN แยกแคชตามภูมิภาคและอาจล้างแคชได้เอง จึงควรติดตามจำนวนคำขอจริงในบัญชี SerpApi ด้วย
