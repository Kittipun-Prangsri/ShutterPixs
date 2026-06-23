const { db, useFirebaseMock } = require('../config/firebase');

// จำลองคิวการจองสำหรับโหมดทดสอบ (ดึงค่าเริ่มต้นและแชร์กับ mockBookings ใน server.js)
let mockBookings = [
  {
    id: 'SP-20260622-101',
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
    id: 'SP-20260622-102',
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

module.exports = {
  // ฟังก์ชันดึงค่า mockBookings ไปแบ่งปัน
  getMockBookings: () => mockBookings,

  /**
   * ดึงข้อมูลการจองคิวทั้งหมดเรียงลำดับตามวันที่สร้างล่าสุด
   */
  getAllBookings: async () => {
    if (useFirebaseMock || !db) {
      return mockBookings;
    }

    try {
      const snapshot = await db.collection('bookings').orderBy('created_at', 'desc').get();
      const list = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });

      // หาก Firestore ว่างเปล่า ให้ส่งค่า mock ไปเพื่อไม่ให้หน้าต่างแอดมินดูว่างเปล่าเกินไป
      if (list.length === 0) return mockBookings;
      
      return list;
    } catch (error) {
      console.error('Error fetching bookings from Firestore:', error.message);
      // Fallback
      return mockBookings;
    }
  },

  /**
   * อัปเดตข้อมูลการจองคิวทั้งหมดหรือบางฟิลด์
   */
  updateBooking: async (id, updateData) => {
    if (updateData.status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatuses.includes(updateData.status)) {
        throw new Error('สถานะการจองไม่ถูกต้อง');
      }
    }

    if (useFirebaseMock || !db) {
      const booking = mockBookings.find(b => b.id === id);
      if (!booking) {
        throw new Error('ไม่พบข้อมูลการจองคิวที่ระบุ');
      }
      Object.assign(booking, updateData);
      booking.updated_at = new Date().toISOString();
      return booking;
    }

    try {
      const docRef = db.collection('bookings').doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        // หากไม่มีใน Firestore ให้ลองหาและอัปเดตใน mockBookings
        const booking = mockBookings.find(b => b.id === id);
        if (booking) {
          Object.assign(booking, updateData);
          return booking;
        }
        throw new Error('ไม่พบข้อมูลการจองคิวที่ระบุ');
      }

      const cleanUpdateData = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // ลบฟิลด์ id หากติดมา เพื่อป้องกันความผิดพลาดใน Firestore
      delete cleanUpdateData.id;

      await docRef.update(cleanUpdateData);
      return { id, ...doc.data(), ...cleanUpdateData };
    } catch (error) {
      throw new Error(`ไม่สามารถอัปเดตข้อมูลการจองคิวได้: ${error.message}`);
    }
  },

  /**
   * ลบการจองคิว
   */
  deleteBooking: async (id) => {
    if (useFirebaseMock || !db) {
      const index = mockBookings.findIndex(b => b.id === id);
      if (index === -1) {
        throw new Error('ไม่พบข้อมูลการจองคิวที่ระบุ');
      }
      mockBookings.splice(index, 1);
      return { success: true, id };
    }

    try {
      const docRef = db.collection('bookings').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        const index = mockBookings.findIndex(b => b.id === id);
        if (index !== -1) {
          mockBookings.splice(index, 1);
          return { success: true, id };
        }
        throw new Error('ไม่พบข้อมูลการจองคิวที่ระบุ');
      }
      await docRef.delete();
      return { success: true, id };
    } catch (error) {
      throw new Error(`ไม่สามารถลบข้อมูลการจองคิวได้: ${error.message}`);
    }
  }
};
