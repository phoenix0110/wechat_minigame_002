import { formatPropertyPrice } from '../config/realEstateConfig.js';
import { CHART_TIME_CONFIG } from '../config/timeConfig.js';

/**
 * 房产历史价格弹窗
 * 显示单个房产过去1小时的价格变化
 */
export default class PropertyHistoryModal {
  constructor() {
    this.isVisible = false;
    this.property = null;
    // 按照 Figma 设计调整弹窗尺寸
    this.modalWidth = 339; // padding: 20px 12px, content: 315px
    this.modalHeight = 327; // 按照 Figma 固定高度
    this.modalX = 0;
    this.modalY = 0;
    this.selectedTimeRange = '1hour'; // 默认选择过去1小时，与资产趋势保持一致
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

    // 检查是否点击了时间范围按钮
    const timeRangeY = this.modalY + 52;
    const timeRangeHeight = 20;
    const timeRangeWidth = 315;
    const timeRangeX = this.modalX + 12;
    
    if (y >= timeRangeY && y <= timeRangeY + timeRangeHeight && 
        x >= timeRangeX && x <= timeRangeX + timeRangeWidth) {
      // 计算点击了哪个时间范围按钮
      const buttonWidth = timeRangeWidth / 3;
      if (x >= timeRangeX && x < timeRangeX + buttonWidth) {
        this.selectedTimeRange = '1hour';
      } else if (x >= timeRangeX + buttonWidth && x < timeRangeX + buttonWidth * 2) {
        this.selectedTimeRange = '12hours';
      } else if (x >= timeRangeX + buttonWidth * 2 && x <= timeRangeX + timeRangeWidth) {
        this.selectedTimeRange = '24hours';
      }
      return null; // 保持弹窗打开，只是切换时间范围
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
   * 绘制圆角矩形辅助方法
   */
  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * 渲染弹窗 - 按照 Figma 设计 (node-id=82-1079)
   */
  render(ctx) {
    if (!this.isVisible || !this.property) return;

    ctx.save();

    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制弹窗背景 - 白色背景，8px圆角，黑色边框
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundRect(ctx, this.modalX, this.modalY, this.modalWidth, this.modalHeight, 8);
    ctx.fill();
    
    // 绘制弹窗边框
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 1. 标题区域 - gap: 96px (但只有一个元素，所以不需要gap)
    const titleY = this.modalY + 20;
    ctx.fillStyle = '#000000';
    ctx.font = '400 12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.property.name}的价格趋势`, this.modalX + 12, titleY + 15);

    // 2. 时间范围选择器 - mode: row, justifyContent: center, gap: 20px
    const timeRangeY = this.modalY + 52;
    const timeRangeWidth = 315;
    const timeRangeX = this.modalX + 12;
    
    const timeRanges = [
      { key: '1hour', label: '过去1小时', active: this.selectedTimeRange === '1hour' },
      { key: '12hours', label: '过去12小时', active: this.selectedTimeRange === '12hours' },
      { key: '24hours', label: '过去24小时', active: this.selectedTimeRange === '24hours' }
    ];
    
    // 计算每个时间范围按钮的位置
    const buttonSpacing = 20;
    const buttonWidth = (timeRangeWidth - buttonSpacing * 2) / 3;
    
    timeRanges.forEach((range, index) => {
      const buttonX = timeRangeX + index * (buttonWidth + buttonSpacing);
      
      if (range.active) {
        // 激活状态 - 紫色文字
        ctx.fillStyle = '#6425FE';
        ctx.font = '500 12px Inter';
      } else {
        // 非激活状态 - 灰色文字
        ctx.fillStyle = '#838383';
        ctx.font = '400 12px Inter';
      }
      
      ctx.textAlign = 'center';
      ctx.fillText(range.label, buttonX + buttonWidth / 2, timeRangeY + 15);
      
      // 绘制分隔线（除了最后一个）
      if (index < timeRanges.length - 1) {
        ctx.strokeStyle = 'rgba(131, 131, 131, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(buttonX + buttonWidth + buttonSpacing / 2, timeRangeY);
        ctx.lineTo(buttonX + buttonWidth + buttonSpacing / 2, timeRangeY + 20);
        ctx.stroke();
      }
    });

    // 3. 图表区域
    this.renderPriceChart(ctx);

    // 4. 底部统计信息 - 根据选择的时间范围显示最高/最低
    const statsY = this.modalY + 282;
    
    // 根据时间范围确定标签文字
    const timeRangeLabel = this.selectedTimeRange === '1hour' ? '过去1小时' : 
                          this.selectedTimeRange === '12hours' ? '过去12小时' : '过去24小时';
    
    // 获取对应时间范围的价格数据
    const priceData = this.getPriceDataByTimeRange();
    
    if (priceData.length > 0) {
      const prices = priceData.map(record => record.price);
      const highestPrice = Math.max(...prices);
      const lowestPrice = Math.min(...prices);
      
      // 最高价格
      ctx.fillStyle = '#838383';
      ctx.font = '400 12px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`${timeRangeLabel}最高`, this.modalX + 12, statsY);
      
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '500 14px Everett, Inter';
      ctx.fillText(this.formatPriceInWan(highestPrice), this.modalX + 12, statsY + 18);
      
      // 最低价格
      ctx.fillStyle = '#838383';
      ctx.font = '400 12px Inter';
      ctx.fillText(`${timeRangeLabel}最低`, this.modalX + 12 + 96 + 60, statsY);
      
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '500 14px Everett, Inter';
      ctx.fillText(this.formatPriceInWan(lowestPrice), this.modalX + 12 + 96 + 60, statsY + 18);
    }

    // 5. 时间轴标签 - 显示实际时间
    const timeAxisY = this.modalY + 256;
    const timeAxisX = this.modalX + 79;
    
    // 渲染实际时间标签
    this.renderTimeLabels(ctx, timeAxisX, timeAxisX + 78, timeAxisX + 156, timeAxisY);

    ctx.restore();
  }

  /**
   * 绘制价格历史图表 - 按照 Figma 设计
   */
  renderPriceChart(ctx) {
    // 图表区域位置和尺寸
    const chartAreaX = this.modalX + 12;
    const chartAreaY = this.modalY + 92; // 20px gap from time range
    const chartAreaWidth = 316;
    const chartAreaHeight = 160;
    
    // Y轴标签区域
    const yAxisX = chartAreaX;
    const yAxisY = chartAreaY + 8;
    const yAxisWidth = 62;
    
    // 实际图表区域
    const chartX = chartAreaX + yAxisWidth;
    const chartY = chartAreaY;
    const chartWidth = 254;
    const chartHeight = 160;

    // 绘制Y轴价格标签 - 基于选择时间范围的价格数据
    const priceData = this.getPriceDataByTimeRange();
    
    let maxPrice = this.property.currentPrice;
    let minPrice = this.property.currentPrice;
    
    if (priceData.length > 0) {
      const prices = priceData.map(record => record.price);
      maxPrice = Math.max(...prices);
      minPrice = Math.min(...prices);
    }
    
    // 扩展价格范围5%以获得更好的视觉效果
    const priceRange = maxPrice - minPrice || this.property.currentPrice * 0.1;
    const expandedMax = maxPrice + priceRange * 0.05;
    const expandedMin = Math.max(0, minPrice - priceRange * 0.05);
    
    // 生成4个均匀分布的价格标签 - 以万为单位显示
    const priceLabels = [];
    for (let i = 0; i < 4; i++) {
      const price = expandedMax - (i * (expandedMax - expandedMin) / 3);
      priceLabels.push(this.formatPriceInWan(price));
    }
    
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Everett, Inter';
    ctx.textAlign = 'right';
    
    priceLabels.forEach((label, index) => {
      const labelY = yAxisY + (index * 32) + 15; // gap: 32px
      ctx.fillText(label, yAxisX + yAxisWidth - 5, labelY);
    });

    // 绘制图表背景网格 - 紫色虚线边框，30%透明度
    const gridRects = [
      { x: chartX, y: chartY, width: 83.33, height: 160 },
      { x: chartX + 170.67, y: chartY, width: 83.33, height: 160 },
      { x: chartX, y: chartY + 50.85, width: 254, height: 58.29 }
    ];
    
    ctx.strokeStyle = '#6F6AF8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]); // 虚线
    ctx.globalAlpha = 0.3;
    
    gridRects.forEach(rect => {
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    });
    
    ctx.setLineDash([]); // 重置为实线
    ctx.globalAlpha = 1.0;

    // 绘制价格曲线区域填充 - 渐变色
    const gradient = ctx.createLinearGradient(0, chartY, 0, chartY + 143);
    gradient.addColorStop(0, 'rgba(100, 37, 254, 0.68)');
    gradient.addColorStop(1, 'rgba(100, 37, 254, 0)');
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.2;
    
    // 基于选择时间范围的价格数据绘制曲线
    const dataPoints = priceData.map(record => record.price);
    
    // 如果数据点少于2个，添加当前价格作为最后一个点
    if (dataPoints.length < 2) {
      dataPoints.push(this.property.currentPrice);
    }
    
    // 计算曲线路径点
    const curvePoints = [];
    for (let i = 0; i < dataPoints.length; i++) {
      const price = dataPoints[i];
      const plotX = chartX + (i * chartWidth / Math.max(1, dataPoints.length - 1));
      const plotY = chartY + chartHeight - ((price - expandedMin) / (expandedMax - expandedMin)) * chartHeight;
      curvePoints.push({ x: plotX, y: Math.max(chartY, Math.min(chartY + chartHeight, plotY)) });
    }
    
    // 绘制填充区域
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    
    curvePoints.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    
    // 闭合填充区域
    ctx.lineTo(curvePoints[curvePoints.length - 1].x, chartY + chartHeight);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 1.0;

    // 绘制价格曲线 - 紫色线条，50%透明度
    ctx.strokeStyle = 'rgba(100, 37, 254, 0.5)';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1.0;
    
    ctx.beginPath();
    curvePoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }

  /**
   * 格式化价格为万单位显示
   */
  formatPriceInWan(price) {
    if (price >= 10000) {
      const wan = price / 10000;
      if (wan >= 100) {
        return Math.round(wan).toLocaleString() + '万';
      } else {
        return wan.toFixed(1) + '万';
      }
    } else {
      return Math.round(price).toLocaleString();
    }
  }

  /**
   * 渲染时间轴标签 - 与资产记录保持一致
   */
  renderTimeLabels(ctx, x1, x2, x3, y) {
    const now = Date.now();
    let format;
    
    switch (this.selectedTimeRange) {
      case '1hour':
        // 10分钟间隔，显示 HH:MM 格式
        format = (timestamp) => {
          const date = new Date(timestamp);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        };
        break;
      case '12hours':
      case '24hours':
        // 1小时间隔，显示 X am/pm 格式
        format = (timestamp) => {
          const date = new Date(timestamp);
          const hours = date.getHours();
          return hours === 0 ? '12 am' : hours <= 12 ? `${hours} am` : `${hours - 12} pm`;
        };
        break;
    }
    
    // 计算三个时间点
        const timeRangeMs = this.selectedTimeRange === '1hour' ? CHART_TIME_CONFIG.TIME_RANGES.ONE_HOUR :
                       this.selectedTimeRange === '12hours' ? CHART_TIME_CONFIG.TIME_RANGES.TWELVE_HOURS :
                       CHART_TIME_CONFIG.TIME_RANGES.TWENTY_FOUR_HOURS;
    
    const startTime = now - timeRangeMs;
    const time1 = startTime;
    const time2 = startTime + timeRangeMs / 2;
    const time3 = now;
    
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(format(time1), x1, y);
    ctx.fillText(format(time2), x2, y);
    ctx.fillText(format(time3), x3, y);
  }

  /**
   * 根据选择的时间范围获取价格数据
   */
  getPriceDataByTimeRange() {
    const now = Date.now();
    const priceHistory = this.property.priceHistory || [];
    
    // 添加当前价格作为最新数据点
    const currentData = {
      timestamp: now,
      price: this.property.currentPrice
    };
    
    let timeRange;
    switch (this.selectedTimeRange) {
      case '1hour':
        timeRange = CHART_TIME_CONFIG.TIME_RANGES.ONE_HOUR;
        break;
      case '12hours':
        timeRange = CHART_TIME_CONFIG.TIME_RANGES.TWELVE_HOURS;
        break;
      case '24hours':
        timeRange = CHART_TIME_CONFIG.TIME_RANGES.TWENTY_FOUR_HOURS;
        break;
      default:
        timeRange = CHART_TIME_CONFIG.TIME_RANGES.ONE_HOUR;
    }
    
    const cutoffTime = now - timeRange;
    const filteredHistory = priceHistory.filter(record => record.timestamp >= cutoffTime);
    
    // 合并历史数据和当前数据
    return [...filteredHistory, currentData];
  }
} 