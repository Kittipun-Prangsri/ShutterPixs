const imageService = require('../services/imageService');

module.exports = {
  /**
   * สร้างลิงก์สำหรับการอัปโหลดรูปภาพด้วยสิทธิ์ Signed URL
   * GET /api/admin/images/signed-url
   */
  getUploadSignedUrl: async (req, res) => {
    try {
      const { fileName, contentType } = req.query;
      
      if (!fileName) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'จำเป็นต้องส่งค่าชื่อไฟล์ (fileName) ใน query parameters'
        });
      }

      const result = await imageService.generateUploadSignedUrl(fileName, contentType);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'ไม่สามารถสร้าง signed URL สำหรับอัปโหลดได้',
        details: error.message
      });
    }
  },

  /**
   * บันทึกข้อมูล Metadata ของรูปภาพที่อัปโหลดสำเร็จแล้ว
   * POST /api/admin/images
   */
  createMetadata: async (req, res) => {
    try {
      const { name, url } = req.body;
      
      if (!name || !url) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'จำเป็นต้องระบุชื่อของรูปภาพ (name) และที่อยู่ไฟล์ภาพ (url) ใน request body'
        });
      }

      const result = await imageService.createImageMetadata(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'ไม่สามารถบันทึกข้อมูล metadata ของรูปภาพได้',
        details: error.message
      });
    }
  },

  /**
   * ดึงรายการรูปภาพและข้อมูล metadata แบบแบ่งหน้า (Pagination)
   * GET /api/admin/images หรือ GET /api/images (สาธารณะ)
   */
  getMetadataList: async (req, res) => {
    try {
      const { limit = 10, cursor = null, category = null } = req.query;
      
      const result = await imageService.getImageMetadataList(limit, cursor, category);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'ไม่สามารถดึงข้อมูลรายการรูปภาพได้',
        details: error.message
      });
    }
  },

  /**
   * ดึงรายละเอียดรูปภาพรายอัน
   * GET /api/admin/images/:id
   */
  getMetadataById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await imageService.getImageMetadataById(id);
      return res.status(200).json(result);
    } catch (error) {
      const status = error.message.includes('ไม่พบ') ? 404 : 500;
      return res.status(status).json({
        error: status === 404 ? 'Not Found' : 'Internal Server Error',
        message: error.message
      });
    }
  },

  /**
   * อัปเดตข้อมูลภาพ
   * PUT /api/admin/images/:id
   */
  updateMetadata: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await imageService.updateImageMetadata(id, req.body);
      return res.status(200).json(result);
    } catch (error) {
      const status = error.message.includes('ไม่พบ') ? 404 : 500;
      return res.status(status).json({
        error: status === 404 ? 'Not Found' : 'Internal Server Error',
        message: error.message
      });
    }
  },

  /**
   * ลบภาพ
   * DELETE /api/admin/images/:id
   */
  deleteMetadata: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await imageService.deleteImageMetadata(id);
      return res.status(200).json(result);
    } catch (error) {
      const status = error.message.includes('ไม่พบ') ? 404 : 500;
      return res.status(status).json({
        error: status === 404 ? 'Not Found' : 'Internal Server Error',
        message: error.message
      });
    }
  }
};
