import { drawRoundRect, formatMoney } from './utils.js';
import { getIndustryCompanyByPlayerId } from '../config/systemPlayersConfig.js';

/**
 * 头像放大模态框
 * 用于在排行榜中点击系统玩家头像时显示放大版本
 */
export default class AvatarModal {
  constructor() {
    this.isVisible = false;
    this.player = null;
    this.avatarImage = null;
    
    // 模态框样式
    this.modalWidth = 300;
    this.modalHeight = 400;
    this.borderRadius = 12;
    this.backgroundColor = '#FFFFFF';
    this.overlayColor = 'rgba(0, 0, 0, 0.5)';
    
    // 头像样式
    this.avatarSize = 120;
    this.nameFont = '700 18px Inter';
    this.titleFont = '400 14px Inter';
    this.assetsFont = '700 16px Inter';
  }
  
  /**
   * 显示头像模态框
   */
  show(canvasWidth, canvasHeight, player, avatarImage) {
    this.isVisible = true;
    this.player = player;
    this.avatarImage = avatarImage;
    
    // 计算模态框位置（居中）
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
  }
  
  /**
   * 隐藏头像模态框
   */
  hide() {
    this.isVisible = false;
    this.player = null;
    this.avatarImage = null;
  }
  
  /**
   * 渲染模态框
   */
  render(ctx) {
    if (!this.isVisible || !this.player) return;
    
    ctx.save();
    
    // 绘制遮罩层
    ctx.fillStyle = this.overlayColor;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 绘制模态框背景
    ctx.fillStyle = this.backgroundColor;
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, this.modalX, this.modalY, this.modalWidth, this.modalHeight, this.borderRadius);
    ctx.fill();
    ctx.stroke();
    
    // 计算内容位置
    const contentX = this.modalX + this.modalWidth / 2;
    let currentY = this.modalY + 40;
    
    // 绘制头像
    const avatarX = contentX - this.avatarSize / 2;
    const avatarY = currentY;
    
    if (this.avatarImage && this.avatarImage.complete) {
      // 裁剪为圆形
      ctx.save();
      ctx.beginPath();
      ctx.arc(contentX, avatarY + this.avatarSize / 2, this.avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.avatarImage, avatarX, avatarY, this.avatarSize, this.avatarSize);
      ctx.restore();
    } else {
      // 占位符，使用随机颜色
      const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
      ctx.fillStyle = avatarColors[this.player.id % avatarColors.length] || '#E0E0E0';
      ctx.beginPath();
      ctx.arc(contentX, avatarY + this.avatarSize / 2, this.avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    currentY += this.avatarSize + 30;
    
    // 绘制玩家名字
    ctx.fillStyle = '#000000';
    ctx.font = this.nameFont;
    ctx.textAlign = 'center';
    ctx.fillText(this.player.name, contentX, currentY);
    
    currentY += 30;
    
    // 绘制行业公司信息
    if (!this.player.isUser) {
      const industryCompany = getIndustryCompanyByPlayerId(this.player.id);
      ctx.fillStyle = '#666666';
      ctx.font = this.titleFont;
      ctx.fillText(`${industryCompany.industry} · ${industryCompany.company}`, contentX, currentY);
      
      currentY += 20;
      ctx.fillText('老板', contentX, currentY);
    }
    
    currentY += 40;
    
    // 绘制资产信息
    ctx.fillStyle = '#FA6400';
    ctx.font = this.assetsFont;
    const assetText = `总资产：${formatMoney(this.player.assets)}`;
    ctx.fillText(assetText, contentX, currentY);
    
    currentY += 30;
    
    // 绘制排名信息
    ctx.fillStyle = '#666666';
    ctx.font = this.titleFont;
    ctx.fillText(`排名：第 ${this.player.rank} 名`, contentX, currentY);
    
    // 绘制关闭按钮
    const closeButtonSize = 30;
    const closeButtonX = this.modalX + this.modalWidth - closeButtonSize - 10;
    const closeButtonY = this.modalY + 10;
    
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.arc(closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2, closeButtonSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制关闭图标（X）
    ctx.fillStyle = '#666666';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 6);
    
    ctx.restore();
  }
  
  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;
    
    // 检查是否点击关闭按钮
    const closeButtonSize = 30;
    const closeButtonX = this.modalX + this.modalWidth - closeButtonSize - 10;
    const closeButtonY = this.modalY + 10;
    
    if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
        y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
      this.hide();
      return { type: 'avatar_modal_close' };
    }
    
    // 检查是否点击模态框外部（关闭模态框）
    if (x < this.modalX || x > this.modalX + this.modalWidth ||
        y < this.modalY || y > this.modalY + this.modalHeight) {
      this.hide();
      return { type: 'avatar_modal_close' };
    }
    
    // 点击模态框内部，阻止事件传播
    return { type: 'avatar_modal_content' };
  }
}