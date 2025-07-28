/**
 * 圆形倒计时器组件
 * 参照Figma设计样式实现
 */
export default class CircularTimer {
  constructor() {
    this.size = 60; // 倒计时器大小
    this.strokeWidth = 4; // 边框宽度
    this.activeColor = '#00C2FF'; // 蓝色进度条
    this.inactiveColor = '#FFFFFF'; // 白色背景
    this.textColor = '#00C2FF'; // 文字颜色
    this.shadowColor = 'rgba(0, 194, 255, 0.3)'; // 阴影颜色
  }

  /**
   * 渲染圆形倒计时器
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   * @param {number} x - 中心点x坐标
   * @param {number} y - 中心点y坐标
   * @param {number} remainingTime - 剩余时间（秒）
   * @param {number} totalTime - 总时间（秒）
   */
  render(ctx, x, y, remainingTime, totalTime) {
    const centerX = x;
    const centerY = y;
    const radius = (this.size - this.strokeWidth) / 2;
    const progress = Math.max(0, Math.min(1, remainingTime / totalTime));
    
    ctx.save();
    
    // 绘制外圆阴影效果
    ctx.shadowColor = this.shadowColor;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    // 绘制白色背景圆
    ctx.fillStyle = this.inactiveColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 绘制进度圆弧
    if (progress > 0) {
      ctx.strokeStyle = this.activeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.lineCap = 'round';
      
      // 从顶部开始，顺时针绘制
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (2 * Math.PI * progress);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.stroke();
    }
    
    // 绘制白色边框
    ctx.strokeStyle = this.inactiveColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制剩余时间文字 - 使用蓝色数字
    const timeText = this.formatTime(remainingTime);
    ctx.fillStyle = this.activeColor; // 使用蓝色 #00C2FF
    ctx.font = '600 14px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 添加文字阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(timeText, centerX, centerY);
    
    ctx.restore();
  }

  /**
   * 格式化时间显示
   * @param {number} seconds - 秒数
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(seconds) {
    const totalSeconds = Math.ceil(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `00:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * 获取倒计时器尺寸
   * @returns {number} 倒计时器直径
   */
  getSize() {
    return this.size;
  }
} 