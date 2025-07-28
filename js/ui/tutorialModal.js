import { drawRoundRect } from './utils.js';

/**
 * 教学对话框
 * 首次进入游戏时显示的教学界面
 * 基于Figma设计稿的游戏化对话界面
 */
export default class TutorialModal {
  constructor() {
    this.isVisible = false;
    this.onComplete = null; // 完成教学的回调
    
    // 根据Figma设计稿的尺寸和位置
    this.dialogWidth = 313;
    this.dialogHeight = 232;
    this.dialogX = 0;
    this.dialogY = 0;
    
    // 人物头像区域
    this.avatarWidth = 86.86;
    this.avatarHeight = 152;
    this.avatarX = 0;
    this.avatarY = 0;
    
    // 对话气泡区域
    this.bubbleWidth = 313;
    this.bubbleHeight = 116;
    this.bubbleX = 0;
    this.bubbleY = 0;
    
    // 人物名字标签
    this.nameTagWidth = 87;
    this.nameTagHeight = 28;
    this.nameTagX = 0;
    this.nameTagY = 0;
    
    // 加载人物头像
    this.avatarImage = null;
    this.loadAvatarImage();
  }

  /**
   * 加载人物头像图片
   */
  loadAvatarImage() {
    // 兼容微信小程序和浏览器环境
    let img;
    if (typeof wx !== 'undefined' && wx.createImage) {
      // 微信小程序环境
      img = wx.createImage();
    } else if (typeof Image !== 'undefined') {
      // 浏览器环境
      img = new Image();
    } else {
      // 如果都不可用，创建空对象避免错误
      img = { complete: false, src: '' };
      return;
    }
    
    img.src = 'images/guide_1.png'; // 使用Figma设计稿中的教学头像
    img.onload = () => {
      this.avatarImage = img;
    };
    img.onerror = () => {
      console.error('教学对话框头像加载失败');
    };
  }

  /**
   * 显示教学对话框
   */
  show(canvasWidth, canvasHeight, onComplete = null) {
    this.isVisible = true;
    this.onComplete = onComplete;
    
    // 根据Figma设计稿计算位置（右下角区域）
    this.dialogX = 80; // Figma中的x位置
    this.dialogY = canvasHeight - 297; // 从底部向上297px（232 + 55底部导航栏 + 10边距）
    
    // 计算子元素位置
    this.avatarX = this.dialogX + 211;
    this.avatarY = this.dialogY;
    
    this.bubbleX = this.dialogX;
    this.bubbleY = this.dialogY + 116;
    
    this.nameTagX = this.dialogX + 198;
    this.nameTagY = this.dialogY + 218; // 102 + 116
  }

  /**
   * 隐藏教学对话框
   */
  hide() {
    this.isVisible = false;
    this.onComplete = null;
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;
    
    // 检查是否点击了对话框区域（整个区域都可以点击关闭）
    if (x >= this.dialogX && x <= this.dialogX + this.dialogWidth &&
        y >= this.dialogY && y <= this.dialogY + this.dialogHeight) {
      
      // 执行完成回调
      if (this.onComplete) {
        this.onComplete();
      }
      
      this.hide();
      return { type: 'complete' };
    }
    
    return null; // 允许其他事件处理
  }

  /**
   * 渲染教学对话框
   */
  render(ctx) {
    if (!this.isVisible) return;
    
    ctx.save();
    
    // 绘制人物头像（如果已加载）
    if (this.avatarImage) {
      ctx.drawImage(
        this.avatarImage,
        this.avatarX,
        this.avatarY,
        this.avatarWidth,
        this.avatarHeight
      );
    }
    
    // 绘制外层对话气泡（黄色 #F7B500）
    ctx.fillStyle = '#F7B500';
    drawRoundRect(ctx, this.bubbleX, this.bubbleY, this.bubbleWidth, this.bubbleHeight, 32);
    ctx.fill();
    
    // 绘制内层对话气泡（浅黄色 #FCE643）
    const innerBubbleX = this.bubbleX + 10;
    const innerBubbleY = this.bubbleY + 10;
    const innerBubbleWidth = this.bubbleWidth - 20;
    const innerBubbleHeight = this.bubbleHeight - 20;
    
    ctx.fillStyle = '#FCE643';
    drawRoundRect(ctx, innerBubbleX, innerBubbleY, innerBubbleWidth, innerBubbleHeight, 28);
    ctx.fill();
    
    // 绘制对话文本
    ctx.fillStyle = '#000000';
    ctx.font = '400 12px Arial, "Reem Kufi"'; // 使用Arial作为后备字体
    ctx.textAlign = 'left';
    
    const textX = innerBubbleX + 11.69;
    const textY = innerBubbleY + 16;
    const textWidth = 267;
    const lineHeight = 18; // 12px * 1.5
    
    // 分行显示文本
    const text = '欢迎来到时代之都 — 天州！你的目标是成为天州首富。';
    const lines = this.wrapText(ctx, text, textWidth);
    
    lines.forEach((line, index) => {
      ctx.fillText(line, textX, textY + index * lineHeight);
    });
    
    // 绘制人物名字标签背景（橙色 #F1AB71）
    ctx.fillStyle = '#F1AB71';
    drawRoundRect(ctx, this.nameTagX, this.nameTagY, this.nameTagWidth, this.nameTagHeight, 20);
    ctx.fill();
    
    // 绘制人物名字
    ctx.fillStyle = '#000000';
    ctx.font = '700 12px Arial, "Reem Kufi"';
    ctx.textAlign = 'center';
    ctx.fillText(
      '洛凌凌',
      this.nameTagX + this.nameTagWidth / 2,
      this.nameTagY + this.nameTagHeight / 2 + 4
    );
    
    ctx.restore();
  }
  
  /**
   * 文本换行处理
   */
  wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let word of words) {
      const testLine = currentLine + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
} 