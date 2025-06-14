import { getStoreLevel } from '../config/luxuryConfig.js';

/**
 * 店铺信息弹窗
 */
export default class StoreInfoModal {
  constructor() {
    this.isVisible = false;
    this.modalWidth = 380;
    this.modalHeight = 500;
    this.modalX = 0;
    this.modalY = 0;
  }

  /**
   * 显示弹窗
   */
  show(canvasWidth, canvasHeight, storeData) {
    this.isVisible = true;
    this.storeData = storeData;
    
    // 计算弹窗居中位置
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    this.storeData = null;
  }

  /**
   * 统计员工评级
   */
  getEmployeeRatingStats() {
    const stats = {
      '天纵奇才': 0,
      '万里挑一': 0,
      '人中龙凤': 0,
      '普通员工': 0
    };

    // 统计进货员
    this.storeData.hiredClerks.forEach(clerk => {
      if (clerk && clerk.rating) {
        stats[clerk.rating] = (stats[clerk.rating] || 0) + 1;
      }
    });

    // 统计设计师
    if (this.storeData.hiredDesigners) {
      this.storeData.hiredDesigners.forEach(designer => {
        if (designer && designer.rating) {
          stats[designer.rating] = (stats[designer.rating] || 0) + 1;
        }
      });
    }

    return stats;
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 检查是否点击了弹窗外部（关闭弹窗）
    if (x < this.modalX || x > this.modalX + this.modalWidth ||
        y < this.modalY || y > this.modalY + this.modalHeight) {
      return { type: 'close' };
    }

    // 检查是否点击了关闭按钮
    const closeButtonX = this.modalX + this.modalWidth - 40;
    const closeButtonY = this.modalY + 10;
    const closeButtonSize = 30;

    if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
        y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
      return { type: 'close' };
    }

    return { type: 'handled' }; // 阻止事件传播
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible || !this.storeData) return;

    ctx.save();

    // 绘制半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制弹窗背景（淡暖色调）
    ctx.fillStyle = '#fefcf8';
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制弹窗边框
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制标题栏
    const titleBarHeight = 50;
    ctx.fillStyle = '#f9f6f1';
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, titleBarHeight);
    
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.modalX, this.modalY + titleBarHeight);
    ctx.lineTo(this.modalX + this.modalWidth, this.modalY + titleBarHeight);
    ctx.stroke();

    // 绘制标题文字
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('店铺信息', this.modalX + 20, this.modalY + 32);

    // 绘制关闭按钮
    const closeButtonX = this.modalX + this.modalWidth - 40;
    const closeButtonY = this.modalY + 10;
    const closeButtonSize = 30;
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2 + 6);

    // 绘制店铺信息内容
    this.renderStoreContent(ctx);

    ctx.restore();
  }

  /**
   * 渲染店铺信息内容
   */
  renderStoreContent(ctx) {
    const contentStartY = this.modalY + 70;
    const leftMargin = this.modalX + 30;
    const lineHeight = 30;

    ctx.fillStyle = '#2c3e50';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';

    // 获取员工评级统计
    const employeeStats = this.getEmployeeRatingStats();
    
    // 店铺等级
    const stats = this.storeData.productStats || { B: 0, A: 0, S: 0, SSS: 0 };
    const storeLevel = getStoreLevel(
      stats.SSS || 0,
      employeeStats['万里挑一'] || 0,
      employeeStats['天纵奇才'] || 0
    );
    
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`店铺等级: ${storeLevel}`, leftMargin, contentStartY);

    // 商品等级统计
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('商品统计:', leftMargin, contentStartY + lineHeight * 1.5);

    const statY = contentStartY + lineHeight * 2.5;
    
    // B级商品
    ctx.fillStyle = '#8B4513';
    ctx.fillText(`B级商品: ${stats.B} 件`, leftMargin + 20, statY);
    
    // A级商品
    ctx.fillStyle = '#4169E1';
    ctx.fillText(`A级商品: ${stats.A} 件`, leftMargin + 20, statY + lineHeight);
    
    // S级商品
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`S级商品: ${stats.S} 件`, leftMargin + 20, statY + lineHeight * 2);
    
    // SSS级商品
    ctx.fillStyle = '#FF1493';
    ctx.fillText(`SSS级商品: ${stats.SSS} 件`, leftMargin + 20, statY + lineHeight * 3);

    // 员工评级统计
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('员工统计:', leftMargin, statY + lineHeight * 4.5);

    const employeeStatY = statY + lineHeight * 5.5;
    
    // 天纵奇才
    ctx.fillStyle = '#FF1493';
    ctx.fillText(`天纵奇才: ${employeeStats['天纵奇才'] || 0} 人`, leftMargin + 20, employeeStatY);
    
    // 万里挑一
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`万里挑一: ${employeeStats['万里挑一'] || 0} 人`, leftMargin + 20, employeeStatY + lineHeight);
    
    // 人中龙凤
    ctx.fillStyle = '#4169E1';
    ctx.fillText(`人中龙凤: ${employeeStats['人中龙凤'] || 0} 人`, leftMargin + 20, employeeStatY + lineHeight * 2);
    
    // 普通员工
    ctx.fillStyle = '#8B4513';
    ctx.fillText(`普通员工: ${employeeStats['普通员工'] || 0} 人`, leftMargin + 20, employeeStatY + lineHeight * 3);
  }
} 