// 初始化全局画布
GameGlobal.canvas = wx.createCanvas();

// 获取窗口信息，兼容不同微信版本
const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

// 设置画布尺寸
canvas.width = windowInfo.screenWidth;
canvas.height = windowInfo.screenHeight;

// 设置画布样式，确保正确显示
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;

// 导出屏幕尺寸常量
export const SCREEN_WIDTH = windowInfo.screenWidth;
export const SCREEN_HEIGHT = windowInfo.screenHeight;

console.log('Canvas initialized:', canvas.width, 'x', canvas.height);