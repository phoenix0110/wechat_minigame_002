import { drawRoundRect, formatMoney } from './utils.js';

/**
 * 房屋升级确认弹窗 - 参考购买确认弹窗的设计 (node-id=80-908)
 */
export default class UpgradeConfirmModal {
  constructor() {
    this.isVisible = false;
    this.property = null;
    this.upgradeCost = 0;
    this.onConfirm = null;
    this.onCancel = null;
  }

  /**
   * 显示弹窗
   */
  show(property, onConfirm = null, onCancel = null) {
    this.isVisible = true;
    this.property = property;
    // 计算升级费用：房产实时价格的10分之1
    this.upgradeCost = Math.round(property.currentPrice * 0.1);
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    this.property = null;
    this.upgradeCost = 0;
    this.onConfirm = null;
    this.onCancel = null;
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 弹窗尺寸：290x194px，居中显示
    const modalWidth = 290;
    const modalHeight = 194;
    const modalX = (canvas.width - modalWidth) / 2;
    const modalY = (canvas.height - modalHeight) / 2;

    // 检查是否点击在弹窗外部 (关闭弹窗)
    if (x < modalX || x > modalX + modalWidth || y < modalY || y > modalY + modalHeight) {
      this.hide();
      if (this.onCancel) this.onCancel();
      return { type: 'cancel' };
    }

    // 确认按钮：位置 (20, 118)，尺寸 120x48px
    const confirmButtonX = modalX + 20;
    const confirmButtonY = modalY + 118;
    const confirmButtonWidth = 120;
    const confirmButtonHeight = 48;
    
    if (x >= confirmButtonX && x <= confirmButtonX + confirmButtonWidth &&
        y >= confirmButtonY && y <= confirmButtonY + confirmButtonHeight) {
      // 保存property引用，避免在hide()中被清空
      const propertyToReturn = this.property;
      const costToReturn = this.upgradeCost;
      this.hide();
      return { type: 'confirm', property: propertyToReturn, upgradeCost: costToReturn };
    }

    // 取消按钮：位置 (150, 118)，尺寸 120x48px
    const cancelButtonX = modalX + 150;
    const cancelButtonY = modalY + 118;
    const cancelButtonWidth = 120;
    const cancelButtonHeight = 48;
    
    if (x >= cancelButtonX && x <= cancelButtonX + cancelButtonWidth &&
        y >= cancelButtonY && y <= cancelButtonY + cancelButtonHeight) {
      this.hide();
      if (this.onCancel) this.onCancel();
      return { type: 'cancel' };
    }

    return null;
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible || !this.property) return;

    ctx.save();

    // 绘制半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 弹窗尺寸和位置 - 按照 Figma 设计：290x194px
    const modalWidth = 290;
    const modalHeight = 194;
    const modalX = (canvas.width - modalWidth) / 2;
    const modalY = (canvas.height - modalHeight) / 2;

    // 绘制弹窗背景 - 淡绿色背景，29px圆角，blur效果
    ctx.fillStyle = '#EBFFEE';
    drawRoundRect(ctx, modalX, modalY, modalWidth, modalHeight, 29);
    ctx.fill();

    // 绘制弹窗阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 主文本 - 位置 (20, 53)，宽度 250px
    const textX = modalX + 20;
    const textY = modalY + 53;
    const textWidth = 250;
    
    ctx.fillStyle = '#000000';
    ctx.font = '400 15px "Noto Sans", Inter';
    ctx.textAlign = 'center';
    
    const confirmText = `你是否愿意花费${formatMoney(this.upgradeCost)}升级这处房产？`;
    ctx.fillText(confirmText, textX + textWidth / 2, textY + 20);

    // 确认按钮 - 位置 (20, 118)，尺寸 120x48px，绿色背景
    const confirmButtonX = modalX + 20;
    const confirmButtonY = modalY + 118;
    const confirmButtonWidth = 120;
    const confirmButtonHeight = 48;
    
    ctx.fillStyle = '#24B874';
    drawRoundRect(ctx, confirmButtonX, confirmButtonY, confirmButtonWidth, confirmButtonHeight, 27);
    ctx.fill();
    
    // 确认按钮白色边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 确认按钮文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '400 16px "Noto Sans", Inter';
    ctx.textAlign = 'center';
    ctx.fillText('确认！', confirmButtonX + confirmButtonWidth / 2, confirmButtonY + confirmButtonHeight / 2 + 5);

    // 取消按钮 - 位置 (150, 118)，尺寸 120x48px，红色背景
    const cancelButtonX = modalX + 150;
    const cancelButtonY = modalY + 118;
    const cancelButtonWidth = 120;
    const cancelButtonHeight = 48;
    
    ctx.fillStyle = '#FCB3AD';
    drawRoundRect(ctx, cancelButtonX, cancelButtonY, cancelButtonWidth, cancelButtonHeight, 27);
    ctx.fill();
    
    // 取消按钮白色边框
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 取消按钮文字
    ctx.fillStyle = '#000000';
    ctx.font = '400 16px "Noto Sans", Inter';
    ctx.textAlign = 'center';
    ctx.fillText('取消！', cancelButtonX + cancelButtonWidth / 2, cancelButtonY + cancelButtonHeight / 2 + 5);

    ctx.restore();
  }
} 