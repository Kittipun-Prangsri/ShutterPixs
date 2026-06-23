const bookingService = require('../services/bookingService');

module.exports = {
  /**
   * ดึงรายการคิวการจองทั้งหมด (Admin Only)
   * GET /api/admin/bookings
   */
  getAllBookings: async (req, res) => {
    try {
      const list = await bookingService.getAllBookings();
      return res.status(200).json(list);
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'ไม่สามารถดึงข้อมูลรายการจองทั้งหมดได้',
        details: error.message
      });
    }
  },

  /**
   * อัปเดตข้อมูลการจองคิว (Admin Only)
   * PUT /api/admin/bookings/:id
   */
  updateBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'จำเป็นต้องส่งข้อมูลที่ต้องการแก้ไขใน request body'
        });
      }

      const result = await bookingService.updateBooking(id, updateData);
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
   * ลบรายการคิวการจอง (Admin Only)
   * DELETE /api/admin/bookings/:id
   */
  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await bookingService.deleteBooking(id);
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
