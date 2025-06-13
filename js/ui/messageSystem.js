/**
 * 消息提示系统
 * 用于显示游戏中的各种提示信息
 */
export default class MessageSystem {
  constructor() {
    this.messages = [];
    this.maxMessages = 3; // 最多显示3条消息
    this.messageDuration = 3000; // 消息显示3秒
  }

  /**
   * 添加新消息
   */
  addMessage(text, type = 'info') {
    const message = {
      text,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: Date.now(),
      alpha: 1
    };

    // 添加到消息列表开头
    this.messages.unshift(message);
    
    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(0, this.maxMessages);
    }
  }

  /**
   * 更新消息系统
   */
  update() {
    const currentTime = Date.now();
    
    // 更新消息透明度和移除过期消息
    this.messages = this.messages.filter(message => {
      const age = currentTime - message.timestamp;
      
      if (age > this.messageDuration) {
        return false; // 移除过期消息
      }
      
      // 在最后500ms内让消息淡出
      if (age > this.messageDuration - 500) {
        message.alpha = (this.messageDuration - age) / 500;
      }
      
      return true;
    });
  }

  /**
   * 渲染消息
   */
  render(ctx, canvasWidth) {
    if (this.messages.length === 0) return;

    ctx.save();
    
    // 从下往上绘制消息
    let yOffset = 120; // 从屏幕上方120px开始显示，避免与金钱余额重叠
    
    this.messages.forEach((message, index) => {
      const y = yOffset + index * 35;
      
      // 设置透明度
      ctx.globalAlpha = message.alpha;
      
      // 根据消息类型设置颜色
      let bgColor, textColor;
      switch (message.type) {
        case 'success':
          bgColor = 'rgba(76, 175, 80, 0.9)';
          textColor = '#FFFFFF';
          break;
        case 'warning':
          bgColor = 'rgba(255, 193, 7, 0.9)';
          textColor = '#2C3E50';
          break;
        case 'error':
          bgColor = 'rgba(244, 67, 54, 0.9)';
          textColor = '#FFFFFF';
          break;
        default: // info
          bgColor = 'rgba(33, 150, 243, 0.9)';
          textColor = '#FFFFFF';
      }
      
      // 绘制消息背景
      const textWidth = ctx.measureText(message.text).width;
      const padding = 20;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = 30;
      const bgX = (canvasWidth - bgWidth) / 2;
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(bgX, y - 20, bgWidth, bgHeight);
      
      // 绘制消息文本
      ctx.fillStyle = textColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(message.text, canvasWidth / 2, y);
    });
    
    ctx.restore();
  }

  /**
   * 清空所有消息
   */
  clear() {
    this.messages = [];
  }
} 