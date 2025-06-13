import Main from './js/main';

// 确保微信环境已准备就绪
function startGame() {
  try {

    // 检查必要的微信API是否可用
    if (!wx) {
      throw new Error('微信环境未准备就绪');
    }
    
    if (!canvas) {
      throw new Error('Canvas未初始化');
    }
    
    console.log('Environment check passed, creating main game instance...');
    new Main();
    
  } catch (error) {
    console.error('Game startup failed:', error);
    
    // 显示错误信息
    wx.showModal({
      title: '游戏启动失败',
      content: error.message || '未知错误',
      showCancel: false
    });
  }
}

// 等待微信环境完全加载后启动游戏
if (wx.onShow) {
  // 如果有onShow API，等待小游戏显示后启动
  wx.onShow(() => {
    console.log('Game onShow triggered');
    startGame();
  });
} else {
  // 否则直接启动
  startGame();
}
