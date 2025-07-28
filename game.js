import Main from './js/main';

// 游戏实例
let gameInstance = null;

// 确保微信环境已准备就绪
function startGame() {
  try {
    gameInstance = new Main();
    
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

// 小程序前台显示时的回调
wx.onShow(() => {
  // 如果游戏还未启动，则启动游戏
  if (!gameInstance) {
    startGame();
  } else {
    // 通知游戏进入前台
    gameInstance.onAppShow();
  }
});

// 小程序后台隐藏时的回调
wx.onHide(() => {
  // 通知游戏进入后台
  if (gameInstance) {
    gameInstance.onAppHide();
  }
});

// 启动游戏
if (typeof wx !== 'undefined') {
  startGame();
}
