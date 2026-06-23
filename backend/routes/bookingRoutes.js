const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const adminAuth = require('../middlewares/auth');

// ==========================================
// เส้นทางสำหรับผู้บริหารระบบ (Admin CMS Endpoints - ถูกป้องกันด้วย Middleware)
// ==========================================

// ดึงรายการประวัติการจองคิวลูกค้าทั้งหมด
router.get('/admin/bookings', adminAuth, bookingController.getAllBookings);

// ปรับปรุงข้อมูลหรือสถานะการจองคิวลูกค้า (เช่น เปลี่ยนสถานะ หรือแก้ไขข้อมูลลูกค้า/วันที่)
router.put('/admin/bookings/:id', adminAuth, bookingController.updateBooking);

// ลบรายการจองคิวลูกค้า
router.delete('/admin/bookings/:id', adminAuth, bookingController.deleteBooking);

module.exports = router;
