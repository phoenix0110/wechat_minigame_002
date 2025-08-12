import { 
  CURRENT_TRADING_PROPERTIES, 
  formatRemainingTime, 
  purchaseProperty,
  getUserProperties,
  initializeRealEstate,
  getTimeUntilNextPriceUpdate,
  updateAllRents,
  getRentProgress,
  getCurrentRentAmount,
  sellProperty
} from '../config/realEstateConfig.js';
import PropertyHistoryModal from './propertyHistoryModal.js';
import PurchaseConfirmModal from './purchaseConfirmModal.js';
import SellConfirmModal from './sellConfirmModal.js';
import { TIME_AXIS_CONFIG, ANIMATION_TIME_CONFIG, ASSET_TRACKING_CONFIG } from '../config/timeConfig.js';
import { 
  drawRoundRect, 
  formatMoney, 
  renderTopMoneyBar, 
  renderBottomNavigation,
  handleBottomNavigationTouch,
  easeOutCubic,
  drawGradientBackground
} from './utils.js';

/**
 * 售楼处页面 - 重新设计版本
 * 采用全屏垂直滚动卡片布局
 */
export default class RealEstatePage {
  constructor(assetTracker = null, getMoneyCallback = null) {
    this.isVisible = false;
    this.currentTab = 'trading'; // 'trading', 'myProperties', 或 'transactionHistory'
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    this.propertyCardHeight = 230; // 交易大厅使用原始高度，我的房产动态调整
    this.propertyCardWidth = 384; // 增加卡片宽度
    this.cardPadding = 20; // 卡片间距
    this.propertiesPerPage = 15;
    this.assetTracker = assetTracker;
    this.getMoneyCallback = getMoneyCallback; // 获取当前金额的回调函数
    
    // 交易记录滚动相关
    this.transactionScrollOffset = 0;
    this.maxTransactionScrollOffset = 0;
    
    // 移除时间选择，固定显示过去10分钟
    
    // 初始化弹窗组件
    this.propertyHistoryModal = new PropertyHistoryModal();
    this.purchaseConfirmModal = new PurchaseConfirmModal();
    this.sellConfirmModal = new SellConfirmModal();
    
    // 动画系统 
    this.animations = new Map(); // 存储正在进行的动画
    this.animationId = 0; // 动画ID计数器
    this.removingPropertyId = null; // 正在移除的房产ID
    this.removingProperty = null; // 正在移除的房产对象

  }

  /**
   * 显示页面
   */
  show() {
    this.isVisible = true;
    this.scrollOffset = 0;
    this.calculateMaxScroll();
  }

  /**
   * 隐藏页面
   */
  hide() {
    this.isVisible = false;
  }

  /**
   * 计算最大滚动偏移量
   */
  calculateMaxScroll() {
    if (this.currentTab === 'transactionHistory') {
      this.calculateTransactionScrollHeight();
      return;
    }
    
    const currentList = this.getCurrentPropertyList();
    const cardHeight = this.getCardHeight();
    const totalHeight = currentList.length * (cardHeight + this.cardPadding);
    const visibleHeight = canvas.height - 200 - 55; // 减去顶部金钱栏、分段控制器和底部导航栏高度，向下平移50px
    this.maxScrollOffset = Math.max(0, totalHeight - visibleHeight);
  }

  /**
   * 计算交易记录的滚动高度
   */
  calculateTransactionScrollHeight() {
    if (!this.assetTracker) {
      this.maxTransactionScrollOffset = 0;
      return;
    }
    
    const transactions = this.assetTracker.getTransactionHistory();
    const recordHeight = 52; // 每条记录高度
    const recordGap = 16; // 记录间距
    const totalRecordHeight = recordHeight + recordGap;
    
    // 计算所有交易记录的总高度
    const totalTransactionHeight = transactions.length * totalRecordHeight;
    
    // 使用辅助方法获取可见高度
    const visibleHeight = this.getTransactionRecordsVisibleHeight();
    
    this.maxTransactionScrollOffset = Math.max(0, totalTransactionHeight - visibleHeight);
  }

  /**
   * 获取基于游戏时间的过去10分钟图表数据
   */
  getChartDataByTimeRange() {
    if (!this.assetTracker) return [];
    
    const allData = this.assetTracker.getAssetHistory();
    
    // 获取最大显示数据点数量（对应30分钟，每30秒一个点 = 60个点）
    const maxDataPoints = ASSET_TRACKING_CONFIG.MAX_ASSET_HISTORY_COUNT;
    
    // 获取最新的数据点，最多60个
    let displayData = allData.slice(-maxDataPoints);
    
    // 如果数据点太多，进行采样以提高性能
    const maxDisplayPoints = 20; // 图表显示最多20个点
    if (displayData.length <= maxDisplayPoints) {
      return displayData;
    }
    
    const step = Math.floor(displayData.length / maxDisplayPoints);
    const sampledData = [];
    
    for (let i = 0; i < displayData.length; i += step) {
      sampledData.push(displayData[i]);
    }
    
    // 确保包含最新的数据点
    const lastPoint = displayData[displayData.length - 1];
    if (sampledData.length > 0 && sampledData[sampledData.length - 1] !== lastPoint) {
      sampledData.push(lastPoint);
    }
    
    return sampledData;
  }

  /**
   * 渲染时间标签 - 固定10分钟时间轴，每2分钟一个刻度
   */
  renderTimeLabels(ctx, chartData, x1, x2, x3, y) {
    // 获取游戏时间管理器
    const gameTimeManager = (typeof window !== 'undefined') ? 
      window.gameTimeManager : GameGlobal.gameTimeManager;
    
    if (!gameTimeManager) {
      // 如果没有游戏时间管理器，显示固定的时间轴
      ctx.fillStyle = '#838383';
      ctx.font = '500 12px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('0分钟', x1, y);
      ctx.fillText('5分钟', x2, y);
      ctx.fillText('10分钟', x3, y);
      return;
    }
    
    const currentGameTime = gameTimeManager.getTotalGameTime();
    const dataLengthMs = TIME_AXIS_CONFIG.DATA_LENGTH; // 10分钟数据显示长度
    
    // 格式化时间显示函数
    const formatTimeLabel = (gameTimeMs) => {
      const totalSeconds = Math.floor(gameTimeMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      
      // 对于10分钟时间轴，始终显示分钟格式
      return `${minutes}分钟`;
    };
    
    // 计算时间轴标签（固定10分钟窗口）
    let startTime, middleTime, endTime;
    
    if (currentGameTime >= dataLengthMs) {
      // 游戏时间超过10分钟，显示最近10分钟的时间范围
      startTime = currentGameTime - dataLengthMs;
      middleTime = currentGameTime - dataLengthMs / 2;
      endTime = currentGameTime;
    } else {
      // 游戏时间不足10分钟，显示从开始到当前时间的范围
      startTime = 0;
      middleTime = currentGameTime / 2;
      endTime = currentGameTime;
    }
    
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Inter, Arial';
    ctx.textAlign = 'center';
    
    // 渲染时间标签
    ctx.fillText(formatTimeLabel(startTime), x1, y);
    ctx.fillText(formatTimeLabel(middleTime), x2, y);
    ctx.fillText(formatTimeLabel(endTime), x3, y);
  }

  /**
   * 渲染资产价值折线图 - 按照 Figma 设计
   */
  renderAssetChartFigma(ctx, x, y, width, height) {
    // 根据选择的时间范围获取数据
    const chartData = this.getChartDataByTimeRange();
    
    // 绘制白色背景框 - 8px 圆角，1px 黑边
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, x, y, width, height, 8);
    ctx.stroke();

    // 内容区域 padding: 20px 12px
    const contentX = x + 12;
    const contentY = y + 20;
    const contentWidth = width - 24;
    const contentHeight = height - 40;

    // 绘制标题 - Inter 400 12px
    ctx.fillStyle = '#2C2C2C';
    ctx.font = '400 12px Inter, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('总资产价值变化趋势', contentX, contentY + 12);

    if (chartData.length < 1) {
      // 数据不足，显示提示
      ctx.fillStyle = '#838383';
      ctx.font = '400 14px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('开始游戏后数据将自动记录', contentX + contentWidth / 2, contentY + contentHeight / 2);
      return;
    }

    // 图表绘制区域
    const chartX = contentX + 62;
    const chartY = contentY + 72;
    const chartWidth = 254;
    const chartHeight = 160;

    // 获取游戏时间管理器
    const gameTimeManager = (typeof window !== 'undefined') ? 
      window.gameTimeManager : GameGlobal.gameTimeManager;
    
    if (!gameTimeManager) {
      ctx.fillStyle = '#838383';
      ctx.font = '400 14px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('游戏时间管理器未初始化', contentX + contentWidth / 2, contentY + contentHeight / 2);
      return;
    }

    const currentGameTime = gameTimeManager.getTotalGameTime();
    const dataLengthMs = TIME_AXIS_CONFIG.DATA_LENGTH; // 10分钟数据显示长度

    // 找到最大值和最小值
    let maxValue = 0;
    let minValue = Infinity;
    chartData.forEach(point => {
      maxValue = Math.max(maxValue, point.totalAssetValue);
      minValue = Math.min(minValue, point.totalAssetValue);
    });

    // 添加一些边距
    const valueRange = maxValue - minValue;
    const margin = valueRange * 0.1;
    maxValue += margin;
    minValue = Math.max(0, minValue - margin);

    // 绘制虚线网格 - 紫色虚线
    ctx.strokeStyle = '#6F6AF8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // 绘制水平网格线
    for (let i = 0; i <= 4; i++) {
      const gridY = chartY + (i * chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(chartX, gridY);
      ctx.lineTo(chartX + chartWidth, gridY);
      ctx.stroke();
    }
    
    // 绘制垂直网格线 - 适应10分钟时间轴，每2分钟一条线（10分钟/5条线）
    for (let i = 0; i <= 5; i++) {
      const gridX = chartX + (i * chartWidth / 5);
      ctx.beginPath();
      ctx.moveTo(gridX, chartY);
      ctx.lineTo(gridX, chartY + chartHeight);
      ctx.stroke();
    }
    
    ctx.setLineDash([]); // 重置虚线
    ctx.lineWidth = 1;

    // 绘制Y轴标签 - 以万为单位显示
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Inter, Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const labelY = chartY + (i * chartHeight / 4) + 4;
      const value = maxValue - (i * (maxValue - minValue) / 4);
      const formattedValue = formatMoney(value);
      ctx.fillText(formattedValue, contentX, labelY);
    }

    // 计算数据点的位置（使用游戏时间逻辑）
    const dataPointsWithPositions = this.calculateAssetDataPointPositions(
      chartData, 
      chartX, 
      chartWidth, 
      currentGameTime, 
      dataLengthMs
    );

    // 绘制渐变填充区域
    if (dataPointsWithPositions.length > 1) {
      const gradient = ctx.createLinearGradient(0, chartY, 0, chartY + chartHeight);
      gradient.addColorStop(0, 'rgba(100, 37, 254, 0.68)');
      gradient.addColorStop(1, 'rgba(100, 37, 254, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // 从底部开始绘制填充区域
      ctx.moveTo(chartX, chartY + chartHeight);
      
      dataPointsWithPositions.forEach(point => {
        const plotY = chartY + chartHeight - ((point.totalAssetValue - minValue) / (maxValue - minValue)) * chartHeight;
        ctx.lineTo(point.x, plotY);
      });
      
      // 回到底部完成填充
      if (dataPointsWithPositions.length > 0) {
        const lastPoint = dataPointsWithPositions[dataPointsWithPositions.length - 1];
        ctx.lineTo(lastPoint.x, chartY + chartHeight);
      }
      ctx.lineTo(chartX, chartY + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // 绘制折线
    if (dataPointsWithPositions.length > 1) {
      ctx.strokeStyle = 'rgba(100, 37, 254, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      dataPointsWithPositions.forEach((point, index) => {
        const plotY = chartY + chartHeight - ((point.totalAssetValue - minValue) / (maxValue - minValue)) * chartHeight;

        if (index === 0) {
          ctx.moveTo(point.x, plotY);
        } else {
          ctx.lineTo(point.x, plotY);
        }
      });
      ctx.stroke();
    }

    // 在最新的数据点上标注"当前资产总值：$XX"
    if (dataPointsWithPositions.length > 0) {
      const lastPoint = dataPointsWithPositions[dataPointsWithPositions.length - 1];
      const lastPlotY = chartY + chartHeight - ((lastPoint.totalAssetValue - minValue) / (maxValue - minValue)) * chartHeight;
      
      // 绘制当前点的圆点
      ctx.fillStyle = '#6425FE';
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPlotY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // 绘制标注文本
      const labelText = `当前资产总值：${formatMoney(lastPoint.totalAssetValue)}`;
      ctx.font = '500 12px Inter';
      ctx.textAlign = 'center';
      const textMetrics = ctx.measureText(labelText);
      const textWidth = textMetrics.width;
      const textHeight = 16;
      
      // 计算标注位置，避免超出边界
      let labelX = lastPoint.x;
      let labelY = lastPlotY - 20;
      const labelPadding = 6;
      const labelWidth = textWidth + labelPadding * 2;
      const labelHeight = textHeight + labelPadding;
      
      // 如果标注会超出上边界，则显示在点的下方
      if (labelY - labelHeight/2 < chartY + 15) {
        labelY = lastPlotY + 25;
      }
      
      // 如果标注会超出右边界，则向左调整
      if (labelX + labelWidth/2 > chartX + chartWidth) {
        labelX = chartX + chartWidth - labelWidth/2;
      }
      
      // 绘制标签背景 - 紫色背景，圆角矩形（与当前价格样式一致）
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
      
      // 绘制标签文本 - 白色文字
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, labelX, labelY + 1);
    }

    // 绘制底部统计信息 - 固定显示过去10分钟数据
    const statsY = contentY + 282;
    
    // 固定显示过去10分钟的标签
    const timeRangeLabel = '过去10分钟';
    
    if (chartData.length > 0) {
      const values = chartData.map(p => p.totalAssetValue);
      const highValue = Math.max(...values);
      const lowValue = Math.min(...values);
      
      // 最高价格
      ctx.fillStyle = '#838383';
      ctx.font = '400 12px Inter, Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${timeRangeLabel}最高`, contentX, statsY);
      
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '500 14px Inter, Arial';
      ctx.fillText(formatMoney(highValue), contentX, statsY + 16);
      
      // 最低价格
      ctx.fillStyle = '#838383';
      ctx.font = '400 12px Inter, Arial';
      ctx.fillText(`${timeRangeLabel}最低`, contentX + 96, statsY);
      
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '500 14px Inter, Arial';
      ctx.fillText(formatMoney(lowValue), contentX + 96, statsY + 16);
    }

  }

  /**
   * 渲染交易记录列表 - 按照 Figma 设计
   */
  renderTransactionRecordsFigma(ctx, x, y, width, height) {
    const transactions = this.assetTracker.getTransactionHistory();
    
    // 绘制白色背景框 - 8px 圆角
    ctx.fillStyle = '#FFFFFF';
    drawRoundRect(ctx, x, y, width, height, 8);
    ctx.fill();

    // 内容区域 padding: 20px 12px
    const contentX = x + 12;
    const contentY = y + 20;
    const contentWidth = width - 24;
    const contentHeight = height - 40;

    // 绘制标题 - Inter 700 14px
    ctx.fillStyle = '#2C2C2C';
    ctx.font = '700 14px Inter, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('过往交易', contentX, contentY + 14);

    if (transactions.length === 0) {
      // 没有交易记录
      ctx.fillStyle = '#838383';
      ctx.font = '400 14px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂无交易记录', contentX + contentWidth / 2, contentY + contentHeight / 2);
      return;
    }

    // 交易记录列表区域
    const recordsStartY = contentY + 34;
    
    // 使用辅助方法获取记录区域高度，确保与calculateTransactionScrollHeight保持一致
    const recordsAreaHeight = this.getTransactionRecordsVisibleHeight();
    
    const recordHeight = 52; // 每条记录高度
    const recordGap = 16; // 记录间距
    const totalRecordHeight = recordHeight + recordGap;
    
    // 设置裁剪区域，防止内容溢出
    ctx.save();
    ctx.beginPath();
    ctx.rect(contentX, recordsStartY, 316, recordsAreaHeight);
    ctx.clip();

    // 计算可见记录的范围
    const startIndex = Math.floor(this.transactionScrollOffset / totalRecordHeight);
    const endIndex = Math.min(transactions.length, startIndex + Math.ceil(recordsAreaHeight / totalRecordHeight) + 1);

    // 绘制可见的交易记录
    for (let i = startIndex; i < endIndex; i++) {
      const transaction = transactions[i];
      const recordY = recordsStartY + (i * totalRecordHeight) - this.transactionScrollOffset;
      
      // 只渲染在可见区域内的记录
      if (recordY + recordHeight >= recordsStartY && recordY <= recordsStartY + recordsAreaHeight) {
        // 绘制交易记录项
        this.renderTransactionItem(ctx, transaction, contentX, recordY, 316, recordHeight);
        
        // 绘制分隔线 (除了最后一条)
        if (i < transactions.length - 1) {
          ctx.strokeStyle = '#E8E9FF';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(contentX, recordY + recordHeight + recordGap / 2);
          ctx.lineTo(contentX + 316, recordY + recordHeight + recordGap / 2);
          ctx.stroke();
        }
      }
    }

    ctx.restore();

    // 绘制滚动条（如果有滚动内容）
    if (this.maxTransactionScrollOffset > 0) {
      this.renderTransactionScrollBar(ctx, contentX + 316 + 8, recordsStartY, 6, recordsAreaHeight);
    }

    // 如果有更多内容，绘制底部渐变遮罩
    if (this.maxTransactionScrollOffset > 0) {
      const gradientHeight = 40;
      const gradientY = recordsStartY + recordsAreaHeight - gradientHeight;
      
      const gradient = ctx.createLinearGradient(0, gradientY, 0, gradientY + gradientHeight);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(contentX, gradientY, 316, gradientHeight);
    }
  }

  /**
   * 渲染交易记录滚动条
   */
  renderTransactionScrollBar(ctx, x, y, width, height) {
    if (this.maxTransactionScrollOffset <= 0) return;
    
    // 滚动条背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(x, y, width, height);

    // 滑块
    const visibleRatio = height / (height + this.maxTransactionScrollOffset);
    const sliderHeight = Math.max(20, height * visibleRatio);
    const sliderY = y + (this.transactionScrollOffset / this.maxTransactionScrollOffset) * (height - sliderHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x, sliderY, width, sliderHeight);
  }

  /**
   * 渲染单个交易记录项
   */
  renderTransactionItem(ctx, transaction, x, y, width, height) {
    // 左侧信息区域 (资产名称 + 时间)
    const leftAreaWidth = 221;
    
    // 绘制资产名称
    ctx.fillStyle = '#2C2C2C';
    ctx.font = '500 12px Inter, Arial';
    ctx.textAlign = 'left';
    
    const assetName = transaction.propertyName || '未知资产';
    const actionText = transaction.type === 'buy' ? '买入' : '售出';
    ctx.fillText(`${assetName}`, x, y + 12);
    
    // 绘制交易时间
    const transactionDate = new Date(transaction.timestamp);
    const dateText = `${transactionDate.getMonth() + 1}月${transactionDate.getDate()}日${actionText}`;
    ctx.fillText(dateText, x, y + 28);

    // 右侧价格区域
    const rightAreaX = x + leftAreaWidth;
    const rightAreaWidth = 33;
    
    // 绘制交易价格
    ctx.fillStyle = '#2C2C2C';
    ctx.font = '400 12px Inter, Arial';
    ctx.textAlign = 'right';
    
    if (transaction.type === 'buy') {
      // 买入交易：显示买价
      const priceText = `买价：$${Math.round(transaction.price).toLocaleString()}`;
      ctx.fillText(priceText, rightAreaX + rightAreaWidth, y + 12);
    } else {
      // 卖出交易：显示售价
      const priceText = `售价：$${Math.round(transaction.price).toLocaleString()}`;
      ctx.fillText(priceText, rightAreaX + rightAreaWidth, y + 12);
      
      // 显示盈亏（按Figma设计：绿色盈利 #77B900，红色亏损 #E8464C）
      if (transaction.purchasePrice) {
        const profit = transaction.price - transaction.purchasePrice;
        const profitText = profit >= 0 ? `+${Math.round(profit).toLocaleString()}` : `${Math.round(profit).toLocaleString()}`;
        
        ctx.fillStyle = profit >= 0 ? '#77B900' : '#E8464C';
        ctx.font = '400 12px Inter, Arial';
        ctx.fillText(profitText, rightAreaX + rightAreaWidth, y + 28);
      }
    }
  }

  /**
   * 计算交易记录区域的可见高度
   */
  getTransactionRecordsVisibleHeight() {
    // 交易记录区域的Y坐标：194 + 327 + 16 = 537 (图表区域Y + 图表高度 + 间距)
    // 交易记录区域内容开始Y坐标：537 + 20 + 34 = 591 (区域Y + padding + 标题高度)
    const transactionAreaStartY = 194 + 327 + 16 + 20 + 34; // 591
    const bottomNavigationHeight = 55;
    const availableHeight = canvas.height - transactionAreaStartY - bottomNavigationHeight;
    
    // 确保最小高度为200像素，避免过小的显示区域
    return Math.max(200, availableHeight);
  }

  /**
   * 获取当前标签页的卡片高度
   */
  getCardHeight() {
    // 按照 Figma 设计调整卡片高度
    // 我的房产卡片需要更多空间来容纳按钮布局
    return this.currentTab === 'myProperties' ? 300 : 230;
  }

  /**
   * 获取当前显示的房产列表
   */
  getCurrentPropertyList() {
    if (this.currentTab === 'trading') {
      return CURRENT_TRADING_PROPERTIES;
    } else if (this.currentTab === 'myProperties') {
      return getUserProperties();
    } else if (this.currentTab === 'transactionHistory') {
      return [];
    }
    return [];
  }

  /**
   * 购买房产
   */
  buyProperty(propertyId, userMoney = 0) {
    const purchaseResult = purchaseProperty(propertyId, userMoney);
    if (purchaseResult.success) {
      // 启动卡片消失动画
      this.startCardRemoveAnimation(propertyId);
      return purchaseResult;
    }
    return purchaseResult;
  }
  /**
   * 获取剩余刷新时间
   */
  getRemainingRefreshTime() {
    return getTimeUntilNextPriceUpdate();
  }

  /**
   * 检查房产是否在冷却期
   * @param {Object} property 房产对象
   * @returns {Object} { inCooldown: boolean, remainingSeconds: number }
   */
  checkPropertyCooldown(property) {
    if (!property.purchaseTime) {
      return { inCooldown: false, remainingSeconds: 0 };
    }
    
    // 获取游戏时间管理器
    const gameTimeManager = (typeof window !== 'undefined') ? 
      window.gameTimeManager : GameGlobal.gameTimeManager;
    
    const currentGameTime = gameTimeManager ? gameTimeManager.getGameTimestamp() : Date.now();
    const purchaseTime = property.purchaseTime || 0;
    const oneMinuteMs = 1 * 60 * 1000; // 1分钟的毫秒数
    
    if (currentGameTime - purchaseTime < oneMinuteMs) {
      const remainingTime = oneMinuteMs - (currentGameTime - purchaseTime);
      const remainingSeconds = Math.ceil(remainingTime / 1000);
      return { inCooldown: true, remainingSeconds: remainingSeconds };
    }
    
    return { inCooldown: false, remainingSeconds: 0 };
  }

  /**
   * 启动卡片移除动画
   */
  startCardRemoveAnimation(propertyId) {
    this.removingPropertyId = propertyId;
    
    // 在房产被移除之前记录其在列表中的索引和对象引用
    const currentList = this.getCurrentPropertyList();
    const removedIndex = currentList.findIndex(p => p.id === propertyId);
    this.removingProperty = currentList.find(p => p.id === propertyId);
    
    // 创建淡出动画
    const fadeOutAnimation = {
      id: ++this.animationId,
      type: 'fadeOut',
      propertyId: propertyId,
      removedIndex: removedIndex,
      duration: 400, // 简化为400ms，参考官方文档的动画时长
      startTime: Date.now(),
      progress: 0,
      onComplete: () => {
        this.startCardsSlideUpAnimation(propertyId, removedIndex);
      }
    };
    
    this.animations.set(fadeOutAnimation.id, fadeOutAnimation);
  }

  /**
   * 启动其他卡片向上滑动动画
   */
  startCardsSlideUpAnimation(removedPropertyId, removedIndex) {
    const slideUpAnimation = {
      id: ++this.animationId,
      type: 'slideUp',
      removedPropertyId: removedPropertyId,
      removedIndex: removedIndex,
      duration: 300, // 简化为300ms，参考官方文档的动画时长
      startTime: Date.now(),
      progress: 0,
      onComplete: () => {
        // 动画完成后清理
        this.removingPropertyId = null;
        this.removingProperty = null;
        this.calculateMaxScroll();
      }
    };
    
    this.animations.set(slideUpAnimation.id, slideUpAnimation);
  }

  /**
   * 更新动画
   */
  updateAnimations() {
    if (this.animations.size === 0) return;
    
    const now = Date.now();
    const completedAnimations = [];
    
    for (const [id, animation] of this.animations) {
      const elapsed = now - animation.startTime;
      animation.progress = Math.min(elapsed / animation.duration, 1);
      
      if (animation.progress >= 1) {
        completedAnimations.push(id);
        if (animation.onComplete) {
          animation.onComplete();
        }
      }
    }
    
    // 清理完成的动画
    completedAnimations.forEach(id => {
      this.animations.delete(id);
    });
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 1. 首先检查底部导航栏 - 最高优先级，防止被卡片遮挡，使用统一的导航处理函数
    const navResult = handleBottomNavigationTouch(x, y, 'realEstate');
    if (navResult) {
      return navResult;
    }

    // 2. 处理弹窗触摸事件 - 优先级顺序：购买确认 > 出售确认 > 历史价格
    if (this.purchaseConfirmModal.isVisible) {
      const result = this.purchaseConfirmModal.handleTouch(x, y);
      if (result && result.type === 'confirm' && result.property) {
        // 确认购买 - 添加空值检查，传递用户金钱
        const userMoney = this.getMoneyCallback ? this.getMoneyCallback() : 0;
        const purchased = this.buyProperty(result.property.id, userMoney);
        if (purchased && purchased.success) {
          return { type: 'purchase_success', property: purchased.property };
        } else {
          return { type: 'purchase_failed', property: result.property, purchaseResult: purchased };
        }
      }
      return null; // 弹窗处理中，不传递其他事件
    }

    if (this.sellConfirmModal.isVisible) {
      const result = this.sellConfirmModal.handleTouch(x, y);
      if (result && result.type === 'confirm') {
        // 确认出售
        return { type: 'sell_property', property: result.property };
      }
      return null; // 弹窗处理中，不传递其他事件
    }

    if (this.propertyHistoryModal.isVisible) {
      const result = this.propertyHistoryModal.handleTouch(x, y);
      if (result && result.type === 'close') {
        // 弹窗关闭事件，不传递给上层
        return null;
      }
      if (result) {
        return result;
      }
    }

    // 3. 检查加号按钮点击 (顶部money bar右侧)
    if (this.topBarClickAreas && this.topBarClickAreas.plusButton) {
      const plusBtn = this.topBarClickAreas.plusButton;
      if (x >= plusBtn.x && x <= plusBtn.x + plusBtn.width &&
          y >= plusBtn.y && y <= plusBtn.y + plusBtn.height) {
        return { type: 'showAdReward' };
      }
    }

    // 检查分段控制器点击 - 向下平移50px
    const segmentedControlWidth = 384;
    const segmentedControlHeight = 32;
    const segmentedControlX = (canvas.width - segmentedControlWidth) / 2;
    const segmentedControlY = 130; // 80 + 50，向下平移50px
    const tabWidth = (segmentedControlWidth - 4) / 3;
    
    if (y >= segmentedControlY && y <= segmentedControlY + segmentedControlHeight &&
        x >= segmentedControlX && x <= segmentedControlX + segmentedControlWidth) {
      const relativeX = x - segmentedControlX - 2;
      if (relativeX < tabWidth) {
        this.currentTab = 'trading';
        this.scrollOffset = 0;
        this.calculateMaxScroll();
        return { type: 'tabChange', tab: 'trading' };
      } else if (relativeX < tabWidth * 2) {
        this.currentTab = 'myProperties';
        this.scrollOffset = 0;
        this.calculateMaxScroll();
        return { type: 'tabChange', tab: 'myProperties' };
      } else {
        this.currentTab = 'transactionHistory';
        this.scrollOffset = 0;
        this.calculateMaxScroll();
        return { type: 'tabChange', tab: 'transactionHistory' };
      }
    }

    // 检查房产卡片点击 - 调整卡片区域判断
    if (y > 180 && y < canvas.height) { // 在卡片区域内，130 + 50 向下平移50px
      const currentList = this.getCurrentPropertyList();
      
      for (let i = 0; i < currentList.length; i++) {
        const property = currentList[i];
        const cardX = (canvas.width - this.propertyCardWidth) / 2;
        const cardHeight = this.getCardHeight();
        const cardY = 200 + i * (cardHeight + this.cardPadding) - this.scrollOffset; // 150 + 50，向下平移50px
        
        // 检查是否在当前卡片范围内
        if (y >= cardY && y <= cardY + cardHeight &&
            x >= cardX && x <= cardX + this.propertyCardWidth) {
          
          if (this.currentTab === 'trading') {
            // 检查房产价格趋势按钮 (绿色按钮)
            const trendButtonY = cardY + 150;
            const trendButtonHeight = 30;
            if (y >= trendButtonY && y <= trendButtonY + trendButtonHeight) {
              this.propertyHistoryModal.show(canvas.width, canvas.height, property);
              return { type: 'showHistory', property: property };
            }
            
            // 检查购买按钮 (绿色按钮) - 显示购买确认弹窗
            const buyButtonY = cardY + 190;
            const buyButtonHeight = 30;
            if (y >= buyButtonY && y <= buyButtonY + buyButtonHeight) {
              this.purchaseConfirmModal.show(property);
              return null; // 不直接购买，等待弹窗确认
            }
            
            // 移除卡片其他位置的购买触发 - 只在功能按钮处有响应
            return null;
          } else if (this.currentTab === 'myProperties') {
            // 按照新的布局检查按钮点击 - 与渲染逻辑保持一致
            // 按钮下移25px
            const bottomButtonStartY = cardY + 185 + 25;
            const bottomButtonHeight = 31;
            const buttonGap = 14;
            const buttonPadding = 4;
            const firstRowButtonWidth = 115;
            
            // 第一行按钮
            const firstRowY = bottomButtonStartY;
            
            // 收取租金按钮
            const rentButtonX = cardX + buttonPadding;
            if (x >= rentButtonX && x <= rentButtonX + firstRowButtonWidth &&
                y >= firstRowY && y <= firstRowY + bottomButtonHeight) {
              return { type: 'collect_rent', property: property };
            }
            
            // 房屋升级按钮
            const upgradeButtonX = rentButtonX + firstRowButtonWidth + buttonGap;
            if (x >= upgradeButtonX && x <= upgradeButtonX + firstRowButtonWidth &&
                y >= firstRowY && y <= firstRowY + bottomButtonHeight) {
              return { type: 'upgrade_property', property: property };
            }
            
            // 出售资产按钮 - 检查冷却期
            const sellButtonX = upgradeButtonX + firstRowButtonWidth + buttonGap;
            if (x >= sellButtonX && x <= sellButtonX + firstRowButtonWidth &&
                y >= firstRowY && y <= firstRowY + bottomButtonHeight) {
              
              // 检查冷却期
              const cooldownStatus = this.checkPropertyCooldown(property);
              if (cooldownStatus.inCooldown) {
                // 冷却期间不响应点击
                return null;
              }
              
              // 不在冷却期，显示出售确认弹窗
              this.sellConfirmModal.show(property);
              return null; // 不直接出售，等待弹窗确认
            }
            
            // 第二行：房产价格趋势按钮
            const secondRowY = firstRowY + bottomButtonHeight + buttonGap;
            const trendButtonWidth = this.propertyCardWidth - (buttonPadding * 2);
            if (x >= cardX + buttonPadding && x <= cardX + buttonPadding + trendButtonWidth &&
                y >= secondRowY && y <= secondRowY + bottomButtonHeight) {
              return { type: 'property_trend', property: property };
            }
            
            return { type: 'viewProperty', property };
          }
        }
      }
    }

    // 底部导航栏点击检查已经移到方法最前面

    return null;
  }

  /**
   * 处理滚动事件
   */
  handleScroll(deltaY) {
    if (!this.isVisible) return;
    
    if (this.currentTab === 'transactionHistory') {
      // 处理交易记录页面的滚动
      this.transactionScrollOffset = Math.max(0, Math.min(this.maxTransactionScrollOffset, this.transactionScrollOffset + deltaY));
    } else {
      // 处理其他页面的滚动
      this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + deltaY));
    }
  }

  /**
   * 绘制圆角矩形辅助方法
   */
  // 移除本地的drawRoundRect函数，使用utils中的版本

  /**
   * 渲染页面 - 新设计版本
   */
  render(ctx) {
    if (!this.isVisible) return;

    // 参考官方Canvas文档：在每帧中更新动画状态
    this.updateAnimations();

    ctx.save();

    // 绘制Figma设计的渐变背景
    drawGradientBackground(ctx, canvas.width, canvas.height);

    // 分段控制器（选项卡）- 向下平移50px
    const segmentedControlWidth = 384;
    const segmentedControlHeight = 32;
    const segmentedControlX = (canvas.width - segmentedControlWidth) / 2;
    const segmentedControlY = 130; // 80 + 50，向下平移50px
    const borderRadius = 9; // 与Figma设计稿保持一致

    // 绘制整体背景 (浅灰色半透明)
    ctx.fillStyle = 'rgba(120, 120, 128, 0.12)';
    drawRoundRect(ctx, segmentedControlX, segmentedControlY, segmentedControlWidth, segmentedControlHeight, borderRadius);
    ctx.fill();

    // 绘制三个选项卡
    const tabs = ['交易大厅', '我的房产', '交易记录'];
    const tabWidth = (segmentedControlWidth - 4) / 3; // 减去间隙
    
    tabs.forEach((tabText, index) => {
      const isActive = (index === 0 && this.currentTab === 'trading') || 
                      (index === 1 && this.currentTab === 'myProperties') ||
                      (index === 2 && this.currentTab === 'transactionHistory');
      
      const tabX = segmentedControlX + 2 + index * tabWidth;
      const tabY = segmentedControlY + 2;
      const tabHeight = segmentedControlHeight - 4;
      
      if (isActive) {
        // 激活状态：白色背景，阴影效果
        ctx.fillStyle = '#FFFFFF';
        drawRoundRect(ctx, tabX, tabY, tabWidth, tabHeight, 7);
        ctx.fill();
        
        // 阴影效果 (模拟iOS分段控制器)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 0.29;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1.5;
        
        drawRoundRect(ctx, tabX, tabY, tabWidth, tabHeight, 7);
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // 文字
      ctx.fillStyle = isActive ? '#000000' : 'rgba(60, 60, 67, 0.6)';
      ctx.font = '500 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(tabText, tabX + tabWidth / 2, segmentedControlY + 20);
    });

    // 渲染顶部金钱栏
    const topBarResult = renderTopMoneyBar(ctx, this.getMoneyCallback, { showBackButton: false });
    this.topBarClickAreas = topBarResult;

    // 渲染内容
    if (this.currentTab === 'transactionHistory') {
      this.renderTransactionHistory(ctx);
    } else {
      this.renderPropertyCards(ctx);
    }

    // 绘制底部导航栏 - 永远在最上层
    const navResult = renderBottomNavigation(ctx, 'realEstate');
    this.bottomNavClickAreas = navResult;

    // 渲染弹窗 - 在所有内容之上
    this.propertyHistoryModal.render(ctx);
    this.purchaseConfirmModal.render(ctx);
    this.sellConfirmModal.render(ctx);

    ctx.restore();
    
    // 渲染弹窗
    if (this.propertyHistoryModal) {
      this.propertyHistoryModal.render(ctx);
    }
  }

  // 移除本地的renderTopMoneyBar函数，使用utils中的版本

  /**
   * 渲染房产卡片列表
   */
  renderPropertyCards(ctx) {
    let currentList = this.getCurrentPropertyList();
    
    // 获取当前动画状态
    const fadeOutAnimation = Array.from(this.animations.values()).find(anim => anim.type === 'fadeOut');
    const slideUpAnimation = Array.from(this.animations.values()).find(anim => anim.type === 'slideUp');
    
    // 在淡出动画期间，需要临时将被移除的房产加回列表以显示淡出效果
    if (fadeOutAnimation && this.currentTab === 'trading' && this.removingProperty) {
      // 创建一个临时列表，在原始索引位置插入被移除的房产
      const tempList = [...currentList];
      if (fadeOutAnimation.removedIndex >= 0 && fadeOutAnimation.removedIndex <= tempList.length) {
        tempList.splice(fadeOutAnimation.removedIndex, 0, this.removingProperty);
        currentList = tempList;
      }
    }
    
    if (currentList.length === 0) {
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      const message = this.currentTab === 'trading' ? 
        '暂无可购买的房产' : 
        '您还没有购买任何房产';
      ctx.fillText(message, canvas.width / 2, canvas.height / 2);
      return;
    }

    const cardX = (canvas.width - this.propertyCardWidth) / 2;
    
    for (let i = 0; i < currentList.length; i++) {
      const property = currentList[i];
      const cardHeight = this.getCardHeight();
      let cardY = 200 + i * (cardHeight + this.cardPadding) - this.scrollOffset; // 150 + 50，向下平移50px
      
      // 参考官方Canvas文档：在每帧中计算动画的当前状态
      let animationOffsetY = 0;
      let animationOffsetX = 0;
      let alpha = 1;
      
      // 处理淡出动画 - 简单的透明度变化
      if (fadeOutAnimation && property.id === fadeOutAnimation.propertyId) {
        // 使用简单的线性插值，参考官方文档的动画计算方式
        alpha = 1 - fadeOutAnimation.progress;
        // 同时添加轻微的左滑效果
        animationOffsetX = -50 * fadeOutAnimation.progress;
        if (alpha <= 0.01) continue; // 几乎透明时跳过渲染
      }
      
      // 处理向上滑动动画 - 参考官方文档的位置计算方式
      if (slideUpAnimation && slideUpAnimation.removedIndex !== -1) {
        if (i >= slideUpAnimation.removedIndex) {
          // 计算动画位置：从0移动到目标位置
          const targetY = -(cardHeight + this.cardPadding);
          animationOffsetY = targetY * slideUpAnimation.progress;
        }
      }
      
      // 应用动画偏移 - 参考官方文档的坐标计算
      const finalCardX = cardX + animationOffsetX;
      const finalCardY = cardY + animationOffsetY;
      
      // 只渲染可见区域内的卡片
      if (finalCardY + cardHeight < 180 || finalCardY > canvas.height - 55) continue;
      
      // 应用动画变换 - 参考官方文档的渲染方式
      if (alpha < 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
      }
      
      this.renderPropertyCard(ctx, property, finalCardX, finalCardY);
      
      if (alpha < 1) {
        ctx.restore();
      }
    }

    // 绘制滚动条
    this.renderScrollBar(ctx);
  }

  /**
   * 渲染单个房产卡片 - 按照 Figma 设计
   */
  renderPropertyCard(ctx, property, x, y) {
    const cardHeight = this.getCardHeight();
    
    // 检查是否为传说级装修别墅，需要金边效果
    const isLegendaryVilla = property.decorationType === '传说' && property.houseType === '别墅';
    
    if (isLegendaryVilla) {
      // 渲染闪光金边效果
      this.renderGoldenBorder(ctx, x, y, this.propertyCardWidth, cardHeight);
    }
    
    // 卡片阴影 (更柔和的阴影效果)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x + 2, y + 2, this.propertyCardWidth, cardHeight);
    
    // 卡片背景
    ctx.fillStyle = '#F2F2F2';
    ctx.fillRect(x, y, this.propertyCardWidth, cardHeight);
    
    // 卡片边框
    if (isLegendaryVilla) {
      // 传说级别墅使用金色边框
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
    }
    ctx.strokeRect(x, y, this.propertyCardWidth, cardHeight);

    // 绘制房产类型横幅 banner (全宽)
    ctx.fillStyle = '#AAE0FA';
    ctx.fillRect(x, y, this.propertyCardWidth, 25);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, this.propertyCardWidth, 25);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    // 显示房产所在的district而不是"住宅"
    const districtText = property.districtType || '住宅';
    ctx.fillText(districtText, x + this.propertyCardWidth / 2, y + 17);

    // 绘制房产建筑图片 (左侧) - 按照 Figma 设计位置调整
    if (property.image) {
      this.renderPropertyImage(ctx, property.image, x + 4, y + 30, 40, 40);
    } else {
      // 备用：根据房屋类型显示文字图标
      const iconMap = {
        '别墅': '🏡',
        '大平层': '🏢', 
        '高楼': '🏗️',
        '平房': '🏠'
      };
      const icon = iconMap[property.houseType] || '🏠';
      ctx.fillStyle = '#2C3E50';
      ctx.font = '40px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(icon, x + 4, y + 65);
    }

    // 绘制房产名称 (右侧) - 支持长名称截断，按照 Figma 设计调整位置
    ctx.fillStyle = '#000000';
    ctx.font = '400 12px Inter'; // 与 Figma 保持一致
    ctx.textAlign = 'center';
    
    // 处理长名称，如果超过一定长度则截断
    let displayName = property.name;
    const maxNameWidth = 200;
    const nameWidth = ctx.measureText(displayName).width;
    if (nameWidth > maxNameWidth) {
      while (ctx.measureText(displayName + '...').width > maxNameWidth && displayName.length > 0) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }
    
    // 按照 Figma 设计调整名称位置
    ctx.fillText(displayName, x + 47 + 70, y + 45); // 图标右侧，稍微上移为星级留空间

    // 绘制星级评定 - 显示在房产名称下方
    this.renderStarRating(ctx, property.starRating, x + 47 + 70, y + 60);

    // 绘制按钮区域
    this.renderCardButtons(ctx, property, x, y);
  }

  /**
   * 渲染房产图片
   */
  renderPropertyImage(ctx, imagePath, x, y, width, height) {
    // 创建图片对象
    if (!this.propertyImages) {
      this.propertyImages = {};
    }
    
    if (!this.propertyImages[imagePath]) {
      // 兼容微信小程序和浏览器环境
      if (typeof wx !== 'undefined' && wx.createImage) {
        // 微信小程序环境
        this.propertyImages[imagePath] = wx.createImage();
      } else if (typeof Image !== 'undefined') {
        // 浏览器环境
        this.propertyImages[imagePath] = new Image();
      } else {
        // 如果都不可用，创建空对象避免错误
        this.propertyImages[imagePath] = { complete: false, src: '' };
      }
      
      this.propertyImages[imagePath].src = imagePath;
    }
    
    const img = this.propertyImages[imagePath];
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, y, width, height);
    } else {
      // 图片未加载完成时显示占位符
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
      
      // 显示加载文字
      ctx.fillStyle = '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('加载中...', x + width/2, y + height/2);
    }
  }

  /**
   * 渲染传说级别墅的闪光金边效果
   */
  renderGoldenBorder(ctx, x, y, width, height) {
    // 保存当前状态
    ctx.save();
    
    // 创建闪光效果的时间动画
    const time = Date.now() * 0.003; // 控制闪光速度
    
    // 外圈金边
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
    
    // 中圈渐变金边
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.3, '#FFA500');
    gradient.addColorStop(0.6, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
    
    // 闪光效果 - 移动的亮线
    const glowOffset = (Math.sin(time) + 1) * 0.5; // 0-1之间的值
    const glowPosition = glowOffset * (width + height) * 2;
    
    // 创建放射状渐变用于闪光
    const glowGradient = ctx.createRadialGradient(
      x + width * 0.5, y + height * 0.5, 0,
      x + width * 0.5, y + height * 0.5, Math.max(width, height) * 0.8
    );
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    // 应用闪光效果
    ctx.strokeStyle = glowGradient;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(time * 2));
    ctx.strokeRect(x - 3, y - 3, width + 6, height + 6);
    
    // 恢复状态
    ctx.restore();
  }

  /**
   * 渲染星级评定 - 6星系统
   */
  renderStarRating(ctx, starRating, centerX, centerY) {
    // 星级配置
    const maxStars = 6;
    const starSize = 16; // 星星大小
    const starSpacing = 2; // 星星间距
    const totalWidth = maxStars * starSize + (maxStars - 1) * starSpacing;
    
    // 计算起始位置（居中对齐）
    const startX = centerX - totalWidth / 2;
    
    // 星级颜色配置
    const starColors = {
      1: '#8B4513', // 1星 - 棕色
      2: '#C0C0C0', // 2星 - 银色  
      3: '#FFD700', // 3星 - 金色
      4: '#FF6B35', // 4星 - 橙红色
      5: '#9932CC', // 5星 - 紫色
      6: '#FF1493'  // 6星 - 深粉色
    };
    
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${starSize}px Arial`;
    
    // 绘制星星
    for (let i = 0; i < maxStars; i++) {
      const starX = startX + i * (starSize + starSpacing) + starSize / 2;
      
      if (i < starRating) {
        // 填充星星 - 使用对应星级的颜色
        ctx.fillStyle = starColors[starRating] || '#FFD700';
        ctx.fillText('★', starX, centerY);
        
        // 添加发光效果（对于高星级）
        if (starRating >= 4) {
          ctx.save();
          ctx.shadowColor = starColors[starRating];
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText('★', starX, centerY);
          ctx.restore();
        }
      } else {
        // 空心星星
        ctx.fillStyle = '#D3D3D3';
        ctx.fillText('☆', starX, centerY);
      }
    }
    
    ctx.restore();
  }

  /**
   * 渲染卡片按钮
   */
  renderCardButtons(ctx, property, x, y) {
    if (this.currentTab === 'trading') {
      // 三个功能按钮：价格更新、当前售价、历史最高 (透明背景，无边框)
      const buttonWidth = 110;
      const buttonHeight = 30;
      const buttonY = y + 85;
      const buttonSpacing = 10;
      
      // 价格更新按钮
      const priceUpdateX = x + 10;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(priceUpdateX, buttonY, buttonWidth, buttonHeight);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('价格更新', priceUpdateX + buttonWidth / 2, buttonY + 20);
      
      // 价格更新数值 (在按钮下方)
      const remainingTime = this.getRemainingRefreshTime();
      ctx.font = '12px Inter';
      ctx.fillText(formatRemainingTime(remainingTime), priceUpdateX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 当前售价按钮
      const currentPriceX = priceUpdateX + buttonWidth + buttonSpacing;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(currentPriceX, buttonY, buttonWidth, buttonHeight);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Inter';
      ctx.fillText('当前售价', currentPriceX + buttonWidth / 2, buttonY + 20);
      
      // 当前售价数值 (在按钮下方)
      ctx.font = '12px Inter';
      ctx.fillText(formatMoney(property.currentPrice), currentPriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 历史最高按钮
      const highestPriceX = currentPriceX + buttonWidth + buttonSpacing;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(highestPriceX, buttonY, buttonWidth, buttonHeight);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Inter';
      ctx.fillText('历史最高', highestPriceX + buttonWidth / 2, buttonY + 20);
      
      // 历史最高数值 (在按钮下方)
      ctx.font = '12px Inter';
      ctx.fillText(formatMoney(property.highestPrice), highestPriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 绘制分隔线
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 140);
      ctx.lineTo(x + this.propertyCardWidth - 10, y + 140);
      ctx.stroke();

      // 房产价格趋势按钮 - 与我的房产样式保持一致
      const trendButtonX = x + 10;
      const trendButtonY = y + 150;
      const trendButtonWidth = this.propertyCardWidth - 20;
      const trendButtonHeight = 30;
      ctx.fillStyle = '#EBFFEE';
      drawRoundRect(ctx, trendButtonX, trendButtonY, trendButtonWidth, trendButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('房产价格趋势', trendButtonX + trendButtonWidth / 2, trendButtonY + 20);

      // 购买此处房产按钮 - 与我的房产样式保持一致
      const buyButtonX = x + 10;
      const buyButtonY = y + 190;
      const buyButtonWidth = this.propertyCardWidth - 20;
      const buyButtonHeight = 30;
      ctx.fillStyle = '#24B874';
      drawRoundRect(ctx, buyButtonX, buyButtonY, buyButtonWidth, buyButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('购买此处房产', buyButtonX + buyButtonWidth / 2, buyButtonY + 20);
      
    } else if (this.currentTab === 'myProperties') {
      // 按照 Figma 设计实现"我的房产"卡片布局

      // 绘制分隔线
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 140);
      ctx.lineTo(x + this.propertyCardWidth - 10, y + 140);
      ctx.stroke();

      // 三个信息按钮 (购入价格、当前价格、交易盈亏) - 按照 Figma 设计
      const buttonWidth = 120;
      const buttonHeight = 30;
      const buttonY = y + 85;
     
      
      // 购入价格按钮 (透明背景)
      const purchasePriceX = x;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      drawRoundRect(ctx, purchasePriceX, buttonY, buttonWidth, buttonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('购入价格', purchasePriceX + buttonWidth / 2, buttonY + 20);
      
      // 购入价格数值
      ctx.fillStyle = '#000000';
      ctx.font = '400 12px Inter';
      ctx.fillText(formatMoney(property.purchasePrice || 0), purchasePriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 当前价格按钮 (透明背景)
      const currentPriceX = x + 127;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      drawRoundRect(ctx, currentPriceX, buttonY, buttonWidth, buttonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('当前价格', currentPriceX + buttonWidth / 2, buttonY + 20);
      
      // 当前价格数值
              ctx.fillStyle = '#000000';
        ctx.font = '400 12px Inter';
        ctx.fillText(formatMoney(property.currentPrice), currentPriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 交易盈亏按钮 (透明背景)
      const profitX = x + 254;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      drawRoundRect(ctx, profitX, buttonY, buttonWidth, buttonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('交易盈亏', profitX + buttonWidth / 2, buttonY + 20);
      
      // 交易盈亏数值 (绿色表示盈利)
      const profit = formatMoney(property.currentPrice - (property.purchasePrice || 0));
      ctx.fillStyle = '#24B874'; // 绿色
      ctx.font = '400 12px Inter';
      ctx.fillText(profit, profitX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 底部按钮区域 - 按照 Figma 设计布局 (mode: row, alignItems: flex-end, wrap: true, gap: 14px)
      // 按钮下移25px
      const bottomButtonStartY = y + 185 + 25; // 在进度条和文字下方留出间距，并额外下移25px
      const bottomButtonHeight = 31;
      const buttonGap = 14; // Figma 设计中的 gap
      const buttonPadding = 4; // 卡片边距，按照 Figma padding: 9px 4px
      
      // 第一行：收取租金、房屋升级、出售资产
      const firstRowY = bottomButtonStartY;
      const firstRowButtonWidth = 115;
      
      // 收取租金按钮 (绿色背景)
      const rentButtonX = x + buttonPadding;
      ctx.fillStyle = '#24B874';
      drawRoundRect(ctx, rentButtonX, firstRowY, firstRowButtonWidth, bottomButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('收取租金', rentButtonX + firstRowButtonWidth / 2, firstRowY + 20);

      // 房屋升级按钮 (淡绿色背景)
      const upgradeButtonX = rentButtonX + firstRowButtonWidth + buttonGap;
      ctx.fillStyle = '#EBFFEE';
      drawRoundRect(ctx, upgradeButtonX, firstRowY, firstRowButtonWidth, bottomButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('房屋升级', upgradeButtonX + firstRowButtonWidth / 2, firstRowY + 20);

      // 出售资产按钮 - 检查冷却期
      const sellButtonX = upgradeButtonX + firstRowButtonWidth + buttonGap;
      const cooldownStatus = this.checkPropertyCooldown(property);
      
      if (cooldownStatus.inCooldown) {
        // 冷却期间：淡灰色背景 + 倒计时文字
        ctx.fillStyle = 'rgba(128, 128, 128, 0.6)'; // 淡灰色半透明
        drawRoundRect(ctx, sellButtonX, firstRowY, firstRowButtonWidth, bottomButtonHeight, 8.98);
        ctx.fill();
        ctx.fillStyle = '#666666'; // 深灰色文字
        ctx.font = '700 10.9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${cooldownStatus.remainingSeconds}秒后可出售`, sellButtonX + firstRowButtonWidth / 2, firstRowY + 20);
      } else {
        // 正常状态：红色背景
        ctx.fillStyle = '#FCB3AD';
        drawRoundRect(ctx, sellButtonX, firstRowY, firstRowButtonWidth, bottomButtonHeight, 8.98);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = '700 10.9px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('出售资产', sellButtonX + firstRowButtonWidth / 2, firstRowY + 20);
      }
      
      // 第二行：房产价格趋势按钮 (全宽，淡绿色背景) - 按照 Figma 设计
      const secondRowY = firstRowY + bottomButtonHeight + buttonGap;
      const trendButtonWidth = this.propertyCardWidth - (buttonPadding * 2); // 减去左右边距
      ctx.fillStyle = '#EBFFEE';
      drawRoundRect(ctx, x + buttonPadding, secondRowY, trendButtonWidth, bottomButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('房产价格趋势', x + buttonPadding + trendButtonWidth / 2, secondRowY + 20);
      
      // 租金收益进度条区域 - 按照 Figma 设计布局
      const progressBarStartY = y + 140; // 调整位置，在按钮下方留出间距
      const cardPadding = 4; // 按照 Figma 的 padding: 9px 4px
      
      // 更新租金数据
      updateAllRents();
      const rentProgress = getRentProgress(property);
      
      // 进度条背景 - 按照 Figma 尺寸：374x11px，borderRadius: 32px
      const progressBgX = x + cardPadding;
      const progressBgY = progressBarStartY + 17; // 留出文字空间
      const progressBgWidth = this.propertyCardWidth - (cardPadding * 2); // 减去左右边距
      const progressBgHeight = 11;
      ctx.fillStyle = '#D9D1C2';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      drawRoundRect(ctx, progressBgX, progressBgY, progressBgWidth, progressBgHeight, 5.5);
      ctx.fill();
      ctx.stroke();
      
      // 进度条填充 - 使用真实进度
      if (rentProgress > 0) {
        const progressWidth = progressBgWidth * rentProgress;
        ctx.fillStyle = '#24B874';
        drawRoundRect(ctx, progressBgX, progressBgY, progressWidth, progressBgHeight, 5.5);
        ctx.fill();
      }
      
      // 租金信息文字 - 按照 Figma 布局
      ctx.fillStyle = '#877777';
      ctx.font = '500 12px Inter';
      ctx.textAlign = 'left';
      // 显示实际的月租金
      ctx.fillText(`租金：${formatMoney(property.monthlyRent)}/月`, x + cardPadding, progressBgY + progressBgHeight + 15);
      ctx.textAlign = 'right';
      // 资金池上限 = 月租金 / 30天 * 60秒 * 60分钟（因为游戏中1秒=1天）
      const poolLimit = Math.floor(property.monthlyRent / 30 * 60 * 60);
      ctx.fillText(`资金池上限：${formatMoney(poolLimit)}`, x + this.propertyCardWidth - cardPadding, progressBgY + progressBgHeight + 15);
      
      // 当前租金显示 - 在进度条下方，使用实时计算的金额
      ctx.fillStyle = '#877777';
      ctx.font = '500 12px Inter';
      ctx.textAlign = 'left';
      const currentRentAmount = getCurrentRentAmount(property);
      ctx.fillText(`当前租金：${formatMoney(currentRentAmount)}`, x + cardPadding, progressBgY + progressBgHeight + 30);
    }
  }

  /**
   * 渲染滚动条
   */
  renderScrollBar(ctx) {
    if (this.maxScrollOffset <= 0) return;
    
    const scrollBarX = canvas.width - 8;
    const scrollBarY = 160; // 110 + 50，向下平移50px
    const scrollBarHeight = canvas.height - 185; // 调整高度以避免与底部导航栏重叠
    const scrollBarWidth = 6;

    // 滚动条背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);

    // 滑块
    const visibleRatio = scrollBarHeight / (scrollBarHeight + this.maxScrollOffset);
    const sliderHeight = Math.max(20, scrollBarHeight * visibleRatio);
    const sliderY = scrollBarY + (this.scrollOffset / this.maxScrollOffset) * (scrollBarHeight - sliderHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(scrollBarX, sliderY, scrollBarWidth, sliderHeight);
  }

  /**
   * 渲染底部导航栏 - 按照 Figma 设计，永远置顶
   */
  // 移除本地的renderBottomNavigation函数，使用utils中的版本

  /**
   * 渲染交易记录页面 - 按照 Figma 设计 (node-id=85-647)
   */
  renderTransactionHistory(ctx) {
    if (!this.assetTracker) {
      // 如果没有资产追踪器，显示提示信息
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('资产追踪器未初始化', canvas.width / 2, canvas.height / 2);
      return;
    }

    // 按照 Figma 设计的布局 - 向下平移50px
    const chartAreaY = 194; // 144 + 50，向下平移50px
    const chartAreaHeight = 327;
    const transactionAreaY = chartAreaY + chartAreaHeight + 16; // 16px gap
    const transactionAreaHeight = 436;

    // 绘制资产价值图表区域 - 使用 Figma 设计
    this.renderAssetChartFigma(ctx, 5, chartAreaY, 384, chartAreaHeight);

    // 绘制交易记录区域 - 使用 Figma 设计
    this.renderTransactionRecordsFigma(ctx, 5, transactionAreaY, 384, transactionAreaHeight);
  }

  // 移除本地的formatValueInWan函数，使用utils中的版本

  /**
   * 渲染交易记录滚动条
   */
  renderTransactionScrollBar(ctx, x, y, width, height) {
    if (this.maxTransactionScrollOffset <= 0) return;
    
    // 滚动条背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(x, y, width, height);

    // 滑块
    const visibleRatio = height / (height + this.maxTransactionScrollOffset);
    const sliderHeight = Math.max(20, height * visibleRatio);
    const sliderY = y + (this.transactionScrollOffset / this.maxTransactionScrollOffset) * (height - sliderHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x, sliderY, width, sliderHeight);
  }

  /**
   * 计算资产数据点在图表中的位置
   * 基于实际游戏时间计算位置，横坐标始终代表10分钟的时间轴
   */
  calculateAssetDataPointPositions(assetData, chartX, chartWidth, currentGameTime, dataLengthMs) {
    if (assetData.length === 0) return [];
    
    const positions = [];
    const recordInterval = ASSET_TRACKING_CONFIG.RECORD_INTERVAL; // 10秒记录间隔
    const maxTimeSpan = 10 * 60 * 1000; // 10分钟时间跨度（毫秒）
    
    // 数据已经是按时间顺序排列的，无需再排序
    assetData.forEach((record, index) => {

      let timePosition;
      
      if (currentGameTime <= maxTimeSpan) {
        // 游戏时间不超过10分钟：基于实际时间位置
        // 数据点的时间位置 = (index * 记录间隔) / 总时间跨度
        const dataPointTime = index * recordInterval;
        timePosition = dataPointTime / maxTimeSpan;
      } else {
        // 游戏时间超过10分钟：显示最近10分钟的数据
        // 计算数据点相对于当前时间的偏移
        const dataPointTime = currentGameTime - (assetData.length - 1 - index) * recordInterval;
        const startTime = currentGameTime - maxTimeSpan;
        timePosition = (dataPointTime - startTime) / maxTimeSpan;
      }
      
      // 确保位置在有效范围内
      timePosition = Math.max(0, Math.min(1, timePosition));
      
      // 计算x坐标
      const x = chartX + timePosition * chartWidth;
      positions.push({
        x,
        totalAssetValue: record.totalAssetValue
      });
    });
    
    return positions;
  }
} 