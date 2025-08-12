/**
 * 游戏时间配置文件
 * 统一管理所有和资产、房产价格刷新相关的时间配置
 */

// 基础时间单位（毫秒）
const TIME_UNITS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
};

/**
 * 房产相关时间配置
 */
export const PROPERTY_TIME_CONFIG = {
  // 房产价格更新间隔
  PRICE_UPDATE_INTERVAL: 10 * TIME_UNITS.SECOND,
  
  // 价格更新检查频率（每5秒检查一次）
  PRICE_CHECK_FREQUENCY: 5 * TIME_UNITS.SECOND,
  
  // 租金更新间隔（每分钟）
  RENT_UPDATE_INTERVAL: 1 * TIME_UNITS.MINUTE,
  
  // 房产价格历史记录保留时间
  PRICE_HISTORY_RETENTION: 10 * TIME_UNITS.MINUTE,
  
  // 最大价格历史记录数量（10分钟，每10秒一个点 = 60个点）
  MAX_PRICE_HISTORY_COUNT: 60
};

// 资产追踪相关时间配置
export const ASSET_TRACKING_CONFIG = {
  // 资产价值记录间隔
  RECORD_INTERVAL: 10 * TIME_UNITS.SECOND,
  
  // 资产历史记录保留时间（24小时）
  HISTORY_RETENTION: 24 * TIME_UNITS.HOUR,
  
  // 最大资产历史记录数量（10分钟，每10秒一个点 = 60个点）
  MAX_ASSET_HISTORY_COUNT: 60
};

// 图表显示相关时间配置
export const CHART_TIME_CONFIG = {
  // 时间范围选项
  TIME_RANGES: {
    ONE_HOUR: 1 * TIME_UNITS.HOUR,
    TWELVE_HOURS: 12 * TIME_UNITS.HOUR,
    TWENTY_FOUR_HOURS: 24 * TIME_UNITS.HOUR
  },
  
  // 默认显示范围
  DEFAULT_RANGE: 'ONE_HOUR',
  
  // 图表数据采样配置
  MAX_CHART_POINTS: 30, // 图表最大显示点数
  CHART_DATA_WINDOW: 30 * TIME_UNITS.MINUTE, // 图表数据窗口（最近30分钟）
  
  // 游戏时间相关配置
  GAME_TIME_DISPLAY: {
    // 当游戏时间不足1小时时，显示全部历史
    SHOW_ALL_WHEN_UNDER_HOUR: true,
    
    // 当游戏时间超过1小时时，只显示最近1小时
    SHOW_LAST_HOUR_WHEN_OVER: true
  }
};

/**
 * 时间轴配置 - 用于房价趋势图（修改为10分钟显示）
 */
export const TIME_AXIS_CONFIG = {
  // 时间轴固定长度（10分钟）
  AXIS_LENGTH: 10 * TIME_UNITS.MINUTE,
  
  // 时间轴刻度间隔（2分钟）
  TICK_INTERVAL: 2 * TIME_UNITS.MINUTE,
  
  // 时间轴刻度数量（6个刻度：0, 2, 4, 6, 8, 10分钟）
  TICK_COUNT: 6,
  
  // 数据显示长度（10分钟）
  DATA_LENGTH: 10 * TIME_UNITS.MINUTE,
  
  // 时间轴显示格式
  DISPLAY_FORMAT: {
    UNDER_HOUR: 'minutes', // 不足1小时时显示分钟
    OVER_HOUR: 'time' // 超过1小时时显示时分
  }
};

// 游戏加载相关时间配置
export const LOADING_TIME_CONFIG = {
  // 加载进度更新间隔（100毫秒）
  PROGRESS_UPDATE_INTERVAL: 100,
  
  // 加载完成后延迟启动时间（500毫秒）
  STARTUP_DELAY: 100
};

// 动画相关时间配置
export const ANIMATION_TIME_CONFIG = {
  // 购买通知动画持续时间（2秒）
  PURCHASE_NOTIFICATION_DURATION: 2 * TIME_UNITS.SECOND,

};

// 导出所有配置的统一对象
export const TIME_CONFIG = {
  UNITS: TIME_UNITS,
  PROPERTY: PROPERTY_TIME_CONFIG,
  ASSET_TRACKING: ASSET_TRACKING_CONFIG,
  CHART: CHART_TIME_CONFIG,
  LOADING: LOADING_TIME_CONFIG,
  ANIMATION: ANIMATION_TIME_CONFIG
};

// 辅助函数：格式化时间显示
export function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / TIME_UNITS.SECOND);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

// 辅助函数：格式化倒计时显示
export function formatCountdown(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / TIME_UNITS.SECOND);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${seconds}秒`;
  }
}

export default TIME_CONFIG; 