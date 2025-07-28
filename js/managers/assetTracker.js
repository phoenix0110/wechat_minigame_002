// 移除formatPropertyPrice的导入，统一使用formatMoney
import { ASSET_TRACKING_CONFIG } from '../config/timeConfig.js';
import { formatMoney } from '../ui/utils.js';

/**
 * 资产追踪管理器
 * 负责记录用户资产价值变化和交易记录
 */
export default class AssetTracker {
  constructor(getMoneyCallback = null, getAssetManagerCallback = null) {
    // 资产价值历史记录（每10分钟一个记录点）
    this.assetHistory = [];
    
    // 交易记录
    this.transactionHistory = [];
    
    // 游戏开始时间
    this.gameStartTime = Date.now();
    
    // 上次记录资产价值的时间
    this.lastRecordTime = 0;
    
    // 记录间隔（从时间配置文件导入）
    this.recordInterval = ASSET_TRACKING_CONFIG.RECORD_INTERVAL;
    
    // 回调函数，用于获取当前游戏状态
    this.getMoneyCallback = getMoneyCallback;
    this.getAssetManagerCallback = getAssetManagerCallback;
    
    // 启动定时记录
    this.startPeriodicRecording();
  }

  /**
   * 记录资产价值
   * @param {number} cash 现金
   * @param {number} propertyValue 房产总价值
   */
  recordAssetValue(cash, propertyValue) {
    const now = Date.now();
    const totalAssetValue = cash + propertyValue;
    
    const record = {
      timestamp: now,
      timeFromStart: now - this.gameStartTime,
      cash: cash,
      propertyValue: propertyValue,
      totalAssetValue: totalAssetValue
    };
    
    this.assetHistory.push(record);
    this.lastRecordTime = now;
  }

  /**
   * 检查是否需要记录新的资产价值点
   * @param {number} cash 当前现金
   * @param {number} propertyValue 当前房产总价值
   */
  checkAndRecordAssetValue(cash, propertyValue) {
    const now = Date.now();
    
    // 检查是否超过了记录间隔
    if (now - this.lastRecordTime >= this.recordInterval) {
      this.recordAssetValue(cash, propertyValue);
      return true;
    }
    
    return false;
  }

  /**
   * 添加交易记录
   * @param {string} type 交易类型：'buy' 或 'sell'
   * @param {object} property 房产信息
   * @param {number} price 交易价格
   * @param {number} currentCash 交易后的现金
   * @param {number} purchasePrice 购买价格（仅用于卖出时计算盈亏）
   */
  addTransaction(type, property, price, currentCash, purchasePrice = null) {
    const transaction = {
      id: this.transactionHistory.length + 1,
      timestamp: Date.now(),
      type: type, // 'buy' 或 'sell'
      propertyName: property.name,
      propertyIcon: property.icon,
      price: price,
      currentCash: currentCash,
      timeFromStart: Date.now() - this.gameStartTime,
      purchasePrice: purchasePrice // 购买价格，用于计算盈亏
    };
    
    this.transactionHistory.unshift(transaction); // 最新的交易显示在最前面
    
    console.log('添加交易记录:', {
      类型: type === 'buy' ? '购买' : '出售',
      房产: property.name,
      价格: formatMoney(price),
      当前现金: formatMoney(currentCash),
      购买价格: purchasePrice ? formatMoney(purchasePrice) : 'N/A'
    });
  }

  /**
   * 获取资产历史记录
   */
  getAssetHistory() {
    return this.assetHistory;
  }

  /**
   * 获取交易记录
   */
  getTransactionHistory() {
    return this.transactionHistory;
  }

  /**
   * 获取最新的资产价值
   */
  getLatestAssetValue() {
    if (this.assetHistory.length > 0) {
      return this.assetHistory[this.assetHistory.length - 1];
    }
    return null;
  }

  /**
   * 格式化时间显示（从游戏开始的时间）
   * @param {number} timeFromStart 从游戏开始的毫秒数
   */
  formatTimeFromStart(timeFromStart) {
    const totalMinutes = Math.floor(timeFromStart / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  }

  /**
   * 启动定时记录
   */
  startPeriodicRecording() {
    // 设置定时器，每分钟记录一次
    this.recordingTimer = setInterval(() => {
      // 使用构造函数传入的回调函数获取当前资产数据
      if (this.getMoneyCallback && this.getAssetManagerCallback) {
        try {
          const cash = this.getMoneyCallback();
          const assetManager = this.getAssetManagerCallback();
          const propertyValue = assetManager ? assetManager.getTotalAssetValue() : 0;
          this.recordAssetValue(cash, propertyValue);
        } catch (error) {
          console.error('定时记录资产价值时出错:', error);
        }
      }
    }, this.recordInterval);
  }

  /**
   * 停止定时记录
   */
  stopPeriodicRecording() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /**
   * 恢复资产追踪器数据（用于加载游戏）
   */
  restoreData(data) {
    if (data) {
      // 恢复交易历史记录
      if (data.transactionHistory && Array.isArray(data.transactionHistory)) {
        this.transactionHistory = data.transactionHistory;
        console.log('交易记录已恢复，共', this.transactionHistory.length, '条记录');
      }
      
      // 恢复资产价值历史记录
      if (data.assetHistory && Array.isArray(data.assetHistory)) {
        this.assetHistory = data.assetHistory;
        console.log('资产历史记录已恢复，共', this.assetHistory.length, '条记录');
      }
      
      // 恢复游戏开始时间
      if (data.gameStartTime) {
        this.gameStartTime = data.gameStartTime;
      }
    }
  }

} 