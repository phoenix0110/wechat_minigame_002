import { formatPropertyPrice } from '../config/realEstateConfig.js';

/**
 * 资产追踪管理器
 * 负责记录用户资产价值变化和交易记录
 */
export default class AssetTracker {
  constructor() {
    // 资产价值历史记录（每10分钟一个记录点）
    this.assetHistory = [];
    
    // 交易记录
    this.transactionHistory = [];
    
    // 游戏开始时间
    this.gameStartTime = Date.now();
    
    // 上次记录资产价值的时间
    this.lastRecordTime = 0;
    
    // 记录间隔（1分钟）
    this.recordInterval = 1 * 60 * 1000;
    
    // 初始化第一个资产记录点
    this.recordAssetValue(0, 0); // 初始资产为0
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
    
    // 定期清理过期记录
    this.performPeriodicCleanup();
    
    console.log('记录资产价值:', {
      时间: new Date(now).toLocaleTimeString(),
      现金: formatPropertyPrice(cash),
      房产价值: formatPropertyPrice(propertyValue),
      总资产: formatPropertyPrice(totalAssetValue)
    });
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
   */
  addTransaction(type, property, price, currentCash) {
    const transaction = {
      id: this.transactionHistory.length + 1,
      timestamp: Date.now(),
      type: type, // 'buy' 或 'sell'
      propertyName: property.name,
      propertyIcon: property.icon,
      price: price,
      currentCash: currentCash,
      timeFromStart: Date.now() - this.gameStartTime
    };
    
    this.transactionHistory.unshift(transaction); // 最新的交易显示在最前面
    
    // 限制交易记录数量，避免占用过多内存
    if (this.transactionHistory.length > 100) {
      this.transactionHistory = this.transactionHistory.slice(0, 100);
    }
    
    console.log('添加交易记录:', {
      类型: type === 'buy' ? '购买' : '出售',
      房产: property.name,
      价格: formatPropertyPrice(price),
      当前现金: formatPropertyPrice(currentCash)
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
   * 获取用于绘制折线图的数据点（最近10分钟）
   * @param {number} maxPoints 最大显示点数
   */
  getChartData(maxPoints = 15) {
    // 计算10分钟前的时间戳
    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);
    
    // 过滤出最近10分钟的数据
    const recentData = this.assetHistory.filter(record => 
      record.timestamp >= tenMinutesAgo
    );
    
    // 如果最近10分钟的数据点数量小于等于maxPoints，直接返回
    if (recentData.length <= maxPoints) {
      return recentData;
    }
    
    // 如果数据点太多，进行均匀采样
    const step = Math.floor(recentData.length / maxPoints);
    const sampledData = [];
    
    for (let i = 0; i < recentData.length; i += step) {
      sampledData.push(recentData[i]);
    }
    
    // 确保包含最新的数据点
    const lastPoint = recentData[recentData.length - 1];
    if (sampledData.length > 0 && sampledData[sampledData.length - 1] !== lastPoint) {
      sampledData.push(lastPoint);
    }
    
    return sampledData;
  }

  /**
   * 清理过期的资产记录（保留最近30分钟的数据）
   */
  cleanupOldRecords() {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    // 保留最近30分钟的资产记录
    this.assetHistory = this.assetHistory.filter(record => 
      now - record.timestamp <= thirtyMinutes
    );
    
    // 至少保留最近的15个记录点
    if (this.assetHistory.length < 15 && this.assetHistory.length > 0) {
      // 如果记录太少，不进行清理
      return;
    }
  }

  /**
   * 定期清理过期记录（在每次记录新数据时调用）
   */
  performPeriodicCleanup() {
    // 每10次记录清理一次
    if (this.assetHistory.length % 10 === 0) {
      this.cleanupOldRecords();
    }
  }
} 