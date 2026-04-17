function resolveBaseURL() {
  if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
    return window.__API_BASE_URL__;
  }

  try {
    const storedBaseURL = uni.getStorageSync('apiBaseURL');
    if (storedBaseURL) {
      return storedBaseURL;
    }
  } catch (error) {
    // Ignore storage lookup failures and continue with fallback resolution.
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return 'https://api.jz.okrcn.com/api';
}

// API配置文件
const API_CONFIG = {
  // API基础URL
  baseURL: resolveBaseURL(),

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
    },
    
    // 求职申请相关接口
    jobApplication: {
      submitJobApplication: '/job/application'
    }
  }
};

export default API_CONFIG;

// 为了兼容非模块化环境，将配置挂载到全局对象
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
}
