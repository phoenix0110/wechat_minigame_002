import { generateClerkResume } from '../utils/nameGenerator.js';
import { formatPrice } from '../config/luxuryConfig.js';
import { EmployeeStatsGenerator } from '../config/employeeStats.js';

/**
 * 进货员简历弹窗
 */
export default class ClerkResumeModal {
  constructor() {
    this.isVisible = false;
    this.modalWidth = 300;
    this.modalHeight = 400;
    this.modalX = 0;
    this.modalY = 0;
    this.currentResume = null;
    this.clerkType = 1;
    this.basePrice = 0;
  }

  /**
   * 显示简历弹窗
   */
  show(canvasWidth, canvasHeight, clerkType, basePrice) {
    this.isVisible = true;
    this.clerkType = clerkType;
    this.basePrice = basePrice;
    
    // 居中显示弹窗
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
    
    // 生成初始简历
    this.generateNewResume();
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    this.currentResume = null;
    this.clerkType = 1;
    this.basePrice = 0;
  }

  /**
   * 生成新简历
   */
  generateNewResume() {
    const baseResume = generateClerkResume(this.clerkType);
    
    // 生成完整的员工对象（包含评级和薪资）
    const completeEmployee = EmployeeStatsGenerator.generateCompleteEmployee(false, baseResume);
    
    // 更新基础价格为实际薪资
    this.basePrice = completeEmployee.salary;
    
    // 保存完整的简历信息
    this.currentResume = completeEmployee;
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

    // 检查是否点击了刷新简历按钮
    const refreshButtonX = this.modalX + 20;
    const refreshButtonY = this.modalY + this.modalHeight - 50;
    const refreshButtonW = 120;
    const refreshButtonH = 35;
    
    if (x >= refreshButtonX && x <= refreshButtonX + refreshButtonW &&
        y >= refreshButtonY && y <= refreshButtonY + refreshButtonH) {
      this.generateNewResume();
      return { type: 'refresh' };
    }

    // 检查是否点击了招聘按钮
    const hireButtonX = this.modalX + this.modalWidth - 140;
    const hireButtonY = this.modalY + this.modalHeight - 50;
    const hireButtonW = 120;
    const hireButtonH = 35;
    
    if (x >= hireButtonX && x <= hireButtonX + hireButtonW &&
        y >= hireButtonY && y <= hireButtonY + hireButtonH) {
      return { type: 'hire', resume: this.currentResume };
    }

    return null;
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible || !this.currentResume) return;

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
    ctx.fillText('📋 进货员简历', this.modalX + this.modalWidth / 2, this.modalY + 30);

    // 绘制关闭按钮
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(this.modalX + this.modalWidth - 30, this.modalY + 10, 20, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', this.modalX + this.modalWidth - 20, this.modalY + 23);

    // 绘制简历内容
    this.renderResumeContent(ctx);

    // 绘制按钮
    this.renderButtons(ctx);

    ctx.restore();
  }

  /**
   * 渲染简历内容
   */
  renderResumeContent(ctx) {
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
    ctx.fillText(this.currentResume.name, contentX + 50, currentY);
    currentY += lineHeight;

    // 年龄
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('年龄：', contentX, currentY);
    ctx.fillStyle = '#3498DB';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`${this.currentResume.age}岁`, contentX + 50, currentY);
    currentY += lineHeight;

    // 评级
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('评级：', contentX, currentY);
    ctx.fillStyle = EmployeeStatsGenerator.getRatingColor(this.currentResume.rating);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(this.currentResume.rating, contentX + 50, currentY);
    currentY += lineHeight + 10;

    // 能力项标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('专业能力：', contentX, currentY);
    currentY += lineHeight + 5;

    // 显示实际的员工能力
    if (this.currentResume.abilities && this.currentResume.abilities.length > 0) {
      this.currentResume.abilities.forEach(ability => {
        ctx.fillStyle = '#7F8C8D';
        ctx.font = '14px Arial';
        const description = EmployeeStatsGenerator.getAbilityDescription(ability);
        ctx.fillText(`• ${description}`, contentX + 10, currentY);
        currentY += lineHeight;
      });
    } else {
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '14px Arial';
      ctx.fillText('• 暂无特殊能力', contentX + 10, currentY);
      currentY += lineHeight;
    }
    
    currentY += 10;

    // 薪资要求
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('薪资要求：', contentX, currentY);
    ctx.fillStyle = '#E74C3C';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(formatPrice(this.currentResume.salary), contentX + 80, currentY);
  }

  /**
   * 渲染按钮
   */
  renderButtons(ctx) {
    const buttonY = this.modalY + this.modalHeight - 50;
    const buttonH = 35;

    // 刷新简历按钮
    const refreshButtonX = this.modalX + 20;
    const refreshButtonW = 120;
    
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(refreshButtonX, buttonY, refreshButtonW, buttonH);
    ctx.strokeStyle = '#7F8C8D';
    ctx.lineWidth = 2;
    ctx.strokeRect(refreshButtonX, buttonY, refreshButtonW, buttonH);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔄 刷新简历', refreshButtonX + refreshButtonW / 2, buttonY + 23);

    // 招聘按钮
    const hireButtonX = this.modalX + this.modalWidth - 140;
    const hireButtonW = 120;
    
    ctx.fillStyle = '#27AE60';
    ctx.fillRect(hireButtonX, buttonY, hireButtonW, buttonH);
    ctx.strokeStyle = '#1E8449';
    ctx.lineWidth = 2;
    ctx.strokeRect(hireButtonX, buttonY, hireButtonW, buttonH);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✅ 招聘！', hireButtonX + hireButtonW / 2, buttonY + 23);
  }
} 