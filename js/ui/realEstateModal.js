import { REAL_ESTATE_OPTIONS, formatPropertyPrice } from '../config/realEstateConfig.js';

/**
 * 售楼处弹窗界面
 */
export default class RealEstateModal {
  constructor() {
    this.isVisible = false;
    this.options = REAL_ESTATE_OPTIONS;
    this.optionsPerRow = 2; // 每行2个选项
    this.optionWidth = 150;
    this.optionHeight = 120;
    this.modalWidth = 350;
    this.modalHeight = 450;
    this.modalX = 0;
    this.modalY = 0;
  }

  /**
   * 显示弹窗
   */
  show(canvasWidth, canvasHeight) {
    this.isVisible = true;
    // 居中显示弹窗
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
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

    // 检查是否点击了房产选项
    const contentX = this.modalX + 25;
    const contentY = this.modalY + 50;
    
    for (let i = 0; i < this.options.length; i++) {
      const row = Math.floor(i / this.optionsPerRow);
      const col = i % this.optionsPerRow;
      const optionX = contentX + col * (this.optionWidth + 10);
      const optionY = contentY + row * (this.optionHeight + 10);
      
      if (x >= optionX && x <= optionX + this.optionWidth &&
          y >= optionY && y <= optionY + this.optionHeight) {
        return { type: 'purchase', option: this.options[i] };
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
    ctx.fillText('🏠 售楼大厅', this.modalX + this.modalWidth / 2, this.modalY + 30);

    // 绘制关闭按钮
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(this.modalX + this.modalWidth - 30, this.modalY + 10, 20, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', this.modalX + this.modalWidth - 20, this.modalY + 23);

    // 绘制房产选项
    const contentX = this.modalX + 25;
    const contentY = this.modalY + 50;

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i];
      const row = Math.floor(i / this.optionsPerRow);
      const col = i % this.optionsPerRow;
      const x = contentX + col * (this.optionWidth + 10);
      const y = contentY + row * (this.optionHeight + 10);

      // 绘制选项背景
      let bgColor = option.type === 'apartment' ? '#E8F4F8' : '#F0E8F8';
      ctx.fillStyle = bgColor;
      ctx.fillRect(x, y, this.optionWidth, this.optionHeight);

      // 绘制选项边框
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, this.optionWidth, this.optionHeight);

      // 绘制房产图标
      ctx.fillStyle = '#2C3E50';
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(option.icon, x + this.optionWidth / 2, y + 40);

      // 绘制房产名称
      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(option.name, x + this.optionWidth / 2, y + 60);

      // 绘制房产描述
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '10px Arial';
      const shortDesc = option.description.length > 20 ? 
        option.description.substring(0, 18) + '...' : option.description;
      ctx.fillText(shortDesc, x + this.optionWidth / 2, y + 75);

      // 绘制价格
      ctx.fillStyle = '#E74C3C';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(formatPropertyPrice(option.totalPrice), x + this.optionWidth / 2, y + this.optionHeight - 10);
    }

    ctx.restore();
  }
} 