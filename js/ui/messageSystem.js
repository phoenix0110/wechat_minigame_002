/**
 * 消息提示系统
 * 用于显示游戏中的各种提示信息
 */

import { formatMoney } from './utils.js';

export default class MessageSystem {
  constructor() {
    this.messages = [];
    this.maxMessages = 3; // 最多同时显示3条消息
    this.messageDuration = 3000; // 消息显示时长（毫秒）
    this.fadeAnimationDuration = 500; // 淡出动画时长
    this.insufficientFundsModal = null; // 资金不足弹窗
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
    if (this.messages.length === 0 && !this.hasActiveModal()) return;

    ctx.save();
    
    // 渲染消息列表
    if (this.messages.length > 0) {
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
    }
    
    // 渲染资金不足弹窗
    if (this.hasActiveModal()) {
      this.renderInsufficientFundsModal(ctx, canvasWidth);
    }
    
    ctx.restore();
  }

  /**
   * 渲染资金不足弹窗 - 按照 Figma 设计 (node-id=122-782)
   */
  renderInsufficientFundsModal(ctx, canvasWidth) {
    const modal = this.insufficientFundsModal;
    if (!modal || !modal.isVisible) return;

    // 弹窗尺寸和位置 - 按照 Figma 设计：360x240
    const modalWidth = 360;
    const modalHeight = 240;
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvas.height - modalHeight) / 2;

    // 绘制半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvas.height);

    // 绘制弹窗外层阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 11;

    // 绘制弹窗背景 - 按照 Figma 设计，使用粉色背景 #FCB3AD
    ctx.fillStyle = '#FCB3AD';
    this.drawRoundRect(ctx, modalX, modalY, modalWidth, modalHeight, 16);
    ctx.fill();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 绘制弹窗内层圆角矩形 - 按照 Figma 设计，使用白色内层
    const innerX = modalX + 12;
    const innerY = modalY + 48;
    const innerWidth = 336;
    const innerHeight = 176;
    
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundRect(ctx, innerX, innerY, innerWidth, innerHeight, 8);
    ctx.fill();

    // 绘制文字阴影效果
    ctx.shadowColor = 'rgba(136, 13, 13, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // 绘制提示消息 - 按照 Figma 设计，文字居中显示
    ctx.fillStyle = '#000000';
    ctx.font = '700 16px Inter';
    ctx.textAlign = 'center';
    const textX = modalX + modalWidth / 2;
    const textY = modalY + 93 + 19; // 文字区域中心位置
    ctx.fillText('算了，等挣了更多的钱再来买吧！', textX, textY);

    // 重置文字阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 绘制关闭按钮 (右上角) - 按照 Figma 设计，使用渐变效果
    const closeButtonX = modalX + 314;
    const closeButtonY = modalY + 11;
    const closeButtonSize = 30;
    
    // 创建关闭按钮渐变背景
    const closeGradient = ctx.createLinearGradient(closeButtonX, closeButtonY, closeButtonX, closeButtonY + closeButtonSize);
    closeGradient.addColorStop(0, '#FF6262');
    closeGradient.addColorStop(1, '#CC4C4C');
    
    ctx.fillStyle = closeGradient;
    this.drawRoundRect(ctx, closeButtonX, closeButtonY, closeButtonSize, closeButtonSize, 2);
    ctx.fill();
    
    // 关闭按钮边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 关闭按钮X符号
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 5);

    // 绘制确认按钮 "知道了" - 按照 Figma 黄色按钮设计
    const btnWidth = 280;
    const btnHeight = 48;
    const btnX = modalX + 40;
    const btnY = modalY + 158;

    // 按钮阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // 创建黄色按钮渐变背景
    const buttonGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
    buttonGradient.addColorStop(0, '#FFAE02');
    buttonGradient.addColorStop(1, '#E6970B');
    
    ctx.fillStyle = buttonGradient;
    this.drawRoundRect(ctx, btnX, btnY, btnWidth, btnHeight, 24);
    ctx.fill();

    // 按钮边框
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 按钮文字阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // 按钮文字 "知道了"
    ctx.fillStyle = '#000000';
    ctx.font = '900 16px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('知道了', btnX + btnWidth / 2, btnY + btnHeight / 2 + 6);

    // 重置文字阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  /**
   * 绘制圆角矩形 - 内部工具函数
   */
  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // 移除本地的formatMoney函数，使用utils中的版本

  /**
   * 清空所有消息
   */
  clear() {
    this.messages = [];
  }

  /**
   * 显示资金不足弹窗
   */
  showInsufficientFundsModal(property, requiredAmount, currentMoney) {
    this.insufficientFundsModal = {
      isVisible: true,
      property: property,
      requiredAmount: requiredAmount,
      currentMoney: currentMoney,
      message: '等挣了更多的钱再来买吧！'
    };
  }

  /**
   * 隐藏资金不足弹窗
   */
  hideInsufficientFundsModal() {
    this.insufficientFundsModal = null;
  }

  /**
   * 检查是否有弹窗正在显示
   */
  hasActiveModal() {
    return this.insufficientFundsModal && this.insufficientFundsModal.isVisible;
  }

  /**
   * 处理弹窗触摸事件 - 更新为新的弹窗尺寸
   */
  handleModalTouch(x, y) {
    if (!this.hasActiveModal()) return null;

    const modal = this.insufficientFundsModal;
    
    // 弹窗尺寸和位置 - 按照新设计 360x240
    const modalWidth = 360;
    const modalHeight = 240;
    const modalX = (canvas.width - modalWidth) / 2;
    const modalY = (canvas.height - modalHeight) / 2;
    
    // 关闭按钮 (右上角)
    const closeButtonX = modalX + 314;
    const closeButtonY = modalY + 11;
    const closeButtonSize = 30;
    
    if (x >= closeButtonX && x <= closeButtonX + closeButtonSize && 
        y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
      // 点击关闭按钮
      this.hideInsufficientFundsModal();
      return { type: 'insufficient_funds_close' };
    }
    
    // 确认按钮 "知道了"
    const btnWidth = 280;
    const btnHeight = 48;
    const btnX = modalX + 40;
    const btnY = modalY + 158;
    
    if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
      // 点击确认按钮
      this.hideInsufficientFundsModal();
      return { type: 'insufficient_funds_confirm' };
    }
    
    // 点击弹窗外区域关闭
    if (x < modalX || x > modalX + modalWidth || y < modalY || y > modalY + modalHeight) {
      this.hideInsufficientFundsModal();
      return { type: 'insufficient_funds_close' };
    }
    
    return null;
  }
} 