import { formatPrice } from '../config/luxuryConfig.js';
import { EmployeeStatsGenerator } from '../config/employeeStats.js';

/**
 * 进货员信息查看弹窗
 */
export default class ClerkInfoModal {
  constructor() {
    this.isVisible = false;
    this.modalWidth = 300;
    this.modalHeight = 420;
    this.modalX = 0;
    this.modalY = 0;
    this.currentClerk = null;
    this.clerkSlot = -1;
  }

  /**
   * 显示进货员信息弹窗
   */
  show(canvasWidth, canvasHeight, clerk, slotIndex) {
    this.isVisible = true;
    this.currentClerk = clerk;
    this.clerkSlot = slotIndex;
    
    // 居中显示弹窗
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    this.currentClerk = null;
    this.clerkSlot = -1;
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

    // 检查是否点击了解雇按钮
    const fireButtonX = this.modalX + (this.modalWidth - 120) / 2;
    const fireButtonY = this.modalY + this.modalHeight - 50;
    const fireButtonW = 120;
    const fireButtonH = 35;
    
    if (x >= fireButtonX && x <= fireButtonX + fireButtonW &&
        y >= fireButtonY && y <= fireButtonY + fireButtonH) {
      return { type: 'fire', clerkSlot: this.clerkSlot };
    }

    return null;
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible || !this.currentClerk) return;

    ctx.save();

    // 绘制半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制弹窗背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 3;
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);
    ctx.strokeRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👨‍💼 进货员信息', this.modalX + this.modalWidth / 2, this.modalY + 30);

    // 绘制关闭按钮
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(this.modalX + this.modalWidth - 30, this.modalY + 10, 20, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', this.modalX + this.modalWidth - 20, this.modalY + 23);

    // 绘制进货员信息
    this.renderClerkInfo(ctx);

    // 绘制解雇按钮
    this.renderFireButton(ctx);

    ctx.restore();
  }

  /**
   * 渲染进货员信息
   */
  renderClerkInfo(ctx) {
    const contentX = this.modalX + 20;
    let currentY = this.modalY + 60;
    const lineHeight = 25;

    ctx.textAlign = 'left';

    // 姓名
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('姓名：', contentX, currentY);
    ctx.fillStyle = '#3498DB';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(this.currentClerk.name, contentX + 50, currentY);
    currentY += lineHeight;

    // 年龄
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('年龄：', contentX, currentY);
    ctx.fillStyle = '#3498DB';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${this.currentClerk.age}岁`, contentX + 50, currentY);
    currentY += lineHeight + 10;

    // 评级
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('评级：', contentX, currentY);
    ctx.fillStyle = EmployeeStatsGenerator.getRatingColor(this.currentClerk.rating);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(this.currentClerk.rating || '普通员工', contentX + 50, currentY);
    currentY += lineHeight;

    // 工作状态
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('状态：', contentX, currentY);
    ctx.fillStyle = '#27AE60';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('工作中', contentX + 50, currentY);
    currentY += lineHeight + 10;

    // 薪资
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('薪资：', contentX, currentY);
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(formatPrice(this.currentClerk.salary || 100000), contentX + 50, currentY);
    currentY += lineHeight + 10;

    // 能力项标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('专业能力：', contentX, currentY);
    currentY += lineHeight + 5;

    // 显示实际的员工能力
    if (this.currentClerk.abilities && this.currentClerk.abilities.length > 0) {
      this.currentClerk.abilities.forEach(ability => {
        ctx.fillStyle = EmployeeStatsGenerator.getAbilityColor(ability);
        ctx.font = '14px Arial';
        const description = EmployeeStatsGenerator.getAbilityDescription(ability);
        ctx.fillText(`• ${description}`, contentX + 10, currentY);
        currentY += lineHeight;
      });
    } else {
      // 兼容旧数据结构
      if (this.currentClerk.speedBonus !== undefined) {
        ctx.fillStyle = '#00BFFF';
        ctx.font = '14px Arial';
        ctx.fillText(`• 进货速度 -${this.currentClerk.speedBonus}%`, contentX + 10, currentY);
        currentY += lineHeight;
      }
      if (this.currentClerk.sLevelBonus !== undefined) {
        ctx.fillStyle = '#C0C0C0';
        ctx.font = '14px Arial';
        ctx.fillText(`• S级概率 +${this.currentClerk.sLevelBonus}%`, contentX + 10, currentY);
        currentY += lineHeight;
      }
      if (this.currentClerk.sssLevelBonus !== undefined) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '14px Arial';
        ctx.fillText(`• SSS级概率 +${this.currentClerk.sssLevelBonus}%`, contentX + 10, currentY);
        currentY += lineHeight;
      }
    }
  }

  /**
   * 渲染解雇按钮
   */
  renderFireButton(ctx) {
    const fireButtonX = this.modalX + (this.modalWidth - 120) / 2;
    const fireButtonY = this.modalY + this.modalHeight - 50;
    const fireButtonW = 120;
    const fireButtonH = 35;
    
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(fireButtonX, fireButtonY, fireButtonW, fireButtonH);
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 2;
    ctx.strokeRect(fireButtonX, fireButtonY, fireButtonW, fireButtonH);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 解雇', fireButtonX + fireButtonW / 2, fireButtonY + 23);
  }
} 