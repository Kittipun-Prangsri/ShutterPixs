const packageService = require('../services/packageService');

module.exports = {
  /**
   * ดึงข้อมูลเฉพาะแพ็คเกจที่เปิดใช้ในเวลานี้เท่านั้น (สำหรับลูกค้าทั่วไป)
   * GET /api/packages
   */
  getActivePackages: async (req, res) => {
    try {
      const activeList = await packageService.getActivePackages();
      return res.status(200).json(activeList);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'ไม่สามารถดึงข้อมูลแพ็คเกจแอคทีฟได้',
        details: error.message
      });
    }
  },

  /**
   * ดึงข้อมูลแพ็คเกจทั้งหมด รวมถึงแพ็คเกจที่ปิดใช้งาน/หมดช่วงโปรโมชั่น (สำหรับหน้า Admin CMS)
   * GET /api/admin/packages
   */
  getAllPackages: async (req, res) => {
    try {
      const allList = await packageService.getAllPackages();
      return res.status(200).json(allList);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'ไม่สามารถดึงข้อมูลรายการแพ็คเกจหลังบ้านได้',
        details: error.message
      });
    }
  },

  /**
   * ดึงแพ็คเกจรายตัว
   * GET /api/admin/packages/:id หรือ GET /api/packages/:id
   */
  getPackageById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await packageService.getPackageById(id);
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
   * สร้างแพ็คเกจราคาใหม่ (Admin Only)
   * POST /api/admin/packages
   */
  createPackage: async (req, res) => {
    try {
      const { name, price } = req.body;
      
      if (!name || price === undefined) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'จำเป็นต้องระบุชื่อของแพ็คเกจ (name) และราคา (price) ใน request body'
        });
      }

      const result = await packageService.createPackage(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'ไม่สามารถบันทึกข้อมูลแพ็คเกจได้',
        details: error.message
      });
    }
  },

  /**
   * แก้ไขแพ็คเกจราคา (Admin Only)
   * PUT /api/admin/packages/:id
   */
  updatePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price } = req.body;

      if (!name || price === undefined) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'จำเป็นต้องระบุชื่อของแพ็คเกจ (name) และราคา (price) ใน request body'
        });
      }

      const result = await packageService.updatePackage(id, req.body);
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
   * ลบแพ็คเกจราคา (Admin Only)
   * DELETE /api/admin/packages/:id
   */
  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await packageService.deletePackage(id);
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
