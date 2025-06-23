import { 
  CURRENT_TRADING_PROPERTIES, 
  formatPropertyPrice, 
  formatRemainingTime, 
  purchaseProperty,
  getUserProperties,
  initializeRealEstate,
  getTimeUntilNextPriceUpdate,
  checkPriceUpdate,
  updateAllRents,
  getRentProgress
} from '../config/realEstateConfig.js';
import PropertyHistoryModal from './propertyHistoryModal.js';
import PurchaseConfirmModal from './purchaseConfirmModal.js';
import SellConfirmModal from './sellConfirmModal.js';
import { CHART_TIME_CONFIG, ANIMATION_TIME_CONFIG } from '../config/timeConfig.js';

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
    
    // 交易记录时间选择
    this.selectedTimeRange = '1hour'; // '1hour', '12hours', '24hours'
    
    // 初始化弹窗组件
    this.propertyHistoryModal = new PropertyHistoryModal();
    this.purchaseConfirmModal = new PurchaseConfirmModal();
    this.sellConfirmModal = new SellConfirmModal();
    
    // 动画系统
    this.animations = new Map(); // 存储正在进行的动画
    this.animationId = 0; // 动画ID计数器
    this.removingPropertyId = null; // 正在移除的房产ID
    this.removingProperty = null; // 正在移除的房产对象
    
    // 初始化房产数据
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
      return;
    }
    
    const currentList = this.getCurrentPropertyList();
    const cardHeight = this.getCardHeight();
    const totalHeight = currentList.length * (cardHeight + this.cardPadding);
    const visibleHeight = canvas.height - 150 - 55; // 减去顶部金钱栏、分段控制器和底部导航栏高度
    this.maxScrollOffset = Math.max(0, totalHeight - visibleHeight);
  }

  /**
   * 获取当前标签页的卡片高度
   */
  getCardHeight() {
    // 按照 Figma 设计调整卡片高度
    // 我的房产卡片需要更多空间来容纳按钮布局，按钮下移25px后需要更多空间
    return this.currentTab === 'myProperties' ? 355 : 230;
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
  buyProperty(propertyId) {
    const purchasedProperty = purchaseProperty(propertyId);
    if (purchasedProperty) {
      // 启动卡片消失动画
      this.startCardRemoveAnimation(propertyId);
      return purchasedProperty;
    }
    return null;
  }

  /**
   * 检查并执行刷新
   */
  checkAndRefresh() {
    const updated = checkPriceUpdate();
    
    if (updated) {
      this.calculateMaxScroll();
      console.log('房产价格已更新，重新计算滚动范围');
    }
    
    return updated;
  }

  /**
   * 获取剩余刷新时间
   */
  getRemainingRefreshTime() {
    return getTimeUntilNextPriceUpdate();
  }

  /**
   * 启动卡片移除动画
   */
  startCardRemoveAnimation(propertyId) {
    console.log('🎬 启动卡片移除动画:', propertyId);
    this.removingPropertyId = propertyId;
    
    // 在房产被移除之前记录其在列表中的索引和对象引用
    const currentList = this.getCurrentPropertyList();
    const removedIndex = currentList.findIndex(p => p.id === propertyId);
    this.removingProperty = currentList.find(p => p.id === propertyId);
    
    console.log('📍 被移除房产信息:', {
      propertyId,
      removedIndex,
      propertyName: this.removingProperty?.name,
      currentListLength: currentList.length
    });
    
    // 创建淡出动画
    const fadeOutAnimation = {
      id: ++this.animationId,
      type: 'fadeOut',
      propertyId: propertyId,
      removedIndex: removedIndex, // 记录原始索引
      duration: ANIMATION_TIME_CONFIG.CARD_REMOVE_DURATION, // 卡片移除动画持续时间
      startTime: Date.now(),
      progress: 0,
      onComplete: () => {
        console.log('✅ 淡出动画完成，启动滑动动画');
        // 淡出完成后，启动向上移动动画
        this.startCardsSlideUpAnimation(propertyId, removedIndex);
      }
    };
    
    this.animations.set(fadeOutAnimation.id, fadeOutAnimation);
    console.log('📦 动画已添加到队列，当前动画数量:', this.animations.size);
  }

  /**
   * 启动其他卡片向上滑动动画
   */
  startCardsSlideUpAnimation(removedPropertyId, removedIndex) {
    const slideUpAnimation = {
      id: ++this.animationId,
      type: 'slideUp',
      removedPropertyId: removedPropertyId,
      removedIndex: removedIndex, // 使用传入的原始索引
      duration: ANIMATION_TIME_CONFIG.CARD_SLIDE_DURATION, // 卡片滑动动画持续时间
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
    const now = Date.now();
    const completedAnimations = [];
    
    for (const [id, animation] of this.animations) {
      const elapsed = now - animation.startTime;
      animation.progress = Math.min(elapsed / animation.duration, 1);
      
      // 调试信息：显示动画进度
      if (animation.type === 'fadeOut') {
        console.log(`🎭 淡出动画进度: ${(animation.progress * 100).toFixed(1)}%`);
      }
      
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
   * 缓动函数 - easeOutCubic
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 1. 首先检查底部导航栏 - 最高优先级，防止被卡片遮挡
    const navHeight = 55;
    const navY = canvas.height - navHeight;
    const navWidth = 393;
    const navX = (canvas.width - navWidth) / 2;
    
    if (y >= navY && y <= navY + navHeight && x >= navX && x <= navX + navWidth) {
      const navItems = [
        { name: '世界', x: navX + 59 + 8, width: 42, action: 'home' },
        { name: '交易', x: navX + 59 + 121, width: 56, action: 'trading' },
        { name: '经营', x: navX + 59 + 234, width: 56, action: 'management' }
      ];
      
      for (let item of navItems) {
        if (x >= item.x && x <= item.x + item.width) {
          if (item.action === 'home') {
            // 跳转到首页
            this.hide();
            return { type: 'navigation', action: 'home' };
          } else if (item.action === 'trading') {
            // 跳转到交易大厅
            this.currentTab = 'trading';
            this.scrollOffset = 0;
            this.calculateMaxScroll();
            return { type: 'navigation', action: 'trading' };
          } else if (item.action === 'management') {
            // 经营暂时不做跳转
            console.log('经营功能暂未开放');
            return null;
          }
        }
      }
    }

    // 2. 处理弹窗触摸事件 - 优先级顺序：购买确认 > 出售确认 > 历史价格
    if (this.purchaseConfirmModal.isVisible) {
      const result = this.purchaseConfirmModal.handleTouch(x, y);
      if (result && result.type === 'confirm' && result.property) {
        // 确认购买 - 添加空值检查
        const purchased = this.buyProperty(result.property.id);
        if (purchased) {
          return { type: 'purchase_success', property: purchased };
        } else {
          return { type: 'purchase_failed', property: result.property };
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

    // 3. 检查返回按钮点击 (左上角圆形按钮)
    const backButtonX = 20;
    const backButtonY = 30;
    const backButtonSize = 30;
    const backButtonCenterX = backButtonX + backButtonSize / 2;
    const backButtonCenterY = backButtonY + backButtonSize / 2;
    const distance = Math.sqrt((x - backButtonCenterX) ** 2 + (y - backButtonCenterY) ** 2);
    
    if (distance <= backButtonSize / 2) {
      this.hide();
      return { type: 'close' };
    }

    // 在交易记录页面，检查时间选择器点击
    if (this.currentTab === 'transactionHistory') {
      const timeTabsY = 144 + 20 + 32; // chartAreaY + contentY + timeTabsY
      const timeTabsHeight = 20;
      const contentX = 5 + 12; // x + padding
      
      if (y >= timeTabsY && y <= timeTabsY + timeTabsHeight) {
        const timeRanges = [
          { key: '1hour', x: contentX + 50, width: 80 },
          { key: '12hours', x: contentX + 140, width: 80 },
          { key: '24hours', x: contentX + 240, width: 80 }
        ];
        
        for (let range of timeRanges) {
          if (x >= range.x - range.width/2 && x <= range.x + range.width/2) {
            this.selectedTimeRange = range.key;
            return null; // 处理了时间选择，不传递事件
          }
        }
      }
    }

    // 检查分段控制器点击
    const segmentedControlWidth = 384;
    const segmentedControlHeight = 32;
    const segmentedControlX = (canvas.width - segmentedControlWidth) / 2;
    const segmentedControlY = 80;
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

    // 检查房产卡片点击
    if (y > 130 && y < canvas.height) { // 在卡片区域内
      const currentList = this.getCurrentPropertyList();
      
      for (let i = 0; i < currentList.length; i++) {
        const property = currentList[i];
        const cardX = (canvas.width - this.propertyCardWidth) / 2;
        const cardHeight = this.getCardHeight();
        const cardY = 150 + i * (cardHeight + this.cardPadding) - this.scrollOffset;
        
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
            
            // 出售资产按钮 - 显示出售确认弹窗
            const sellButtonX = upgradeButtonX + firstRowButtonWidth + buttonGap;
            if (x >= sellButtonX && x <= sellButtonX + firstRowButtonWidth &&
                y >= firstRowY && y <= firstRowY + bottomButtonHeight) {
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
    
    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + deltaY));
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
   * 渲染页面 - 新设计版本
   */
  render(ctx) {
    if (!this.isVisible) return;

    // 更新动画
    this.updateAnimations();

    this.checkAndRefresh();
    ctx.save();

    // 绘制背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制顶部金钱栏 - 按照 Figma 设计
    this.renderTopMoneyBar(ctx);

    // 绘制分段控制器 - 按照 Figma 设计
    const segmentedControlWidth = 384;
    const segmentedControlHeight = 32;
    const segmentedControlX = (canvas.width - segmentedControlWidth) / 2;
    const segmentedControlY = 80; // 为顶部金钱栏留出更多空间
    const borderRadius = 9;
    
    // 绘制整体背景 (浅灰色半透明)
    ctx.fillStyle = 'rgba(120, 120, 128, 0.12)';
    this.drawRoundRect(ctx, segmentedControlX, segmentedControlY, segmentedControlWidth, segmentedControlHeight, borderRadius);
    ctx.fill();
    
    const tabs = [
      { name: '交易大厅', key: 'trading' },
      { name: '我的房产', key: 'myProperties' },
      { name: '交易记录', key: 'transactionHistory' }
    ];
    
    const tabWidth = (segmentedControlWidth - 4) / 3; // 减去内边距
    
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      const tabX = segmentedControlX + 2 + i * tabWidth;
      const tabY = segmentedControlY + 2;
      const tabHeight = segmentedControlHeight - 4;
      const isActive = this.currentTab === tab.key;
      
      if (isActive) {
        // 激活状态：白色背景，阴影效果
        ctx.fillStyle = '#FFFFFF';
        this.drawRoundRect(ctx, tabX, tabY, tabWidth, tabHeight, 7);
        ctx.fill();
        
        // 添加阴影效果
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // 文字样式 (加粗)
        ctx.fillStyle = '#000000';
        ctx.font = '590 13px SF Pro, Inter';
        ctx.textAlign = 'center';
        ctx.fillText(tab.name, tabX + tabWidth / 2, tabY + 16);
      } else {
        // 非激活状态文字
        ctx.fillStyle = '#000000';
        ctx.font = '400 13px SF Pro, Inter';
        ctx.textAlign = 'center';
        ctx.fillText(tab.name, tabX + tabWidth / 2, tabY + 16);
      }
      
      // 绘制分隔线 (除了最后一个)
      if (i < tabs.length - 1) {
        ctx.fillStyle = 'rgba(142, 142, 147, 0.3)';
        const separatorX = tabX + tabWidth;
        const separatorY = tabY + (tabHeight - 12) / 2;
        ctx.fillRect(separatorX, separatorY, 1, 12);
      }
    }



    // 根据当前标签页渲染内容
    if (this.currentTab === 'transactionHistory') {
      this.renderTransactionHistory(ctx);
    } else {
      this.renderPropertyCards(ctx);
    }

    // 绘制底部导航栏 - 永远在最上层
    this.renderBottomNavigation(ctx);

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

  /**
   * 渲染顶部金钱栏 - 按照 Figma 设计
   */
  renderTopMoneyBar(ctx) {
    // 返回按钮 (左侧) - 按照 Figma 设计
    const backButtonX = 20;
    const backButtonY = 30;
    const backButtonSize = 30;
    
    // 返回按钮背景 (圆形)
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.arc(backButtonX + backButtonSize / 2, backButtonY + backButtonSize / 2, backButtonSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 返回箭头图标
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('←', backButtonX + backButtonSize / 2, backButtonY + backButtonSize / 2 + 5);
    
    // 资金显示栏 (右侧) - 按照 Figma 设计 (node-id=66-1897)
    const barHeight = 30;
    const barWidth = 250;
    const barX = canvas.width - barWidth - 20;
    const barY = 30;
    const borderRadius = 10.62; // 按照 Figma 设计圆角
    
    // 绘制圆角背景
    ctx.fillStyle = '#16996B';
    this.drawRoundRect(ctx, barX, barY, barWidth, barHeight, borderRadius);
    ctx.fill();
    
    // 钱包图标 (左侧)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💰', barX + 26.56 / 2, barY + 20);
    
    // 金额文字 (居中)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 16px Inter';
    ctx.textAlign = 'center';
    
    // 获取当前金额
    const currentMoney = this.getMoneyCallback ? this.getMoneyCallback() : 0;
    ctx.fillText('$' + formatPropertyPrice(currentMoney).replace('$', ''), barX + barWidth / 2, barY + 20);
    
    // 右侧图标
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📊', barX + barWidth - 26.56 / 2, barY + 20);
  }

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
      console.log('🔄 淡出动画进行中，添加被移除房产到临时列表');
      // 创建一个临时列表，在原始索引位置插入被移除的房产
      const tempList = [...currentList];
      if (fadeOutAnimation.removedIndex >= 0 && fadeOutAnimation.removedIndex <= tempList.length) {
        tempList.splice(fadeOutAnimation.removedIndex, 0, this.removingProperty);
        currentList = tempList;
        console.log('✅ 临时列表已更新，长度:', currentList.length);
      } else {
        console.log('❌ 无效的插入索引:', fadeOutAnimation.removedIndex);
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
      let cardY = 150 + i * (cardHeight + this.cardPadding) - this.scrollOffset;
      
      // 计算动画偏移
      let animationOffset = 0;
      let alpha = 1;
      
      // 处理淡出动画
      if (fadeOutAnimation && property.id === fadeOutAnimation.propertyId) {
        alpha = 1 - this.easeOutCubic(fadeOutAnimation.progress);
        console.log(`🎨 房产 ${property.id} 透明度: ${alpha.toFixed(2)}`);
        if (alpha <= 0) continue; // 完全透明时跳过渲染
      }
      
      // 处理向上滑动动画
      if (slideUpAnimation && slideUpAnimation.removedIndex !== -1) {
        // 在被移除卡片之后的卡片需要向上移动
        if (i >= slideUpAnimation.removedIndex) {
          const targetOffset = -(cardHeight + this.cardPadding);
          animationOffset = targetOffset * this.easeOutCubic(slideUpAnimation.progress);
        }
      }
      
      cardY += animationOffset;
      
      // 只渲染可见区域内的卡片（避免与底部导航栏重叠）
      if (cardY + cardHeight < 130 || cardY > canvas.height - 55) continue;
      
      // 如果有透明度变化，保存当前状态并设置透明度
      if (alpha < 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
      }
      
      this.renderPropertyCard(ctx, property, cardX, cardY);
      
      // 恢复透明度状态
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
    
    // 卡片阴影 (更柔和的阴影效果)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x + 2, y + 2, this.propertyCardWidth, cardHeight);
    
    // 卡片背景
    ctx.fillStyle = '#F2F2F2';
    ctx.fillRect(x, y, this.propertyCardWidth, cardHeight);
    
    // 卡片边框
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
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
    ctx.fillText('住宅', x + this.propertyCardWidth / 2, y + 17);

    // 绘制房产建筑图标 (左侧) - 按照 Figma 设计位置调整
    ctx.fillStyle = '#2C3E50';
    ctx.font = '40px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(property.icon, x + 4, y + 65); // 调整左边距，符合 Figma padding

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
    ctx.fillText(displayName, x + 47 + 70, y + 55); // 图标右侧，垂直居中

    // 绘制按钮区域
    this.renderCardButtons(ctx, property, x, y);
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
      ctx.fillText(formatPropertyPrice(property.currentPrice), currentPriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 历史最高按钮
      const highestPriceX = currentPriceX + buttonWidth + buttonSpacing;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      ctx.fillRect(highestPriceX, buttonY, buttonWidth, buttonHeight);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Inter';
      ctx.fillText('历史最高', highestPriceX + buttonWidth / 2, buttonY + 20);
      
      // 历史最高数值 (在按钮下方)
      ctx.font = '12px Inter';
      ctx.fillText(formatPropertyPrice(property.highestPrice), highestPriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

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
      this.drawRoundRect(ctx, trendButtonX, trendButtonY, trendButtonWidth, trendButtonHeight, 8.98);
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
      this.drawRoundRect(ctx, buyButtonX, buyButtonY, buyButtonWidth, buyButtonHeight, 8.98);
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
      this.drawRoundRect(ctx, purchasePriceX, buttonY, buttonWidth, buttonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('购入价格', purchasePriceX + buttonWidth / 2, buttonY + 20);
      
      // 购入价格数值
      ctx.fillStyle = '#000000';
      ctx.font = '400 12px Inter';
      ctx.fillText(formatPropertyPrice(property.purchasePrice || 0), purchasePriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 当前价格按钮 (透明背景)
      const currentPriceX = x + 127;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      this.drawRoundRect(ctx, currentPriceX, buttonY, buttonWidth, buttonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('当前价格', currentPriceX + buttonWidth / 2, buttonY + 20);
      
      // 当前价格数值
      ctx.fillStyle = '#000000';
      ctx.font = '400 12px Inter';
      ctx.fillText(formatPropertyPrice(property.currentPrice), currentPriceX + buttonWidth / 2, buttonY + buttonHeight + 15);

      // 交易盈亏按钮 (透明背景)
      const profitX = x + 254;
      ctx.fillStyle = 'rgba(255, 255, 255, 0)';
      this.drawRoundRect(ctx, profitX, buttonY, buttonWidth, buttonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('交易盈亏', profitX + buttonWidth / 2, buttonY + 20);
      
      // 交易盈亏数值 (绿色表示盈利)
      const profit = property.currentPrice - (property.purchasePrice || 0);
      const profitText = profit >= 0 ? `+${formatPropertyPrice(profit)}` : formatPropertyPrice(profit);
      ctx.fillStyle = '#24B874'; // 绿色
      ctx.font = '400 12px Inter';
      ctx.fillText(profitText, profitX + buttonWidth / 2, buttonY + buttonHeight + 15);

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
      this.drawRoundRect(ctx, rentButtonX, firstRowY, firstRowButtonWidth, bottomButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('收取租金', rentButtonX + firstRowButtonWidth / 2, firstRowY + 20);

      // 房屋升级按钮 (淡绿色背景)
      const upgradeButtonX = rentButtonX + firstRowButtonWidth + buttonGap;
      ctx.fillStyle = '#EBFFEE';
      this.drawRoundRect(ctx, upgradeButtonX, firstRowY, firstRowButtonWidth, bottomButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('房屋升级', upgradeButtonX + firstRowButtonWidth / 2, firstRowY + 20);

      // 出售资产按钮 (红色背景)
      const sellButtonX = upgradeButtonX + firstRowButtonWidth + buttonGap;
      ctx.fillStyle = '#FCB3AD';
      this.drawRoundRect(ctx, sellButtonX, firstRowY, firstRowButtonWidth, bottomButtonHeight, 8.98);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('出售资产', sellButtonX + firstRowButtonWidth / 2, firstRowY + 20);
      
      // 第二行：房产价格趋势按钮 (全宽，淡绿色背景) - 按照 Figma 设计
      const secondRowY = firstRowY + bottomButtonHeight + buttonGap;
      const trendButtonWidth = this.propertyCardWidth - (buttonPadding * 2); // 减去左右边距
      ctx.fillStyle = '#EBFFEE';
      this.drawRoundRect(ctx, x + buttonPadding, secondRowY, trendButtonWidth, bottomButtonHeight, 8.98);
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
      const rentAmount = property.rentAccumulated || 0;
      
      // 进度条背景 - 按照 Figma 尺寸：374x11px，borderRadius: 32px
      const progressBgX = x + cardPadding;
      const progressBgY = progressBarStartY + 17; // 留出文字空间
      const progressBgWidth = this.propertyCardWidth - (cardPadding * 2); // 减去左右边距
      const progressBgHeight = 11;
      ctx.fillStyle = '#D9D1C2';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 4;
      this.drawRoundRect(ctx, progressBgX, progressBgY, progressBgWidth, progressBgHeight, 5.5);
      ctx.fill();
      ctx.stroke();
      
      // 进度条填充 - 使用真实进度
      if (rentProgress > 0) {
        const progressWidth = progressBgWidth * rentProgress;
        ctx.fillStyle = '#24B874';
        this.drawRoundRect(ctx, progressBgX, progressBgY, progressWidth, progressBgHeight, 5.5);
        ctx.fill();
      }
      
      // 租金信息文字 - 按照 Figma 布局
      ctx.fillStyle = '#877777';
      ctx.font = '500 12px Inter';
      ctx.textAlign = 'left';
      ctx.fillText('租金：$5,000/分钟', x + cardPadding, progressBgY + progressBgHeight + 15);
      ctx.textAlign = 'right';
      ctx.fillText('资金池上限：$100,000', x + this.propertyCardWidth - cardPadding, progressBgY + progressBgHeight + 15);
      
      // 当前租金显示 - 在进度条下方
      ctx.fillStyle = '#877777';
      ctx.font = '500 12px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`当前租金：${formatPropertyPrice(rentAmount)}`, x + cardPadding, progressBgY + progressBgHeight + 30);
    }
  }

  /**
   * 渲染滚动条
   */
  renderScrollBar(ctx) {
    if (this.maxScrollOffset <= 0) return;
    
    const scrollBarX = canvas.width - 8;
    const scrollBarY = 110;
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
  renderBottomNavigation(ctx) {
    const navHeight = 55;
    const navY = canvas.height - navHeight;
    const navWidth = 393;
    const navX = (canvas.width - navWidth) / 2;
    
    // 添加阴影效果，使导航栏看起来在最上层
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = -2;
    
    // 背景 - 增加一点不透明度以确保可见性
    ctx.fillStyle = 'rgba(242, 242, 242, 0.95)';
    ctx.fillRect(navX, navY, navWidth, navHeight);
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 导航项 - 根据当前标签页更新激活状态
    const navItems = [
      { name: '世界', icon: '🌍', x: navX + 59 + 8, active: false },
      { name: '交易', icon: '💼', x: navX + 59 + 121, active: true },
      { name: '经营', icon: '🏢', x: navX + 59 + 234, active: false }
    ];
    
    navItems.forEach(item => {
      // 图标
      ctx.fillStyle = item.active ? '#000000' : 'rgba(0, 0, 0, 0.3)';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, item.x + 13, navY + 18);
      
      // 文字
      ctx.fillStyle = item.active ? 'rgba(0, 0, 0, 0.3)' : '#000000';
      ctx.font = '700 12px Quicksand';
      ctx.fillText(item.name, item.x + 13, navY + 44);
    });
  }

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

    // 按照 Figma 设计的布局
    const chartAreaY = 144;
    const chartAreaHeight = 327;
    const transactionAreaY = chartAreaY + chartAreaHeight + 16; // 16px gap
    const transactionAreaHeight = 436;

    // 绘制资产价值图表区域 - 使用 Figma 设计
    this.renderAssetChartFigma(ctx, 5, chartAreaY, 384, chartAreaHeight);

    // 绘制交易记录区域 - 使用 Figma 设计
    this.renderTransactionRecordsFigma(ctx, 5, transactionAreaY, 384, transactionAreaHeight);
  }

  /**
   * 格式化数值为万单位显示
   */
  formatValueInWan(value) {
    if (value >= 10000) {
      const wan = value / 10000;
      if (wan >= 100) {
        return Math.round(wan).toLocaleString() + '万';
      } else {
        return wan.toFixed(1) + '万';
      }
    } else {
      return Math.round(value).toLocaleString();
    }
  }

  /**
   * 根据选择的时间范围获取图表数据
   */
  getChartDataByTimeRange() {
    if (!this.assetTracker) return [];
    
    const now = Date.now();
    let timeRangeMs;
    
    switch (this.selectedTimeRange) {
      case '1hour':
        timeRangeMs = CHART_TIME_CONFIG.TIME_RANGES.ONE_HOUR;
        break;
      case '12hours':
        timeRangeMs = CHART_TIME_CONFIG.TIME_RANGES.TWELVE_HOURS;
        break;
      case '24hours':
        timeRangeMs = CHART_TIME_CONFIG.TIME_RANGES.TWENTY_FOUR_HOURS;
        break;
      default:
        timeRangeMs = CHART_TIME_CONFIG.TIME_RANGES.ONE_HOUR;
    }
    
    const startTime = now - timeRangeMs;
    const allData = this.assetTracker.getAssetHistory();
    
    // 过滤指定时间范围内的数据
    const filteredData = allData.filter(record => record.timestamp >= startTime);
    
    // 如果数据点太多，进行采样
    const maxPoints = 15;
    if (filteredData.length <= maxPoints) {
      return filteredData;
    }
    
    const step = Math.floor(filteredData.length / maxPoints);
    const sampledData = [];
    
    for (let i = 0; i < filteredData.length; i += step) {
      sampledData.push(filteredData[i]);
    }
    
    // 确保包含最新的数据点
    const lastPoint = filteredData[filteredData.length - 1];
    if (sampledData.length > 0 && sampledData[sampledData.length - 1] !== lastPoint) {
      sampledData.push(lastPoint);
    }
    
    return sampledData;
  }

  /**
   * 渲染时间标签
   */
  renderTimeLabels(ctx, chartData, x1, x2, x3, y) {
    if (chartData.length === 0) return;
    
    const now = Date.now();
    let interval, format;
    
    switch (this.selectedTimeRange) {
      case '1hour':
        interval = CHART_TIME_CONFIG.AXIS_INTERVALS.ONE_HOUR_INTERVAL;
        format = (timestamp) => {
          const date = new Date(timestamp);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          return `${hours}:${minutes}`;
        };
        break;
      case '12hours':
      case '24hours':
        interval = CHART_TIME_CONFIG.AXIS_INTERVALS.LONG_TERM_INTERVAL;
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
    
    ctx.fillText(format(time1), x1, y);
    ctx.fillText(format(time2), x2, y);
    ctx.fillText(format(time3), x3, y);
  }

  /**
   * 渲染资产价值折线图 - 按照 Figma 设计
   */
  renderAssetChartFigma(ctx, x, y, width, height) {
    // 根据选择的时间范围获取数据
    const chartData = this.getChartDataByTimeRange();
    
    // 绘制白色背景框 - 8px 圆角，1px 黑边
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    this.drawRoundRect(ctx, x, y, width, height, 8);
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

    // 时间选择器 (过去1小时, 过去12小时, 过去24小时)
    const timeTabsY = contentY + 32;
    const timeTabsHeight = 20;
    
    // 绘制时间选择器
    const timeRanges = [
      { key: '1hour', label: '过去1小时', x: contentX + 50 },
      { key: '12hours', label: '过去12小时', x: contentX + 140 },
      { key: '24hours', label: '过去24小时', x: contentX + 240 }
    ];
    
    timeRanges.forEach((range, index) => {
      const isSelected = this.selectedTimeRange === range.key;
      ctx.fillStyle = isSelected ? '#6425FE' : '#838383';
      ctx.font = isSelected ? '500 12px Inter, Arial' : '400 12px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(range.label, range.x, timeTabsY + 12);
      
      // 绘制分隔线（除了最后一个）
      if (index < timeRanges.length - 1) {
        ctx.strokeStyle = 'rgba(131, 131, 131, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const lineX = range.x + 45;
        ctx.moveTo(lineX, timeTabsY);
        ctx.lineTo(lineX, timeTabsY + timeTabsHeight);
        ctx.stroke();
      }
    });

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
    
    // 垂直网格线
    for (let i = 0; i <= 3; i++) {
      const gridX = chartX + (i * chartWidth / 3);
      ctx.beginPath();
      ctx.moveTo(gridX, chartY);
      ctx.lineTo(gridX, chartY + chartHeight);
      ctx.stroke();
    }
    
    // 水平网格线
    for (let i = 0; i <= 4; i++) {
      const gridY = chartY + (i * chartHeight / 4);
      ctx.beginPath();
      ctx.moveTo(chartX, gridY);
      ctx.lineTo(chartX + chartWidth, gridY);
      ctx.stroke();
    }
    
    ctx.setLineDash([]); // 重置虚线

    // 绘制Y轴标签 - 以万为单位显示
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Inter, Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 4; i++) {
      const labelY = chartY + (i * chartHeight / 4) + 4;
      const value = maxValue - (i * (maxValue - minValue) / 4);
      const formattedValue = this.formatValueInWan(value);
      ctx.fillText(formattedValue, contentX, labelY);
    }

    // 绘制渐变填充区域
    if (chartData.length > 1) {
      const gradient = ctx.createLinearGradient(0, chartY, 0, chartY + chartHeight);
      gradient.addColorStop(0, 'rgba(100, 37, 254, 0.68)');
      gradient.addColorStop(1, 'rgba(100, 37, 254, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // 从底部开始绘制填充区域
      ctx.moveTo(chartX, chartY + chartHeight);
      
      for (let i = 0; i < chartData.length; i++) {
        const point = chartData[i];
        const plotX = chartX + (i * chartWidth / (chartData.length - 1));
        const plotY = chartY + chartHeight - ((point.totalAssetValue - minValue) / (maxValue - minValue)) * chartHeight;
        ctx.lineTo(plotX, plotY);
      }
      
      // 回到底部完成填充
      ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
      ctx.closePath();
      ctx.fill();
    }

    // 绘制折线
    if (chartData.length > 1) {
      ctx.strokeStyle = 'rgba(100, 37, 254, 0.5)';
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
    }

    // 绘制底部统计信息 - 根据选择的时间范围显示最高最低
    const statsY = contentY + 282;
    
    // 根据时间范围确定标签文字
    const timeRangeLabel = this.selectedTimeRange === '1hour' ? '过去1小时' : 
                          this.selectedTimeRange === '12hours' ? '过去12小时' : '过去24小时';
    
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
      ctx.fillText(this.formatValueInWan(highValue), contentX, statsY + 16);
      
      // 最低价格
      ctx.fillStyle = '#838383';
      ctx.font = '400 12px Inter, Arial';
      ctx.fillText(`${timeRangeLabel}最低`, contentX + 96, statsY);
      
      ctx.fillStyle = '#2C2C2C';
      ctx.font = '500 14px Inter, Arial';
      ctx.fillText(this.formatValueInWan(lowValue), contentX + 96, statsY + 16);
    }

    // 绘制X轴时间标签
    ctx.fillStyle = '#838383';
    ctx.font = '500 12px Inter, Arial';
    ctx.textAlign = 'center';
    
    const timeLabelsY = contentY + 256;
    this.renderTimeLabels(ctx, chartData, contentX + 79, contentX + 157, contentX + 235, timeLabelsY);
  }

  /**
   * 渲染交易记录列表 - 按照 Figma 设计
   */
  renderTransactionRecordsFigma(ctx, x, y, width, height) {
    const transactions = this.assetTracker.getTransactionHistory();
    
    // 绘制白色背景框 - 8px 圆角
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundRect(ctx, x, y, width, height, 8);
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
    const recordsAreaHeight = 379;
    const recordHeight = 52; // 每条记录高度
    const recordGap = 16; // 记录间距
    const totalRecordHeight = recordHeight + recordGap;
    
    // 计算可见记录数量
    const visibleRecords = Math.min(7, transactions.length); // 最多显示7条

    // 绘制交易记录
    for (let i = 0; i < visibleRecords; i++) {
      const transaction = transactions[i];
      const recordY = recordsStartY + (i * totalRecordHeight);
      
      // 绘制交易记录项
      this.renderTransactionItem(ctx, transaction, contentX, recordY, 316, recordHeight);
      
      // 绘制分隔线 (除了最后一条)
      if (i < visibleRecords - 1) {
        ctx.strokeStyle = '#E8E9FF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(contentX, recordY + recordHeight + recordGap / 2);
        ctx.lineTo(contentX + 316, recordY + recordHeight + recordGap / 2);
        ctx.stroke();
      }
    }

    // 绘制查看更多按钮 (如果有更多记录)
    if (transactions.length > visibleRecords) {
      const buttonY = recordsStartY + 380;
      const buttonWidth = 54;
      const buttonHeight = 34;
      const buttonX = contentX + (contentWidth - buttonWidth) / 2;
      
      // 绘制按钮背景 - #E8E9FF 颜色，34px 圆角
      ctx.fillStyle = '#E8E9FF';
      this.drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 34);
      ctx.fill();
      
      // 绘制箭头图标 - #6F6AF8 颜色
      ctx.strokeStyle = '#6F6AF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(buttonX + 20, buttonY + 14);
      ctx.lineTo(buttonX + 27, buttonY + 17);
      ctx.lineTo(buttonX + 20, buttonY + 20);
      ctx.stroke();
    }

    // 绘制白色渐变遮罩 (底部淡出效果)
    const gradientHeight = 62;
    const gradientY = recordsStartY + 317;
    
    const gradient = ctx.createLinearGradient(0, gradientY, 0, gradientY + gradientHeight);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.435, 'rgba(255, 255, 255, 1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(contentX, gradientY, 316, gradientHeight);
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
} 