/**
 * 售楼处配置
 * 包含房产的单价和批量购买选项
 */

// 房产配置
const CITY_TYPES = {
  SUPER_FIRST_TIER: {
    name: '超一线城市',
    basePrice: 20000000, // 2000万
    priceMultiplier: 1.5
  },
  FIRST_TIER: {
    name: '一线城市',
    basePrice: 10000000, // 1000万
    priceMultiplier: 1.2
  },
  SECOND_TIER: {
    name: '二线城市',
    basePrice: 5000000, // 500万
    priceMultiplier: 1.0
  },
  THIRD_TIER: {
    name: '三线城市',
    basePrice: 1000000, // 100万
    priceMultiplier: 0.8
  }
};

const PROPERTY_CATEGORIES = {
  RESIDENTIAL: {
    name: '住宅',
    types: {
      BUNGALOW: {
        name: '平房',
        icon: '🏠',
        priceMultiplier: 0.8
      },
      LARGE_FLAT: {
        name: '大平层',
        icon: '🏢',
        priceMultiplier: 1.2
      },
      VILLA: {
        name: '别墅',
        icon: '🏡',
        priceMultiplier: 1.5
      }
    }
  },
  BUSINESS: {
    name: '经营型',
    types: {
      MALL: {
        name: '商场',
        icon: '🏬',
        priceMultiplier: 2.0
      },
      CONVENIENCE_STORE: {
        name: '便利店',
        icon: '🏪',
        priceMultiplier: 1.0
      },
      CAFE: {
        name: '咖啡店',
        icon: '☕',
        priceMultiplier: 1.2
      },
      RESTAURANT: {
        name: '餐厅',
        icon: '🍽️',
        priceMultiplier: 1.3
      },
      GYM: {
        name: '健身房',
        icon: '💪',
        priceMultiplier: 1.4
      }
    }
  },
  COMMERCIAL: {
    name: '商用',
    types: {
      OFFICE_BUILDING: {
        name: '写字楼',
        icon: '🏢',
        priceMultiplier: 1.8
      }
    }
  }
};

import { PROPERTY_TIME_CONFIG } from './timeConfig.js';

// 刷新间隔（从时间配置文件导入）
const REFRESH_INTERVAL = PROPERTY_TIME_CONFIG.PRICE_UPDATE_INTERVAL;

// 全局房产数据池（48套房产）
let ALL_PROPERTIES = [];

// 当前交易中心展示的房产（15套）
let CURRENT_TRADING_PROPERTIES = [];

// 全局价格更新定时器
let priceUpdateTimer = null;
let lastPriceUpdateTime = 0;
let nextPriceUpdateTime = 0;

// 生成所有48套房产数据
function generateAllProperties() {
  const properties = [];
  let id = 1;

  // 为每个城市类型生成房产
  Object.entries(CITY_TYPES).forEach(([cityKey, cityData]) => {
    // 为每个房产类别生成房产
    Object.entries(PROPERTY_CATEGORIES).forEach(([categoryKey, categoryData]) => {
      // 为每个房产类型生成房产
      Object.entries(categoryData.types).forEach(([typeKey, typeData]) => {
        // 每种类型生成4个房产
        for (let i = 0; i < 4; i++) {
          const basePrice = cityData.basePrice;
          const totalPrice = Math.round(
            basePrice * 
            cityData.priceMultiplier * 
            typeData.priceMultiplier * 
            (0.9 + Math.random() * 0.2) // 添加随机浮动
          );

          properties.push({
            id: id++,
            name: `${cityData.name}${typeData.name}`,
            icon: typeData.icon,
            category: categoryData.name,
            type: typeData.name,
            city: cityData.name,
            basePrice: totalPrice, // 保存基础价格，用于计算涨跌
            currentPrice: totalPrice,
            totalPrice: totalPrice,
            highestPrice: totalPrice,
            isPurchased: false, // 标记是否已被购买
            purchaseTime: null, // 购买时间
            purchasePrice: null, // 购买时的价格
            priceHistory: [{ // 历史价格记录
              timestamp: Date.now(),
              price: totalPrice
            }],
            // 租金系统相关字段
            rentAccumulated: 0, // 累积的租金，最大10万
            lastRentUpdate: null, // 上次租金更新时间
            rentPerMinute: 5000, // 每分钟租金收入
            rentCap: 100000 // 租金上限
          });
        }
      });
    });
  });

  ALL_PROPERTIES = properties;
  return properties;
}

// 更新所有房产价格（1%-5%随机涨跌）
function updateAllPropertyPrices() {
  const now = Date.now();
  
  ALL_PROPERTIES.forEach(property => {
      // 随机涨跌1%-5%
      const changePercent = (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      const newPrice = Math.round(property.currentPrice * (1 + changePercent));
      
      property.currentPrice = Math.max(newPrice, property.basePrice * 0.2); // 最低不低于基础价格的50%
      property.totalPrice = property.currentPrice;
      
      // 更新历史最高价
      if (property.currentPrice > property.highestPrice) {
        property.highestPrice = property.currentPrice;
      }
      
      // 记录历史价格
      property.priceHistory.push({
        timestamp: now,
        price: property.currentPrice
      });
      
      // 清理超过1小时的历史记录
      const oneHourAgo = now - PROPERTY_TIME_CONFIG.PRICE_HISTORY_RETENTION;
      property.priceHistory = property.priceHistory.filter(record => 
        record.timestamp >= oneHourAgo
      );
  });
}

// 从48套房产中随机选择15套用于交易中心展示
function selectTradingProperties() {
  // 获取所有未被购买的房产
  const availableProperties = ALL_PROPERTIES.filter(property => !property.isPurchased);
  
  // 如果可用房产少于15套，返回所有可用房产
  if (availableProperties.length <= 15) {
    return availableProperties;
  }
  
  // 随机选择15套房产
  const selectedProperties = [];
  const availableIndices = availableProperties.map((_, index) => index);
  
  for (let i = 0; i < 15; i++) {
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const propertyIndex = availableIndices.splice(randomIndex, 1)[0];
    selectedProperties.push(availableProperties[propertyIndex]);
  }
  
  return selectedProperties;
}

// 启动全局价格更新定时器
function startPriceUpdateTimer() {
  // 清除现有定时器
  if (priceUpdateTimer) {
    clearInterval(priceUpdateTimer);
  }
  
  // 设置初始更新时间
  const now = Date.now();
  lastPriceUpdateTime = now;
  nextPriceUpdateTime = now + REFRESH_INTERVAL;
  
  // 启动定时器，根据配置的频率检查是否需要更新
  priceUpdateTimer = setInterval(() => {
    const currentTime = Date.now();
    
    // 检查是否到了更新时间
    if (currentTime >= nextPriceUpdateTime) {
      console.log('执行房产价格统一更新...');
      
      // 更新所有房产价格
      updateAllPropertyPrices();
      
      // 重新选择交易中心展示的房产
      CURRENT_TRADING_PROPERTIES = selectTradingProperties();
      
      // 为选中的房产设置倒计时
      CURRENT_TRADING_PROPERTIES.forEach(property => {
        property.remainingTime = REFRESH_INTERVAL;
        property.lastUpdateTime = currentTime;
      });
      
      // 更新时间记录
      lastPriceUpdateTime = currentTime;
      nextPriceUpdateTime = currentTime + REFRESH_INTERVAL;
      
      console.log('房产价格更新完成，下次更新时间:', new Date(nextPriceUpdateTime));
    }
      }, PROPERTY_TIME_CONFIG.PRICE_CHECK_FREQUENCY); // 根据配置的频率检查
}

// 停止全局价格更新定时器
function stopPriceUpdateTimer() {
  if (priceUpdateTimer) {
    clearInterval(priceUpdateTimer);
    priceUpdateTimer = null;
    console.log('房产价格更新定时器已停止');
  }
}

// 重新启动价格更新定时器（在页面重新显示时使用）
function restartPriceUpdateTimer() {
  // 先停止现有定时器
  stopPriceUpdateTimer();
  
  // 检查是否需要立即更新价格
  checkPriceUpdate();
  
  // 重新启动定时器
  startPriceUpdateTimer();
  
  console.log('房产价格更新定时器已重新启动');
}

// 获取距离下次价格更新的剩余时间 
function getTimeUntilNextPriceUpdate() {
  const now = Date.now();
  return Math.max(0, nextPriceUpdateTime - now);
}

// 检查价格是否需要更新（供外部调用）
function checkPriceUpdate() {
  const now = Date.now();
  if (now >= nextPriceUpdateTime) {
    console.log('触发房产价格更新检查...');
    
    // 更新所有房产价格
    updateAllPropertyPrices();
    
    // 重新选择交易中心展示的房产
    CURRENT_TRADING_PROPERTIES = selectTradingProperties();
    
    // 为选中的房产设置倒计时
    CURRENT_TRADING_PROPERTIES.forEach(property => {
      property.remainingTime = REFRESH_INTERVAL;
      property.lastUpdateTime = now;
    });
    
    // 更新时间记录
    lastPriceUpdateTime = now;
    nextPriceUpdateTime = now + REFRESH_INTERVAL;
    
    return true;
  }
  return false;
}

// 购买房产
function purchaseProperty(propertyId) {
  const property = ALL_PROPERTIES.find(p => p.id === propertyId);
  if (property && !property.isPurchased) {
    property.isPurchased = true;
    property.purchaseTime = Date.now();
    property.purchasePrice = property.currentPrice;
    
    // 初始化租金系统
    property.rentAccumulated = 0;
    property.lastRentUpdate = Date.now();
    
    // 从当前交易列表中移除
    CURRENT_TRADING_PROPERTIES = CURRENT_TRADING_PROPERTIES.filter(p => p.id !== propertyId);
    
    return property;
  }
  return null;
}

// 出售房产
function sellProperty(propertyId) {
  const property = ALL_PROPERTIES.find(p => p.id === propertyId);
  if (property && property.isPurchased) {
    
    // 重置房产状态，使其可以重新进入交易市场
    property.isPurchased = false;
    property.purchaseTime = null;
    property.purchasePrice = null;
    
    return {
      property: property,
      sellPrice: property.currentPrice
    };
  }
  return null;
}

// 获取用户已购买的房产
function getUserProperties() {
  return ALL_PROPERTIES.filter(property => property.isPurchased);
}

// 初始化房产数据
function initializeRealEstate() {
  generateAllProperties();
  CURRENT_TRADING_PROPERTIES = selectTradingProperties();
  
  const now = Date.now();
  CURRENT_TRADING_PROPERTIES.forEach(property => {
    property.remainingTime = REFRESH_INTERVAL;
    property.lastUpdateTime = now;
  });
  
  // 启动全局价格更新定时器
  startPriceUpdateTimer();
  
  return CURRENT_TRADING_PROPERTIES;
}

// 刷新交易中心（保持向后兼容，但使用新的统一更新机制）
function refreshTradingCenter() {
  // 检查是否需要更新价格
  checkPriceUpdate();
  return CURRENT_TRADING_PROPERTIES;
}

// 格式化房产价格显示
function formatPropertyPrice(price) {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(1)}亿`;
  } else if (price >= 10000) {
    return `${(price / 10000).toFixed(1)}万`;
  } else {
    return `${price.toLocaleString()}元`;
  }
}

/**
 * 获取房产类型的中文名称
 */
export function getPropertyTypeName(type) {
  const typeNames = {
    apartment: '大平层',
    villa: '别墅',
    mansion: '豪宅',
    penthouse: '顶层公寓'
  };
  return typeNames[type] || type;
}

// 格式化剩余时间显示
function formatRemainingTime(remainingTime) {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  return `${minutes}分${seconds}秒`;
}

// 更新单个房产的租金累积
function updatePropertyRent(property) {
  if (!property.isPurchased || !property.lastRentUpdate) {
    return;
  }
  
  const now = Date.now();
  const timeDiff = now - property.lastRentUpdate;
  const minutesPassed = timeDiff / (60 * 1000); // 转换为分钟
  
  // 计算应该增加的租金
  const rentToAdd = Math.floor(minutesPassed * property.rentPerMinute);
  
  if (rentToAdd > 0) {
    // 增加租金，但不超过上限
    property.rentAccumulated = Math.min(
      property.rentAccumulated + rentToAdd, 
      property.rentCap
    );
    
    // 更新最后更新时间
    property.lastRentUpdate = now;
  }
}

// 更新所有已购买房产的租金
function updateAllRents() {
  const userProperties = getUserProperties();
  userProperties.forEach(updatePropertyRent);
}

// 收取房产租金
function collectRent(propertyId) {
  const property = ALL_PROPERTIES.find(p => p.id === propertyId && p.isPurchased);
  if (!property) {
    return null;
  }
  
  // 先更新租金
  updatePropertyRent(property);
  
  // 获取累积的租金
  const rentAmount = property.rentAccumulated;
  
  if (rentAmount > 0) {
    // 清空累积租金
    property.rentAccumulated = 0;
    // 重新开始计时
    property.lastRentUpdate = Date.now();
    
    return {
      property: property,
      rentAmount: rentAmount
    };
  }
  
  return null;
}

// 获取房产的租金进度（0-1之间的值）
function getRentProgress(property) {
  if (!property.isPurchased) {
    return 0;
  }
  
  // 先更新租金
  updatePropertyRent(property);
  
  return property.rentAccumulated / property.rentCap;
}

// 导出配置
export {
  CITY_TYPES,
  PROPERTY_CATEGORIES,
  REFRESH_INTERVAL,
  ALL_PROPERTIES,
  CURRENT_TRADING_PROPERTIES,
  generateAllProperties,
  updateAllPropertyPrices,
  selectTradingProperties,
  refreshTradingCenter,
  purchaseProperty,
  sellProperty,
  getUserProperties,
  initializeRealEstate,
  formatPropertyPrice,
  formatRemainingTime,
  startPriceUpdateTimer,
  stopPriceUpdateTimer,
  restartPriceUpdateTimer,
  getTimeUntilNextPriceUpdate,
  checkPriceUpdate,
  updatePropertyRent,
  updateAllRents,
  collectRent,
  getRentProgress
}; 