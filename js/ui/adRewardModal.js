import { drawRoundRect, formatMoney } from './utils.js';

/**
 * 广告奖励弹窗
 * 询问用户是否愿意观看广告获得50万人民币
 */
export default class AdRewardModal {
  constructor() {
    this.isVisible = false;
    this.onConfirm = null; // 确定回调
    this.onCancel = null; // 取消回调
    
    // 弹窗尺寸
    this.modalWidth = 300;
    this.modalHeight = 180;
    this.modalX = 0;
    this.modalY = 0;
    
    // 奖励金额
    this.rewardAmount = 500000; // 50万
  }

  /**
   * 显示弹窗
   */
  show(canvasWidth, canvasHeight, onConfirm = null, onCancel = null) {
    this.isVisible = true;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    
    // 计算弹窗位置（居中）
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    this.onConfirm = null;
    this.onCancel = null;
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 检查是否点击在弹窗区域内
    if (x < this.modalX || x > this.modalX + this.modalWidth ||
        y < this.modalY || y > this.modalY + this.modalHeight) {
      return null; // 点击在弹窗外，不处理
    }

    // 确定按钮区域
    const confirmButtonX = this.modalX + 20;
    const confirmButtonY = this.modalY + this.modalHeight - 50;
    const confirmButtonWidth = 100;
    const confirmButtonHeight = 30;

    // 取消按钮区域
    const cancelButtonX = this.modalX + this.modalWidth - 120;
    const cancelButtonY = this.modalY + this.modalHeight - 50;
    const cancelButtonWidth = 100;
    const cancelButtonHeight = 30;

    // 检查确定按钮点击
    if (x >= confirmButtonX && x <= confirmButtonX + confirmButtonWidth &&
        y >= confirmButtonY && y <= confirmButtonY + confirmButtonHeight) {
      if (this.onConfirm) {
        this.onConfirm(this.rewardAmount);
      }
      this.hide();
      return { type: 'confirm', amount: this.rewardAmount };
    }

    // 检查取消按钮点击
    if (x >= cancelButtonX && x <= cancelButtonX + cancelButtonWidth &&
        y >= cancelButtonY && y <= cancelButtonY + cancelButtonHeight) {
      if (this.onCancel) {
        this.onCancel();
      }
      this.hide();
      return { type: 'cancel' };
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
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, this.modalX, this.modalY, this.modalWidth, this.modalHeight, 12);
    ctx.fill();
    ctx.stroke();

    // 绘制标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('观看广告获得奖励', this.modalX + this.modalWidth / 2, this.modalY + 40);

    // 绘制说明文字
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('观看一个短视频广告', this.modalX + this.modalWidth / 2, this.modalY + 70);
    ctx.fillText('即可获得', this.modalX + this.modalWidth / 2, this.modalY + 90);

    // 绘制奖励金额
    ctx.fillStyle = '#27AE60';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const rewardText = formatMoney(this.rewardAmount);
    ctx.fillText(rewardText, this.modalX + this.modalWidth / 2, this.modalY + 115);

    // 绘制确定按钮
    const confirmButtonX = this.modalX + 20;
    const confirmButtonY = this.modalY + this.modalHeight - 50;
    const confirmButtonWidth = 100;
    const confirmButtonHeight = 30;

    ctx.fillStyle = '#27AE60';
    drawRoundRect(ctx, confirmButtonX, confirmButtonY, confirmButtonWidth, confirmButtonHeight, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('观看广告', confirmButtonX + confirmButtonWidth / 2, confirmButtonY + 20);

    // 绘制取消按钮
    const cancelButtonX = this.modalX + this.modalWidth - 120;
    const cancelButtonY = this.modalY + this.modalHeight - 50;
    const cancelButtonWidth = 100;
    const cancelButtonHeight = 30;

    ctx.fillStyle = '#95A5A6';
    drawRoundRect(ctx, cancelButtonX, cancelButtonY, cancelButtonWidth, cancelButtonHeight, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('取消', cancelButtonX + cancelButtonWidth / 2, cancelButtonY + 20);

    ctx.restore();
  }
} 