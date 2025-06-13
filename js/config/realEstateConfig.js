/**
 * 售楼处配置
 * 包含房产的单价和批量购买选项
 */

// 房产单价配置
export const PROPERTY_PRICES = {
  apartment: 50000000, // 大平层单价：5000万
  villa: 120000000     // 别墅单价：1.2亿
};

// 售楼大厅选项配置
export const REAL_ESTATE_OPTIONS = [
  // 第一行：单套房产
  { 
    id: 1, 
    type: 'apartment', 
    quantity: 1, 
    name: '豪华大平层', 
    icon: '🏢',
    description: '市中心黄金地段，270平米精装修',
    totalPrice: PROPERTY_PRICES.apartment * 1
  },
  { 
    id: 2, 
    type: 'villa', 
    quantity: 1, 
    name: '独栋别墅', 
    icon: '🏘️',
    description: '私人花园，500平米独栋设计',
    totalPrice: PROPERTY_PRICES.villa * 1
  },
  
  // 第二行：10套房产
  { 
    id: 3, 
    type: 'apartment', 
    quantity: 10, 
    name: '10套大平层', 
    icon: '🏢',
    description: '整层购买，投资首选',
    totalPrice: PROPERTY_PRICES.apartment * 10
  },
  { 
    id: 4, 
    type: 'villa', 
    quantity: 10, 
    name: '10套别墅', 
    icon: '🏘️',
    description: '别墅群落，尊贵社区',
    totalPrice: PROPERTY_PRICES.villa * 10
  },
  
  // 第三行：100套房产
  { 
    id: 5, 
    type: 'apartment', 
    quantity: 100, 
    name: '100套大平层', 
    icon: '🏢',
    description: '整座大厦，地产大亨',
    totalPrice: PROPERTY_PRICES.apartment * 100
  },
  { 
    id: 6, 
    type: 'villa', 
    quantity: 100, 
    name: '100套别墅', 
    icon: '🏘️',
    description: '别墅小镇，奢华生活',
    totalPrice: PROPERTY_PRICES.villa * 100
  }
];

/**
 * 根据ID获取房产选项
 */
export function getPropertyOptionById(id) {
  return REAL_ESTATE_OPTIONS.find(option => option.id === id);
}

/**
 * 格式化价格显示
 */
export function formatPropertyPrice(price) {
  if (price >= 100000000) {
    return (price / 100000000).toFixed(1) + '亿元';
  } else if (price >= 10000) {
    return (price / 10000).toFixed(0) + '万元';
  } else {
    return price + '元';
  }
}

/**
 * 获取房产类型的中文名称
 */
export function getPropertyTypeName(type) {
  const typeNames = {
    apartment: '大平层',
    villa: '别墅'
  };
  return typeNames[type] || type;
} 