/**
 * 售楼处配置
 * 包含房产的单价和批量购买选项
 */

import { DISTRICT_PROPERTY_CONFIG, getPropertyImageByHouseType } from './districtPropertyConfig.js';
import { PROPERTY_TIME_CONFIG, TIME_AXIS_CONFIG } from './timeConfig.js';
import { newsManager } from './newsConfig.js';

/**
 * 房产数据结构
 * 基于新的地块配置表生成
 */

// 将配置表数据转换为游戏所需的房产数据格式
function convertConfigToPropertyData(config) {
  const initialTimestamp = gameTimeManager ? gameTimeManager.getGameTimestamp() : Date.now();
  
  return {
    id: config.blockId,
    name: config.propertyName,
    districtType: config.districtType, // 新增区域类型
    decorationType: config.decorationType, // 新增装修类型
    houseType: config.houseType, // 新增房屋类型
    starRating: config.starRating, // 新增星级评定
    monthlyRent: config.monthlyRent, // 新增月租金
    initialPrice: config.initialPrice, // 保存初始价格
    currentPrice: config.initialPrice,
    totalPrice: config.initialPrice, // 总价等于当前价格
    purchasePrice: null, // 购买时设置
    highestPrice: config.initialPrice,
    lowestPrice: config.initialPrice,
    lastPriceUpdate: initialTimestamp, // 使用游戏时间戳
    image: getPropertyImageByType(config.houseType), // 根据房屋类型选择图片
    priceHistory: [],
    // 租金相关
    lastRentCollection: 0, // 上次收取租金的时间
    rentProgress: 0 // 租金累积进度 (0-1)
  };
}

// 根据房屋类型选择对应的图片
function getPropertyImageByType(houseType) {
  // 使用新的图片配置系统
  return getPropertyImageByHouseType(houseType);
}

// 生成交易大厅的房产列表（按指定类型分布）
function generateTradingProperties() {
  const tradingProperties = [];
  const usedPropertyIds = new Set(); // 防止重复选择
  
  // 获取用户已拥有的房产ID，排除在外
  const userOwnedPropertyIds = new Set();
  if (gameDataAdapter) {
    const userProperties = gameDataAdapter.getUserProperties();
    userProperties.forEach(property => {
      userOwnedPropertyIds.add(property.id);
    });
  }
  
  // 筛选函数：排除已使用的和用户已拥有的房产
  const isAvailable = (config) => {
    return !usedPropertyIds.has(config.blockId) && !userOwnedPropertyIds.has(config.blockId);
  };
  
  // 1. 传说 1栋
  const chuanshuoProperties = DISTRICT_PROPERTY_CONFIG.filter(config => 
    config.decorationType === '传说' && isAvailable(config)
  );
  if (chuanshuoProperties.length > 0) {
    const randomIndex = Math.floor(Math.random() * chuanshuoProperties.length);
    const selected = chuanshuoProperties[randomIndex];
    const propertyInstance = getPropertyById(selected.blockId);
    if (propertyInstance) {
      tradingProperties.push(propertyInstance);
      usedPropertyIds.add(selected.blockId);
    }
  }
  
  // 2. 大平层 2栋
  const dapingcengProperties = DISTRICT_PROPERTY_CONFIG.filter(config => 
    config.houseType === '大平层' && isAvailable(config)
  );
  let dapingcengCount = 0;
  while (dapingcengCount < 2 && dapingcengProperties.length > 0) {
    const randomIndex = Math.floor(Math.random() * dapingcengProperties.length);
    const selected = dapingcengProperties[randomIndex];
    const propertyInstance = getPropertyById(selected.blockId);
    if (propertyInstance) {
      tradingProperties.push(propertyInstance);
      usedPropertyIds.add(selected.blockId);
      dapingcengCount++;
    }
    dapingcengProperties.splice(randomIndex, 1); // 从候选列表中移除
  }
  
  // 3. 高楼 5栋
  const gaolouProperties = DISTRICT_PROPERTY_CONFIG.filter(config => 
    config.houseType === '高楼' && isAvailable(config)
  );
  let gaolouCount = 0;
  while (gaolouCount < 5 && gaolouProperties.length > 0) {
    const randomIndex = Math.floor(Math.random() * gaolouProperties.length);
    const selected = gaolouProperties[randomIndex];
    const propertyInstance = getPropertyById(selected.blockId);
    if (propertyInstance) {
      tradingProperties.push(propertyInstance);
      usedPropertyIds.add(selected.blockId);
      gaolouCount++;
    }
    gaolouProperties.splice(randomIndex, 1); // 从候选列表中移除
  }
  
  // 4. 平房
  const pingfangProperties = DISTRICT_PROPERTY_CONFIG.filter(config => 
    config.houseType === '平房' && isAvailable(config)
  );
  let pingfangCount = 0;
  const targetPingfangCount = 15 - tradingProperties.length;
  while (pingfangCount < targetPingfangCount && pingfangProperties.length > 0) {
    const randomIndex = Math.floor(Math.random() * pingfangProperties.length);
    const selected = pingfangProperties[randomIndex];
    const propertyInstance = getPropertyById(selected.blockId);
    if (propertyInstance) {
      tradingProperties.push(propertyInstance);
      usedPropertyIds.add(selected.blockId);
      pingfangCount++;
    }
    pingfangProperties.splice(randomIndex, 1); // 从候选列表中移除
  }
  
  console.log('🏠 生成交易房产列表:', {
    总数: tradingProperties.length,
    房产IDs: tradingProperties.map(p => p.id),
    用户已拥有: userOwnedPropertyIds.size,
    实例池总数: PROPERTY_INSTANCE_POOL.size
  });
  
  return tradingProperties;
}

// 当前交易房产列表 - 延迟初始化，等gameDataAdapter设置后再生成
let CURRENT_TRADING_PROPERTIES = [];

// 游戏数据适配器实例（数据唯一来源）
let gameDataAdapter = null;
// 游戏时间管理器实例
let gameTimeManager = null;

// 🔥 修复：创建统一的房产实例管理机制
// 所有房产的唯一实例池（基于配置表，确保每个房产ID只有一个实例）
const PROPERTY_INSTANCE_POOL = new Map();

// 初始化房产实例池
DISTRICT_PROPERTY_CONFIG.forEach(config => {
  const propertyInstance = convertConfigToPropertyData(config);
  PROPERTY_INSTANCE_POOL.set(config.blockId, propertyInstance);
});

// 获取所有可用房产的完整列表（返回实例池中的所有房产）
function getAllAvailableProperties() {
  return Array.from(PROPERTY_INSTANCE_POOL.values());
}

// 通过ID获取房产实例（确保始终返回同一个实例）
function getPropertyById(propertyId) {
  return PROPERTY_INSTANCE_POOL.get(propertyId);
}

// 区域名称双向映射函数
function mapDistrictTypeToNewsDistrict(districtType) {
  const chineseToEnglish = {
    '金融街': 'financial_district',
    '市中心': 'commercial_district', 
    '科创园区': 'tech_park',
    '老城区': 'residential_district',
    '工业开发新区': 'industrial_district'
  };
  
  const englishToChinese = {
    'financial_district': '金融街',
    'commercial_district': '市中心',
    'tech_park': '科创园区',
    'residential_district': '老城区',
    'industrial_district': '工业开发新区'
  };
  
  // 优先检查中文到英文的映射
  if (chineseToEnglish[districtType]) {
    return chineseToEnglish[districtType];
  }
  
  // 然后检查英文到中文的映射
  if (englishToChinese[districtType]) {
    return englishToChinese[districtType];
  }
  
  return null;
}

// 基于统一映射的区域图片选择函数
function getDistrictPinImage(districtType) {
  // 使用统一映射确保一致性
  const chineseName = mapDistrictTypeToNewsDistrict(districtType) || districtType;
  
  // 区域到图钉图片的映射
  const districtToPinMapping = {
    '金融街': 'map_pin_1.png',
    '市中心': 'map_pin_4.png',
    '科创园区': 'map_pin_3.png', 
    '老城区': 'map_pin_5.png',
    '工业开发新区': 'map_pin_2.png'
  };
  
  return districtToPinMapping[chineseName] || 'map_pin_1.png'; // 默认金融街图片
}

// 全局价格更新定时器
let priceUpdateTimer = null;
let nextPriceUpdateTime = 0;
function updateAllPropertyPrices() {
  // 只有在游戏时间管理器活跃时才更新价格
  if (!gameTimeManager || !gameTimeManager.isActive) {
    return;
  }
  
  const gameTimestamp = gameTimeManager.getGameTimestamp();
  
  // 通用的房产价格更新函数
  const updatePropertyPrice = (property) => {
    const oldPrice = property.currentPrice;
    let changePercent = 0;
    
    // 检查新闻对该房产所在区域的影响
    const newsDistrict = mapDistrictTypeToNewsDistrict(property.districtType);
    let newsEffect = null;
    
    if (newsDistrict) {
      newsEffect = newsManager.getDistrictEffect(newsDistrict);
    }
    
         // 根据新闻影响决定价格变化逻辑
     if (newsEffect && newsEffect.hasEffect) {
       // 有新闻影响时，使用新闻的效果值
       changePercent = newsEffect.totalEffect;
     } else {
       // 无新闻影响时，使用原有的随机涨跌逻辑
       changePercent = (Math.random() * 0.06 + 0.02) * (Math.random() > 0.5 ? 1 : -1);
     }
    
    const newPrice = Math.round(property.currentPrice * (1 + changePercent));
    
    // 最低不低于初始价格的20%
    const minPrice = Math.round(property.initialPrice * 0.2);
    property.currentPrice = Math.max(newPrice, minPrice);
    property.totalPrice = property.currentPrice;
    
    // 更新历史最高价和最低价
    if (property.currentPrice > property.highestPrice) {
      property.highestPrice = property.currentPrice;
    }
    if (property.currentPrice < property.lowestPrice) {
      property.lowestPrice = property.currentPrice;
    }
    
    // 记录历史价格
    const change = property.currentPrice - oldPrice;
    const changePercentage = (change / oldPrice) * 100;
    
    property.priceHistory.push({
      timestamp: gameTimestamp, // 使用游戏时间戳
      price: property.currentPrice,
      change: change,
      changePercentage: changePercentage
    });
    
    property.lastPriceUpdate = gameTimestamp; // 使用游戏时间戳
    
    // 清理超过30分钟游戏时间的历史记录（基于数据显示长度）
    const dataRetentionTime = gameTimeManager.getGameTimeAgo(TIME_AXIS_CONFIG.DATA_LENGTH);
    property.priceHistory = property.priceHistory.filter(record => 
      record.timestamp >= dataRetentionTime
    );
    
    // 额外保护：如果记录数量过多，只保留最新的记录
    if (property.priceHistory.length > PROPERTY_TIME_CONFIG.MAX_PRICE_HISTORY_COUNT) {
      property.priceHistory = property.priceHistory.slice(-PROPERTY_TIME_CONFIG.MAX_PRICE_HISTORY_COUNT);
    }
  };
  
  getAllAvailableProperties().forEach(updatePropertyPrice);
}

// 启动全局价格更新定时器
function startPriceUpdateTimer() {
  // 清除现有定时器
  if (priceUpdateTimer) {
    clearInterval(priceUpdateTimer);
  }
  
  // 设置初始更新时间
  const now = Date.now();
  nextPriceUpdateTime = now + PROPERTY_TIME_CONFIG.PRICE_UPDATE_INTERVAL;
  
  // 启动定时器，根据配置的频率检查是否需要更新
  priceUpdateTimer = setInterval(() => {
    const currentTime = Date.now();
    
    // 检查是否到了更新时间
    if (currentTime >= nextPriceUpdateTime) {
      
      // 只更新房产价格，不重新生成房产列表
      updateAllPropertyPrices();
      
      // 更新时间记录
      nextPriceUpdateTime = currentTime + PROPERTY_TIME_CONFIG.PRICE_UPDATE_INTERVAL;
    }
  }, PROPERTY_TIME_CONFIG.PRICE_CHECK_FREQUENCY); // 每5秒检查一次
}

// 获取距离下次价格更新的剩余时间 
function getTimeUntilNextPriceUpdate() {
  const now = Date.now();
  return Math.max(0, nextPriceUpdateTime - now);
}

// 购买房产
function purchaseProperty(propertyId, userMoney = 0) {
  // 🔥 修复：使用实例池中的统一实例
  const property = getPropertyById(propertyId);
  if (!property) {
    return { success: false, error: '房产不存在' };
  }
  
  // 检查房产是否在交易大厅中
  const isInTrading = CURRENT_TRADING_PROPERTIES.some(p => p.id === propertyId);
  if (!isInTrading) {
    return { success: false, error: '房产不在交易大厅中' };
  }
  
  // 检查用户资金是否足够
  if (userMoney < property.currentPrice) {
    return { 
      success: false, 
      error: '等挣了更多的钱再来买吧！',
      requiredAmount: property.currentPrice,
      currentMoney: userMoney
    };
  }
  
  // 设置购买信息
  property.purchasePrice = property.currentPrice;
  property.purchaseTime = gameTimeManager ? gameTimeManager.getGameTimestamp() : Date.now();
  
  // 初始化租金系统
  property.lastRentCollection = Date.now();
  property.rentProgress = 0;
  
  // 添加到用户房产列表
  if (gameDataAdapter) {
    gameDataAdapter.addUserProperty(property);
  }
  
  // 从交易列表中移除
  CURRENT_TRADING_PROPERTIES = CURRENT_TRADING_PROPERTIES.filter(p => p.id !== propertyId);
  
  return { success: true, property: property };
}

// 出售房产
function sellProperty(propertyId) {
  if (!gameDataAdapter) return null;
  
  // 获取房产但不立即移除，先检查交易锁定
  const userProperties = gameDataAdapter.getUserProperties();
  const property = userProperties.find(p => p.id === propertyId);
  
  if (property) {
    // 检查5分钟交易锁定期限
    const currentGameTime = gameTimeManager ? gameTimeManager.getGameTimestamp() : Date.now();
    const purchaseTime = property.purchaseTime || 0;
    const fiveMinutesMs = 5 * 60 * 1000; // 5分钟的毫秒数
    
    if (currentGameTime - purchaseTime < fiveMinutesMs) {
      // 还在交易锁定期内，不允许出售
      const remainingTime = fiveMinutesMs - (currentGameTime - purchaseTime);
      const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
      return {
        success: false,
        error: `交易锁定期内，还需等待 ${remainingMinutes} 分钟才能出售`,
        remainingTime: remainingTime
      };
    }
    
    // 锁定期已过，可以出售
    const removedProperty = gameDataAdapter.removeUserProperty(propertyId);
    if (removedProperty) {
      const sellPrice = removedProperty.currentPrice;
      
      // 重新添加到交易列表
      CURRENT_TRADING_PROPERTIES.push(removedProperty);
      
      return {
        success: true,
        property: removedProperty,
        sellPrice: sellPrice
      };
    }
  }
  
  return {
    success: false,
    error: '房产不存在'
  };
}

// 设置游戏数据适配器
function setGameDataAdapter(adapter) {
  gameDataAdapter = adapter;
  
  // 设置适配器后，立即重新生成交易房产列表，确保排除用户已拥有的房产
  CURRENT_TRADING_PROPERTIES = generateTradingProperties();
  
  console.log('游戏数据适配器已设置，交易房产列表已更新:', {
    userProperties: gameDataAdapter ? gameDataAdapter.getUserProperties().length : 0,
    tradingProperties: CURRENT_TRADING_PROPERTIES.length
  });
}

// 设置游戏时间管理器
function setGameTimeManager(timeManager) {
  gameTimeManager = timeManager;
  console.log('游戏时间管理器已设置');
}

// 获取用户已购买的房产
function getUserProperties() {
  return gameDataAdapter ? gameDataAdapter.getUserProperties() : [];
}

// 初始化房产数据
function initializeRealEstate() {
  // 生成交易大厅房产
  CURRENT_TRADING_PROPERTIES = generateTradingProperties();
  
  const now = Date.now();
  CURRENT_TRADING_PROPERTIES.forEach(property => {
    property.remainingTime = LIST_REFRESH_INTERVAL;
    property.lastUpdateTime = now;
  });
  
  // 初始化房产列表刷新时间
  lastListRefreshTime = now;
  
  console.log('🏠 房产数据初始化完成:', {
    实例池房产总数: PROPERTY_INSTANCE_POOL.size,
    交易大厅房产: CURRENT_TRADING_PROPERTIES.length,
    用户房产: gameDataAdapter ? gameDataAdapter.getUserProperties().length : 0,
    价格更新覆盖: '将按定时器正常更新'
  });
  
  // 启动全局价格更新定时器
  startPriceUpdateTimer();
  
  return CURRENT_TRADING_PROPERTIES;
}

// 格式化剩余时间显示
function formatRemainingTime(remainingTime) {
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  return `${minutes}分${seconds}秒`;
}

// 更新单个房产的租金累积
function updatePropertyRent(property) {
  if (!property.lastRentCollection) {
    // 如果从未收取过租金，设置为当前时间
    property.lastRentCollection = Date.now();
    return;
  }
  
  // 所有计算都在 getRentProgress 和 collectRent 中实时进行
}

// 更新所有已购买房产的租金
function updateAllRents() {
  const userProperties = getUserProperties();
  userProperties.forEach(updatePropertyRent);
}

// 收取房产租金 - 秒级实时计算，不超过资金池上限
function collectRent(propertyId) {
  if (!gameDataAdapter) return null;
  
  const property = gameDataAdapter.getUserProperties().find(p => p.id === propertyId);

  const now = Date.now();
  
  // 如果从未收取过租金，初始化时间
  if (!property.lastRentCollection) {
    property.lastRentCollection = now;
    return null;
  }
  
  const timeSinceLastCollection = now - property.lastRentCollection;
  
  // 实时计算可收取的租金（基于每秒租金收入）
  const secondsElapsed = timeSinceLastCollection / 1000; // 毫秒转换为秒
  let availableRent = Math.floor(secondsElapsed * property.monthlyRent / 30); // 一秒等于一天
  
  // 计算资金池上限：月租金 / 30天 * 60秒 * 60分钟 = 月租金的120倍（2小时累积）
  const poolLimit = Math.floor(property.monthlyRent / 30 * 60 * 60);
  
  // 确保不超过资金池上限
  availableRent = Math.min(availableRent, poolLimit);
  
  if (availableRent > 0) {
    // 更新最后收取时间
    property.lastRentCollection = now;
    property.rentProgress = 0; // 重置进度
    property.rentAccumulated = 0; // 重置累积租金
    
    return {
      property: property,
      rentAmount: availableRent
    };
  }
  
  return null;
}

// 获取房产的租金进度（0-1之间的值）- 实时计算，基于资金池上限
function getRentProgress(property) {
  if (!property.lastRentCollection) {
    return 0;
  }
  
  const now = Date.now();
  const timeSinceLastCollection = now - property.lastRentCollection;
  
  // 计算资金池上限：月租金 / 30天 * 60秒 * 60分钟 = 月租金的120倍（2小时累积）
  const poolLimit = Math.floor(property.monthlyRent / 30 * 60 * 60);
  
  // 计算到达资金池上限所需的时间（2小时）
  const timeToFullPool = 2 * 60 * 60 * 1000; // 2小时的毫秒数
  
  // 进度条按资金池上限为满进度计算
  const progress = Math.min(timeSinceLastCollection / timeToFullPool, 1);
  
  // 同时更新rentAccumulated，与进度条保持一致，但不超过资金池上限
  const secondsElapsed = timeSinceLastCollection / 1000;
  const calculatedRent = Math.floor(secondsElapsed * property.monthlyRent / 30);
  property.rentAccumulated = Math.min(calculatedRent, poolLimit);
  
  return progress;
}

// 获取当前可收取的租金金额（实时计算，不实际收取，不超过资金池上限）
function getCurrentRentAmount(property) {
  if (!property.lastRentCollection) {
    return 0;
  }
  
  const now = Date.now();
  const timeSinceLastCollection = now - property.lastRentCollection;
  const secondsElapsed = timeSinceLastCollection / 1000;
  
  let availableRent = Math.floor(secondsElapsed * property.monthlyRent / 30);
  
  // 计算资金池上限：月租金 / 30天 * 60秒 * 60分钟 = 月租金的120倍（2小时累积）
  const poolLimit = Math.floor(property.monthlyRent / 30 * 60 * 60);
  
  // 确保不超过资金池上限
  return Math.min(availableRent, poolLimit);
}

// 新增：专门用于刷新交易中心房产列表的函数（5分钟调用一次）
let lastListRefreshTime = 0;
const LIST_REFRESH_INTERVAL = 5 * 60 * 1000; // 5分钟

function refreshTradingPropertyList() {
  const now = Date.now();
  if (now - lastListRefreshTime >= LIST_REFRESH_INTERVAL) {
    
    // 重新生成交易中心展示的房产
    CURRENT_TRADING_PROPERTIES = generateTradingProperties();
    
    // 为选中的房产设置倒计时
    CURRENT_TRADING_PROPERTIES.forEach(property => {
      property.remainingTime = LIST_REFRESH_INTERVAL;
      property.lastUpdateTime = now;
    });
    
    lastListRefreshTime = now;
    return true;
  }
  return false;
}

// 导出配置
export {
  CURRENT_TRADING_PROPERTIES,
  setGameDataAdapter,
  setGameTimeManager,
  purchaseProperty,
  sellProperty,
  getUserProperties,
  initializeRealEstate,
  formatRemainingTime,
  getTimeUntilNextPriceUpdate,
  updateAllRents,
  collectRent,
  getRentProgress,
  getCurrentRentAmount,
  refreshTradingPropertyList,
  mapDistrictTypeToNewsDistrict,
  getDistrictPinImage,
  getAllAvailableProperties,
  getPropertyById
}; 