import { LUXURY_ITEMS, formatPrice } from '../config/luxuryConfig.js';

/**
 * 奢侈品商店弹窗界面
 */
export default class LuxuryStoreModal {
  constructor() {
    this.isVisible = false;
    this.items = LUXURY_ITEMS;
    this.itemsPerRow = 4; // 每行4个商品
    this.rows = 6; // 总共6行
    this.itemWidth = 80;
    this.itemHeight = 90;
    this.modalWidth = 350;
    this.modalHeight = 580;
    this.modalX = 0;
    this.modalY = 0;
    this.scrollY = 0;
    this.maxScrollY = 0;
  }

  /**
   * 显示弹窗
   */
  show(canvasWidth, canvasHeight) {
    this.isVisible = true;
    // 居中显示弹窗
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
    this.scrollY = 0;
    
    // 计算最大滚动距离
    const contentHeight = Math.ceil(this.items.length / this.itemsPerRow) * this.itemHeight + 100;
    this.maxScrollY = Math.max(0, contentHeight - this.modalHeight + 60);
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 检查是否点击了关闭按钮
    const closeButtonX = this.modalX + this.modalWidth - 30;
    const closeButtonY = this.modalY + 10;
    if (x >= closeButtonX && x <= closeButtonX + 20 && 
        y >= closeButtonY && y <= closeButtonY + 20) {
      this.hide();
      return { type: 'close' };
    }

    // 检查是否点击了商品
    const contentX = this.modalX + 15;
    const contentY = this.modalY + 50 - this.scrollY;
    
    for (let i = 0; i < this.items.length; i++) {
      const row = Math.floor(i / this.itemsPerRow);
      const col = i % this.itemsPerRow;
      const itemX = contentX + col * (this.itemWidth + 5);
      const itemY = contentY + row * (this.itemHeight + 5);
      
      if (x >= itemX && x <= itemX + this.itemWidth &&
          y >= itemY && y <= itemY + this.itemHeight &&
          itemY >= this.modalY + 50 && itemY <= this.modalY + this.modalHeight - 30) {
        return { type: 'purchase', item: this.items[i] };
      }
    }

    return null;
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible) return;

    ctx.save();

    // 绘制半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制弹窗背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 3;
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);
    ctx.strokeRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💎 奢侈品陈列柜', this.modalX + this.modalWidth / 2, this.modalY + 30);

    // 绘制关闭按钮
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(this.modalX + this.modalWidth - 30, this.modalY + 10, 20, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', this.modalX + this.modalWidth - 20, this.modalY + 23);

    // 设置商品显示区域的裁剪
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.modalX + 10, this.modalY + 50, this.modalWidth - 20, this.modalHeight - 60);
    ctx.clip();

    // 绘制商品网格
    const contentX = this.modalX + 15;
    const contentY = this.modalY + 50 - this.scrollY;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const row = Math.floor(i / this.itemsPerRow);
      const col = i % this.itemsPerRow;
      const x = contentX + col * (this.itemWidth + 5);
      const y = contentY + row * (this.itemHeight + 5);

      // 绘制商品背景
      let bgColor = '#F8F9FA';
      if (item.type === 'bag') bgColor = '#FFE5E5';
      else if (item.type === 'scarf') bgColor = '#E5F3FF';
      else if (item.type === 'shoes') bgColor = '#F0E5FF';

      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, this.itemWidth, this.itemHeight);

      // 绘制商品边框
      ctx.strokeStyle = '#BDC3C7';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, this.itemWidth, this.itemHeight);

      // 绘制商品图标
      ctx.fillStyle = '#2C3E50';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, x + this.itemWidth / 2, y + 25);

      // 绘制商品名称
      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 10px Arial';
      const nameLines = this.wrapText(item.name, 12);
      nameLines.forEach((line, index) => {
        ctx.fillText(line, x + this.itemWidth / 2, y + 40 + index * 10);
      });

      // 绘制价格
      ctx.fillStyle = '#E74C3C';
      ctx.font = 'bold 9px Arial';
      ctx.fillText(formatPrice(item.price), x + this.itemWidth / 2, y + this.itemHeight - 5);
    }

    ctx.restore();

    // 绘制滚动条（如果需要）
    if (this.maxScrollY > 0) {
      const scrollBarHeight = Math.max(20, (this.modalHeight - 60) * (this.modalHeight - 60) / (this.maxScrollY + this.modalHeight - 60));
      const scrollBarY = this.modalY + 50 + (this.scrollY / this.maxScrollY) * (this.modalHeight - 60 - scrollBarHeight);
      
      ctx.fillStyle = 'rgba(44, 62, 80, 0.3)';
      ctx.fillRect(this.modalX + this.modalWidth - 8, this.modalY + 50, 6, this.modalHeight - 60);
      
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(this.modalX + this.modalWidth - 8, scrollBarY, 6, scrollBarHeight);
    }

    ctx.restore();
  }

  /**
   * 文本换行处理
   */
  wrapText(text, maxLength) {
    if (text.length <= maxLength) return [text];
    
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (const char of words) {
      if (currentLine.length + 1 <= maxLength) {
        currentLine += char;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = char;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 2); // 最多显示两行
  }

  /**
   * 滚动处理
   */
  scroll(deltaY) {
    if (!this.isVisible || this.maxScrollY <= 0) return;
    
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + deltaY));
  }
} 