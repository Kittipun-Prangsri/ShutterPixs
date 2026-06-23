require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const admin = require('firebase-admin');
const line = require('@line/bot-sdk');
const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3005;

// Enable CORS and Gzip compression
app.use(cors());
app.use(compression());

// Serve static files from the sibling frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Firebase Admin (Firestore)
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let db = null;
let useFirebaseMock = true;

if (serviceAccountPath && serviceAccountPath.trim() !== '') {
  try {
    if (admin.apps.length === 0) {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
    useFirebaseMock = false;
    console.log('✅ Firebase Admin (Firestore) initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin client:', error.message);
  }
} else {
  console.log('⚠️  Using In-Memory Fallback Database. Configure GOOGLE_APPLICATION_CREDENTIALS in .env to connect to your live database.');
}

// In-Memory Fallback Database
const mockBookings = [];
const mockPortfolios = [
  {
    id: "p1",
    title: "Eternal Love at The Glasshouse",
    category: "wedding",
    image_url: "assets/images/wedding_1.jpg",
    description: "Modern romantic garden wedding photoshoot featuring natural light and candid moments."
  },
  {
    id: "p2",
    title: "Traditional Thai Blessed Union",
    category: "wedding",
    image_url: "assets/images/wedding_2.jpg",
    description: "Elegant traditional Thai wedding ceremony capturing the exquisite details of Thai attire and sacred water pouring ritual."
  },
  {
    id: "p3",
    title: "Pristine Ordination Ceremony",
    category: "ordination",
    image_url: "assets/images/ordination_1.jpg",
    description: "Shaving ritual and serene ordination ceremony at the historic Wat Phra Kaew, capturing local cultural legacy."
  },
  {
    id: "p4",
    title: "Path to Enlightenment",
    category: "ordination",
    image_url: "assets/images/ordination_2.jpg",
    description: "The sacred moments of a monk walking around the chapel, surrounded by joyful family and friends."
  },
  {
    id: "p5",
    title: "Proud Achievements at Chulalongkorn",
    category: "graduation",
    image_url: "assets/images/graduation_1.jpg",
    description: "Joyful graduation outdoor portrait photoshoot with iconic campus backdrops and premium color grading."
  },
  {
    id: "p6",
    title: "Milestone Reached!",
    category: "graduation",
    image_url: "assets/images/graduation_2.jpg",
    description: "Group graduation photography capturing genuine smiles, mortarboard tosses, and bright memories with close friends."
  },
  {
    id: "p7",
    title: "Minimalist Studio Portraiture",
    category: "other",
    image_url: "assets/images/other_1.jpg",
    description: "High-end studio profile shoots highlighting personal branding, professional lighting, and editorial styles."
  },
  {
    id: "p8",
    title: "Sunset Beach Couple Session",
    category: "other",
    image_url: "assets/images/other_2.jpg",
    description: "Cinematic pre-wedding style couple photoshoot during the golden hour on the white sands of Phuket."
  }
];

// LINE Bot Configuration
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};

let lineClient = null;
let useLineMock = true;

if (lineConfig.channelAccessToken && lineConfig.channelSecret && !lineConfig.channelAccessToken.includes('placeholder')) {
  try {
    lineClient = new line.messagingApi.MessagingApiClient({ channelAccessToken: lineConfig.channelAccessToken });
    useLineMock = false;
    console.log('✅ LINE client initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize LINE client:', error.message);
  }
} else {
  console.log('⚠️  LINE features running in Demo mode. Configure LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET in .env for actual bot responses.');
}

// Set JSON parsers for standard routes (skip for LINE webhook to prevent signature verification errors)
app.use((req, res, next) => {
  if (req.path === '/api/webhook/line') {
    return next();
  }
  express.json()(req, res, next);
});

// Register High-Performance CMS API routes for Images, Packages, and Bookings
const imageRoutes = require('./routes/imageRoutes');
const packageRoutes = require('./routes/packageRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api', imageRoutes);
app.use('/api', packageRoutes);
app.use('/api', bookingRoutes);

// API: Get Portfolios
app.get('/api/portfolios', async (req, res) => {
  const category = req.query.category;

  if (useFirebaseMock || !db) {
    let list = mockPortfolios;
    if (category) {
      list = mockPortfolios.filter(p => p.category === category);
    }
    return res.json(list);
  }

  try {
    let queryRef = db.collection('portfolios');
    if (category) {
      queryRef = queryRef.where('category', '==', category);
    }
    const snapshot = await queryRef.get();
    const data = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching portfolios from Firestore:', error.message);
    // Graceful fallback to mock data
    let list = mockPortfolios;
    if (category) {
      list = mockPortfolios.filter(p => p.category === category);
    }
    res.json(list);
  }
});

// API: Create Booking
app.post('/api/bookings', async (req, res) => {
  const { customer_name, customer_phone, customer_line_id, event_type, event_date, package_name, total_price, details } = req.body;

  if (!customer_name || !customer_phone || !event_type || !event_date || !package_name || total_price === undefined) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  // Generate Booking ID: SP-YYYYMMDD-XXX
  const dateObj = new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dateStr = String(dateObj.getDate()).padStart(2, '0');
  const randNum = String(Math.floor(100 + Math.random() * 900));
  const bookingId = `SP-${year}${month}${dateStr}-${randNum}`;

  const newBooking = {
    id: bookingId,
    customer_name,
    customer_phone,
    customer_line_id: customer_line_id || null,
    event_type,
    event_date,
    package_name,
    total_price: Number(total_price),
    status: 'pending',
    details: details || '',
    created_at: new Date().toISOString()
  };

  if (useFirebaseMock || !db) {
    mockBookings.push(newBooking);
    console.log(`Saved mock booking: ${bookingId}. Total saved mock bookings: ${mockBookings.length}`);
    // Notify admin via LINE push (if LINE client is configured)
    await notifyAdminNewBooking(newBooking);
    return res.status(201).json(newBooking);
  }

  try {
    await db.collection('bookings').doc(bookingId).set(newBooking);
    console.log(`✅ Saved booking to Firestore: ${bookingId}`);
    // Notify admin via LINE push
    await notifyAdminNewBooking(newBooking);
    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error inserting booking into Firestore:', error.message);
    // Fallback to mock booking
    mockBookings.push(newBooking);
    console.log(`Fallback saved mock booking: ${bookingId}`);
    res.status(201).json(newBooking);
  }
});

// API: Get Booking Details
app.get('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;

  if (useFirebaseMock || !db) {
    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    return res.json(booking);
  }

  try {
    const docRef = db.collection('bookings').doc(bookingId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      const booking = mockBookings.find(b => b.id === bookingId);
      if (booking) return res.json(booking);
      return res.status(404).json({ error: 'Booking not found.' });
    }
    res.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    console.error('Error fetching booking details from Firestore:', error.message);
    res.status(404).json({ error: 'Booking not found.' });
  }
});

// Helper: Query Booking for LINE Bot (supports both Firestore and memory fallback)
async function findBookingById(bookingId) {
  if (useFirebaseMock || !db) {
    return mockBookings.find(b => b.id === bookingId);
  }
  try {
    const docRef = db.collection('bookings').doc(bookingId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return mockBookings.find(b => b.id === bookingId);
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (err) {
    return mockBookings.find(b => b.id === bookingId);
  }
}

// Helper: Push booking notification to Admin LINE
async function notifyAdminNewBooking(booking) {
  const adminUserId = process.env.LINE_ADMIN_USER_ID;
  if (!lineClient || !adminUserId || useLineMock) return;

  const eventNames = {
    wedding: 'งานแต่งงาน (Wedding)',
    ordination: 'งานบวช (Ordination)',
    graduation: 'งานรับปริญญา (Graduation)',
    other: 'งานอื่นๆ (Other)'
  };

  try {
    await lineClient.pushMessage({
      to: adminUserId,
      messages: [
        {
          type: 'flex',
          altText: `📸 การจองใหม่! ${booking.id}`,
          contents: {
            type: 'bubble',
            styles: {
              header: { backgroundColor: '#111827' },
              body: { backgroundColor: '#1f2937' },
              footer: { backgroundColor: '#111827' }
            },
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                { type: 'text', text: '📸 SHUTTERPIXS', weight: 'bold', color: '#e5e7eb', size: 'sm' },
                { type: 'text', text: '🔔 มีการจองใหม่!', weight: 'bold', color: '#fbbf24', size: 'xl', margin: 'xs' }
              ]
            },
            body: {
              type: 'box',
              layout: 'vertical',
              spacing: 'sm',
              contents: [
                { type: 'text', text: `รหัส: ${booking.id}`, color: '#9ca3af', size: 'xs', weight: 'bold' },
                { type: 'separator', margin: 'md', color: '#374151' },
                {
                  type: 'box', layout: 'vertical', margin: 'md', spacing: 'sm',
                  contents: [
                    {
                      type: 'box', layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'ชื่อลูกค้า:', color: '#9ca3af', size: 'sm', flex: 3 },
                        { type: 'text', text: booking.customer_name, color: '#f3f4f6', size: 'sm', flex: 5, weight: 'bold', wrap: true }
                      ]
                    },
                    {
                      type: 'box', layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'เบอร์โทร:', color: '#9ca3af', size: 'sm', flex: 3 },
                        { type: 'text', text: booking.customer_phone, color: '#f3f4f6', size: 'sm', flex: 5 }
                      ]
                    },
                    {
                      type: 'box', layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'ประเภทงาน:', color: '#9ca3af', size: 'sm', flex: 3 },
                        { type: 'text', text: eventNames[booking.event_type] || booking.event_type, color: '#f3f4f6', size: 'sm', flex: 5, weight: 'bold', wrap: true }
                      ]
                    },
                    {
                      type: 'box', layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'วันที่จัดงาน:', color: '#9ca3af', size: 'sm', flex: 3 },
                        { type: 'text', text: booking.event_date, color: '#f3f4f6', size: 'sm', flex: 5 }
                      ]
                    },
                    {
                      type: 'box', layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'แพ็กเกจ:', color: '#9ca3af', size: 'sm', flex: 3 },
                        { type: 'text', text: booking.package_name, color: '#fbbf24', size: 'sm', flex: 5, weight: 'bold', wrap: true }
                      ]
                    },
                    {
                      type: 'box', layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'ราคารวม:', color: '#9ca3af', size: 'sm', flex: 3 },
                        { type: 'text', text: `฿${booking.total_price.toLocaleString('th-TH')}`, color: '#10b981', size: 'base', flex: 5, weight: 'bold' }
                      ]
                    }
                  ]
                }
              ]
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: 'กรุณาติดต่อลูกค้าและล็อควันงานครับ 🙏',
                  color: '#d1d5db',
                  size: 'xs',
                  wrap: true,
                  align: 'center'
                }
              ]
            }
          }
        }
      ]
    });
    console.log(`📨 Admin notified via LINE for booking: ${booking.id}`);
  } catch (err) {
    console.error('❌ Failed to push admin LINE notification:', err.message);
  }
}

// LINE OA Webhook endpoint
app.post('/api/webhook/line',
  (lineConfig.channelSecret && !lineConfig.channelSecret.includes('placeholder'))
    ? line.middleware({ channelSecret: lineConfig.channelSecret })
    : express.json(), // Parse body normally if signature check is bypassed
  async (req, res) => {
    if (useLineMock) {
      console.log('Received Line Webhook (DEMO mode):', JSON.stringify(req.body, null, 2));
      return res.sendStatus(200);
    }

    try {
      const events = req.body.events;
      const results = await Promise.all(events.map(handleLineEvent));
      res.json(results);
    } catch (err) {
      console.error('Line webhook error:', err);
      res.status(500).end();
    }
  });

// Helper: Get keyword-based responses for common inquiries
// Helper: Get keyword-based responses for common inquiries
function getKeywordResponse(text) {
  if (!text) return null;
  // Normalize: remove spaces/hyphens, normalize double-เ to แ, convert to lowercase
  const cleanText = text.replace(/[\s\-\–]+/g, '').replace(/\u0e40\u0e40/g, '\u0e41').toLowerCase();

  // 1. ช่างภารับอะไรบ้าง / ช่างภาทำอะไร / ช่างภารับงานอะไร
  if (cleanText.includes('ช่างภาพ') && (cleanText.includes('รับ') || cleanText.includes('ทำ') || cleanText.includes('บริการ') || cleanText.includes('งาน'))) {
    return `📸 ช่างภาพ ของทาง ShutterPixs ยินดีให้บริการถ่ายภาพระดับพรีเมียมในประเภทงานต่างๆ ดังนี้ครับ:\n` +
      `1. งานแต่งงาน (Wedding) - พิธีเช้า งานเลี้ยงเย็น หรือพรีเวดดิ้ง\n` +
      `2. งานบวช (Ordination) - พิธีปลงผม แห่นาค และพิธีในโบสถ์\n` +
      `3. งานรับปริญญา (Graduation) - ทั้งวันจริงและนอกรอบแบบเดี่ยว/กลุ่ม\n` +
      `4. งาน Portrait / อื่นๆ (Other) - ภาพโปรไฟล์ อีเวนต์ สินค้า และแฟชั่นครับ\n\n` +
      `คุณลูกค้าสามารถดูตัวอย่างผลงานช่างภาและจองคิวออนไลน์ได้ทางเว็บหลัก https://shutterpixs59.web.app นะครับ 😊`;
  }

  // 2. เช้า-เที่ยง ราคาเท่าไร / ราคาเช้าเที่ยง
  if (cleanText.includes('เช้าเที่ยง') && (cleanText.includes('ราคา') || cleanText.includes('เท่าไร') || cleanText.includes('เท่าไหร่') || cleanText.includes('กี่บาท'))) {
    return `📸 สำหรับคิวงานช่วง เช้า-เที่ยง (ครึ่งวัน / ประมาณ 4 ชั่วโมง):\n` +
      `- ราคาเริ่มต้น 4,900 บาท (Bronze Package)\n` +
      `- บริการโดยช่างภาพหลัก 1 คน พร้อมปรับแต่งโทนสีไฟล์ภาพดิจิทัลทั้งหมด และส่งงานภายใน 7-10 วันครับ\n\n` +
      `สามารถเช็คคิวช่างภาว่างและจองคิวออนไลน์ล่วงหน้าได้ที่ https://shutterpixs59.web.app ครับ ✨`;
  }

  // 3. เช้า-เย็น ราคาเท่าไร / ราคาเช้าเย็น
  if (cleanText.includes('เช้าเย็น') && (cleanText.includes('ราคา') || cleanText.includes('เท่าไร') || cleanText.includes('เท่าไหร่') || cleanText.includes('กี่บาท'))) {
    return `📸 สำหรับคิวงานช่วง เช้า-เย็น (เต็มวัน / ประมาณ 8 ชั่วโมง):\n` +
      `- ราคาเริ่มต้น 14,900 บาท (Gold Package)\n` +
      `- บริการโดยทีมช่างภาพ 3 คน (หลัก+แคนดิด) พร้อมไฟสตูดิโอขนาดใหญ่หน้างาน โฟโต้บุ๊คพรีเมียม ส่งงานด่วน 3 วันครับ\n\n` +
      `สามารถจองคิวออนไลน์หรือเลือกแพ็กเกจอื่นๆ เพิ่มเติมได้ทางเว็บหลัก https://shutterpixs59.web.app ครับ ✨`;
  }

  return null;
}

// Helper: Generate service Flex Message
function getServiceFlexMessage(category) {
  const websiteBase = 'https://shutterpixs59.web.app';
  
  const services = {
    wedding: {
      title: "Pre-Wedding / งานแต่ง",
      typeText: "ถ่ายภาพพรีเวดดิ้ง / งานแต่ง",
      priceText: "฿8,900 / คิว",
      descText: "บันทึกความทรงจำ สีละมุน ส่งงานไว ✨",
      imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      color: "#C2185B",
      portfolioUrl: `${websiteBase}/#portfolio`,
      bookingUrl: `${websiteBase}/#planner`
    },
    ordination: {
      title: "Ordination / งานบวช",
      typeText: "ถ่ายภาพงานบวช / อุปสมบท",
      priceText: "฿4,900 / คิว",
      descText: "งานบวชแสนประณีต ครบทุกพิธีสำคัญ 🙏",
      imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      color: "#E67E22",
      portfolioUrl: `${websiteBase}/#portfolio`,
      bookingUrl: `${websiteBase}/#planner`
    },
    graduation: {
      title: "Graduation / รับปริญญา",
      typeText: "ถ่ายภาพนอกรอบ / วันจริง",
      priceText: "฿3,500 / คิว",
      descText: "ภาพรับปริญญา ช็อตเดี่ยว/กลุ่ม สุดปัง 🎓",
      imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      color: "#2980B9",
      portfolioUrl: `${websiteBase}/#portfolio`,
      bookingUrl: `${websiteBase}/#planner`
    },
    event: {
      title: "Event / งานอีเว้นท์",
      typeText: "ถ่ายภาพอีเว้นท์ / กิจกรรม",
      priceText: "฿5,000 / คิว",
      descText: "งานสัมมนา ปาร์ตี้ คอนเสิร์ต ครบทุกโมเมนต์ 🎉",
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      color: "#8E44AD",
      portfolioUrl: `${websiteBase}/#portfolio`,
      bookingUrl: `${websiteBase}/#planner`
    },
    other: {
      title: "Portrait / ถ่ายภาพอื่นๆ",
      typeText: "ถ่ายภาพบุคคล / สินค้า / แฟชั่น",
      priceText: "฿3,900 / คิว",
      descText: "ถ่ายภาพโปรไฟล์ แฟชั่น หรือรูปส่วนตัวสุดชิค 📸",
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      color: "#16A085",
      portfolioUrl: `${websiteBase}/#portfolio`,
      bookingUrl: `${websiteBase}/#planner`
    }
  };

  const createBubble = (svc) => ({
    type: "bubble",
    hero: {
      type: "image",
      url: svc.imageUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
      action: {
        type: "uri",
        uri: svc.portfolioUrl
      }
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: svc.title,
          weight: "bold",
          size: "xl",
          color: svc.color
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "ประเภท",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 2
                },
                {
                  type: "text",
                  text: svc.typeText,
                  wrap: true,
                  color: "#666666",
                  size: "sm",
                  flex: 5
                }
              ]
            },
            {
              type: "box",
              layout: "baseline",
              spacing: "sm",
              contents: [
                {
                  type: "text",
                  text: "ราคาเริ่ม",
                  color: "#aaaaaa",
                  size: "sm",
                  flex: 2
                },
                {
                  type: "text",
                  text: svc.priceText,
                  wrap: true,
                  color: svc.color,
                  size: "sm",
                  flex: 5,
                  weight: "bold"
                }
              ]
            }
          ]
        },
        {
          type: "text",
          text: svc.descText,
          wrap: true,
          color: "#888888",
          size: "xs",
          margin: "md"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          height: "sm",
          action: {
            type: "uri",
            label: "ดูผลงาน (Portfolio)",
            uri: svc.portfolioUrl
          },
          color: svc.color
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "เช็คคิวว่าง / จองคิว",
            uri: svc.bookingUrl
          }
        }
      ],
      flex: 0
    }
  });

  if (category === 'all') {
    return {
      type: "flex",
      altText: "สอบถามราคาและแพ็กเกจ ShutterPixs 📸",
      contents: {
        type: "carousel",
        contents: Object.keys(services).map(key => createBubble(services[key]))
      }
    };
  }

  if (services[category]) {
    return {
      type: "flex",
      altText: `รายละเอียดแพ็กเกจ ${services[category].title} 📸`,
      contents: createBubble(services[category])
    };
  }

  return null;
}

// Helper: Map text to Flex Message response
function getFlexMessageForText(text) {
  if (!text) return null;
  // Normalize: remove spaces/hyphens, normalize double-เ to แ, convert to lowercase
  const cleanText = text.replace(/[\s\-\–]+/g, '').replace(/\u0e40\u0e40/g, '\u0e41').toLowerCase();

  // 1. งานแต่ง
  if (cleanText.includes('แต่งงาน') || cleanText.includes('wedding') || cleanText.includes('งานแต่ง') || cleanText.includes('พรีเวด')) {
    return getServiceFlexMessage('wedding');
  }

  // 2. งานบวช
  if (cleanText.includes('งานบวช') || cleanText.includes('บวช') || cleanText.includes('อุปสมบท') || cleanText.includes('ordination')) {
    return getServiceFlexMessage('ordination');
  }

  // 3. งานรับปริญญา
  if (cleanText.includes('รับปริญญา') || cleanText.includes('เรียนจบ') || cleanText.includes('graduation') || cleanText.includes('นอกรอบ')) {
    return getServiceFlexMessage('graduation');
  }

  // 4. งานอีเว้น
  if (cleanText.includes('อีเว้น') || cleanText.includes('อีเวน') || cleanText.includes('สัมมนา') || cleanText.includes('event') || cleanText.includes('ปาร์ตี้')) {
    return getServiceFlexMessage('event');
  }

  // 5. ถ่ายภาพอื่นๆ / อื่นๆ
  if (cleanText.includes('ถ่ายภาพอื่นๆ') || cleanText.includes('อื่นๆ') || cleanText.includes('portrait') || cleanText.includes('พอร์ตเทรต') || cleanText.includes('บุคคล') || cleanText.includes('โปรไฟล์')) {
    return getServiceFlexMessage('other');
  }

  // 6. สอบถาม / ราคา / แพ็กเกจ / กี่บาท / อัตราค่าบริการ
  if (cleanText === 'สอบถาม' || 
      cleanText.includes('สอบถาม') ||
      cleanText.includes('ราคา') || 
      cleanText.includes('ราขา') || 
      cleanText.includes('เท่าไร') ||
      cleanText.includes('เท่าไหร่') ||
      cleanText.includes('กี่บาท') ||
      cleanText.includes('แพ็กเกจ') || 
      cleanText.includes('แพคเกจ') || 
      cleanText.includes('เเพ็คเกจ') ||
      cleanText.includes('เเพคเกจ') ||
      cleanText.includes('อัตรา')) {
    return getServiceFlexMessage('all');
  }

  return null;
}

// Event Handler for LINE Messages
async function handleLineEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userText = event.message.text.trim();
  const replyToken = event.replyToken;

  // Pattern match for Booking ID, e.g. SP-20260622-001
  const bookingMatch = userText.match(/SP-\d{8}-\d{3}/i);

  if (bookingMatch) {
    const bookingId = bookingMatch[0].toUpperCase();
    const booking = await findBookingById(bookingId);

    if (booking) {
      const typeThaiMap = {
        wedding: 'งานแต่งงาน (Wedding)',
        ordination: 'งานบวช (Ordination)',
        graduation: 'งานรับปริญญา (Graduation)',
        other: 'งานอื่นๆ (Other events)'
      };

      const dateStr = new Date(booking.event_date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const flexMessage = {
        type: 'flex',
        altText: `ยืนยันการจอง ShutterPixs ${bookingId}`,
        contents: {
          type: 'bubble',
          styles: {
            header: { backgroundColor: '#111827' },
            body: { backgroundColor: '#1f2937' },
            footer: { backgroundColor: '#111827' }
          },
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '📸 SHUTTERPIXS', weight: 'bold', color: '#e5e7eb', size: 'sm', letterSpacing: '0.1em' },
              { type: 'text', text: 'ยืนยันรหัสการจอง', weight: 'bold', color: '#fbbf24', size: 'xl', margin: 'xs' }
            ]
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: `รหัสอ้างอิง: ${booking.id}`, color: '#9ca3af', size: 'xs', weight: 'bold' },
              { type: 'separator', margin: 'md', color: '#374151' },
              {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                spacing: 'sm',
                contents: [
                  {
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'ชื่อลูกค้า:', color: '#9ca3af', size: 'sm', flex: 2 },
                      { type: 'text', text: booking.customer_name, color: '#f3f4f6', size: 'sm', flex: 4, weight: 'bold' }
                    ]
                  },
                  {
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'เบอร์โทร:', color: '#9ca3af', size: 'sm', flex: 2 },
                      { type: 'text', text: booking.customer_phone, color: '#f3f4f6', size: 'sm', flex: 4 }
                    ]
                  },
                  {
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'ประเภทงาน:', color: '#9ca3af', size: 'sm', flex: 2 },
                      { type: 'text', text: typeThaiMap[booking.event_type] || booking.event_type, color: '#f3f4f6', size: 'sm', flex: 4, weight: 'bold' }
                    ]
                  },
                  {
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'วันที่จัดงาน:', color: '#9ca3af', size: 'sm', flex: 2 },
                      { type: 'text', text: dateStr, color: '#f3f4f6', size: 'sm', flex: 4 }
                    ]
                  },
                  {
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'แพ็กเกจ:', color: '#9ca3af', size: 'sm', flex: 2 },
                      { type: 'text', text: booking.package_name, color: '#fbbf24', size: 'sm', flex: 4, weight: 'bold' }
                    ]
                  },
                  {
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'ราคารวม:', color: '#9ca3af', size: 'sm', flex: 2 },
                      { type: 'text', text: `฿${booking.total_price.toLocaleString('th-TH')}`, color: '#10b981', size: 'base', flex: 4, weight: 'bold' }
                    ]
                  },
                  {
                    type: 'box', layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'สถานะ:', color: '#9ca3af', size: 'sm', flex: 2 },
                      {
                        type: 'text',
                        text: booking.status === 'pending' ? 'รอเจ้าหน้าที่ตรวจสอบ' : 'ยืนยันสิทธิ์แล้ว',
                        color: booking.status === 'pending' ? '#f59e0b' : '#10b981',
                        size: 'sm',
                        flex: 4,
                        weight: 'bold'
                      }
                    ]
                  }
                ]
              },
              { type: 'separator', margin: 'md', color: '#374151' },
              {
                type: 'text',
                text: 'แอดมินได้รับข้อมูลแล้ว และจะติดต่อกลับผ่านแชทนี้โดยเร็วที่สุดครับ 🙏',
                color: '#d1d5db',
                size: 'xs',
                margin: 'md',
                wrap: true
              }
            ]
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: 'ดูรายละเอียดบนหน้าเว็ป',
                  uri: `https://shutterpixs59.web.app`
                },
                style: 'primary',
                color: '#d97706'
              }
            ]
          }
        }
      };

      return lineClient.replyMessage({
        replyToken: replyToken,
        messages: [flexMessage]
      });
    } else {
      return lineClient.replyMessage({
        replyToken: replyToken,
        messages: [{
          type: 'text',
          text: `ขออภัยครับ ไม่พบข้อมูลการจองรหัส ${bookingId} ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง หรือทำรายการจองใหม่บนเว็ปไซต์หลักครับ 🙏`
        }]
      });
    }
  }

  // Check for specific keywords (สอบถาม, ราคา, เช้า-เที่ยง, เช้า-เย็น, ช่างภา)
  const keywordReplyText = getKeywordResponse(userText);
  if (keywordReplyText) {
    return lineClient.replyMessage({
      replyToken: replyToken,
      messages: [{
        type: 'text',
        text: keywordReplyText
      }]
    });
  }

  // Check for category Flex Messages (สอบถาม, งานแต่ง, งานบวช, งานรับปริญญา, งานอีเว้น, ถ่ายภาพอื่นๆ)
  const flexMessage = getFlexMessageForText(userText);
  if (flexMessage) {
    return lineClient.replyMessage({
      replyToken: replyToken,
      messages: [flexMessage]
    });
  }

  // Default welcome response (handled by Gemini AI)
  try {
    const aiReply = await aiService.generateResponse(userText);
    return lineClient.replyMessage({
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: aiReply
        }
      ]
    });
  } catch (aiErr) {
    console.error("AI reply error, falling back to static default:", aiErr.message);
    // Static Fallback
    return lineClient.replyMessage({
      replyToken: replyToken,
      messages: [
        {
          type: 'text',
          text: 'สวัสดีครับ ยินดีต้อนรับสู่ ShutterPixs 📸✨\n\nหากคุณจองบริการบนเว็ปไซต์แล้ว กรุณาส่ง "รหัสการจอง" (เช่น: SP-20260622-123) เข้ามาในแชทนี้เพื่อยืนยันคิวได้เลยครับ!\n\nหรือสอบถามข้อมูลบริการและแพ็กเกจถ่ายภาพได้เลยครับ แอดมิน AI และทีมงานยินดีให้บริการครับ 😊'
        }
      ]
    });
  }
}

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 ShutterPixs Server is running on port ${PORT}`);
  console.log(`👉 Access Local Website: http://localhost:${PORT}`);
});
