import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const atlas = wx.createImage();
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
