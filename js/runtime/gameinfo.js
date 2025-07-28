import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

// 兼容微信小程序和浏览器环境
let atlas;
if (typeof wx !== 'undefined' && wx.createImage) {
  // 微信小程序环境
  atlas = wx.createImage();
} else if (typeof Image !== 'undefined') {
  // 浏览器环境
  atlas = new Image();
} else {
  // 如果都不可用，创建空对象避免错误
  atlas = { complete: false, src: '' };
}

atlas.src = 'images/Common.png';

export default class GameInfo {
  constructor() {
    // 移除了事件系统的依赖
  }

  setFont(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
  }

  render(ctx) {
    // 简化渲染，不再依赖databus
  }

  renderGameScore(ctx, score) {
    this.setFont(ctx);
    ctx.fillText(score, 10, 30);
  }

  touchEventHandler(event) {
    // 简化触摸处理，移除游戏结束逻辑
  }
}
