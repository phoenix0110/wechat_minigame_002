// 移除formatPropertyPrice的导入，统一使用formatMoney
import { drawRoundRect, formatMoney } from './utils.js';
import { TIME_AXIS_CONFIG } from '../config/timeConfig.js';

/**
 * 房产历史价格弹窗
 * 显示单个房产过去30分钟的价格变化
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
    // 移除时间选择，固定显示过去30分钟
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

    // 检查是否点击了弹窗外部
    if (x < this.modalX || x > this.modalX + this.modalWidth ||
        y < this.modalY || y > this.modalY + this.modalHeight) {
      this.hide();
      return { type: 'close' };
    }

    return null;
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
    drawRoundRect(ctx, this.modalX, this.modalY, this.modalWidth, this.modalHeight, 8);
    ctx.fill();
    
    // 绘制弹窗边框
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 1. 标题区域
    const titleY = this.modalY + 20;
    ctx.fillStyle = '#000000';
    ctx.font = '400 12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.property.name}的过去30分钟房价走势`, this.modalX + 12, titleY + 15);
    // 3. 图表区域
    this.renderPriceChart(ctx);

    // 4. 底部统计信息 - 固定显示过去30分钟的数据
    const statsY = this.modalY + 282;
    
    // 固定显示过去30分钟的标签
    const timeRangeLabel = '过去30分钟';
    
    // 获取过去30分钟的价格数据
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
      ctx.fillText(formatMoney(highestPrice), this.modalX + 12, statsY + 18);
      
      // 最低价格
      ctx.fillStyle = '#838383';
      ctx.font = '400 12px Inter';
      ctx.fillText(`${timeRangeLabel}最低`, this.modalX + 12 + 96 + 60, statsY);
      
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '500 14px Everett, Inter';
      ctx.fillText(formatMoney(lowestPrice), this.modalX + 12 + 96 + 60, statsY + 18);
    }

    ctx.restore();
  }

  /**
   * 绘制价格历史图表 - 按照 Figma 设计，支持时间轴留白效果
   */
  renderPriceChart(ctx) {
    // 图表区域位置和尺寸
    const chartAreaX = this.modalX + 12;
    const chartAreaY = this.modalY + 60; // 20px gap from time range
    
    // Y轴标签区域
    const yAxisX = chartAreaX;
    const yAxisWidth = 62;
    
    // 实际图表区域
    const chartX = chartAreaX + yAxisWidth;
    const chartY = chartAreaY;
    const chartWidth = 254;
    const chartHeight = 150;

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
    const priceLabelValues = [];
    for (let i = 0; i < 4; i++) {
      const price = expandedMax - (i * (expandedMax - expandedMin) / 3);
      priceLabels.push(formatMoney(price));
      priceLabelValues.push(price);
    }
    
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Everett, Inter';
    ctx.textAlign = 'right';
    
    priceLabels.forEach((label, index) => {
      // 修正Y轴标签位置，确保与网格线居中对齐
      const labelY = chartY + (index * (chartHeight / 3)) + 4; // 使用chartY作为基准，+4用于文字垂直居中
      ctx.fillText(label, yAxisX + yAxisWidth - 5, labelY);
    });

    // 绘制图表背景网格 - 按照Figma设计，水平和垂直网格线
    ctx.strokeStyle = '#6F6AF8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]); // 虚线
    ctx.globalAlpha = 0.3;
    
    // 绘制水平网格线 - 与Y轴标签对齐
    for (let i = 0; i < 4; i++) {
      const gridY = chartY + (i * chartHeight / 3);
      ctx.beginPath();
      ctx.moveTo(chartX, gridY);
      ctx.lineTo(chartX + chartWidth, gridY);
      ctx.stroke();
    }
    
    // 绘制垂直网格线 - 按照时间轴刻度（每15分钟，共6个刻度）
    const tickCount = TIME_AXIS_CONFIG.TICK_COUNT;
    for (let i = 0; i < tickCount; i++) {
      const gridX = chartX + (i * chartWidth / (tickCount - 1));
      ctx.beginPath();
      ctx.moveTo(gridX, chartY);
      ctx.lineTo(gridX, chartY + chartHeight);
      ctx.stroke();
    }
    
    ctx.setLineDash([]); // 重置为实线
    ctx.globalAlpha = 1.0;

    // 获取游戏时间管理器以计算时间轴覆盖范围
    const gameTimeManager = (typeof window !== 'undefined') ? 
      window.gameTimeManager : GameGlobal.gameTimeManager;

    const currentGameTime = gameTimeManager.getTotalGameTime();
    const totalAxisMs = TIME_AXIS_CONFIG.AXIS_LENGTH; // 30分钟总时间轴长度
    const dataLengthMs = TIME_AXIS_CONFIG.DATA_LENGTH; // 30分钟数据显示长度
    
    // 计算时间轴覆盖范围（基于数据显示长度）
    let timeAxisCoverage = 1.0; // 默认覆盖整个数据区域
    if (currentGameTime < dataLengthMs) {
      // 游戏时间不足30分钟，计算覆盖比例
      timeAxisCoverage = currentGameTime / dataLengthMs;
    }    
    // 计算价格数据点的时间位置
    const dataPointsWithPositions = this.calculateDataPointPositions(
      priceData, 
      chartX, 
      chartWidth, 
      currentGameTime, 
      totalAxisMs
    );
    
    // 绘制价格曲线区域填充 - 渐变色
    if (dataPointsWithPositions.length > 1) {
      const gradient = ctx.createLinearGradient(0, chartY, 0, chartY + chartHeight);
      gradient.addColorStop(0, 'rgba(100, 37, 254, 0.2)');
      gradient.addColorStop(1, 'rgba(100, 37, 254, 0)');
      
      ctx.fillStyle = gradient;
      
      // 绘制填充区域
      ctx.beginPath();
      ctx.moveTo(chartX, chartY + chartHeight);
      
      dataPointsWithPositions.forEach((point, index) => {
        const plotY = chartY + chartHeight - ((point.price - expandedMin) / (expandedMax - expandedMin)) * chartHeight;
        const clampedY = Math.max(chartY, Math.min(chartY + chartHeight, plotY));
        
        ctx.lineTo(point.x, clampedY);
      });
      
      // 闭合填充区域
      if (dataPointsWithPositions.length > 1) {
        const lastPoint = dataPointsWithPositions[dataPointsWithPositions.length - 1];
        ctx.lineTo(lastPoint.x, chartY + chartHeight);
      }
      ctx.lineTo(chartX, chartY + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // 绘制价格曲线 - 按照Figma设计，使用紫色线条
    if (dataPointsWithPositions.length > 1) {
      ctx.strokeStyle = '#6F6AF8';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1.0;
      
      ctx.beginPath();
      dataPointsWithPositions.forEach((point, index) => {
        const plotY = chartY + chartHeight - ((point.price - expandedMin) / (expandedMax - expandedMin)) * chartHeight;
        const clampedY = Math.max(chartY, Math.min(chartY + chartHeight, plotY));
        
        ctx.lineTo(point.x, clampedY);
      });
      ctx.stroke();
    }
    
    // 绘制最新价格点的圆点和价格标签
    if (dataPointsWithPositions.length > 1) {
      const lastPoint = dataPointsWithPositions[dataPointsWithPositions.length - 1];
      const lastPlotY = chartY + chartHeight - ((lastPoint.price - expandedMin) / (expandedMax - expandedMin)) * chartHeight;
      const lastClampedY = Math.max(chartY, Math.min(chartY + chartHeight, lastPlotY));
      
      // 绘制圆点 - 白色填充，紫色边框
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#6F6AF8';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastClampedY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      // 绘制价格标签背景 - 圆角矩形，修改文本格式为"当前价格：XX万"
      const currentPrice = `当前价格：${formatMoney(lastPoint.price)}`;
      ctx.font = '500 12px Inter';
      ctx.textAlign = 'center';
      const textMetrics = ctx.measureText(currentPrice);
      const textWidth = textMetrics.width;
      const textHeight = 16;
      
      // 标签位置 - 在圆点上方
      const labelX = lastPoint.x;
      const labelY = lastClampedY - 20;
      const labelPadding = 6;
      const labelWidth = textWidth + labelPadding * 2;
      const labelHeight = textHeight + labelPadding;
      
      // 绘制标签背景 - 紫色背景，圆角矩形
      ctx.fillStyle = '#6F6AF8';
      
      // 使用兼容性方法绘制圆角矩形
      const rectX = labelX - labelWidth/2;
      const rectY = labelY - labelHeight/2;
      const radius = 4;
      
      ctx.beginPath();
      ctx.moveTo(rectX + radius, rectY);
      ctx.lineTo(rectX + labelWidth - radius, rectY);
      ctx.quadraticCurveTo(rectX + labelWidth, rectY, rectX + labelWidth, rectY + radius);
      ctx.lineTo(rectX + labelWidth, rectY + labelHeight - radius);
      ctx.quadraticCurveTo(rectX + labelWidth, rectY + labelHeight, rectX + labelWidth - radius, rectY + labelHeight);
      ctx.lineTo(rectX + radius, rectY + labelHeight);
      ctx.quadraticCurveTo(rectX, rectY + labelHeight, rectX, rectY + labelHeight - radius);
      ctx.lineTo(rectX, rectY + radius);
      ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
      ctx.closePath();
      ctx.fill();
      
      // 绘制价格文本 - 白色文字
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(currentPrice, labelX, labelY + 4);
    }
  }
  
  /**
   * 计算数据点在图表中的位置
   */
  calculateDataPointPositions(priceData, chartX, chartWidth, currentGameTime, totalAxisMs) {
    if (priceData.length === 0) return [];
    
    const positions = [];
    const dataLengthMs = TIME_AXIS_CONFIG.DATA_LENGTH; // 30分钟数据显示区域
    const dataAreaWidth = chartWidth; // 数据显示区域宽度（占总宽度的100%）
    
    // 计算时间范围
    let startTime, endTime;
    if (currentGameTime >= dataLengthMs) {
      // 游戏时间超过30分钟，显示最近30分钟
      startTime = currentGameTime - dataLengthMs;
      endTime = currentGameTime;
    } else {
      // 游戏时间不足30分钟，显示从开始到现在
      startTime = 0;
      endTime = currentGameTime;
    }
    
    priceData.forEach(record => {
      // 计算每个数据点在时间轴上的位置
      let timePosition;
      
      if (currentGameTime >= dataLengthMs) {
        // 游戏时间超过30分钟，按最近30分钟的时间范围计算位置
        timePosition = (record.timestamp - startTime) / (endTime - startTime);
      } else {
        // 游戏时间不足30分钟，按30分钟时间轴计算位置
        timePosition = record.timestamp / dataLengthMs;
      }
      
      // 确保位置在有效范围内，且只在数据显示区域内
      timePosition = Math.max(0, Math.min(1, timePosition));
      
      // 计算在数据显示区域内的x坐标
      const x = chartX + timePosition * dataAreaWidth;
      positions.push({
        x,
        price: record.price,
        timestamp: record.timestamp
      });
    });
    
    return positions;
  }
  
  /**
   * 渲染时间轴标签 - 固定30分钟时间轴，每5分钟一个刻度
   */
  renderTimeLabels(ctx, x1, x2, x3, y) {
    // 获取游戏时间管理器
    const gameTimeManager = (typeof window !== 'undefined') ? 
      window.gameTimeManager : GameGlobal.gameTimeManager;
    
    if (!gameTimeManager) {
      // 如果没有游戏时间管理器，显示固定的时间轴
      ctx.fillStyle = '#838383';
      ctx.font = '500 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('0分钟', x1, y);
      ctx.fillText('15分钟', x2, y);
      ctx.fillText('30分钟', x3, y);
      return;
    }
    
    // 获取当前游戏时间
    const currentGameTime = gameTimeManager.getTotalGameTime();
    const totalAxisMs = TIME_AXIS_CONFIG.AXIS_LENGTH; // 30分钟总时间轴长度
    const dataLengthMs = TIME_AXIS_CONFIG.DATA_LENGTH; // 30分钟数据显示长度
    
    // 格式化时间显示函数
    const formatTimeLabel = (gameTimeMs) => {
      const totalSeconds = Math.floor(gameTimeMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (currentGameTime >= dataLengthMs) {
        // 游戏时间超过30分钟，显示时分格式
        const displayHours = Math.floor(gameTimeMs / 1000 / 60 / 60);
        const displayMinutes = Math.floor((gameTimeMs / 1000 / 60) % 60);
        return `${displayHours}:${displayMinutes.toString().padStart(2, '0')}`;
      } else {
        // 游戏时间不足30分钟，显示分钟格式
        return `${minutes}分钟`;
      }
    };
    
    // 计算时间轴标签（固定30分钟窗口）
    let startTime, middleTime, endTime;
    
    if (currentGameTime >= dataLengthMs) {
      // 游戏时间超过30分钟，显示最近30分钟的时间范围
      startTime = currentGameTime - dataLengthMs;
      middleTime = currentGameTime - dataLengthMs / 2;
      endTime = currentGameTime;
    } else {
      // 游戏时间不足30分钟，显示从开始到当前时间的范围
      startTime = 0;
      middleTime = currentGameTime / 2;
      endTime = currentGameTime;
    }
    
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Inter';
    ctx.textAlign = 'center';
    
    // 渲染时间标签
    ctx.fillText(formatTimeLabel(startTime), x1, y);
    ctx.fillText(formatTimeLabel(middleTime), x2, y);
    ctx.fillText(formatTimeLabel(endTime), x3, y);
  }

  /**
   * 获取基于游戏时间的价格数据
   */
  getPriceDataByTimeRange() {
    const gameTimeManager = (typeof window !== 'undefined') ? 
      window.gameTimeManager : GameGlobal.gameTimeManager;
    const priceHistory = this.property.priceHistory || [];
    
    if (!gameTimeManager) {
      // 如果没有游戏时间管理器，返回所有历史数据
      return [...priceHistory];
    }
    
    const currentGameTime = gameTimeManager.getTotalGameTime();
    const dataLengthMs = TIME_AXIS_CONFIG.DATA_LENGTH; // 30分钟的数据显示长度
    
    // 添加当前价格作为最新数据点
    const currentData = {
      timestamp: currentGameTime,
      price: this.property.currentPrice
    };
    
    let filteredHistory;
    
    if (currentGameTime >= dataLengthMs) {
      // 游戏时间超过30分钟，获取最近30分钟的游戏时间数据
      const cutoffTime = currentGameTime - dataLengthMs;
      filteredHistory = priceHistory.filter(record => record.timestamp >= cutoffTime);
    } else {
      // 游戏时间不足30分钟，获取从开始到现在的所有数据
      filteredHistory = priceHistory.filter(record => record.timestamp >= 0);
    }
    
    // 合并历史数据和当前数据
    return [...filteredHistory, currentData];
  }
} 