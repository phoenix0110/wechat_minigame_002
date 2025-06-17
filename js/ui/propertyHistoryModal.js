import { formatPropertyPrice } from '../config/realEstateConfig.js';

/**
 * 房产历史价格弹窗
 * 显示单个房产过去1小时的价格变化
 */
export default class PropertyHistoryModal {
  constructor() {
    this.isVisible = false;
    this.property = null;
    this.modalWidth = 400;
    this.modalHeight = 350;
    this.modalX = 0;
    this.modalY = 0;
  }

  /**
   * 显示弹窗
   */
  show(canvasWidth, canvasHeight, property) {
    this.isVisible = true;
    this.property = property;
    
    // 计算弹窗位置（居中显示）
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    this.property = null;
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 检查是否点击了关闭按钮
    const closeButtonX = this.modalX + this.modalWidth - 35;
    const closeButtonY = this.modalY + 10;
    const closeButtonSize = 25;

    if (x >= closeButtonX && x <= closeButtonX + closeButtonSize &&
        y >= closeButtonY && y <= closeButtonY + closeButtonSize) {
      this.hide();
      return { type: 'close' };
    }

    // 检查是否点击了弹窗外部
    if (x < this.modalX || x > this.modalX + this.modalWidth ||
        y < this.modalY || y > this.modalY + this.modalHeight) {
      this.hide();
      return { type: 'close' };
    }

    return null;
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible || !this.property) return;

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制弹窗背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制弹窗边框
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制标题栏
    ctx.fillStyle = '#3498DB';
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, 40);

    // 绘制标题文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.property.icon} ${this.property.name} - 价格历史`, this.modalX + 15, this.modalY + 25);

    // 绘制关闭按钮
    const closeButtonX = this.modalX + this.modalWidth - 35;
    const closeButtonY = this.modalY + 10;
    const closeButtonSize = 25;

    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', closeButtonX + closeButtonSize / 2, closeButtonY + 17);

    // 绘制当前价格信息
    const currentInfoY = this.modalY + 60;
    ctx.fillStyle = '#2C3E50';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`当前价格: ${formatPropertyPrice(this.property.currentPrice)}`, this.modalX + 15, currentInfoY);
    
    const historyText = `历史价格记录（过去1小时，共${this.property.priceHistory.length}个记录点）`;
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '12px Arial';
    ctx.fillText(historyText, this.modalX + 15, currentInfoY + 20);

    // 绘制价格历史图表
    this.renderPriceChart(ctx);
  }

  /**
   * 绘制价格历史图表
   */
  renderPriceChart(ctx) {
    if (!this.property.priceHistory || this.property.priceHistory.length < 2) {
      // 数据不足，显示提示
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('历史数据收集中...', this.modalX + this.modalWidth / 2, this.modalY + this.modalHeight / 2);
      return;
    }

    const chartX = this.modalX + 20;
    const chartY = this.modalY + 100;
    const chartWidth = this.modalWidth - 40;
    const chartHeight = this.modalHeight - 150;

    // 绘制图表背景
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(chartX, chartY, chartWidth, chartHeight);
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);

    const priceHistory = this.property.priceHistory;
    
    // 找到价格的最大值和最小值
    let maxPrice = Math.max(...priceHistory.map(record => record.price));
    let minPrice = Math.min(...priceHistory.map(record => record.price));
    
    // 添加5%的边距
    const priceRange = maxPrice - minPrice;
    const margin = priceRange * 0.05 || 1000; // 避免除零错误
    maxPrice += margin;
    minPrice = Math.max(0, minPrice - margin);

    // 绘制网格线
    ctx.strokeStyle = '#E8E8E8';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gridY = chartY + (i * chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(chartX, gridY);
      ctx.lineTo(chartX + chartWidth, gridY);
      ctx.stroke();
    }

    // 绘制Y轴标签（价格）
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const labelY = chartY + (i * chartHeight / 4) + 3;
      const price = maxPrice - (i * (maxPrice - minPrice) / 4);
      ctx.fillText(formatPropertyPrice(price), chartX - 5, labelY);
    }

    // 绘制价格折线
    if (priceHistory.length > 1) {
      ctx.strokeStyle = '#3498DB';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < priceHistory.length; i++) {
        const record = priceHistory[i];
        const plotX = chartX + (i * chartWidth / (priceHistory.length - 1));
        const plotY = chartY + chartHeight - ((record.price - minPrice) / (maxPrice - minPrice)) * chartHeight;

        if (i === 0) {
          ctx.moveTo(plotX, plotY);
        } else {
          ctx.lineTo(plotX, plotY);
        }
      }
      ctx.stroke();

      // 绘制数据点
      ctx.fillStyle = '#3498DB';
      for (let i = 0; i < priceHistory.length; i++) {
        const record = priceHistory[i];
        const plotX = chartX + (i * chartWidth / (priceHistory.length - 1));
        const plotY = chartY + chartHeight - ((record.price - minPrice) / (maxPrice - minPrice)) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(plotX, plotY, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 绘制X轴标签（时间）
    const now = Date.now();
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    
    // 显示起始时间和结束时间
    if (priceHistory.length > 0) {
      const firstRecord = priceHistory[0];
      const lastRecord = priceHistory[priceHistory.length - 1];
      
      const firstMinutesAgo = Math.floor((now - firstRecord.timestamp) / 60000);
      const lastMinutesAgo = Math.floor((now - lastRecord.timestamp) / 60000);
      
      ctx.fillText(`${firstMinutesAgo}分钟前`, chartX, chartY + chartHeight + 15);
      ctx.fillText(`${lastMinutesAgo}分钟前`, chartX + chartWidth, chartY + chartHeight + 15);
      
      // 显示中间时间点
      if (priceHistory.length > 4) {
        const midIndex = Math.floor(priceHistory.length / 2);
        const midRecord = priceHistory[midIndex];
        const midMinutesAgo = Math.floor((now - midRecord.timestamp) / 60000);
        const midX = chartX + (midIndex * chartWidth / (priceHistory.length - 1));
        ctx.fillText(`${midMinutesAgo}分钟前`, midX, chartY + chartHeight + 15);
      }
    }

    // 显示涨跌信息
    if (priceHistory.length >= 2) {
      const firstPrice = priceHistory[0].price;
      const lastPrice = priceHistory[priceHistory.length - 1].price;
      const change = lastPrice - firstPrice;
      const changePercent = ((change / firstPrice) * 100).toFixed(2);
      
      const changeColor = change >= 0 ? '#27AE60' : '#E74C3C';
      const changeSymbol = change >= 0 ? '+' : '';
      
      ctx.fillStyle = changeColor;
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `总变化: ${changeSymbol}${formatPropertyPrice(Math.abs(change))} (${changeSymbol}${changePercent}%)`,
        this.modalX + 15,
        this.modalY + this.modalHeight - 15
      );
    }
  }
} 