/**
 * 奢侈品商店配置
 * 包含21个商品位置的奢侈品信息和价格
 */

import { EmployeeStatsGenerator } from './employeeStats.js';

/**
 * 产品等级配置
 */
export const PRODUCT_GRADES = {
  B: { name: 'B级', probability: 0.875, color: '#8B4513' }, // 87.5% 棕色
  A: { name: 'A级', probability: 0.10, color: '#4169E1' },  // 10% 蓝色
  S: { name: 'S级', probability: 0.02, color: '#FFD700' },  // 2% 金色
  SSS: { name: 'SSS级', probability: 0.005, color: '#FF1493' } // 0.5% 紫红色
};

/**
 * 商品刷新配置
 */
export const REFRESH_CONFIG = {
  TOTAL_SLOTS: 21,           // 总共21个商品位置
  EMPTY_SLOTS: 9,            // 9个空位置
  AVAILABLE_SLOTS: 12,       // 12个可用位置
  REFRESH_TIME: 60000,       // 刷新时间1分钟（毫秒）
  COOLDOWN_TIME: 60000       // 冷却时间1分钟（毫秒）
};

/**
 * 技能类型配置
 */
export const SKILL_TYPES = {
  STOCK_CLERK: 'stockClerk',  // 进货员：提高A级和S级概率
  DESIGNER: 'designer'        // 设计师：提高SSS级概率
};

export const LUXURY_ITEMS = [
  // 包包类 (6款)
  { id: 1, name: '经典款手提包', type: 'bag', baseGrade: 'SSS', icon: 'images/image_goods_1.png', basePrice: 80000000, cooldown: 0 },
  { id: 2, name: '链条斜挎包', type: 'bag', baseGrade: 'S', icon: 'images/image_goods_2.png', basePrice: 45000000, cooldown: 0 },
  { id: 3, name: '时尚手提包', type: 'bag', baseGrade: 'A', icon: 'images/image_goods_3.png', basePrice: 25000000, cooldown: 0 },
  { id: 4, name: '马鞍型手包', type: 'bag', baseGrade: 'A', icon: 'images/image_goods_4.png', basePrice: 35000000, cooldown: 0 },
  { id: 5, name: '竹节提手包', type: 'bag', baseGrade: 'A', icon: 'images/image_goods_5.png', basePrice: 28000000, cooldown: 0 },
  { id: 6, name: '简约手提包', type: 'bag', baseGrade: 'B', icon: 'images/image_goods_6.png', basePrice: 22000000, cooldown: 0 },

  // 丝巾类 (5款)
  { id: 7, name: '经典印花丝巾', type: 'scarf', baseGrade: 'B', icon: 'images/image_goods_7.png', basePrice: 3500000, cooldown: 0 },
  { id: 8, name: '山茶花丝巾', type: 'scarf', baseGrade: 'B', icon: 'images/image_goods_8.png', basePrice: 2800000, cooldown: 0 },
  { id: 9, name: '图案印花丝巾', type: 'scarf', baseGrade: 'A', icon: 'images/image_goods_9.png', basePrice: 4200000, cooldown: 0 },
  { id: 10, name: '斜纹印花丝巾', type: 'scarf', baseGrade: 'A', icon: 'images/image_goods_10.png', basePrice: 3800000, cooldown: 0 },
  { id: 11, name: '蛇纹印花丝巾', type: 'scarf', baseGrade: 'B', icon: 'images/image_goods_11.png', basePrice: 2200000, cooldown: 0 },

  // 鞋子类 (5款)
  { id: 12, name: '红底高跟鞋', type: 'shoes', baseGrade: 'S', icon: 'images/image_goods_12.png', basePrice: 8500000, cooldown: 0 },
  { id: 13, name: '水晶装饰鞋', type: 'shoes', baseGrade: 'S', icon: 'images/image_goods_13.png', basePrice: 12000000, cooldown: 0 },
  { id: 14, name: '优雅高跟鞋', type: 'shoes', baseGrade: 'A', icon: 'images/image_goods_14.png', basePrice: 7200000, cooldown: 0 },
  { id: 15, name: '双色拼接鞋', type: 'shoes', baseGrade: 'A', icon: 'images/image_goods_15.png', basePrice: 6800000, cooldown: 0 },
  { id: 16, name: '舒适平底鞋', type: 'shoes', baseGrade: 'B', icon: 'images/image_goods_16.png', basePrice: 4500000, cooldown: 0 }
];

/**
 * 进货员配置 - 提高A级和S级概率
 */
export const STOCK_CLERKS = [
  { 
    id: 1, 
    name: '初级进货员', 
    price: 50000000, 
    speedBonus: 20, 
    aProbabilityBonus: 2,  // A级概率增加2%
    sProbabilityBonus: 0,  // S级概率不变
    icon: '👨‍💼' 
  },
  { 
    id: 2, 
    name: '高级进货员', 
    price: 150000000, 
    speedBonus: 50, 
    aProbabilityBonus: 3,  // A级概率增加3%
    sProbabilityBonus: 1,  // S级概率增加1%
    icon: '👨‍💻' 
  },
  { 
    id: 3, 
    name: '专业进货员', 
    price: 500000000, 
    speedBonus: 100, 
    aProbabilityBonus: 5,  // A级概率增加5%
    sProbabilityBonus: 2,  // S级概率增加2%
    icon: '👨‍🔬' 
  }
];

/**
 * 设计师配置 - 提高SSS级概率
 */
export const DESIGNER = {
  id: 4,
  name: '首席设计师',
  price: 2000000000,
  attractionBonus: 1.5,
  sssProbabilityBonus: 1.5, // SSS级概率增加1.5%
  icon: '👨‍🎨'
};

/**
 * 商品位置状态
 */
export const SLOT_STATUS = {
  EMPTY: 'empty',      // 空位置
  AVAILABLE: 'available', // 有商品可购买
  COOLDOWN: 'cooldown'    // 冷却中
};

// 商品位置数组 - 21个位置
let productSlots = [];

/**
 * 初始化商品位置
 */
export function initializeProductSlots() {
  productSlots = new Array(REFRESH_CONFIG.TOTAL_SLOTS).fill(null).map((_, index) => ({
    id: `slot_${index}`,
    status: index < REFRESH_CONFIG.EMPTY_SLOTS ? SLOT_STATUS.EMPTY : SLOT_STATUS.AVAILABLE,
    product: null,
    grade: null,
    price: 0,
    cooldownEnd: 0,
    lastRefresh: Date.now()
  }));
  
  // 为非空位置生成初始商品
  refreshAvailableSlots();
}

/**
 * 获取当前所有商品位置
 */
export function getProductSlots() {
  if (productSlots.length === 0) {
    initializeProductSlots();
  }
  return productSlots;
}

/**
 * 计算实际商品刷新概率（考虑技能加成）
 */
export function calculateRefreshProbabilities(hiredClerks = [], hiredDesigners = []) {
  // 使用新的员工数值系统计算加成
  const clerkEffects = EmployeeStatsGenerator.calculateClerkTotalEffects(hiredClerks);
  const designerEffects = EmployeeStatsGenerator.calculateDesignerTotalEffects(hiredDesigners);
  
  // 转换为小数
  const aBonusDecimal = clerkEffects.aGradeBoost / 100;
  const sBonusDecimal = clerkEffects.sGradeBoost / 100;
  const sssBonusDecimal = designerEffects.sssGradeBoost / 100;
  
  // 计算最终概率
  const finalProbabilities = {
    A: Math.min(PRODUCT_GRADES.A.probability + aBonusDecimal, 0.5), // 最大50%
    S: Math.min(PRODUCT_GRADES.S.probability + sBonusDecimal, 0.3), // 最大30%
    SSS: Math.min(PRODUCT_GRADES.SSS.probability + sssBonusDecimal, 0.1) // 最大10%
  };
  
  // B级概率 = 1 - 其他等级概率
  finalProbabilities.B = Math.max(1 - finalProbabilities.A - finalProbabilities.S - finalProbabilities.SSS, 0.1);
  
  return finalProbabilities;
}

/**
 * 计算刷新速度加成（考虑进货员速度技能）
 */
export function calculateRefreshSpeedBonus(hiredClerks = []) {
  const clerkEffects = EmployeeStatsGenerator.calculateClerkTotalEffects(hiredClerks);
  return clerkEffects.speedReduction; // 返回速度缩短百分比
}

/**
 * 根据概率随机选择商品等级
 */
export function randomGrade(probabilities) {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [grade, probability] of Object.entries(probabilities)) {
    cumulative += probability;
    if (rand <= cumulative) {
      return grade;
    }
  }
  
  return 'B'; // 默认返回B级
}

/**
 * 根据等级随机选择商品
 */
export function getRandomProductByGrade(grade) {
  const products = LUXURY_ITEMS.filter(item => item.baseGrade === grade);
  if (products.length === 0) {
    return LUXURY_ITEMS[Math.floor(Math.random() * LUXURY_ITEMS.length)];
  }
  return products[Math.floor(Math.random() * products.length)];
}

/**
 * 计算商品最终价格（基于等级）
 */
export function calculateProductPrice(basePrice, grade) {
  const multipliers = {
    B: 1.0,
    A: 1.5,
    S: 3.0,
    SSS: 10.0
  };
  return Math.floor(basePrice * (multipliers[grade] || 1.0));
}

/**
 * 刷新可用商品位置
 */
export function refreshAvailableSlots(hiredClerks = [], hiredDesigners = []) {
  const slots = getProductSlots();
  const probabilities = calculateRefreshProbabilities(hiredClerks, hiredDesigners);
  
  slots.forEach(slot => {
    if (slot.status === SLOT_STATUS.AVAILABLE) {
      const grade = randomGrade(probabilities);
      const product = getRandomProductByGrade(grade);
      
      slot.product = product;
      slot.grade = grade;
      slot.price = calculateProductPrice(product.basePrice, grade);
      slot.lastRefresh = Date.now();
    }
  });
}

/**
 * 购买商品
 */
export function purchaseProduct(slotIndex) {
  const slots = getProductSlots();
  if (slotIndex >= 0 && slotIndex < slots.length) {
    const slot = slots[slotIndex];
    if (slot.status === SLOT_STATUS.AVAILABLE && slot.product) {
      // 设置冷却时间
      slot.status = SLOT_STATUS.COOLDOWN;
      slot.cooldownEnd = Date.now() + REFRESH_CONFIG.COOLDOWN_TIME;
      
      return {
        success: true,
        product: slot.product,
        grade: slot.grade,
        price: slot.price
      };
    }
  }
  return { success: false };
}

/**
 * 更新商品位置状态
 */
export function updateProductSlots(hiredClerks = [], hiredDesigners = []) {
  const slots = getProductSlots();
  const now = Date.now();
  let refreshNeeded = false;
  
  slots.forEach(slot => {
    if (slot.status === SLOT_STATUS.COOLDOWN && now >= slot.cooldownEnd) {
      slot.status = SLOT_STATUS.AVAILABLE;
      slot.cooldownEnd = 0;
      refreshNeeded = true;
    }
  });
  
  if (refreshNeeded) {
    refreshAvailableSlots(hiredClerks, hiredDesigners);
  }
}

/**
 * 获取位置剩余冷却时间
 */
export function getSlotCooldown(slotIndex) {
  const slots = getProductSlots();
  if (slotIndex >= 0 && slotIndex < slots.length) {
    const slot = slots[slotIndex];
    if (slot.status === SLOT_STATUS.COOLDOWN) {
      const remaining = slot.cooldownEnd - Date.now();
      return Math.max(0, Math.ceil(remaining / 1000));
    }
  }
  return 0;
}

/**
 * 根据类型获取商品
 */
export function getItemsByType(type) {
  return LUXURY_ITEMS.filter(item => item.type === type);
}

/**
 * 根据ID获取商品
 */
export function getItemById(id) {
  return LUXURY_ITEMS.find(item => item.id === id);
}

/**
 * 根据ID获取进货员
 */
export function getStockClerkById(id) {
  return STOCK_CLERKS.find(clerk => clerk.id === id);
}

/**
 * 获取设计师
 */
export function getDesigner() {
  return DESIGNER;
}

/**
 * 设置商品冷却时间
 */
export function setItemCooldown(itemId) {
  const item = getItemById(itemId);
  if (item) {
    item.cooldown = Date.now() + REFRESH_CONFIG.COOLDOWN_TIME;
  }
}

/**
 * 检查商品是否在冷却期
 */
export function isItemOnCooldown(itemId) {
  const item = getItemById(itemId);
  return item && item.cooldown > Date.now();
}

/**
 * 获取商品剩余冷却时间（秒）
 */
export function getRemainingCooldown(itemId) {
  const item = getItemById(itemId);
  if (!item || item.cooldown <= Date.now()) return 0;
  return Math.ceil((item.cooldown - Date.now()) / 1000);
}

/**
 * 应用进货员加速效果
 */
export function applySpeedBonus(itemId, speedBonus) {
  const item = getItemById(itemId);
  if (item && item.cooldown > Date.now()) {
    const remaining = item.cooldown - Date.now();
    const reduced = remaining * (1 - speedBonus / 100);
    item.cooldown = Date.now() + reduced;
  }
}

/**
 * 格式化价格显示
 */
export function formatPrice(price) {
  if (price >= 10000000) {
    return (price / 10000000).toFixed(1) + '万元';
  } else if (price >= 10000) {
    return (price / 10000).toFixed(1) + '万元';
  } else {
    return price + '元';
  }
}

/**
 * 格式化时间显示
 */
export function formatTime(seconds) {
  if (seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
}

/**
 * 计算店铺等级
 */
export function getStoreLevel(totalEmployees, hasDesigner) {
  let level = 1;
  if (totalEmployees >= 1) level = 2;
  if (totalEmployees >= 2) level = 3;
  if (totalEmployees >= 3) level = 4;
  if (hasDesigner) level = 5;
  return level;
}

/**
 * 获取商品等级统计
 */
export function getGradeStats() {
  const stats = { B: 0, A: 0, S: 0, SSS: 0 };
  const slots = getProductSlots();
  
  slots.forEach(slot => {
    if (slot.status === SLOT_STATUS.AVAILABLE && slot.grade) {
      stats[slot.grade]++;
    }
  });
  
  return stats;
}

