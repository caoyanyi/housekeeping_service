// API配置文件
export default {
  // API基础URL
    baseURL: 'http://localhost:8000',

  // 接口路径配置
  endpoints: {
    // 分类相关接口
    category: {
      getCategories: '/Category/getCategories'
    },

    // 服务相关接口
    service: {
      getServices: '/Service/getServices',
      getService: '/Service/getService'
    },

    // 预约相关接口
    appointment: {
      getUserAppointments: '/Appointment/getUserAppointments',
      getAppointment: '/Appointment/getAppointment',
      updateAppointmentStatus: '/Appointment/updateAppointmentStatus'
    },

    // 用户相关接口
    user: {
      updateUserInfo: '/User/updateUserInfo'
    }
  }
};

// 为了兼容非模块化环境，将配置挂载到全局对象
// 注意：在实际项目中，建议仅使用ES模块导入方式
if (typeof window !== 'undefined') {
  window.API_CONFIG = module.exports || this.default;
}
