import API_CONFIG from '../config/api.config.js';
import ROUTER_CONFIG from '../config/router.config.js';

function normalizeHeaders(options = {}) {
  return {
    ...(options.header || {}),
    ...(options.headers || {})
  };
}

function cleanData(data = {}) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data;
  }

  return Object.keys(data).reduce((result, key) => {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
    return result;
  }, {});
}

function looksLikeOptions(payload) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      (Object.prototype.hasOwnProperty.call(payload, 'headers') ||
        Object.prototype.hasOwnProperty.call(payload, 'header') ||
        Object.prototype.hasOwnProperty.call(payload, 'timeout'))
  );
}

// 创建全局request对象
const request = {
  // 创建http请求实例
  http(options) {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token');

      // 构建完整URL
      let { url } = options;
      if (url.indexOf('http') !== 0 && API_CONFIG.baseURL) {
        url = API_CONFIG.baseURL + url;
      }

      // 合并headers
      const optionHeaders = normalizeHeaders(options);
      const headers = {
        'content-type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...optionHeaders
      };

      uni.request({
        url,
        method: options.method || 'GET',
        data: cleanData(options.data || {}),
        header: headers,
        timeout: 60000, // 设置超时时间为60秒
        success: (res) => {
          if (res.statusCode === 200) {
            if (res.data.code === 200) {
              resolve(res.data);
            } else {
              // 统一错误处理
              uni.showToast({
                title: res.data.message || '请求失败',
                icon: 'none'
              });
              reject(new Error(res.data.message || '请求失败'));
            }
          } else if (res.statusCode === 401) {
            // token过期或无效，跳转到登录页
            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');
            uni.showToast({
              title: '请重新登录',
              icon: 'none'
            });
            setTimeout(() => {
              ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
            }, 1500);
            reject(new Error('请重新登录'));
          } else {
            uni.showToast({
              title: res.data.message || '网络错误',
              icon: 'none'
            });
            reject(new Error(res.data.message || '网络错误'));
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '请求失败',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  }
};

// 封装常用请求方法
['get', 'post', 'put', 'delete'].forEach((method) => {
  request[method] = (url, data = {}, options = {}) => {
    let requestData = data;
    let requestOptions = options;

    if (looksLikeOptions(data) && Object.keys(options).length === 0) {
      requestData = {};
      requestOptions = data;
    }

    return request.http({
      url,
      method: method.toUpperCase(),
      data: requestData,
      ...requestOptions
    });
  };
});

export default request;
