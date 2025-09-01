// 本地版本的Element UI JS
// 这是一个简化版本，仅包含基本的功能模拟

// 模拟Element UI组件
const ElementUI = {
  version: '2.15.13',
  // 这里仅模拟一些常用的组件和指令
};

// 模拟一些常用的Element UI组件
const ElMessage = {
  success: function(message) {
    console.log('成功:', message);
    // 实际项目中应该显示一个成功提示框
  },
  error: function(message) {
    console.log('错误:', message);
    // 实际项目中应该显示一个错误提示框
  },
  warning: function(message) {
    console.log('警告:', message);
    // 实际项目中应该显示一个警告提示框
  }
};

const ElMessageBox = {
  confirm: function(message, title, options) {
    console.log('确认框:', title, message);
    // 实际项目中应该显示一个确认对话框
    return new Promise(function(resolve) {
      resolve();
    });
  },
  alert: function(message) {
    console.log('提示框:', message);
    // 实际项目中应该显示一个提示对话框
  }
};

// 将Element UI挂载到Vue原型上
if (window.Vue) {
  // 模拟Vue.use(ElementUI)
  Vue.prototype.$message = ElMessage;
  Vue.prototype.$confirm = ElMessageBox.confirm;
  Vue.prototype.$alert = ElMessageBox.alert;
}

// 挂载到window对象
window.ElementUI = ElementUI;
window.ELEMENT = ElementUI;
window.el = {}; // 模拟el命名空间