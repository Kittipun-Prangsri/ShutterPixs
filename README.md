# 📸 ShutterPixs — Photography Booking System

> ระบบจองช่างภาพพรีเมียมออนไลน์ พร้อมแจ้งเตือนผ่าน LINE OA อัตโนมัติ

[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=black)](https://shutterpixs59.web.app)
[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![LINE Bot SDK](https://img.shields.io/badge/LINE-Bot%20SDK-00C300?logo=line&logoColor=white)](https://developers.line.biz)
[![Firestore](https://img.shields.io/badge/Firestore-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/docs/firestore)

---

## 🌐 Live Demo

| | URL |
|---|---|
| 🌍 **Website** | https://shutterpixs59.web.app |
| 🔧 **Firebase Console** | https://console.firebase.google.com/project/shutterpixs-1091a |

---

## ✨ Features

- 📸 **Portfolio Gallery** — แสดงผลงานแบ่งตามหมวด (Wedding, Ordination, Graduation, Other)
- 📅 **Online Booking** — ฟอร์มจองคิวออนไลน์ พร้อมสร้างรหัสการจองอัตโนมัติ (SP-YYYYMMDD-XXX)
- 💬 **LINE OA Bot** — ลูกค้าส่งรหัสการจองใน LINE แล้วระบบตอบกลับรายละเอียดอัตโนมัติ
- 🔔 **Admin Notification** — แจ้งเตือนช่างภาพทันทีเมื่อมีการจองใหม่ผ่าน Flex Message
- 🔥 **Firestore Database** — เก็บข้อมูลการจองบน Firebase Firestore (พร้อม In-Memory Fallback)
- 📱 **Responsive Design** — รองรับทุกขนาดหน้าจอ

---

## 🗂️ Project Structure

```
Booking_ShutterPixs/
├── frontend/                   # Static frontend files (deployed to Firebase Hosting)
│   ├── index.html              # Main HTML page
│   ├── styles.css              # Global styles
│   ├── app.js                  # Frontend JavaScript logic
│   └── assets/                 # Images, icons, fonts
│
├── backend/                    # Express.js API server
│   ├── server.js               # Main server (Express + Firestore + LINE Bot)
│   ├── package.json            # Backend dependencies
│   ├── schema.sql              # Database schema reference (Firestore model)
│   ├── .env                    # Environment variables (ไม่ commit ขึ้น Git)
│   ├── .env.example            # Template สำหรับ environment variables
│   └── .nodemonignore          # ป้องกัน nodemon restart ที่ไม่จำเป็น
│
├── firebase.json               # Firebase Hosting configuration
└── README.md                   # คู่มือโปรเจกต์นี้
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS, JavaScript (ES6+) |
| **Backend** | Node.js v20, Express.js 4.x |
| **Database** | Firebase Firestore (Admin SDK) |
| **Notification** | LINE Messaging API (Bot SDK v9) |
| **Hosting** | Firebase Hosting (Frontend Static) |
| **Dev Tools** | Nodemon, dotenv |

---

## ⚙️ Environment Variables

สร้างไฟล์ `backend/.env` โดย copy จาก `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port ที่ server รัน (default: 3005) | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `FIREBASE_API_KEY` | Firebase Web API Key | ✅ |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path ไปยัง Service Account JSON | ⚠️ สำหรับ Firestore |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token | ✅ |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret | ✅ |
| `LINE_ADMIN_USER_ID` | LINE User ID ของช่างภาพ (รับ notification) | ✅ |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Firebase Project (`shutterpixs-1091a`)
- LINE Official Account

### 1. Clone & Install

```bash
git clone <repo-url>
cd "Booking_ShutterPixs"

# ติดตั้ง backend dependencies
cd backend
npm install
```

### 2. ตั้งค่า Environment Variables

```bash
cp .env.example .env
# แก้ไขค่าใน .env ตาม Firebase และ LINE credentials ของคุณ
```

### 3. (Optional) ตั้งค่า Firestore

1. เปิด [Firebase Console → Service Accounts](https://console.firebase.google.com/project/shutterpixs-1091a/settings/serviceaccounts/adminsdk)
2. คลิก **"Generate new private key"**
3. บันทึกไฟล์เป็น `backend/serviceAccountKey.json`
4. ใน `.env` ตั้งค่า:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   ```

### 4. รัน Server

```bash
cd backend
npm run dev
```

เปิดเบราวเซอร์: **http://localhost:3005**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/portfolios` | ดึงรายการผลงานทั้งหมด |
| `GET` | `/api/portfolios?category=wedding` | ดึงผลงานตามหมวดหมู่ |
| `POST` | `/api/bookings` | สร้างการจองใหม่ |
| `GET` | `/api/bookings/:id` | ดูรายละเอียดการจอง |
| `POST` | `/api/webhook/line` | LINE Webhook endpoint |

### ตัวอย่าง POST `/api/bookings`

```json
{
  "customer_name": "สมชาย ใจดี",
  "customer_phone": "081-234-5678",
  "customer_line_id": "@somchai",
  "event_type": "wedding",
  "event_date": "2026-12-25",
  "package_name": "Premium Wedding Package",
  "total_price": 15000,
  "details": "งานแต่งงานในสวน ช่วงเช้า-เที่ยง"
}
```

### Booking ID Format

```
SP-20261225-143   →  SP-[YYYYMMDD]-[3-digit random]
```

---

## 🤖 LINE Bot Commands

| ลูกค้าพิมพ์ | Bot ตอบกลับ |
|---|---|
| `SP-20261225-143` | Flex Message แสดงรายละเอียดการจองครบถ้วน |
| ข้อความอื่นๆ | ข้อความต้อนรับและวิธีใช้งาน |

---

## 🔥 Deploy

### Frontend → Firebase Hosting

```bash
# Login Firebase (ครั้งแรก)
npx -y firebase-tools@latest login

# ตั้ง project
npx -y firebase-tools@latest use shutterpixs-1091a

# Deploy live
npx -y firebase-tools@latest deploy --only hosting

# หรือ Preview Channel (ทดสอบก่อน)
npx -y firebase-tools@latest hosting:channel:deploy preview --expires 7d
```

### Backend → (แนะนำ Railway หรือ Render)

```bash
# เพิ่ม environment variables ทั้งหมดบน platform
# ชี้ LINE Webhook URL ไปที่: https://your-backend.railway.app/api/webhook/line
```

---

## 📦 Package Categories

```
wedding      →  งานแต่งงาน
ordination   →  งานบวช
graduation   →  งานรับปริญญา
other        →  งานอื่นๆ
```

---

## 🔒 Security Notes

- ไฟล์ `serviceAccountKey.json` ถูกเพิ่มใน `.gitignore` แล้ว — อย่า commit ขึ้น Git
- ไฟล์ `.env` ถูกเพิ่มใน `.gitignore` แล้ว — ใช้ `.env.example` เป็น template
- LINE Channel Secret และ Access Token ต้องเก็บเป็นความลับเสมอ

---

## 👨‍💻 Developer

**ShutterPixs** — Premium Photography Booking System  
Built with ❤️ by Kittipun

---

*Last updated: June 2026*
>>>>>>> 7072792 (feat: Add high-performance Admin CMS backend API with caching and direct storage upload)
