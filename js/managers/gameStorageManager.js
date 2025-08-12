/**
 * 游戏存储管理器
 * 简化版本，专注于基本的用户数据和系统数据存储
 */

export default class GameStorageManager {
  constructor() {
    // 存储键名常量
    this.STORAGE_KEYS = {
      // 用户游戏数据
      USER_DATA: 'wechat_minigame_user_data',
      
      // 系统游戏状态
      SYSTEM_DATA: 'wechat_minigame_system_data'
    };
    
    // 添加存储锁机制
    this.isStorageLocked = false;
    this.storageQueue = [];
    this.lastStorageTime = 0;
    this.MIN_STORAGE_INTERVAL = 300; // 最小存储间隔500ms

  }
  

  /**
   * 保存用户游戏数据
   * @param {Object} userData 用户数据对象
   * @returns {boolean} 保存是否成功
   */
  saveUserData(userData) {
    // 调试：检查传入的数据
    console.log('saveUserData 接收到的数据:');
    console.log('  - properties数量:', userData.properties?.length || 0);
    console.log('  - transactionHistory数量:', userData.transactionHistory?.length || 0);
    console.log('  - money:', userData.money);
    
    if (userData.properties && userData.properties.length > 0) {
      console.log('  - 前3个房产ID:', userData.properties.slice(0, 3).map(p => p.id));
    }
    
    const data = {
      // 基础游戏状态
      money: userData.money || 0,
      gameStartTime: userData.gameStartTime || Date.now(),
      lastSaveTime: Date.now(),
      
      // 用户房产数据
      properties: userData.properties || [],
      
      // 交易历史
      transactionHistory: userData.transactionHistory || [],
      
      // 资产历史记录
      assetHistory: userData.assetHistory || [],
      
      // 用户统计数据
      statistics: userData.statistics || {
        totalSpent: 0,
        totalEarned: 0,
        propertiesPurchased: 0
      },
      
      timestamp: Date.now()
    };

    return this._saveDataWithQueue(this.STORAGE_KEYS.USER_DATA, data);
  }

  /**
   * 保存系统游戏数据
   * @param {Object} systemData 系统数据对象
   * @returns {boolean} 保存是否成功
   */
  saveSystemData(systemData) {
    const data = {
      // 系统玩家数据
      systemPlayers: systemData.systemPlayers || [],
      
      // 房产价格历史（所有房产）
      propertyPriceHistory: systemData.propertyPriceHistory || {},
      
      // 市场状态
      marketState: systemData.marketState || {},
      
      // 游戏世界状态
      worldState: systemData.worldState || {},
      
      timestamp: Date.now()
    };
    return this._saveDataWithQueue(this.STORAGE_KEYS.SYSTEM_DATA, data);
  }

  /**
   * 加载用户游戏数据
   * @returns {Object|null} 用户数据对象，失败时返回null
   */
  loadUserData() {
    const data = this._loadData(this.STORAGE_KEYS.USER_DATA);

    // 直接返回数据，不使用默认数据掩盖数据丢失问题
    if (!data) {
      console.error('❌ 用户数据加载失败 - 返回null以暴露问题');
      return null;
    }
    
    return data;
  }

  /**
   * 加载系统游戏数据
   * @returns {Object|null} 系统数据对象或null
   */
  loadSystemData() {
    const data = this._loadData(this.STORAGE_KEYS.SYSTEM_DATA);
    
    if (!data) {
      console.log('未找到系统数据，返回默认数据');
      return this._getDefaultSystemData();
    }

    return data;
  }

  /**
   * 检查用户是否首次游戏
   * @returns {boolean} 是否首次游戏
   */
  isFirstTimeUser() {
    try {
      const userData = this.loadUserData();
      return !userData || !userData.gameStartTime;
    } catch (error) {
      console.error('检查首次用户状态失败:', error);
      return true; // 出错时当作首次用户
    }
  }

  /**
   * 清空所有游戏数据（重置游戏）
   * @returns {boolean} 清空是否成功
   */
  clearAllData() {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      keys.forEach(key => {
        wx.removeStorageSync(key);
      });
      return true;
    } catch (error) {
      console.error('清空游戏数据失败:', error);
      return false;
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Object} 存储使用情况
   */
  getStorageInfo() {
    try {
      const info = wx.getStorageInfoSync();
      return {
        keys: info.keys,
        currentSize: info.currentSize,
        limitSize: info.limitSize,
        usagePercentage: (info.currentSize / info.limitSize * 100).toFixed(2)
      };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return null;
    }
  }

  // =============== 私有方法 ===============

  /**
   * 带队列的数据保存方法
   */
  _saveDataWithQueue(key, data) {
    return new Promise((resolve) => {
      // 添加到队列
      this.storageQueue.push({
        key,
        data: JSON.parse(JSON.stringify(data)), // 深拷贝避免引用问题
        resolve,
        timestamp: Date.now()
      });
      
      // 处理队列
      this._processStorageQueue();
    });
  }
  
  /**
   * 处理存储队列
   */
  _processStorageQueue() {
    if (this.isStorageLocked || this.storageQueue.length === 0) {
      return;
    }
    
    // 检查时间间隔
    const now = Date.now();
    if (now - this.lastStorageTime < this.MIN_STORAGE_INTERVAL) {
      // 延迟处理
      setTimeout(() => this._processStorageQueue(), this.MIN_STORAGE_INTERVAL);
      return;
    }
    
    // 锁定存储
    this.isStorageLocked = true;
    
    // 取出最新的存储请求（只保留最新的同key请求）
    const latestRequests = new Map();
    this.storageQueue.forEach(request => {
      latestRequests.set(request.key, request);
    });
    
    // 清空队列
    this.storageQueue = [];
    
    // 处理所有最新请求
    const promises = Array.from(latestRequests.values()).map(request => {
      return this._doActualSave(request.key, request.data, request.resolve);
    });
    
    Promise.all(promises).finally(() => {
      this.lastStorageTime = Date.now();
      this.isStorageLocked = false;
      
      // 如果队列中还有新的请求，继续处理
      if (this.storageQueue.length > 0) {
        setTimeout(() => this._processStorageQueue(), 100);
      }
    });
  }
  
  /**
   * 简单加载数据
   */
  _loadData(key) {
    try {
      const data = wx.getStorageSync(key);
      
      if (!data && key === this.STORAGE_KEYS.USER_DATA) {
        console.error(`❌ 用户数据丢失`);
      }
      
      return data;
    } catch (error) {
      console.error(`❌ 加载数据失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 实际执行存储操作
   */
  _doActualSave(key, data, resolve) {
    return new Promise((resolveInternal) => {
      try {
        // 直接保存数据
        wx.setStorageSync(key, data);
        
        // 基础验证
        const savedData = wx.getStorageSync(key);
        const success = savedData && typeof savedData === 'object';
        
        if (!success) {
          console.error(`❌ 数据保存失败 (${key})`);
        }
        
        resolve(success);
        resolveInternal();
        
      } catch (error) {
        console.error(`❌ 保存过程失败 (${key}):`, error.message);
        resolve(false);
        resolveInternal();
      }
    });
  }

  /**
   * 获取默认用户数据
   */
  _getDefaultUserData() {
    return {
      money: 5000000, // 初始资金500万
      gameStartTime: Date.now(),
      lastSaveTime: Date.now(),
      properties: [],
      transactionHistory: [],
      assetHistory: [],
      statistics: {
        totalSpent: 0,
        totalEarned: 0,
        propertiesPurchased: 0
      },
      timestamp: Date.now()
    };
  }

  /**
   * 获取默认系统数据
   */
  _getDefaultSystemData() {
    return {
      systemPlayers: [],
      propertyPriceHistory: {},
      marketState: {},
      worldState: {},
      timestamp: Date.now()
    };
  }

  /**
   * 简单保存数据 (兼容方法，重定向到队列版本)
   */
  _saveData(key, data) {
    // 对于同步调用，我们需要返回Promise但也要支持同步行为
    const promise = this._saveDataWithQueue(key, data);
    
    // 对于需要同步结果的调用，我们可以返回true，实际结果通过Promise处理
    // 这是一个权衡，因为原来的代码期望同步返回
    promise.catch(error => {
      console.error('异步保存失败:', error);
    });
    
    return promise;
  }
} 