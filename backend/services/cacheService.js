const NodeCache = require('node-cache');

// สร้าง Cache Instance กำหนดเวลาจัดเก็บเริ่มต้น 1 ชั่วโมง (3600 วินาที)
// และลบข้อมูลที่หมดอายุอัตโนมัติทุกๆ 120 วินาที
const appCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 120
});

module.exports = {
  /**
   * ดึงค่าจากแคช
   * @param {string} key 
   */
  get: (key) => {
    return appCache.get(key);
  },

  /**
   * บันทึกข้อมูลลงแคช
   * @param {string} key 
   * @param {any} value 
   * @param {number} [ttl] - เวลาที่ต้องการจัดเก็บ (วินาที)
   */
  set: (key, value, ttl) => {
    if (ttl) {
      return appCache.set(key, value, ttl);
    }
    return appCache.set(key, value);
  },

  /**
   * ลบข้อมูลในแคชรายคีย์ (Cache Invalidation)
   * @param {string} key 
   */
  delete: (key) => {
    return appCache.del(key);
  },

  /**
   * ล้างแคชทั้งหมด
   */
  clearAll: () => {
    return appCache.flushAll();
  },

  // นิยามคีย์ที่ใช้ภายในโปรเจกต์ป้องกันข้อผิดพลาดการพิมพ์คีย์ผิด
  KEYS: {
    ACTIVE_PACKAGES: 'active_packages_list'
  }
};
