import './render'; // 初始化Canvas
import GameInfo from './runtime/gameinfo'; // 导入游戏UI类
import MessageSystem from './ui/messageSystem'; // 导入消息系统
import RealEstatePage from './ui/realEstatePage'; // 导入售楼处页面
import WorldPage from './ui/worldPage'; // 导入世界页面
import RankingPage from './ui/rankingPage'; // 导入排名页面
import BusinessPage from './ui/businessPage'; // 导入经营页面
import AssetManager from './managers/assetManager'; // 导入资产管理器
import RankingManager from './managers/rankingManager'; // 导入排名管理器
import UpgradeConfirmModal from './ui/upgradeConfirmModal'; // 导入房屋升级确认弹窗
import AdRewardModal from './ui/adRewardModal.js'; // 导入广告奖励弹窗
import TutorialModal from './ui/tutorialModal.js'; // 导入教学对话框
import DailyNewsModal from './ui/dailyNewsModal.js'; // 导入每日新闻弹窗
import GameCalendar from './ui/gameCalendar.js'; // 导入游戏日历组件
import GameDataAdapter from './managers/gameDataAdapter'; // 导入游戏数据适配器
import GameTimeManager from './managers/gameTimeManager'; // 导入游戏时间管理器
import { sellProperty, collectRent, updateAllRents, refreshTradingPropertyList, setGameDataAdapter, initializeRealEstate, setGameTimeManager } from './config/realEstateConfig.js';
import { PROPERTY_TIME_CONFIG, LOADING_TIME_CONFIG, ANIMATION_TIME_CONFIG } from './config/timeConfig.js';
import AssetTracker from './managers/assetTracker';
import { formatMoney } from './ui/utils.js';


const ctx = canvas.getContext('2d'); // 获取canvas的2D绘图上下文

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    // 初始化属性
    this.aniId = 0; // 用于存储动画帧的ID
    this.gameView = 'world'; // 游戏视图: 默认进入世界界面
    this.realEstatePage = null; // 售楼处页面，稍后初始化
    this.worldPage = null; // 世界页面，稍后初始化
    this.rankingPage = null; // 排名页面，稍后初始化
    this.businessPage = null; // 经营页面，稍后初始化
    this.gameState = 'loading'; // 游戏状态: 'loading'(加载中), 'playing'(游戏中)
    this.loadingProgress = 0; // 加载进度
    this.money = 5000000; // 初始资金500万
    this.backgroundImage = null; // 背景图片（用于加载页面）
    this.purchaseNotifications = []; // 存储购买通知动画
    this.rentTimer = null; // 租金更新定时器
    try {
      // 初始化组件
      this.gameInfo = new GameInfo(); // 创建游戏UI显示
      this.messageSystem = new MessageSystem(); // 消息系统
      this.assetManager = new AssetManager(); // 资产管理器
      this.rankingManager = new RankingManager(); // 排名管理器
      this.upgradeConfirmModal = new UpgradeConfirmModal(); // 房屋升级确认弹窗
      this.adRewardModal = new AdRewardModal(); // 广告奖励弹窗
      this.tutorialModal = new TutorialModal(); // 教学对话框
      this.gameDataAdapter = new GameDataAdapter(); // 游戏数据适配器
      this.gameTimeManager = new GameTimeManager(); // 游戏时间管理器
      this.gameCalendar = new GameCalendar(this.gameTimeManager); // 游戏日历组件
      this.dailyNewsModal = new DailyNewsModal(this.rankingManager); // 每日新闻弹窗
      this.assetTracker = new AssetTracker(
        () => this.money, // 获取当前金钱的回调
        () => this.assetManager // 获取资产管理器的回调
      ); // 资产追踪器
      
      // 设置日历的日期变更回调
      this.gameCalendar.setDayChangeCallback(this.onDayChange.bind(this));
      
      // 初始化游戏数据适配器并设置组件引用
      this.initializeDataAdapter();

      // 设置游戏时间管理器到房产配置
      setGameTimeManager(this.gameTimeManager);
      
      // 🔥 重要：在加载数据之前先初始化房产实例池
      // 确保getAllAvailableProperties方法在数据恢复时可用
      initializeRealEstate();
      
      // 设置游戏时间管理器为全局变量，供UI组件访问
      // 在微信小程序中使用 GameGlobal 而不是 window
      if (typeof window !== 'undefined') {
        window.gameTimeManager = this.gameTimeManager;
      } else {
        // 微信小程序环境
        GameGlobal.gameTimeManager = this.gameTimeManager;
      }

      // 加载游戏数据和设置（在房产初始化之后）
      this.loadGameData();

      // 绑定触摸事件
      this.bindTouchEvents();
      
      // 开始游戏
      this.start();
      
      // 模拟加载进度
      this.simulateLoading();
      
    } catch (error) {
      console.error('Main构造函数执行失败:', error);
      throw error;
    }
  }

  /**
   * 初始化游戏数据适配器
   */
  initializeDataAdapter() {
    // 设置游戏数据适配器的组件引用
    this.gameDataAdapter.setComponents({
      assetManager: this.assetManager,
      assetTracker: this.assetTracker,
      rankingManager: this.rankingManager,
      gameTimeManager: this.gameTimeManager
    });
    
    // 设置初始游戏状态
    this.gameDataAdapter.setGameState(this.money);
    
    // 设置为房产配置的数据源
    setGameDataAdapter(this.gameDataAdapter);
  }

  async saveGameData() {
    try {
      // 同步当前金钱状态到数据适配器
      this.gameDataAdapter.setMoney(this.money);
      
      // 使用新的存储系统保存数据
      const success = await this.gameDataAdapter.saveGameData();
      
      return success;
    } catch (error) {
      console.error('保存游戏数据时发生错误:', error);
      return false;
    }
  }

  loadGameData() {
    try {
      
      // 使用新的存储系统加载数据
      const success = this.gameDataAdapter.loadGameData();
      
      if (success) {
        // 从数据适配器获取恢复的金钱
        this.money = this.gameDataAdapter.getMoney();
        
        // 检查是否首次用户
        if (this.gameDataAdapter.isFirstTimeUser()) {
          this.shouldShowTutorial = true;
        }
        
      } else {
        console.error('❌ 游戏数据加载失败 - 数据可能已丢失');
        this.money = 5000000; // 默认资金
        this.shouldShowTutorial = true; // 显示教学
        
        // 延迟显示用户提示
        setTimeout(() => {
          if (this.messageSystem) {
            this.messageSystem.addMessage('游戏数据丢失，已重置为初始状态', 'error');
          }
        }, 2000);
      }
      
      return success;
      
    } catch (error) {
      console.error('加载游戏数据时发生错误:', error);
      this.money = 5000000; // 错误时使用默认值
      this.shouldShowTutorial = true;
      
      // 延迟显示错误提示
      setTimeout(() => {
        if (this.messageSystem) {
          this.messageSystem.addMessage('数据加载异常，游戏已重置', 'error');
        }
      }, 2000);
      
      return false;
    }
  }

  /**
   * 检查是否首次进入游戏
   */
  checkFirstTimeUser() {
    try {
      // 使用新的存储系统检查首次用户
      if (this.shouldShowTutorial || this.gameDataAdapter.isFirstTimeUser()) {
        // 首次进入，显示教学对话框
        this.showTutorial();
      }
    } catch (error) {
      console.error('检查首次用户状态失败:', error);
    }
  }

  /**
   * 显示教学对话框
   */
  showTutorial() {
    this.tutorialModal.show(
      canvas.width, 
      canvas.height,
      () => {
        // 教学完成回调
        this.markUserAsPlayed();
      }
    );
  }

  /**
   * 标记用户已经玩过游戏
   */
  markUserAsPlayed() {
    try {
      // 标记不再显示教学
      this.shouldShowTutorial = false;
    } catch (error) {
      console.error('标记用户状态失败:', error);
    }
  }


  /**
   * 记录当前资产状态（在数据完全恢复后调用）
   */
  recordCurrentAssetState() {
    try {
      // 计算当前房产总价值
      const userProperties = this.gameDataAdapter.getUserProperties();
      const totalPropertyValue = userProperties.reduce((total, property) => {
        return total + (property.currentPrice || property.totalPrice || 0);
      }, 0);
      
      // 记录当前资产状态
      if (this.assetTracker) {
        this.assetTracker.recordAssetValue(this.money, totalPropertyValue);
      }
    } catch (error) {
      console.error('记录资产状态失败:', error);
    }
  }
  /**
   * 模拟加载进度
   */
  simulateLoading() {
    const loadingInterval = setInterval(() => {
      if (this.loadingProgress < 60) {
        this.loadingProgress += Math.random() * 10 + 5;
      }
      
      if (this.loadingProgress >= 60) {
        clearInterval(loadingInterval);
        // 开始加载背景图片
        this.loadBackgroundImage();
      }
    }, LOADING_TIME_CONFIG.PROGRESS_UPDATE_INTERVAL);
  }

  /**
   * 加载背景图片
   */
  loadBackgroundImage() {
    // 兼容微信小程序和浏览器环境
    if (typeof wx !== 'undefined' && wx.createImage) {
      // 微信小程序环境
      this.backgroundImage = wx.createImage();
    } else if (typeof Image !== 'undefined') {
      // 浏览器环境
      this.backgroundImage = new Image();
    } else {
      // 如果都不可用，直接完成加载
      this.loadingProgress = 100;
      this.finishLoading();
      return;
    }
    
    this.backgroundImage.src = 'images/image_building_1.png';
    this.backgroundImage.onload = () => {
      this.loadingProgress = 100;
      this.finishLoading();
    };
    this.backgroundImage.onerror = () => {
      console.error('背景图片加载失败');
      this.loadingProgress = 100;
      this.finishLoading();
    };
  }

  /**
   * 完成加载，开始游戏
   */
  finishLoading() {
    this.loadingProgress = 100;

    
    // 初始化页面组件，传入资产追踪器
    this.realEstatePage = new RealEstatePage(this.assetTracker, () => this.money);
    this.worldPage = new WorldPage(() => this.money, () => this.gameDataAdapter.getUserProperties());
    this.rankingPage = new RankingPage(() => this.money, this.rankingManager);
          this.businessPage = new BusinessPage(() => this.money, this.gameDataAdapter.getAchievementManager());
      
      // 设置成就奖励领取回调
      this.businessPage.setClaimRewardCallback((reward) => {
        this.handleAchievementReward(reward);
      });
    
    
    // 房产数据已在构造函数中初始化，这里不需要重复调用
    // initializeRealEstate(); // 已移除重复调用
    
    // 同步数据适配器的当前金钱状态
    this.gameDataAdapter.setMoney(this.money);
    
    // 最后记录当前资产状态（在所有数据恢复完成后）
    setTimeout(() => {
      this.recordCurrentAssetState();

    }, 100); // 延迟一点确保所有数据完全恢复
    
    // 启动租金更新定时器
    this.startRentTimer();
    
    setTimeout(() => {
      // 直接进入游戏，显示世界界面
      this.gameState = 'playing';
      this.worldPage.show();
      
      // 检查是否首次进入游戏
      this.checkFirstTimeUser();
    }, LOADING_TIME_CONFIG.STARTUP_DELAY); // 根据配置的延迟时间
  }

  /**
   * 绑定触摸事件
   */
  bindTouchEvents() {
    // 微信小游戏使用全局触摸事件API
    wx.onTouchStart(this.onTouchStart.bind(this));
    wx.onTouchMove(this.onTouchMove.bind(this));
    wx.onTouchEnd(this.onTouchEnd.bind(this));

    // 记录触摸开始位置
    this.touchStartY = 0;
    this.isTouching = false;
  }

  /**
   * 触摸开始事件
   */
  onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      // 微信小游戏中直接使用触摸坐标，无需减去canvas偏移
      const x = touch.clientX;
      const y = touch.clientY;
      
      this.touchStartY = y;
      this.isTouching = true;
      
      // 处理页面特定的触摸开始事件
      if (this.gameView === 'business' && this.businessPage) {
        this.businessPage.handleTouch(x, y, 'start');
      } else if (this.gameView === 'world' && this.worldPage) {
        this.worldPage.handleDragStart(x, y);
      }
      
      this.handleTouch(x, y);
    }
  }

  onTouchMove(e) {
    if (this.isTouching && e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;
      
      if (this.gameView === 'realEstate' && this.realEstatePage && this.realEstatePage.isVisible) {
        // 售楼处页面处理滚动
        const deltaY = this.touchStartY - currentY;
        this.handleScroll(deltaY * 2); // 增加滚动敏感度
        this.touchStartY = currentY; // 更新起始位置，实现连续滚动
      } else if (this.gameView === 'ranking' && this.rankingPage && this.rankingPage.isVisible) {
        // 排名页面处理滚动
        const deltaY = this.touchStartY - currentY;
        this.rankingPage.handleScroll(deltaY * 2); // 增加滚动敏感度
        this.touchStartY = currentY; // 更新起始位置，实现连续滚动
      } else if (this.gameView === 'business' && this.businessPage && this.businessPage.isVisible) {
        // 经营页面处理滚动
        this.businessPage.handleTouch(currentX, currentY, 'move');

      } else if (this.gameView === 'world' && this.worldPage && this.worldPage.isVisible) {
        // 世界页面处理地图拖拽
        this.worldPage.handleDragMove(currentX, currentY);
      }
    }
  }

  onTouchEnd(e) {
    this.isTouching = false;
    
    // 结束拖拽 - 添加空值检查
    if (this.gameView === 'world' && this.worldPage && this.worldPage.isVisible) {
      this.worldPage.handleDragEnd();
    } else if (this.gameView === 'business' && this.businessPage && this.businessPage.isVisible) {
      this.businessPage.handleTouch(0, 0, 'end');
    }
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (this.gameState !== 'playing') return;

    // 最高优先级：处理教学对话框
    if (this.tutorialModal.isVisible) {
      const tutorialResult = this.tutorialModal.handleTouch(x, y);
      if (tutorialResult) {
        return;
      }
    }

    // 处理每日新闻弹窗（最高优先级）
    if (this.dailyNewsModal.isVisible) {
      const newsResult = this.dailyNewsModal.handleTouch(x, y);
      if (newsResult) {
        // 新闻弹窗已处理，不继续处理其他事件
        return;
      }
    }

    // 处理广告奖励弹窗（高优先级，完全阻止其他交互）
    if (this.adRewardModal.isVisible) {
      const adResult = this.adRewardModal.handleTouch(x, y);
      if (adResult) {
        if (adResult.type === 'confirm') {
          // 用户确认观看广告，给予奖励
          this.money += adResult.amount;
          this.messageSystem.addMessage(`成功收获 ${formatMoney(adResult.amount)}`, 'success');
          this.saveGameData();
        }
      }
      return;
    }

    // 优先处理资金不足弹窗
    if (this.messageSystem.hasActiveModal()) {
      const modalResult = this.messageSystem.handleModalTouch(x, y);
      if (modalResult) {
        // 弹窗已处理，不继续处理其他事件
        return;
      }
    }

    // 优先处理升级确认弹窗 - 防止被其他元素遮挡
    if (this.upgradeConfirmModal.isVisible) {
      const upgradeResult = this.upgradeConfirmModal.handleTouch(x, y);
      if (upgradeResult) {
        // 处理升级确认弹窗的结果
        if (upgradeResult.type === 'confirm') {
          // 执行升级操作
          this.executeUpgrade(upgradeResult.property, upgradeResult.upgradeCost);
        }
        return;
      }
    }
    
    // 处理日历触摸事件 - 在页面处理之前
    if (this.gameCalendar) {
      const calendarResult = this.gameCalendar.handleTouch(x, y);
      if (calendarResult) {
        // 可以在这里处理日历点击事件
        if (calendarResult.type === 'calendar_click') {
          // 例如：显示详细时间信息，或者什么都不做
        }
        return;
      }
    }
    let result = null;
    
    // 根据当前游戏视图处理触摸事件 - 添加空值检查
    if (this.gameView === 'world' && this.worldPage) {
      result = this.worldPage.handleTouch(x, y);
    } else if (this.gameView === 'realEstate' && this.realEstatePage) {
      result = this.realEstatePage.handleTouch(x, y);
    } else if (this.gameView === 'ranking' && this.rankingPage) {
      result = this.rankingPage.handleTouch(x, y);
          } else if (this.gameView === 'business' && this.businessPage) {
        result = this.businessPage.handleTouch(x, y);
      }
    
    if (result) {
      // 处理导航切换
      if (result.type === 'navigation') {
        this.switchView(result.tab);
        return;
      }
      
      // 处理返回事件（点击返回箭头）
      if (result.type === 'close') {
        this.switchView('world');
        return;
      }
      
      if (result.type === 'purchase_property') {
        // 处理房产购买
        const purchaseResult = this.realEstatePage.buyProperty(result.property.id, this.money);
        
        if (purchaseResult.success) {
          // 调用统一的购买成功处理方法
          this.handlePurchaseSuccess(purchaseResult.property);
        } else {
          console.log('房产购买失败:', purchaseResult ? purchaseResult.error : '未知错误');
          
          // 检查是否是资金不足的错误
          const errorMsg = purchaseResult ? purchaseResult.error : '购买失败';
          if (errorMsg.includes('资金不足') || errorMsg === '等挣了更多的钱再来买吧！') {
            // 资金不足时显示弹窗确认
            this.showInsufficientFundsModal(
              result.property, 
              purchaseResult.requiredAmount || result.property.currentPrice || 0, 
              purchaseResult.currentMoney || this.money
            );
          } else {
            // 其他错误直接显示消息
            this.messageSystem.addMessage(errorMsg, 'error');
          }
        }
      } else if (result.type === 'purchase_success') {
        // 处理购买成功（来自确认弹窗）
        this.handlePurchaseSuccess(result.property);
      } else if (result.type === 'purchase_failed') {
        // 处理购买失败 - 显示资金不足弹窗
        const purchaseResult = result.purchaseResult;
        
        if (purchaseResult && purchaseResult.error === '等挣了更多的钱再来买吧！') {
          // 资金不足，显示弹窗
          this.showInsufficientFundsModal(
            result.property, 
            purchaseResult.requiredAmount || result.property.currentPrice || 0, 
            purchaseResult.currentMoney || this.money
          );
        } else {
          // 其他错误，显示消息
          const errorMsg = purchaseResult ? purchaseResult.error : '购买失败';
          this.messageSystem.addMessage(errorMsg, 'error');
        }
      } else if (result.type === 'sell_property') {
        // 处理房产出售
        this.handlePropertySale(result.property);
      } else if (result.type === 'collect_rent') {
        // 处理收取租金
        this.handleCollectRent(result.property);
      } else if (result.type === 'upgrade_property') {
        // 处理房屋升级
        this.handleUpgradeProperty(result.property);
      } else if (result.type === 'property_trend') {
        // 处理房产价格趋势
        this.handlePropertyTrend(result.property);
      } else if (result.type === 'map_interaction') {
        // 处理地图交互（开始拖拽）
        if (this.gameView === 'world' && this.worldPage) {
          this.worldPage.handleDragStart(result.x, result.y);
        }
      } else if (result.type === 'showAdReward') {
        // 显示广告奖励弹窗
        this.adRewardModal.show(
          canvas.width, 
          canvas.height,
          (amount) => {
            // 确认观看广告的回调
            console.log('用户选择观看广告，奖励金额:', amount);
          },
          () => {
            // 取消观看广告的回调
            console.log('用户取消观看广告');
          }
        );
      }
    }
  }

  /**
   * 处理房产出售
   */
  handlePropertySale(property) {
    // 使用已导入的房产出售函数
    const saleResult = sellProperty(property.id);
    
    if (saleResult && saleResult.success) {
      const originalMoney = this.money;
      
      // 从资产管理器中移除
      const assetSaleResult = this.assetManager.sellAsset(property);
      
      this.money += saleResult.sellPrice;
      
      console.log('房产出售成功:', {
        房产: property.name,
        出售价格: formatMoney(saleResult.sellPrice),
        原金钱: formatMoney(originalMoney),
        新金钱: formatMoney(this.money),
        资产管理器更新: assetSaleResult ? '成功' : '失败'
      });
      
      // 添加到资产追踪器的交易记录，包含购买价格用于计算盈亏
      this.assetTracker.addTransaction('sell', saleResult.property, saleResult.sellPrice, this.money, saleResult.property.purchasePrice);
      
      // 显示出售成功消息
      this.messageSystem.addMessage(
        `成功出售 ${property.name}，获得 ${formatMoney(saleResult.sellPrice)}！`, 
        'success'
      );
      
      // 添加出售通知动画
      this.addPurchaseNotification(`出售 ${property.name}`);
      
      // 保存游戏数据
      this.saveGameData();
      
      // 如果资产管理器出售失败，记录警告但不影响用户体验
      if (!assetSaleResult) {
        console.warn('资产管理器出售记录失败，但房产已成功出售');
      }
    } else {
      // 出售失败，显示错误信息
      const errorMsg = saleResult && saleResult.error ? saleResult.error : '无法出售此房产';
      console.log('房产出售失败:', errorMsg);
      this.messageSystem.addMessage(errorMsg, 'error');
    }
  }

  /**
   * 处理收取租金
   */
  handleCollectRent(property) {
    const result = collectRent(property.id);
    if (result) {
      // 增加金钱
      this.money += result.rentAmount;
      
      // 更新成就统计
      this.gameDataAdapter.collectRent(result.rentAmount);
      
      // 注意：根据需求，租金收入不记录到交易记录中，只保留房产买卖记录
      
      // 显示收取成功消息
      this.messageSystem.addMessage(`收取 ${property.name} 租金 ${formatMoney(result.rentAmount)}`, 'success');
      
      // 保存游戏数据
      this.saveGameData();
    } else {
      // 没有租金可收取
      this.messageSystem.addMessage(`${property.name} 暂无租金可收取`, 'warning');
    }
  }

    /**
   * 处理成就奖励
   */
  handleAchievementReward(reward) {
    // 发放奖励金钱
    this.money += reward;
    
    // 显示奖励通知
    this.messageSystem.addMessage(`🎉 成就奖励: ${formatMoney(reward)}`, 'success');
    
    // 自动保存游戏数据
    this.saveGameData();
  }

  /**
   * 处理房屋升级
   */
  handleUpgradeProperty(property) {
    // 计算升级费用（当前房价的10%）
    const upgradeCost = Math.round(property.currentPrice * 0.1);
    
    // 检查资金是否足够
    if (this.money < upgradeCost) {
      this.messageSystem.addMessage('资金不足，无法升级', 'error');
      return;
    }
    
    // 显示升级确认弹窗
    this.upgradeConfirmModal.show(
      property,
      upgradeCost,
      this.money,
      () => {
        // 确认升级回调
        this.executeUpgrade(property, upgradeCost);
      },
      canvas.width,
      canvas.height
    );
  }

  /**
   * 执行实际的房屋升级操作
   */
  executeUpgrade(property, upgradeCost) {
    // 扣除升级费用
    this.money -= upgradeCost;
    
    // 房屋升级后租金增长10%，但房屋价格不变
    property.monthlyRent = Math.round(property.monthlyRent * 1.1);
    
    // 更新成就统计
    this.gameDataAdapter.upgradeProperty();
    
    // 显示升级成功消息
    this.messageSystem.addMessage(`${property.name} 升级成功！月租金提升至 ${formatMoney(property.monthlyRent)}`, 'success');
    
    // 添加升级通知动画
    this.addPurchaseNotification(`升级 ${property.name}`);
    
    // 保存游戏数据
    this.saveGameData();
  }

  /**
   * 处理房产价格趋势
   */
  handlePropertyTrend(property) {
    // 显示房产价格趋势模态框
    if (this.realEstatePage && this.realEstatePage.propertyHistoryModal) {
      this.realEstatePage.propertyHistoryModal.show(canvas.width, canvas.height, property);
    }
  }

  /**
   * 启动租金更新定时器
   */
  startRentTimer() {
    // 根据配置的间隔更新租金
    this.rentTimer = setInterval(() => {
      // 直接调用已导入的函数，避免动态导入问题
      updateAllRents();
    }, PROPERTY_TIME_CONFIG.RENT_UPDATE_INTERVAL);
  }

  /**
   * 获取当前金钱数量（供资产追踪器使用）
   */
  getMoneyCallback() {
    return this.money;
  }

  /**
   * 切换游戏视图
   */
  switchView(viewName) {    
    // 隐藏当前视图
    if (this.gameView === 'world' && this.worldPage) {
      this.worldPage.hide();
    } else if (this.gameView === 'realEstate' && this.realEstatePage) {
      this.realEstatePage.hide();
    } else if (this.gameView === 'ranking' && this.rankingPage) {
      this.rankingPage.hide();
    } else if (this.gameView === 'business' && this.businessPage) {
      this.businessPage.hide();
    }
    
    // 切换到新视图
    this.gameView = viewName;
    
    if (viewName === 'world') {
      if (this.worldPage) {
        this.worldPage.show();
      }
    } else if (viewName === 'trading' || viewName === 'realEstate') {
      this.gameView = 'realEstate';
      if (this.realEstatePage) {
        this.realEstatePage.show();
      }
    } else if (viewName === 'ranking') {
      if (this.rankingPage) {
        this.rankingPage.show();
      }
    } else if (viewName === 'business') {
      if (this.businessPage) {
        this.businessPage.show();
      }
    }
  }

  // 移除本地的formatMoney函数，使用utils中的版本

  /**
   * 添加购买通知动画
   */
  addPurchaseNotification(itemName) {
    // 计算资产按钮位置（与renderMoney中的计算一致）
    const baseY = 100;
    const buttonWidth = 180;
    const spacing = 10;
    const totalWidth = buttonWidth * 2 + spacing;
    const assetButtonX = canvas.width / 2 - totalWidth / 2 + buttonWidth + spacing;
    
    const notification = {
      text: itemName + ' +1',
      x: assetButtonX + 60, // 资产按钮中心（120宽度的一半是60）
      y: baseY - 10, // 按钮上方
      startY: baseY - 10,
      targetY: baseY - 50, // 向上移动40px
      alpha: 1.0,
      startTime: Date.now(),
      duration: ANIMATION_TIME_CONFIG.PURCHASE_NOTIFICATION_DURATION // 购买通知动画持续时间
    };
    
    this.purchaseNotifications.push(notification);
  }

  /**
   * 更新购买通知动画
   */
  updatePurchaseNotifications() {
    const currentTime = Date.now();
    
    this.purchaseNotifications = this.purchaseNotifications.filter(notification => {
      const elapsed = currentTime - notification.startTime;
      const progress = elapsed / notification.duration;
      
      if (progress >= 1) {
        return false; // 移除已完成的动画
      }
      
      // 更新位置和透明度
      notification.y = notification.startY + (notification.targetY - notification.startY) * progress;
      notification.alpha = 1 - progress; // 淡出效果
      
      return true;
    });
  }

  /**
   * 渲染购买通知动画
   */
  renderPurchaseNotifications(ctx) {
    this.purchaseNotifications.forEach(notification => {
      ctx.save();
      ctx.globalAlpha = notification.alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#27AE60';
      ctx.lineWidth = 2;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      
      // 绘制文字描边
      ctx.strokeText(notification.text, notification.x, notification.y);
      // 绘制文字填充
      ctx.fillText(notification.text, notification.x, notification.y);
      
      ctx.restore();
    });
  }

  /**
   * 开始游戏
   */
  start() {
    cancelAnimationFrame(this.aniId); // 清除上一局的动画
    
    // 开始加载资源
    this.gameState = 'loading';
    this.loadingProgress = 0;  
    this.aniId = requestAnimationFrame(this.loop.bind(this)); // 开始新的动画循环
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布

    if (this.gameState === 'loading') {
      this.renderLoadingScreen(ctx);
    } else if (this.gameState === 'playing') {
      // 根据当前视图渲染对应页面 - 添加空值检查
      if (this.gameView === 'world' && this.worldPage) {
        this.worldPage.render(ctx);
      } else if (this.gameView === 'realEstate' && this.realEstatePage) {
        this.realEstatePage.render(ctx);
      } else if (this.gameView === 'ranking' && this.rankingPage) {
        this.rankingPage.render(ctx);
              } else if (this.gameView === 'business' && this.businessPage) {
          this.businessPage.render(ctx);
        }
      
      // 绘制游戏日历（只在经营页和交易页显示）
      if (this.gameView === 'business' || this.gameView === 'realEstate') {
        this.gameCalendar.render(ctx);
      }
      
      // 绘制消息系统和通知
      this.messageSystem.render(ctx, canvas.width);
      this.renderPurchaseNotifications(ctx);

      // 绘制升级确认弹窗
      this.upgradeConfirmModal.render(ctx);
      
      // 绘制广告奖励弹窗
      this.adRewardModal.render(ctx);
      
      // 绘制每日新闻弹窗（优先级仅次于教学对话框）
      this.dailyNewsModal.render(ctx);
      
      // 绘制教学对话框（最后渲染，确保在最上层）
      this.tutorialModal.render(ctx);
    }
  }

  /**
   * 渲染加载页面
   */
  renderLoadingScreen(ctx) {
    // 如果背景图片已加载，则使用原首页背景图片
    if (this.backgroundImage) {
      ctx.save();
      
      // 计算背景图片的缩放比例，保持比例并填满屏幕
      const scaleX = canvas.width / this.backgroundImage.width;
      const scaleY = canvas.height / this.backgroundImage.height;
      const scale = Math.max(scaleX, scaleY);
      
      const newWidth = this.backgroundImage.width * scale;
      const newHeight = this.backgroundImage.height * scale;
      
      // 居中绘制
      const x = (canvas.width - newWidth) / 2;
      const y = (canvas.height - newHeight) / 2;
      
      ctx.drawImage(this.backgroundImage, x, y, newWidth, newHeight);
      
      // 添加半透明遮罩让文字更清楚
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.restore();
    } else {
      // 备用渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#74b9ff');
      gradient.addColorStop(1, '#0984e3');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 绘制游戏标题
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 3;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    
    const title = '花光100亿';
    const titleY = canvas.height / 2 - 60;
    
    ctx.strokeText(title, canvas.width / 2, titleY);
    ctx.fillText(title, canvas.width / 2, titleY);

    // 绘制副标题
    ctx.font = 'bold 16px Arial';
    ctx.fillText('成为世界首富的挑战', canvas.width / 2, titleY + 40);

    // 绘制加载进度条
    const progressBarWidth = 200;
    const progressBarHeight = 8;
    const progressBarX = (canvas.width - progressBarWidth) / 2;
    const progressBarY = canvas.height / 2 + 40;

    // 进度条背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // 进度条填充
    ctx.fillStyle = '#FFFFFF';
    const progressWidth = (this.loadingProgress / 100) * progressBarWidth;
    ctx.fillRect(progressBarX, progressBarY, progressWidth, progressBarHeight);

    // 加载文字
    ctx.font = '14px Arial';
    let loadingText = '正在初始化...';
    if (this.loadingProgress >= 60 && this.loadingProgress < 100) {
      loadingText = '正在加载游戏资源...';
    } else if (this.loadingProgress >= 100) {
      loadingText = '加载完成！';
    }
    ctx.fillText(`${loadingText} ${Math.floor(this.loadingProgress)}%`, canvas.width / 2, progressBarY + 30);

    ctx.restore();
  }

  // 游戏逻辑更新主函数
  update() {
    // 只在游戏模式下更新消息系统
    if (this.gameState === 'playing') {
      this.messageSystem.update(); // 更新消息系统
      this.updatePurchaseNotifications(); // 更新购买通知动画
      
      // 定期检查并记录资产价值变化
      this.updateAssetTracking();
      
      // 检查是否需要刷新交易中心房产列表（5分钟一次）
      refreshTradingPropertyList();
    }
  }
  
  /**
   * 更新资产追踪
   */
  updateAssetTracking() {
    // 计算当前房产总价值
    const userProperties = this.gameDataAdapter.getUserProperties();
    const totalPropertyValue = userProperties.reduce((total, property) => {
      return total + property.currentPrice;
    }, 0);
    
    // 检查是否需要记录新的资产价值点
    this.assetTracker.checkAndRecordAssetValue(this.money, totalPropertyValue);
  }

  // 实现游戏帧循环
  loop() {
    this.update(); // 更新游戏逻辑
    this.render(); // 渲染游戏画面

    // 请求下一帧动画
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * 小程序前台显示时的回调
   */
  onAppShow() {
    // 设置游戏时间管理器为活跃状态
    if (this.gameTimeManager) {
      this.gameTimeManager.setActive(true);
    }
    
    // 保存游戏数据
    this.saveGameData();
  }

  /**
   * 小程序后台隐藏时的回调
   */
  onAppHide() {
    // 设置游戏时间管理器为非活跃状态
    if (this.gameTimeManager) {
      this.gameTimeManager.setActive(false);
    }
    
    // 保存游戏数据
    this.saveGameData();
  }

  /**
   * 处理滚动事件
   */
  handleScroll(deltaY) {
    if (this.gameView === 'realEstate' && this.realEstatePage) {
      this.realEstatePage.handleScroll(deltaY);
    }
  }

  // 添加新的方法来处理资金不足时的弹窗
  showInsufficientFundsModal(property, requiredAmount, currentMoney) {
    // 使用messageSystem显示弹窗
    this.messageSystem.showInsufficientFundsModal(property, requiredAmount, currentMoney);
  }

  /**
   * 处理购买成功
   */
  handlePurchaseSuccess(property) {
    // 扣除金钱
    this.money -= property.totalPrice;
    
    // 如果有资产管理器，添加到资产中
    if (this.assetManager) {
      this.assetManager.addAsset(property, property.totalPrice);
    }
    
    // 添加到资产追踪器的交易记录
    this.assetTracker.addTransaction('buy', property, property.totalPrice, this.money);
    
    // 显示购买成功消息
    this.messageSystem.addMessage(`成功购买 ${property.name}！`, 'success');
    
    // 添加购买通知动画
    this.addPurchaseNotification(`购买 ${property.name}`);
    
    // 保存游戏数据
    this.saveGameData();
  }

  /**
   * 处理每日新闻弹窗的日期变更
   */
  onDayChange(timeInfo) {
    // 当日期变更时，显示每日新闻弹窗
    if (this.dailyNewsModal && this.gameState === 'playing') {
      // 计算用户总资产
      const userAssets = this.money + (this.assetManager ? this.assetManager.getTotalAssetValue() : 0);
      
      // 显示每日新闻弹窗
      this.dailyNewsModal.show(canvas.width, canvas.height, userAssets, '我');
    }
  }
}
