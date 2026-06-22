const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const adminAuth = require('../middlewares/auth');

// ==========================================
// เส้นทางสาธารณะ (Public Endpoints)
// ==========================================

// ลูกค้าทั่วไปดึงข้อมูลเฉพาะแพ็คเกจที่แอคทีฟอยู่ (ฟังก์ชันนี้ใช้ Caching ประสิทธิภาพสูง)
router.get('/packages', packageController.getActivePackages);

// ==========================================
// เส้นทางสำหรับผู้บริหารระบบ (Admin CMS Endpoints - ถูกป้องกันด้วย Middleware)
// ==========================================

// ดึงรายการแพ็คเกจทั้งหมด (รวมโปรโมชั่นที่หมดอายุ/ปิดใช้งาน เพื่อให้แอดมินจัดการได้)
router.get('/admin/packages', adminAuth, packageController.getAllPackages);

// ดึงรายละเอียดแพ็คเกจเดี่ยว
router.get('/admin/packages/:id', adminAuth, packageController.getPackageById);

// เพิ่มแพ็คเกจใหม่
router.post('/admin/packages', adminAuth, packageController.createPackage);

// แก้ไขแพ็คเกจเดิม
router.put('/admin/packages/:id', adminAuth, packageController.updatePackage);

// ลบแพ็คเกจ
router.delete('/admin/packages/:id', adminAuth, packageController.deletePackage);

module.exports = router;
