// API配置文件
const API_CONFIG = {
  // API基础URL
  baseURL: 'http://localhost:8000',

  // 接口路径配置
  endpoints: {
    // 分类相关接口
    category: {
      getCategories: '/category/categories'
    },

    // 服务相关接口
    service: {
      getServices: '/service/services',
      getService: '/service/services'
    },

    // 预约相关接口
    appointment: {
      getUserAppointments: '/appointment/appointments',
      getAppointment: '/appointment/appointments',
      updateAppointmentStatus: '/appointment/appointments',
      createAppointment: '/appointment/appointments'
    },

    // 用户相关接口
    user: {
      login: '/user/login',
      register: '/user/register',
      getUserInfo: '/user/profile',
      updateUserInfo: '/user/profile',
      changePassword: '/user/change-password'
    }
  }
};

export default API_CONFIG;

// 为了兼容非模块化环境，将配置挂载到全局对象
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
}