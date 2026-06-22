const { db, useFirebaseMock } = require('../config/firebase');
const cacheService = require('./cacheService');

// จำลองคลังข้อมูลแพ็คเกจเริ่มต้นสำหรับการรันโหมดจำลอง (Mock Mode)
let mockPackages = [
  {
    id: 'pkg1',
    name: 'Wedding Standard',
    price: 15000,
    description: '4 hours photoshoot, 1 main photographer, all digital files color-graded',
    is_seasonal: false,
    start_date: null,
    end_date: null,
    created_at: new Date().toISOString()
  },
  {
    id: 'pkg2',
    name: 'Rainy Season Special Promo',
    price: 12000,
    description: 'Special rainy season wedding portrait discount package',
    is_seasonal: true,
    start_date: '2026-06-01',
    end_date: '2026-08-31', // ยังอยู่ในช่วงเวลาปัจจุบัน ณ ปี 2026
    created_at: new Date().toISOString()
  },
  {
    id: 'pkg3',
    name: 'Winter Wonderland Premium Wedding',
    price: 25000,
    description: 'High-end package with studio props and lighting for winter pre-weddings',
    is_seasonal: true,
    start_date: '2026-11-01',
    end_date: '2026-12-31', // หมดช่วงเวลาปัจจุบัน
    created_at: new Date().toISOString()
  }
];

/**
 * ล้างแคชรายการแพ็คเกจแอคทีฟ (Cache Invalidation)
 */
const invalidateActivePackagesCache = () => {
  cacheService.delete(cacheService.KEYS.ACTIVE_PACKAGES);
  console.log('🔄 [Cache Invalidation] Active packages list cache deleted.');
};

module.exports = {
  /**
   * ดึงข้อมูลแพ็คเกจที่มีผลบังคับใช้ (Active Packages) ที่ผ่านการกรองตามช่วงเวลา
   * ฟังก์ชันนี้ครอบด้วย High-Performance In-Memory Cache เพื่อลดภาระการคิวรี่ไปยังฐานข้อมูล
   */
  getActivePackages: async () => {
    // 1. ตรวจสอบข้อมูลในแคชก่อน
    const cachedData = cacheService.get(cacheService.KEYS.ACTIVE_PACKAGES);
    if (cachedData) {
      console.log('⚡ [Cache Hit] Serving active packages from memory cache.');
      return cachedData;
    }

    console.log('🔌 [Cache Miss] Fetching active packages from database.');
    let allPackages = [];

    // ดึงข้อมูลดิบจาก Firebase หรือ Mock
    if (useFirebaseMock || !db) {
      allPackages = [...mockPackages];
    } else {
      try {
        const snapshot = await db.collection('packages').get();
        snapshot.forEach(doc => {
          allPackages.push({ id: doc.id, ...doc.data() });
        });
      } catch (error) {
        console.error('Error fetching packages from Firestore:', error.message);
        throw new Error(`ไม่สามารถดึงข้อมูลแพ็คเกจได้: ${error.message}`);
      }
    }

    // 2. ลอจิกการกรองเอาเฉพาะแพ็คเกจที่ใช้งานได้ ณ วันเวลาปัจจุบัน
    const now = new Date();
    const activePackages = allPackages.filter(pkg => {
      // หากไม่ใช่แพ็คเกจตามฤดูกาล ให้ถือว่าใช้งานได้ตลอดเวลา
      if (!pkg.is_seasonal) {
        return true;
      }
      
      // กรณีไม่มีกำหนดการระบุแม้จะระบุว่าเป็น seasonal ให้ปล่อยผ่าน
      if (!pkg.start_date || !pkg.end_date) {
        return true;
      }

      const start = new Date(pkg.start_date);
      const end = new Date(pkg.end_date);
      
      // ปรับเวลาสิ้นสุดให้เป็นปลายวัน (23:59:59.999) เพื่อความครอบคลุม
      end.setHours(23, 59, 59, 999);

      // ตรวจสอบว่าวันที่ปัจจุบันอยู่ภายในช่วงโปรโมชั่นฤดูกาลหรือไม่
      return now >= start && now <= end;
    });

    // 3. บันทึกข้อมูลที่คัดกรองลงหน่วยความจำแคช (TTL เริ่มต้น 1 ชั่วโมง)
    cacheService.set(cacheService.KEYS.ACTIVE_PACKAGES, activePackages);

    return activePackages;
  },

  /**
   * ดึงแพ็คเกจทั้งหมด (รวมถึงแพ็คเกจที่หมดช่วงเวลาแล้ว เพื่อแอดมินจัดการหลังบ้าน)
   */
  getAllPackages: async () => {
    if (useFirebaseMock || !db) {
      return mockPackages;
    }

    try {
      const snapshot = await db.collection('packages').orderBy('created_at', 'desc').get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } catch (error) {
      throw new Error(`ไม่สามารถดึงข้อมูลแพ็คเกจทั้งหมดได้: ${error.message}`);
    }
  },

  /**
   * ดึงข้อมูลแพ็คเกจรายอัน
   */
  getPackageById: async (id) => {
    if (useFirebaseMock || !db) {
      const record = mockPackages.find(pkg => pkg.id === id);
      if (!record) throw new Error('ไม่พบแพ็คเกจที่ต้องการ');
      return record;
    }

    try {
      const doc = await db.collection('packages').doc(id).get();
      if (!doc.exists) {
        throw new Error('ไม่พบแพ็คเกจที่ต้องการ');
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw new Error(`ไม่สามารถค้นหาข้อมูลแพ็คเกจได้: ${error.message}`);
    }
  },

  /**
   * เพิ่มแพ็คเกจใหม่ลงฐานข้อมูล และล้างแคชเพื่อให้แสดงผลข้อมูลล่าสุดทันที
   */
  createPackage: async (data) => {
    const newPackage = {
      name: data.name,
      price: Number(data.price),
      description: data.description || '',
      is_seasonal: !!data.is_seasonal,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      created_at: new Date().toISOString()
    };

    let result;
    if (useFirebaseMock || !db) {
      const id = 'pkg_' + Math.random().toString(36).substr(2, 9);
      result = { id, ...newPackage };
      mockPackages.push(result);
    } else {
      try {
        const docRef = await db.collection('packages').add(newPackage);
        result = { id: docRef.id, ...newPackage };
      } catch (error) {
        console.error('Error creating package in Firestore:', error.message);
        throw new Error(`ไม่สามารถสร้างแพ็คเกจได้: ${error.message}`);
      }
    }

    // ดำเนินการล้างแคชรายการแพ็คเกจ (Cache Invalidation) ทันที
    invalidateActivePackagesCache();
    return result;
  },

  /**
   * อัปเดตข้อมูลแพ็คเกจ และล้างแคชรายการแพ็คเกจ
   */
  updatePackage: async (id, data) => {
    const updateData = {
      name: data.name,
      price: Number(data.price),
      description: data.description,
      is_seasonal: !!data.is_seasonal,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (useFirebaseMock || !db) {
      const index = mockPackages.findIndex(pkg => pkg.id === id);
      if (index === -1) throw new Error('ไม่พบแพ็คเกจที่ต้องการแก้ไข');
      
      mockPackages[index] = { ...mockPackages[index], ...updateData };
      result = mockPackages[index];
    } else {
      try {
        const docRef = db.collection('packages').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
          throw new Error('ไม่พบแพ็คเกจที่ต้องการแก้ไข');
        }
        await docRef.update(updateData);
        result = { id, ...doc.data(), ...updateData };
      } catch (error) {
        console.error('Error updating package in Firestore:', error.message);
        throw new Error(`ไม่สามารถแก้ไขแพ็คเกจได้: ${error.message}`);
      }
    }

    // ดำเนินการล้างแคชรายการแพ็คเกจ (Cache Invalidation) ทันที
    invalidateActivePackagesCache();
    return result;
  },

  /**
   * ลบแพ็คเกจออก และล้างแคชรายการแพ็คเกจ
   */
  deletePackage: async (id) => {
    if (useFirebaseMock || !db) {
      const index = mockPackages.findIndex(pkg => pkg.id === id);
      if (index === -1) throw new Error('ไม่พบแพ็คเกจที่ต้องการลบ');
      mockPackages.splice(index, 1);
    } else {
      try {
        const docRef = db.collection('packages').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
          throw new Error('ไม่พบแพ็คเกจที่ต้องการลบ');
        }
        await docRef.delete();
      } catch (error) {
        console.error('Error deleting package in Firestore:', error.message);
        throw new Error(`ไม่สามารถลบแพ็คเกจได้: ${error.message}`);
      }
    }

    // ดำเนินการล้างแคชรายการแพ็คเกจ (Cache Invalidation) ทันที
    invalidateActivePackagesCache();
    return { success: true, id };
  }
};
