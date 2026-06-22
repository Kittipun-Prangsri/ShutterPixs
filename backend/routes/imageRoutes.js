const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const adminAuth = require('../middlewares/auth');

// ==========================================
// เส้นทางสาธารณะ (Public Endpoints)
// ==========================================

// ลูกค้าดึงภาพทั้งหมดของช่างภาพไปแสดงที่หน้า Portfolio (รองรับ Pagination และการฟิลเตอร์หมวดหมู่)
router.get('/images', imageController.getMetadataList);

// ==========================================
// เส้นทางสำหรับผู้บริหารระบบ (Admin CMS Endpoints - ถูกป้องกันด้วย Middleware)
// ==========================================

// ดึง Signed URL สำหรับให้ Admin อัปโหลดภาพตรงเข้า Firebase Storage (GET แต่เป็นฟังก์ชันแอดมินจึงควรป้องกันไว้)
router.get('/admin/images/signed-url', adminAuth, imageController.getUploadSignedUrl);

// บันทึกข้อมูล Metadata ลงฐานข้อมูลหลังจากอัปโหลดเสร็จสิ้น
router.post('/admin/images', adminAuth, imageController.createMetadata);

// ดึงรายละเอียดรูปภาพรายรายการ
router.get('/admin/images/:id', adminAuth, imageController.getMetadataById);

// อัปเดตข้อมูลรายละเอียดหรือหมวดหมู่รูปภาพ
router.put('/admin/images/:id', adminAuth, imageController.updateMetadata);

// ลบรูปภาพ (ออกเฉพาะ Metadata ใน DB หรือพัฒนาต่อยอดเพื่อลบไฟล์ใน Storage ด้วย)
router.delete('/admin/images/:id', adminAuth, imageController.deleteMetadata);

// Mock Upload สำหรับการทดสอบอัปโหลดรูปภาพตรงโดยไม่ต้องต่อ Firebase Storage จริง
router.post('/mock-upload/*', (req, res) => {
  console.log(`📸 [Mock Storage] Received mock upload for file: ${req.url}`);
  res.status(200).json({ success: true, url: req.url, message: 'Mock upload successful' });
});

module.exports = router;
