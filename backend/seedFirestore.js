require('dotenv').config();
const { db } = require('./config/firebase');

const initialBookings = [
  {
    customer_name: 'คุณมงคล สุขศรี',
    customer_phone: '0812345678',
    customer_line_id: 'mongkol_line',
    event_type: 'wedding',
    event_date: '2026-10-12',
    package_name: 'Wedding Standard',
    total_price: 15000,
    status: 'pending',
    details: 'ต้องการเน้นถ่ายแสงธรรมชาติช่วงบ่าย',
    created_at: new Date().toISOString()
  },
  {
    customer_name: 'คุณชลิตา วงศ์ดี',
    customer_phone: '0898765432',
    customer_line_id: 'chalita_w',
    event_type: 'graduation',
    event_date: '2026-07-20',
    package_name: 'Graduation Half Day',
    total_price: 3500,
    status: 'confirmed',
    details: 'ถ่ายเดี่ยวและถ่ายกับกลุ่มเพื่อนที่คณะ',
    created_at: new Date().toISOString()
  }
];

const initialPackages = [
  {
    name: 'Wedding Standard',
    price: 15000,
    description: '4 hours photoshoot, 1 main photographer, all digital files color-graded',
    is_seasonal: false,
    start_date: null,
    end_date: null,
    created_at: new Date().toISOString()
  },
  {
    name: 'Rainy Season Special Promo',
    price: 12000,
    description: 'Special rainy season wedding portrait discount package',
    is_seasonal: true,
    start_date: '2026-06-01',
    end_date: '2026-08-31',
    created_at: new Date().toISOString()
  },
  {
    name: 'Winter Wonderland Premium Wedding',
    price: 25000,
    description: 'High-end package with studio props and lighting for winter pre-weddings',
    is_seasonal: true,
    start_date: '2026-11-01',
    end_date: '2026-12-31',
    created_at: new Date().toISOString()
  }
];

const initialPortfolios = [
  {
    title: "Eternal Love at The Glasshouse",
    name: "Eternal Love at The Glasshouse",
    category: "wedding",
    image_url: "assets/images/wedding_1.jpg",
    url: "assets/images/wedding_1.jpg",
    description: "Modern romantic garden wedding photoshoot featuring natural light and candid moments.",
    created_at: new Date().toISOString()
  },
  {
    title: "Traditional Thai Blessed Union",
    name: "Traditional Thai Blessed Union",
    category: "wedding",
    image_url: "assets/images/wedding_2.jpg",
    url: "assets/images/wedding_2.jpg",
    description: "Elegant traditional Thai wedding ceremony capturing the exquisite details of Thai attire and sacred water pouring ritual.",
    created_at: new Date().toISOString()
  },
  {
    title: "Pristine Ordination Ceremony",
    name: "Pristine Ordination Ceremony",
    category: "ordination",
    image_url: "assets/images/ordination_1.jpg",
    url: "assets/images/ordination_1.jpg",
    description: "Shaving ritual and serene ordination ceremony at the historic Wat Phra Kaew, capturing local cultural legacy.",
    created_at: new Date().toISOString()
  },
  {
    title: "Path to Enlightenment",
    name: "Path to Enlightenment",
    category: "ordination",
    image_url: "assets/images/ordination_2.jpg",
    url: "assets/images/ordination_2.jpg",
    description: "The sacred moments of a monk walking around the chapel, surrounded by joyful family and friends.",
    created_at: new Date().toISOString()
  },
  {
    title: "Proud Achievements at Chulalongkorn",
    name: "Proud Achievements at Chulalongkorn",
    category: "graduation",
    image_url: "assets/images/graduation_1.jpg",
    url: "assets/images/graduation_1.jpg",
    description: "Joyful graduation outdoor portrait photoshoot with iconic campus backdrops and premium color grading.",
    created_at: new Date().toISOString()
  },
  {
    title: "Milestone Reached!",
    name: "Milestone Reached!",
    category: "graduation",
    image_url: "assets/images/graduation_2.jpg",
    url: "assets/images/graduation_2.jpg",
    description: "Group graduation photography capturing genuine smiles, mortarboard tosses, and bright memories with close friends.",
    created_at: new Date().toISOString()
  },
  {
    title: "Minimalist Studio Portraiture",
    name: "Minimalist Studio Portraiture",
    category: "other",
    image_url: "assets/images/other_1.jpg",
    url: "assets/images/other_1.jpg",
    description: "High-end studio profile shoots highlighting personal branding, professional lighting, and editorial styles.",
    created_at: new Date().toISOString()
  },
  {
    title: "Sunset Beach Couple Session",
    name: "Sunset Beach Couple Session",
    category: "other",
    image_url: "assets/images/other_2.jpg",
    url: "assets/images/other_2.jpg",
    description: "Cinematic pre-wedding style couple photoshoot during the golden hour on the white sands of Phuket.",
    created_at: new Date().toISOString()
  }
];

async function seed() {
  console.log('🌱 Starting database seeding to Firestore...');

  try {
    // 1. Seed Bookings
    console.log('⏳ Seeding bookings...');
    for (let i = 0; i < initialBookings.length; i++) {
      const id = `SP-20260622-10${i + 1}`;
      await db.collection('bookings').doc(id).set(initialBookings[i]);
      console.log(`✅ Seeded booking: ${id}`);
    }

    // 2. Seed Packages
    console.log('⏳ Seeding packages...');
    for (let i = 0; i < initialPackages.length; i++) {
      const id = `pkg${i + 1}`;
      await db.collection('packages').doc(id).set(initialPackages[i]);
      console.log(`✅ Seeded package: ${id}`);
    }

    // 3. Seed Portfolios
    console.log('⏳ Seeding portfolios...');
    for (let i = 0; i < initialPortfolios.length; i++) {
      const id = `p${i + 1}`;
      await db.collection('portfolios').doc(id).set(initialPortfolios[i]);
      console.log(`✅ Seeded portfolio: ${id}`);
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
