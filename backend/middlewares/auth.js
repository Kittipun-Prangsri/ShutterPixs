const { admin, useFirebaseMock } = require('../config/firebase');

/**
 * Middleware สำหรับการตรวจสอบสิทธิ์ Admin โดยใช้ Firebase ID Token
 */
const adminAuth = async (req, res, next) => {
  // ตรวจสอบเฉพาะเมธอดที่มีการเปลี่ยนแปลงข้อมูล (POST, PUT, DELETE)
  const isWriteMethod = ['POST', 'PUT', 'DELETE'].includes(req.method);
  
  if (!isWriteMethod) {
    return next(); // หากไม่ใช่การเขียนข้อมูล อนุญาตให้ผ่านไปยัง Route ถัดไป
  }

  // ดึง Token จาก Authorization Header (รูปแบบ Bearer <Token>)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // ในโหมด Mock หากไม่มี Token หรือเป็น Token จำลองเพื่อทดสอบให้ผ่านได้
    if (useFirebaseMock) {
      console.log('⚠️ [Mock Auth] Bypassing authorization check in MOCK mode.');
      req.user = { uid: 'mock-admin-uid', email: 'admin@shutterpixs.com', role: 'admin' };
      return next();
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'จำเป็นต้องระบุ Firebase ID Token ในรูปแบบ Authorization: Bearer <Token>'
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // ในโหมด Mock สามารถใช้ token พิเศษ "mock-admin-token" ในการข้ามระบบจริงได้
    if (useFirebaseMock && idToken === 'mock-admin-token') {
      req.user = { uid: 'mock-admin-uid', email: 'admin@shutterpixs.com', role: 'admin' };
      return next();
    }

    if (useFirebaseMock) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'ระบบรันอยู่ในโหมดจำลอง (Mock Mode) กรุณาใช้ "mock-admin-token" สำหรับการทดสอบเขียนข้อมูล'
      });
    }

    // ทำการตรวจสอบ ID Token จริงกับ Firebase Auth
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // ตั้งค่าข้อมูลผู้ใช้เข้า Request
    req.user = decodedToken;
    
    // สามารถเพิ่มสิทธิ์ตรวจสอบความสิทธิ์ Custom Claim เช่น admin: true
    // if (!decodedToken.admin) {
    //   return res.status(403).json({ error: 'Forbidden', message: 'คุณไม่มีสิทธิ์เป็น Admin' });
    // }
    
    next();
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    res.status(403).json({
      error: 'Forbidden',
      message: 'ID Token ไม่ถูกต้อง หรือหมดอายุแล้ว',
      details: error.message
    });
  }
};

module.exports = adminAuth;
