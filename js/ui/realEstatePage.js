import { 
  CURRENT_TRADING_PROPERTIES, 
  formatPropertyPrice, 
  formatRemainingTime, 
  purchaseProperty,
  getUserProperties,
  initializeRealEstate,
  getTimeUntilNextPriceUpdate,
  checkPriceUpdate
} from '../config/realEstateConfig.js';
import PropertyHistoryModal from './propertyHistoryModal.js';

/**
 * 售楼处页面
 * 包含左侧导航栏和右侧房产列表
 */
export default class RealEstatePage {
  constructor(assetTracker = null) {
    this.isVisible = false;
    this.currentTab = 'trading'; // 'trading', 'myProperties', 或 'transactionHistory'
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    this.propertyCardHeight = 120;
    this.propertyCardWidth = 250;
    this.propertiesPerPage = 15;
    this.assetTracker = assetTracker; // 资产追踪器引用
    
    // 初始化房产历史价格弹窗
    this.propertyHistoryModal = new PropertyHistoryModal();
    
    // 初始化房产数据（现在会自动启动统一的价格更新定时器）
    initializeRealEstate();
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
      // 交易记录页面的滚动计算在渲染方法中动态处理
      return;
    }
    
    const currentList = this.getCurrentPropertyList();
    const totalHeight = currentList.length * (this.propertyCardHeight + 10);
    const visibleHeight = canvas.height - 100; // 减去顶部导航栏高度
    this.maxScrollOffset = Math.max(0, totalHeight - visibleHeight);
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
      // 交易记录返回空数组，因为会有特殊的渲染逻辑
      return [];
    }
    return [];
  }

  /**
   * 购买房产
   */
  buyProperty(propertyId) {
    const purchasedProperty = purchaseProperty(propertyId);
    if (purchasedProperty) {
      // 重新计算滚动范围
      this.calculateMaxScroll();
      return purchasedProperty;
    }
    return null;
  }

  /**
   * 检查并执行刷新
   */
  checkAndRefresh() {
    // 使用统一的价格更新检查机制
    const updated = checkPriceUpdate();
    
    if (updated) {
      // 重新计算滚动范围
      this.calculateMaxScroll();
      console.log('房产价格已更新，重新计算滚动范围');
    }
    
    return updated;
  }

  /**
   * 获取剩余刷新时间
   */
  getRemainingRefreshTime() {
    // 使用统一的倒计时机制
    return getTimeUntilNextPriceUpdate();
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 首先处理弹窗触摸事件
    if (this.propertyHistoryModal.isVisible) {
      const result = this.propertyHistoryModal.handleTouch(x, y);
      if (result) {
        return result;
      }
    }

    console.log('售楼处触摸事件:', {
      x, y, 
      currentTab: this.currentTab,
      isVisible: this.isVisible
    });

    // 检查左侧导航栏点击
    if (x <= 100) { // 导航栏宽度
      if (y >= 50 && y <= 90) { // 交易大厅按钮
        this.currentTab = 'trading';
        this.scrollOffset = 0; // 重置滚动
        this.calculateMaxScroll();
        console.log('切换到交易大厅');
        return { type: 'tabChange', tab: 'trading' };
      } else if (y >= 100 && y <= 140) { // 我的房产按钮
        this.currentTab = 'myProperties';
        this.scrollOffset = 0; // 重置滚动
        this.calculateMaxScroll();
        console.log('切换到我的房产');
        return { type: 'tabChange', tab: 'myProperties' };
      } else if (y >= 150 && y <= 190) { // 交易记录按钮
        this.currentTab = 'transactionHistory';
        this.scrollOffset = 0; // 重置滚动
        this.calculateMaxScroll();
        console.log('切换到交易记录');
        return { type: 'tabChange', tab: 'transactionHistory' };
      }
    }

    // 检查返回按钮点击
    if (x >= canvas.width - 60 && x <= canvas.width - 20 &&
        y >= 20 && y <= 60) {
      this.hide();
      return { type: 'close' };
    }

    // 检查房产列表点击
    if (x > 120) { // 导航栏宽度 + 间距
      const currentList = this.getCurrentPropertyList();
      
      console.log('房产列表状态:', {
        currentTab: this.currentTab,
        listLength: currentList.length,
        propertyNames: currentList.map(p => p.name)
      });
      
      // 遍历所有可见的房产卡片
      for (let i = 0; i < currentList.length; i++) {
        const property = currentList[i];
        const cardY = 60 + i * (this.propertyCardHeight + 10) - this.scrollOffset;
        
        // 检查是否在当前卡片范围内
        if (y >= cardY && y <= cardY + this.propertyCardHeight) {
          if (this.currentTab === 'trading') {
            // 检查是否点击了历史价格按钮
            const historyButtonX = 120 + this.propertyCardWidth - 100;
            const historyButtonY = cardY + 60;
            const historyButtonWidth = 90;
            const historyButtonHeight = 20;
            
            if (x >= historyButtonX && x <= historyButtonX + historyButtonWidth &&
                y >= historyButtonY && y <= historyButtonY + historyButtonHeight) {
              // 显示历史价格弹窗
              this.propertyHistoryModal.show(canvas.width, canvas.height, property);
              return { type: 'showHistory', property: property };
            }
            
            return { type: 'purchase', option: property };
          } else if (this.currentTab === 'myProperties') {
            // 在我的房产页面，检查是否点击了出售按钮
            const sellButtonX = 120 + this.propertyCardWidth - 60;
            const sellButtonY = cardY + this.propertyCardHeight - 35;
            const sellButtonWidth = 50;
            const sellButtonHeight = 25;
            
            console.log('出售按钮检测:', {
              clickX: x, clickY: y,
              buttonX: sellButtonX, buttonY: sellButtonY,
              buttonWidth: sellButtonWidth, buttonHeight: sellButtonHeight,
              cardY: cardY,
              propertyName: property.name
            });
            
            if (x >= sellButtonX && x <= sellButtonX + sellButtonWidth &&
                y >= sellButtonY && y <= sellButtonY + sellButtonHeight) {
              console.log('出售按钮被点击:', property.name);
              return { type: 'sell_property', property: property };
            } else {
              return { type: 'viewProperty', property };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * 处理滚动事件
   */
  handleScroll(deltaY) {
    if (!this.isVisible) return;
    
    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + deltaY));
  }

  /**
   * 渲染页面
   */
  render(ctx) {
    if (!this.isVisible) return;

    // 检查并执行刷新
    this.checkAndRefresh();

    ctx.save();

    // 绘制背景
    ctx.fillStyle = '#F5F6FA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制顶部标题栏
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, canvas.width, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏠 售楼处', canvas.width / 2, 35);

    // 绘制返回按钮
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(canvas.width - 60, 20, 40, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('←', canvas.width - 40, 45);

    // 绘制左侧导航栏
    ctx.fillStyle = '#34495E';
    ctx.fillRect(0, 50, 100, canvas.height - 50);

    // 绘制导航按钮
    const drawNavButton = (text, y, isActive) => {
      ctx.fillStyle = isActive ? '#3498DB' : '#2C3E50';
      ctx.fillRect(10, y, 80, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, 50, y + 25);
    };

    drawNavButton('交易大厅', 60, this.currentTab === 'trading');
    drawNavButton('我的房产', 110, this.currentTab === 'myProperties');
    drawNavButton('交易记录', 160, this.currentTab === 'transactionHistory');

    // 绘制刷新倒计时（仅在交易大厅显示）
    if (this.currentTab === 'trading') {
      const remainingTime = this.getRemainingRefreshTime();
      ctx.fillStyle = '#E67E22';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`下次刷新: ${formatRemainingTime(remainingTime)}`, 50, 220);
    }

    // 根据当前标签页渲染不同内容
    if (this.currentTab === 'transactionHistory') {
      this.renderTransactionHistory(ctx);
    } else {
      // 绘制右侧房产列表
      const startX = 120;
      const startY = 60;
      const currentList = this.getCurrentPropertyList();

      // 如果没有房产，显示提示信息
      if (currentList.length === 0) {
        ctx.fillStyle = '#7F8C8D';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        const message = this.currentTab === 'trading' ? 
          '暂无可购买的房产' : 
          '您还没有购买任何房产';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
      } else {
      for (let i = 0; i < currentList.length; i++) {
        const property = currentList[i];
        const y = startY + i * (this.propertyCardHeight + 10) - this.scrollOffset;

        // 只渲染可见区域内的房产卡片
        if (y + this.propertyCardHeight < 60 || y > canvas.height) continue;

        // 绘制房产卡片背景
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.fillRect(startX, y, this.propertyCardWidth, this.propertyCardHeight);
        ctx.strokeRect(startX, y, this.propertyCardWidth, this.propertyCardHeight);

        // 绘制房产图标
        ctx.fillStyle = '#2C3E50';
        ctx.font = '36px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(property.icon, startX + 20, y + 40);

        // 绘制房产名称
        ctx.fillStyle = '#2C3E50';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(property.name, startX + 70, y + 30);

        // 绘制房产类别和城市
        ctx.fillStyle = '#7F8C8D';
        ctx.font = '12px Arial';
        ctx.fillText(`${property.category} | ${property.city}`, startX + 70, y + 50);

        if (this.currentTab === 'trading') {
          // 交易大厅显示当前价值和历史最高
          ctx.fillStyle = '#27AE60';
          ctx.font = '14px Arial';
          ctx.fillText(`当前价值: ${formatPropertyPrice(property.currentPrice)}`, startX + 70, y + 70);

          ctx.fillStyle = '#E67E22';
          ctx.font = '14px Arial';
          ctx.fillText(`历史最高: ${formatPropertyPrice(property.highestPrice)}`, startX + 70, y + 90);

          // 绘制历史价格按钮
          const historyButtonX = startX + this.propertyCardWidth - 100;
          const historyButtonY = y + 60;
          const historyButtonWidth = 90;
          const historyButtonHeight = 20;

          // 历史价格按钮背景
          ctx.fillStyle = '#3498DB';
          ctx.fillRect(historyButtonX, historyButtonY, historyButtonWidth, historyButtonHeight);

          // 历史价格按钮边框
          ctx.strokeStyle = '#2980B9';
          ctx.lineWidth = 1;
          ctx.strokeRect(historyButtonX, historyButtonY, historyButtonWidth, historyButtonHeight);

          // 历史价格按钮文字
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '11px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('📈 历史价格', historyButtonX + historyButtonWidth / 2, historyButtonY + 14);
          
          // 恢复文字对齐方式
          ctx.textAlign = 'left';
        } else {
          // 我的房产显示购买价格和当前价值
          ctx.fillStyle = '#3498DB';
          ctx.font = '14px Arial';
          ctx.fillText(`购买价格: ${formatPropertyPrice(property.purchasePrice)}`, startX + 70, y + 70);

          ctx.fillStyle = '#27AE60';
          ctx.font = '14px Arial';
          ctx.fillText(`当前价值: ${formatPropertyPrice(property.currentPrice)}`, startX + 70, y + 90);

          // 显示盈亏
          const profit = property.currentPrice - property.purchasePrice;
          const profitColor = profit >= 0 ? '#27AE60' : '#E74C3C';
          const profitText = profit >= 0 ? `+${formatPropertyPrice(profit)}` : formatPropertyPrice(profit);
          ctx.fillStyle = profitColor;
          ctx.font = '12px Arial';
          ctx.fillText(`盈亏: ${profitText}`, startX + 70, y + 110);

          // 绘制出售按钮
          const sellButtonX = startX + this.propertyCardWidth - 60;
          const sellButtonY = y + this.propertyCardHeight - 35;
          const sellButtonWidth = 50;
          const sellButtonHeight = 25;

          // 出售按钮背景
          ctx.fillStyle = '#E67E22';
          ctx.fillRect(sellButtonX, sellButtonY, sellButtonWidth, sellButtonHeight);

          // 出售按钮边框
          ctx.strokeStyle = '#D35400';
          ctx.lineWidth = 1;
          ctx.strokeRect(sellButtonX, sellButtonY, sellButtonWidth, sellButtonHeight);

          // 出售按钮文字
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('出售', sellButtonX + sellButtonWidth / 2, sellButtonY + 16);
          
          // 恢复文字对齐方式
          ctx.textAlign = 'left';
        }
      }
    }
    }

    // 绘制滚动条（如果内容超出可视区域）
    if (this.maxScrollOffset > 0) {
      const scrollBarX = canvas.width - 15;
      const scrollBarY = 60;
      const scrollBarHeight = canvas.height - 70;
      const scrollBarWidth = 8;

      // 绘制滚动条背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);

      // 计算滚动条滑块的位置和大小
      const visibleRatio = scrollBarHeight / (scrollBarHeight + this.maxScrollOffset);
      const sliderHeight = Math.max(20, scrollBarHeight * visibleRatio);
      const sliderY = scrollBarY + (this.scrollOffset / this.maxScrollOffset) * (scrollBarHeight - sliderHeight);

      // 绘制滚动条滑块
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(scrollBarX + 1, sliderY, scrollBarWidth - 2, sliderHeight);

      // 绘制滚动条边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);
    }

    ctx.restore();
    
    // 渲染房产历史价格弹窗（最后渲染，确保在最顶层）
    if (this.propertyHistoryModal) {
      this.propertyHistoryModal.render(ctx);
    }
  }

  /**
   * 渲染交易记录页面
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

    const startX = 120;
    const startY = 60;
    const contentWidth = canvas.width - startX - 20;
    const contentHeight = canvas.height - startY - 20;

    // 绘制资产价值折线图（上半部分）
    const chartHeight = Math.floor(contentHeight * 0.4);
    this.renderAssetChart(ctx, startX, startY, contentWidth, chartHeight);

    // 绘制交易记录列表（下半部分）
    const recordsStartY = startY + chartHeight + 20;
    const recordsHeight = contentHeight - chartHeight - 30;
    this.renderTransactionRecords(ctx, startX, recordsStartY, contentWidth, recordsHeight);
  }

  /**
   * 渲染资产价值折线图
   */
  renderAssetChart(ctx, x, y, width, height) {
    const chartData = this.assetTracker.getChartData(15); // 最多显示15个点
    
    // 绘制图表背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // 绘制图表标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('资产价值变化图（最近10分钟）', x + 15, y + 25);

    if (chartData.length < 2) {
      // 数据不足，显示提示
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('数据收集中，每分钟更新一次', x + width / 2, y + height / 2);
      return;
    }

    // 计算图表绘制区域
    const chartPadding = 40;
    const chartX = x + chartPadding;
    const chartY = y + 40;
    const chartWidth = width - chartPadding * 2;
    const chartHeight = height - 60;

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

    // 绘制网格线
    ctx.strokeStyle = '#F0F0F0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const gridY = chartY + (i * chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(chartX, gridY);
      ctx.lineTo(chartX + chartWidth, gridY);
      ctx.stroke();
    }

    // 绘制Y轴标签
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const labelY = chartY + (i * chartHeight / 4) + 4;
      const value = maxValue - (i * (maxValue - minValue) / 4);
      ctx.fillText(formatPropertyPrice(value), chartX - 10, labelY);
    }

    // 绘制折线
    if (chartData.length > 1) {
      ctx.strokeStyle = '#3498DB';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < chartData.length; i++) {
        const point = chartData[i];
        const plotX = chartX + (i * chartWidth / (chartData.length - 1));
        const plotY = chartY + chartHeight - ((point.totalAssetValue - minValue) / (maxValue - minValue)) * chartHeight;

        if (i === 0) {
          ctx.moveTo(plotX, plotY);
        } else {
          ctx.lineTo(plotX, plotY);
        }
      }
      ctx.stroke();

      // 绘制数据点
      ctx.fillStyle = '#3498DB';
      for (let i = 0; i < chartData.length; i++) {
        const point = chartData[i];
        const plotX = chartX + (i * chartWidth / (chartData.length - 1));
        const plotY = chartY + chartHeight - ((point.totalAssetValue - minValue) / (maxValue - minValue)) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(plotX, plotY, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 绘制X轴标签（时间）
    ctx.fillStyle = '#7F8C8D';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    // 显示时间轴标签（显示距离当前时间的分钟数）
    const now = Date.now();
    const labelStep = Math.max(1, Math.floor(chartData.length / 5));
    
    for (let i = 0; i < chartData.length; i += labelStep) {
      const point = chartData[i];
      const plotX = chartX + (i * chartWidth / (chartData.length - 1));
      
      // 计算距离当前时间的分钟数
      const minutesAgo = Math.floor((now - point.timestamp) / 60000);
      const timeLabel = minutesAgo <= 0 ? '现在' : `${minutesAgo}分钟前`;
      
      ctx.fillText(timeLabel, plotX, chartY + chartHeight + 15);
    }
    
    // 在最右侧添加"现在"标签
    if (chartData.length > 0) {
      const lastPlotX = chartX + chartWidth;
      ctx.fillText('现在', lastPlotX, chartY + chartHeight + 15);
    }
  }

  /**
   * 渲染交易记录列表
   */
  renderTransactionRecords(ctx, x, y, width, height) {
    const transactions = this.assetTracker.getTransactionHistory();
    
    // 绘制标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('交易记录', x + 15, y + 20);

    if (transactions.length === 0) {
      // 没有交易记录
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('暂无交易记录', x + width / 2, y + height / 2);
      return;
    }

    // 计算每个交易记录的高度
    const recordHeight = 60;
    const recordsStartY = y + 35;
    const visibleRecords = Math.floor((height - 35) / recordHeight);
    
    // 计算滚动偏移量对应的记录索引
    const startIndex = Math.floor(this.scrollOffset / recordHeight);
    const endIndex = Math.min(startIndex + visibleRecords + 1, transactions.length);

    // 绘制可见的交易记录
    for (let i = startIndex; i < endIndex; i++) {
      const transaction = transactions[i];
      const recordY = recordsStartY + (i * recordHeight) - this.scrollOffset;
      
      // 检查是否在可见区域
      if (recordY + recordHeight < y || recordY > y + height) continue;

      // 绘制记录背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 10, recordY, width - 20, recordHeight - 5);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 10, recordY, width - 20, recordHeight - 5);

      // 绘制交易类型图标
      const iconX = x + 25;
      const iconY = recordY + 30;
      ctx.fillStyle = transaction.type === 'buy' ? '#27AE60' : '#E74C3C';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(transaction.type === 'buy' ? '📈' : '📉', iconX, iconY);

      // 绘制房产图标
      ctx.fillStyle = '#2C3E50';
      ctx.font = '20px Arial';
      ctx.fillText(transaction.propertyIcon, iconX + 40, iconY);

      // 绘制交易信息
      const textX = iconX + 70;
      ctx.fillStyle = '#2C3E50';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${transaction.type === 'buy' ? '购买' : '出售'} ${transaction.propertyName}`,
        textX, recordY + 20
      );

      // 绘制价格
      ctx.fillStyle = transaction.type === 'buy' ? '#E74C3C' : '#27AE60';
      ctx.font = '12px Arial';
      ctx.fillText(
        `${transaction.type === 'buy' ? '-' : '+'}${formatPropertyPrice(transaction.price)}`,
        textX, recordY + 35
      );

      // 绘制时间
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '10px Arial';
      const timeAgo = this.assetTracker.formatTimeFromStart(transaction.timeFromStart);
      ctx.fillText(`${timeAgo}前`, textX, recordY + 50);

      // 绘制交易后余额
      ctx.fillStyle = '#3498DB';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(
        `余额: ${formatPropertyPrice(transaction.currentCash)}`,
        x + width - 20, recordY + 35
      );
    }

    // 更新滚动计算
    this.maxScrollOffset = Math.max(0, transactions.length * recordHeight - (height - 35));
  }
} 