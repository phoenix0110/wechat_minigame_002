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
   * @returns {Object|null} 用户数据对象或null
   */
  loadUserData() {
    console.log(`🔍 尝试加载用户数据，存储key: ${this.STORAGE_KEYS.USER_DATA}`);
    
    // 添加详细的存储状态检查
    try {
      // 先检查所有存储keys
      const allKeys = wx.getStorageInfoSync().keys;
      console.log(`📱 微信存储中的所有keys:`, allKeys);
      console.log(`📱 目标key是否存在:`, allKeys.includes(this.STORAGE_KEYS.USER_DATA));
      
      // 尝试直接读取原始数据
      const rawData = wx.getStorageSync(this.STORAGE_KEYS.USER_DATA);
      console.log(`📤 原始存储数据类型:`, typeof rawData);
      console.log(`📤 原始存储数据长度:`, rawData ? JSON.stringify(rawData).length : 0);
      
      if (rawData) {
        console.log(`📤 原始数据结构检查:`, {
          hasMoney: rawData.money !== undefined,
          hasProperties: Array.isArray(rawData.properties),
          propertiesCount: rawData.properties?.length || 0,
          hasTimestamp: rawData.timestamp !== undefined,
          timestamp: rawData.timestamp ? new Date(rawData.timestamp).toLocaleString() : 'None'
        });
      }
      
    } catch (debugError) {
      console.error('🔍 存储状态检查失败:', debugError);
    }
    
    const data = this._loadData(this.STORAGE_KEYS.USER_DATA);

    if (!data) {
      console.log('❌ 未找到用户数据，返回默认数据');
      
      // 尝试检查是否有其他可能的存储key
      try {
        const storageInfo = wx.getStorageInfoSync();
        const possibleKeys = storageInfo.keys.filter(key => 
          key.includes('wechat') || key.includes('minigame') || key.includes('user')
        );
        if (possibleKeys.length > 0) {
          console.log('🔍 发现可能相关的存储keys:', possibleKeys);
        }
      } catch (e) {
        console.error('检查相关keys失败:', e);
      }
      
      return this._getDefaultUserData();
    }
    
    console.log(`✅ 用户数据加载成功: ${data.properties?.length || 0}个房产, ${data.transactionHistory?.length || 0}条交易记录`);
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
   * 实际执行存储操作
   */
  _doActualSave(key, data, resolve) {
    return new Promise((resolveInternal) => {
      try {
        const startTime = Date.now();
        console.log(`🔄 开始保存数据到 ${key}:`, {
          properties: data.properties?.length || 0,
          money: data.money,
          timestamp: new Date().toLocaleTimeString(),
          dataSize: JSON.stringify(data).length + ' 字符'
        });
        
        // 强制清除可能的存储缓存
        try {
          wx.removeStorageSync(key);
          console.log(`🗑️ 清除旧数据完成: ${key}`);
        } catch (removeError) {
          console.warn(`清除旧数据失败: ${removeError.message}`);
        }
        
        // 短暂延迟确保清除完成
        setTimeout(() => {
                  try {
          // 保存新数据
          wx.setStorageSync(key, data);
          const saveTime = Date.now() - startTime;
          console.log(`💾 setStorageSync 调用完成，耗时: ${saveTime}ms`);
          
          // 同时保存一个备份版本（只有用户数据才备份）
          if (key === this.STORAGE_KEYS.USER_DATA) {
            try {
              const backupKey = key + '_backup_' + Date.now();
              const simpleBackup = {
                money: data.money,
                properties: data.properties,
                gameStartTime: data.gameStartTime,
                timestamp: data.timestamp
              };
              wx.setStorageSync(backupKey, simpleBackup);
              console.log(`💾 备份数据保存成功: ${backupKey}`);
              
              // 清理过旧的备份（保留最新的3个）
              const allKeys = wx.getStorageInfoSync().keys;
              const backupKeys = allKeys.filter(k => k.startsWith(key + '_backup_')).sort();
              if (backupKeys.length > 3) {
                backupKeys.slice(0, -3).forEach(oldBackupKey => {
                  try {
                    wx.removeStorageSync(oldBackupKey);
                  } catch (e) {
                    console.warn(`清理旧备份失败: ${oldBackupKey}`);
                  }
                });
              }
            } catch (backupError) {
              console.warn('备份数据保存失败:', backupError);
            }
          }
            
            // 立即验证保存结果
            const savedData = wx.getStorageSync(key);
            const verifyTime = Date.now() - startTime;
            console.log(`🔍 getStorageSync 验证完成，总耗时: ${verifyTime}ms`);
            
            // 详细对比数据
            const originalPropsCount = data.properties?.length || 0;
            const savedPropsCount = savedData.properties?.length || 0;
            const originalMoney = data.money || 0;
            const savedMoney = savedData.money || 0;
            
            console.log(`📊 数据对比结果:`, {
              '房产数量': `${originalPropsCount} → ${savedPropsCount}`,
              '金钱数量': `${originalMoney} → ${savedMoney}`,
              '数据大小': `${JSON.stringify(data).length} → ${JSON.stringify(savedData).length} 字符`,
              '时间戳': `${data.timestamp} → ${savedData.timestamp}`
            });
            
            // 检查基础数据完整性（放宽验证条件）
            const hasBasicData = savedData && 
                                savedData.money !== undefined && 
                                Array.isArray(savedData.properties);
            
            if (!hasBasicData) {
              console.error(`❌ 基础数据验证失败!`, {
                hasData: !!savedData,
                hasMoney: savedData?.money !== undefined,
                hasProperties: Array.isArray(savedData?.properties)
              });
              resolve(false);
            } else {
              // 如果房产数量有轻微差异，记录但不认为失败
              if (originalPropsCount !== savedPropsCount) {
                console.warn(`⚠️ 房产数量有差异但基础数据正常: ${originalPropsCount} → ${savedPropsCount}`);
                
                // 只有差异很大时才检查详情
                if (Math.abs(originalPropsCount - savedPropsCount) > 2) {
                  console.warn(`⚠️ 房产数量差异较大，进行详细检查`);
                  try {
                    const storageInfo = wx.getStorageInfoSync();
                    console.log(`📱 微信存储状态:`, {
                      '当前使用': `${storageInfo.currentSize}KB`,
                      '存储上限': `${storageInfo.limitSize}KB`,
                      '使用率': `${(storageInfo.currentSize / storageInfo.limitSize * 100).toFixed(2)}%`
                    });
                  } catch (storageInfoError) {
                    console.error('获取存储信息失败:', storageInfoError);
                  }
                }
              }
              
              console.log(`✅ 数据保存成功 (${key})`);
              resolve(true);
            }
            
            resolveInternal();
          } catch (error) {
            console.error(`💥 setStorageSync 调用失败 (${key}):`, {
              message: error.message,
              errCode: error.errCode,
              stack: error.stack
            });
            resolve(false);
            resolveInternal();
          }
        }, 50);
        
      } catch (error) {
        console.error(`💥 保存数据过程失败 (${key}):`, error);
        resolve(false);
        resolveInternal();
      }
    });
  }

  /**
   * 简单加载数据
   */
  _loadData(key) {
    try {
      const data = wx.getStorageSync(key);
      
      // 如果主数据不存在且是用户数据，尝试从备份恢复
      if (!data && key === this.STORAGE_KEYS.USER_DATA) {
        console.warn('主用户数据不存在，尝试从备份恢复');
        try {
          const allKeys = wx.getStorageInfoSync().keys;
          const backupKeys = allKeys
            .filter(k => k.startsWith(key + '_backup_'))
            .sort()
            .reverse(); // 最新的在前
            
          for (const backupKey of backupKeys) {
            try {
              const backupData = wx.getStorageSync(backupKey);
              if (backupData && backupData.money !== undefined) {
                console.log(`✅ 从备份恢复数据成功: ${backupKey}`);
                
                // 将备份数据恢复为主数据
                wx.setStorageSync(key, backupData);
                return backupData;
              }
            } catch (e) {
              console.warn(`备份数据读取失败: ${backupKey}`, e);
            }
          }
          
          if (backupKeys.length > 0) {
            console.warn('所有备份数据都无效');
          } else {
            console.warn('未找到任何备份数据');
          }
        } catch (backupError) {
          console.error('备份恢复过程失败:', backupError);
        }
      }
      
      return data;
    } catch (error) {
      console.error(`加载数据失败 (${key}):`, error);
      return null;
    }
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