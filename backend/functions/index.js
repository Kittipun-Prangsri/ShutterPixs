/**
 * Firebase Cloud Functions (v2) สำหรับระบบ ShutterPixs Image Processing
 * ทำงานอัตโนมัติเมื่อมีการอัปโหลดรูปภาพใหม่เข้าสู่ Firebase Storage
 * เพื่อทำการลดขนาดภาพและแปลงนามสกุลไฟล์เป็น .webp (High Performance)
 */

const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const sharp = require('sharp');
const path = require('path');
const os = require('os');
const fs = require('fs');

// เริ่มทำงาน Firebase Admin ภายใน Functions
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * ฟังก์ชันประมวลผลรูปภาพอัตโนมัติ (Optimize & Convert to WebP)
 * ทำงานเมื่อมีการอัปโหลดไฟล์เข้ามาที่โฟลเดอร์ portfolios/ สำเร็จ
 */
exports.optimizeAndConvertToWebP = onObjectFinalized({
  cpu: 2, // ต้องการ CPU และ Memory สูงขึ้นเล็กน้อยสำหรับการประมวลผลภาพ (sharp)
  memory: '1GiB',
  timeoutSeconds: 300
}, async (event) => {
  const fileBucket = event.data.bucket; // ชื่อ bucket ของ storage
  const filePath = event.data.name;     // ตำแหน่งไฟล์เต็ม เช่น portfolios/1719000_raw.jpg
  const contentType = event.data.contentType; // ชนิดของไฟล์ เช่น image/jpeg

  // 1. ตรวจสอบว่าไฟล์เป็นรูปภาพและอยู่ในโฟลเดอร์ portfolios/ หรือไม่
  if (!contentType.startsWith('image/')) {
    logger.log('🚫 ไฟล์นี้ไม่ใช่รูปภาพ ข้ามการประมวลผล');
    return null;
  }

  if (!filePath.startsWith('portfolios/')) {
    logger.log('🚫 ไฟล์นี้ไม่ได้อยู่ในโฟลเดอร์ portfolios/ ข้ามการประมวลผล');
    return null;
  }

  // ป้องกันการทำงานซ้ำแบบ Loop (ฟังก์ชันรันซ้ำเมื่ออัปโหลดไฟล์ webp ที่แปลงแล้วเข้า storage ตัวเอง)
  const fileName = path.basename(filePath);
  if (fileName.endsWith('.webp')) {
    logger.log('🔄 ไฟล์นี้เป็น .webp อยู่แล้ว ข้ามการทำงานเพื่อป้องกัน Loop');
    return null;
  }

  const bucket = admin.storage().bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  const webpFileName = `${path.parse(fileName).name}.webp`;
  const tempWebpPath = path.join(os.tmpdir(), webpFileName);
  const targetStoragePath = path.join(path.dirname(filePath), webpFileName);

  try {
    // 2. ดาวน์โหลดรูปภาพต้นฉบับลงพื้นที่จำลอง (Temp) ของ Cloud Functions
    await bucket.file(filePath).download({ destination: tempFilePath });
    logger.log(`📥 ดาวน์โหลดรูปภาพ ${fileName} ลงเครื่องทดสอบสำเร็จ`);

    // 3. เริ่มกระบวนการแปลงไฟล์เป็น WebP และปรับขนาดให้เหมาะกับเว็บไซต์ด้วย Sharp
    // บีบอัดลงเหลือ 80% (คุณภาพดีเยี่ยมขนาดเล็กลง 70%) และกำหนดขนาดกว้างสูงสุด 1920px (Responsive)
    await sharp(tempFilePath)
      .resize({ width: 1920, withoutEnlargement: true }) // ป้องกันภาพขยายเกินขนาดจริง
      .webp({ quality: 80 }) // แปลงเป็น WebP คุณภาพ 80%
      .toFile(tempWebpPath);

    logger.log(`⚡ ทำการบีบอัดและแปลงรูปภาพเป็น WebP สำเร็จที่ ${webpFileName}`);

    // 4. อัปโหลดไฟล์รูปภาพ WebP ใหม่กลับไปยัง Firebase Storage
    await bucket.upload(tempWebpPath, {
      destination: targetStoragePath,
      metadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000', // กำหนด CDN Caching 1 ปี
      }
    });
    logger.log(`📤 อัปโหลดไฟล์ WebP ขึ้น Storage สำเร็จ: ${targetStoragePath}`);

    // 5. อัปเดต public url ของภาพ WebP ล่าสุดลงในคอลเลกชัน portfolios บน Firestore (Optional)
    const publicWebpUrl = `https://storage.googleapis.com/${fileBucket}/${targetStoragePath}`;
    const db = admin.firestore();
    const portfoliosRef = db.collection('portfolios');
    
    // ค้นหาเอกสาร metadata ที่มี URL ต้นฉบับ และอัปเดตเป็น WebP URL แทน
    // (ใช้สำหรับแอปพลิเคชันที่ต้องการประหยัดแบนด์วิดท์หน้าบ้านสูงสุด)
    const originalPublicUrl = `https://storage.googleapis.com/${fileBucket}/${filePath}`;
    const querySnapshot = await portfoliosRef.where('url', '==', originalPublicUrl).get();
    
    if (!querySnapshot.empty) {
      const batch = db.batch();
      querySnapshot.forEach(doc => {
        batch.update(doc.ref, { 
          url: publicWebpUrl,
          original_url: originalPublicUrl, // สำรองไฟล์เดิมไว้
          optimized: true 
        });
      });
      await batch.commit();
      logger.log(`📝 อัปเดต URL รูปภาพ WebP ในเอกสารคอลเลกชัน Firestore สำเร็จ`);
    }

    // 6. ลบไฟล์ภาพต้นฉบับ (ดิบ) ออกจาก Storage เพื่อลดค่าใช้จ่ายจัดเก็บ (Optional)
    // await bucket.file(filePath).delete();
    // logger.log(`🗑️ ลบรูปภาพดิบออกจาก Storage สำเร็จ`);

  } catch (error) {
    logger.error('❌ เกิดข้อผิดพลาดในการประมวลผลภาพ:', error);
  } finally {
    // 7. เคลียร์พื้นที่ไฟล์ชั่วคราวในเซิร์ฟเวอร์ Cloud Functions เสมอ
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (fs.existsSync(tempWebpPath)) fs.unlinkSync(tempWebpPath);
  }
  
  return null;
});
