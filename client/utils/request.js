import API_CONFIG from '../config/api.config.js';
import ROUTER_CONFIG from '../config/router.config.js';

const DEFAULT_ERROR_MESSAGE = '操作未完成，请稍后重试';
const NETWORK_ERROR_MESSAGE = '网络开小差了，请稍后重试';
const LOGIN_EXPIRED_MESSAGE = '登录状态已失效，请重新登录';

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
        Object.prototype.hasOwnProperty.call(payload, 'timeout') ||
        Object.prototype.hasOwnProperty.call(payload, 'showError') ||
        Object.prototype.hasOwnProperty.call(payload, 'redirectOn401'))
  );
}

// 创建全局request对象
const request = {
  // 创建http请求实例
  http(options) {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token');
      const showError = options.showError !== false;
      const redirectOn401 = options.redirectOn401 !== false;
      const requestOptions = { ...options };

      // 构建完整URL
      let { url } = requestOptions;
      if (url.indexOf('http') !== 0 && API_CONFIG.baseURL) {
        url = API_CONFIG.baseURL + url;
      }

      // 合并headers
      const optionHeaders = normalizeHeaders(requestOptions);
      const headers = {
        'content-type': 'application/json',
        ...optionHeaders
      };

      if (!headers.Authorization && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      delete requestOptions.header;
      delete requestOptions.headers;
      delete requestOptions.showError;
      delete requestOptions.redirectOn401;

      uni.request({
        url,
        method: requestOptions.method || 'GET',
        data: cleanData(requestOptions.data || {}),
        header: headers,
        timeout: requestOptions.timeout || 60000,
        success: (res) => {
          const responseCode = Number(res.data?.code || res.statusCode);
          const responseMessage = res.data?.message || DEFAULT_ERROR_MESSAGE;

          if (res.statusCode === 200 && responseCode === 200) {
              resolve(res.data);
              return;
          }

          if (res.statusCode === 401 || responseCode === 401) {
            // token过期或无效，跳转到登录页
            uni.removeStorageSync('token');
            uni.removeStorageSync('userInfo');
            if (showError) {
              uni.showToast({
                title: LOGIN_EXPIRED_MESSAGE,
                icon: 'none'
              });
            }
            if (redirectOn401) {
              setTimeout(() => {
                ROUTER_CONFIG.navigate.to(ROUTER_CONFIG.pages.login);
              }, 1500);
            }
            reject(new Error(LOGIN_EXPIRED_MESSAGE));
            return;
          }

          if (showError) {
            uni.showToast({
              title: responseMessage,
              icon: 'none'
            });
          }
          reject(new Error(responseMessage));
        },
        fail: (err) => {
          if (showError) {
            uni.showToast({
              title: NETWORK_ERROR_MESSAGE,
              icon: 'none'
            });
          }
          reject(new Error(err?.errMsg || NETWORK_ERROR_MESSAGE));
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
