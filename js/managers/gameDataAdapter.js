/**
 * 游戏数据适配器
 * 负责协调存储管理器与各个游戏组件之间的数据同步
 * 
 * 主要功能：
 * 1. 将分散的游戏组件数据统一管理
 * 2. 提供简化的数据保存和加载接口
 * 3. 协调各组件间的数据一致性
 */

import GameStorageManager from './gameStorageManager.js';
import { AchievementManager } from '../config/achievementConfig.js';

export default class GameDataAdapter {
  constructor() {
    this.storageManager = new GameStorageManager();
    
    // 引用各个游戏组件（稍后设置）
    this.assetManager = null;
    this.assetTracker = null;
    this.rankingManager = null;
    this.gameTimeManager = null;
    this.achievementManager = new AchievementManager(); // 初始化成就管理器
    
    // 游戏主要状态
    this.gameState = {
      money: 5000000,
      gameStartTime: Date.now()
    };
    
    // 用户房产数据（唯一数据源）
    this.userProperties = [];
  }

  /**
   * 设置游戏组件引用
   */
  setComponents(components) {
    this.assetManager = components.assetManager;
    this.assetTracker = components.assetTracker;
    this.rankingManager = components.rankingManager;
    this.gameTimeManager = components.gameTimeManager;
    // 成就管理器已经在构造函数中初始化
  }

  /**
   * 获取成就管理器
   */
  getAchievementManager() {
    return this.achievementManager;
  }

  /**
   * 设置游戏状态
   */
  setGameState(money, gameStartTime = null) {
    this.gameState.money = money;
    if (gameStartTime) {
      this.gameState.gameStartTime = gameStartTime;
    }
  }

  /**
   * 获取当前金钱
   */
  getMoney() {
    return this.gameState.money;
  }

  /**
   * 设置金钱
   */
  setMoney(amount) {
    this.gameState.money = amount;
  }

  /**
   * 增加金钱（用于成就奖励）
   */
  addMoney(amount) {
    this.gameState.money += amount;
    
    // 更新成就统计
    this.achievementManager.updateStats('earn', { amount: amount });
  }

  /**
   * 获取用户房产
   */
  getUserProperties() {
    return this.userProperties;
  }

  /**
   * 添加用户房产
   */
  addUserProperty(property) {
    this.userProperties.push(property);
    
    // 更新成就统计
    this.achievementManager.updateStats('purchase', {
      district: property.districtType,
      districtType: property.districtType
    });
    
    // 更新排名相关成就
    this.updateRankingAchievements();
  }

  /**
   * 移除用户房产
   */
  removeUserProperty(propertyId, profit = 0) {
    const propertyIndex = this.userProperties.findIndex(p => p.id === propertyId);
    if (propertyIndex !== -1) {
      const property = this.userProperties[propertyIndex];
      this.userProperties.splice(propertyIndex, 1);
      
      // 更新成就统计
      this.achievementManager.updateStats('sell', {
        district: property.districtType,
        districtType: property.districtType,
        profit: profit
      });
      
      // 更新排名相关成就
      this.updateRankingAchievements();
      
      // 返回被移除的房产对象
      return property;
    }
    
    // 如果没有找到房产，返回null
    return null;
  }

  /**
   * 更新排名相关成就
   */
  updateRankingAchievements() {
    if (this.rankingManager) {
      const userAssets = this.getMoney() + this.getTotalAssetValue();
      const userRank = this.rankingManager.getUserRank(userAssets);
      
      // 更新成就管理器中的排名
      this.achievementManager.updateStats('rank_update', { rank: userRank });
    }
  }

  /**
   * 获取总资产价值
   */
  getTotalAssetValue() {
    if (!this.assetManager) return 0;
    return this.assetManager.getTotalAssetValue();
  }

  /**
   * 收取房产租金
   */
  collectRent(amount) {
    this.gameState.money += amount;
    
    // 更新成就统计
    this.achievementManager.updateStats('rent', {});
  }

  /**
   * 房产升级
   */
  upgradeProperty() {
    // 更新成就统计
    this.achievementManager.updateStats('upgrade', {});
  }

  /**
   * 保存完整游戏状态
   * @returns {Promise<boolean>} 保存是否成功
   */
  async saveGameData() {
    try {
      // 1. 收集用户数据
      const userData = this._collectUserData();
      
      // 2. 收集系统数据
      const systemData = this._collectSystemData();
      
      // 3. 异步保存数据
      const [userSaveResult, systemSaveResult] = await Promise.all([
        this.storageManager.saveUserData(userData),
        this.storageManager.saveSystemData(systemData)
      ]);
      
      const success = userSaveResult && systemSaveResult;

      return success;
      
    } catch (error) {
      console.error('保存游戏数据时发生错误:', error);
      return false;
    }
  }

  /**
   * 加载完整游戏状态
   * @returns {boolean} 加载是否成功
   */
  loadGameData() {
    try {
      
      // 1. 加载用户数据
      const userData = this.storageManager.loadUserData();
      const userRestoreResult = this._restoreUserData(userData);
      
      // 2. 加载系统数据
      const systemData = this.storageManager.loadSystemData();
      const systemRestoreResult = this._restoreSystemData(systemData);
      
      const success = userRestoreResult && systemRestoreResult;
      return success;
      
    } catch (error) {
      console.error('加载游戏数据时发生错误:', error);
      return false;
    }
  }

  /**
   * 检查是否首次游戏
   */
  isFirstTimeUser() {
    return this.storageManager.isFirstTimeUser();
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo() {
    return this.storageManager.getStorageInfo();
  }

  // =============== 私有方法 ===============

  /**
   * 收集用户数据
   */
  _collectUserData() {
    const userData = {
      // 基础状态
      money: this.gameState.money,
      gameStartTime: this.gameState.gameStartTime,
      
      // 用户房产 - 只保存关键信息，避免与实例池脱离
      properties: this.userProperties.map(property => ({
        id: property.id,
        purchasePrice: property.purchasePrice,
        purchaseTime: property.purchaseTime,
        lastRentCollection: property.lastRentCollection,
        rentProgress: property.rentProgress
      })),
      
      // 交易历史
      transactionHistory: this.assetTracker.getTransactionHistory(),
      
      // 资产历史
      assetHistory: this.assetTracker.getAssetHistory(),
      
      // 统计数据
      statistics: {
        totalSpent: this.assetManager.totalSpent,
        totalEarned: this.assetManager.totalEarned,
        propertiesPurchased: this.userProperties.length
      },
      
      // 成就数据
      achievements: this.achievementManager.saveData(),
      
      // 游戏时间数据
      gameTime: this.gameTimeManager ? this.gameTimeManager.saveTimeState() : null
    };

    return userData;
  }

  /**
   * 收集系统数据
   */
  _collectSystemData() {
    const systemData = {
      // 系统玩家数据
      systemPlayers: [],
      
      // 房产价格历史
      propertyPriceHistory: {},
      
      // 市场状态
      marketState: {},
      
      // 游戏世界状态
      worldState: {}
    };

    // 从RankingManager收集系统玩家数据
    if (this.rankingManager) {
      const rankingData = this.rankingManager.getSystemPlayersData();
      systemData.systemPlayers = rankingData.systemPlayers;
      systemData.marketState.lastUpdateTime = rankingData.lastUpdateTime;
    }

    // 收集所有房产的价格历史数据
    try {
      // 获取房产实例池的方法，支持不同环境
      let getAllPropertiesFunc = null;
      if (typeof window !== 'undefined' && window.getAllAvailableProperties) {
        getAllPropertiesFunc = window.getAllAvailableProperties;
      } else if (typeof GameGlobal !== 'undefined' && GameGlobal.getAllAvailableProperties) {
        getAllPropertiesFunc = GameGlobal.getAllAvailableProperties;
      } else if (typeof global !== 'undefined' && global.getAllAvailableProperties) {
        getAllPropertiesFunc = global.getAllAvailableProperties;
      }
      
      if (getAllPropertiesFunc) {
        const allProperties = getAllPropertiesFunc();
        allProperties.forEach(property => {
          if (property.priceHistory && property.priceHistory.length > 0) {
            systemData.propertyPriceHistory[property.id] = {
              currentPrice: property.currentPrice,
              initialPrice: property.initialPrice,
              highestPrice: property.highestPrice,
              lowestPrice: property.lowestPrice,
              lastPriceUpdate: property.lastPriceUpdate,
              priceHistory: [...property.priceHistory]
            };
          }
        });
      }
    } catch (error) {
      // 静默处理错误
    }

    return systemData;
  }

  /**
   * 恢复用户数据
   */
  _restoreUserData(userData) {
    if (!userData) {
      return false;
    }
    try {
      // 恢复基础状态
      this.gameState.money = userData.money || 5000000;
      this.gameState.gameStartTime = userData.gameStartTime || Date.now();

      // 恢复用户房产数据 - 从实例池重新获取以保持同步
      this.userProperties = [];
      if (userData.properties && Array.isArray(userData.properties)) {
        // 获取房产实例池的方法，支持不同环境
        let getAllPropertiesFunc = null;
        if (typeof window !== 'undefined' && window.getAllAvailableProperties) {
          getAllPropertiesFunc = window.getAllAvailableProperties;
        } else if (typeof GameGlobal !== 'undefined' && GameGlobal.getAllAvailableProperties) {
          getAllPropertiesFunc = GameGlobal.getAllAvailableProperties;
        } else if (typeof global !== 'undefined' && global.getAllAvailableProperties) {
          getAllPropertiesFunc = global.getAllAvailableProperties;
        }
        
        if (getAllPropertiesFunc) {
          const allProperties = getAllPropertiesFunc();
          const propertiesMap = new Map(allProperties.map(p => [p.id, p]));
          
          console.log(`🏠 开始恢复用户房产: ${userData.properties.length} 个房产`);
          
          userData.properties.forEach(savedProperty => {
            const liveProperty = propertiesMap.get(savedProperty.id);
            if (liveProperty) {
              // 设置购买相关信息
              liveProperty.purchasePrice = savedProperty.purchasePrice;
              liveProperty.purchaseTime = savedProperty.purchaseTime;
              liveProperty.lastRentCollection = savedProperty.lastRentCollection || Date.now();
              liveProperty.rentProgress = savedProperty.rentProgress || 0;
              
              this.userProperties.push(liveProperty);
              console.log(`✅ 恢复房产: ${liveProperty.name} (ID: ${liveProperty.id})`);
            } else {
              console.error(`❌ 无法找到房产 ID: ${savedProperty.id}`);
            }
          });
          
          console.log(`🏠 房产恢复完成: 成功恢复 ${this.userProperties.length} 个房产`);
        } else {
          console.error('❌ 无法获取房产实例池 - getAllAvailableProperties 方法未找到');
          console.error('🔍 可用的全局对象:', {
            hasWindow: typeof window !== 'undefined',
            hasGlobal: typeof global !== 'undefined', 
            hasGameGlobal: typeof GameGlobal !== 'undefined',
            windowHasMethod: typeof window !== 'undefined' && !!window.getAllAvailableProperties,
            gameGlobalHasMethod: typeof GameGlobal !== 'undefined' && !!GameGlobal.getAllAvailableProperties
          });
        }
      }

      this.assetTracker.restoreData({
        transactionHistory: userData.transactionHistory,
        assetHistory: userData.assetHistory,
        gameStartTime: userData.gameStartTime
      });
      this.assetManager.totalSpent = userData.statistics?.totalSpent || 0;
      this.assetManager.totalEarned = userData.statistics?.totalEarned || 0;

      this.assetManager.assets.clear();
      this.userProperties.forEach(property => {
        const price = property.currentPrice || property.totalPrice || 0;
        const asset = {
          id: property.id,
          name: property.name,
          price: price,
          quantity: 1,
          totalPrice: price,
          icon: property.icon || '📦',
          firstPurchaseTime: property.purchaseTime || Date.now(),
          originalItem: property
        };
        this.assetManager.assets.set(property.id, asset);
      });

      // 恢复成就数据
      if (userData.achievements) {
        this.achievementManager.loadData(userData.achievements);
      }

      // 恢复游戏时间数据
      if (userData.gameTime && this.gameTimeManager) {
        this.gameTimeManager.restoreTimeState(userData.gameTime);
      }

      // 更新成就统计
      this.achievementManager.playerStats.currentPropertyCount = this.userProperties.length;
      
      // 计算区域统计
      this.achievementManager.playerStats.districtStats = {};
      this.userProperties.forEach(property => {
        const district = property.districtType;
        if (district) {
          if (!this.achievementManager.playerStats.districtStats[district]) {
            this.achievementManager.playerStats.districtStats[district] = 0;
          }
          this.achievementManager.playerStats.districtStats[district]++;
        }
      });
      
      // 更新排名相关成就
      this.updateRankingAchievements();

      return true;

    } catch (error) {
      console.error('恢复用户数据失败:', error);
      return false;
    }
  }

  /**
   * 恢复系统数据
   */
  _restoreSystemData(systemData) {
    if (!systemData) {
      return true; // 系统数据可以为空，使用默认初始化
    }

    try {
      // 恢复RankingManager数据
      if (this.rankingManager) {
        if (systemData.systemPlayers && Array.isArray(systemData.systemPlayers) && systemData.systemPlayers.length > 0) {
          this.rankingManager.restoreSystemPlayersData({
            systemPlayers: systemData.systemPlayers,
            lastUpdateTime: systemData.marketState?.lastUpdateTime
          });
        }
      }

      // 恢复房产价格历史数据
      if (systemData.propertyPriceHistory && Object.keys(systemData.propertyPriceHistory).length > 0) {
        try {
          // 获取房产实例池的方法，支持不同环境
          let getAllPropertiesFunc = null;
          if (typeof window !== 'undefined' && window.getAllAvailableProperties) {
            getAllPropertiesFunc = window.getAllAvailableProperties;
          } else if (typeof GameGlobal !== 'undefined' && GameGlobal.getAllAvailableProperties) {
            getAllPropertiesFunc = GameGlobal.getAllAvailableProperties;
          } else if (typeof global !== 'undefined' && global.getAllAvailableProperties) {
            getAllPropertiesFunc = global.getAllAvailableProperties;
          }
          
          if (getAllPropertiesFunc) {
            const allProperties = getAllPropertiesFunc();
            let restoredCount = 0;
            
            allProperties.forEach(property => {
              const savedPropertyData = systemData.propertyPriceHistory[property.id];
              if (savedPropertyData) {
                // 恢复价格信息
                property.currentPrice = savedPropertyData.currentPrice || property.currentPrice;
                property.highestPrice = savedPropertyData.highestPrice || property.highestPrice;
                property.lowestPrice = savedPropertyData.lowestPrice || property.lowestPrice;
                property.lastPriceUpdate = savedPropertyData.lastPriceUpdate || property.lastPriceUpdate;
                
                // 恢复价格历史记录
                if (savedPropertyData.priceHistory && Array.isArray(savedPropertyData.priceHistory)) {
                  property.priceHistory = [...savedPropertyData.priceHistory];
                  restoredCount++;
                }
              }
            });
          }
        } catch (error) {
          // 静默处理房产恢复错误
        }
      }

      return true;

    } catch (error) {
      return false;
    }
  }
} 