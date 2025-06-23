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

// 房产相关时间配置
export const PROPERTY_TIME_CONFIG = {
  // 房产价格更新间隔
  PRICE_UPDATE_INTERVAL: 1 * TIME_UNITS.MINUTE,
  
  // 价格更新检查频率（每分钟检查一次）
  PRICE_CHECK_FREQUENCY: 1 * TIME_UNITS.MINUTE,
  
  // 租金更新间隔（每分钟）
  RENT_UPDATE_INTERVAL: 1 * TIME_UNITS.MINUTE,
  
  // 房产价格历史记录保留时间（1小时）
  PRICE_HISTORY_RETENTION: 24 * TIME_UNITS.HOUR
};

// 资产追踪相关时间配置
export const ASSET_TRACKING_CONFIG = {
  // 资产价值记录间隔（1分钟）
  RECORD_INTERVAL: 1 * TIME_UNITS.MINUTE,
  
  // 资产历史记录保留时间（24小时）
  HISTORY_RETENTION: 24 * TIME_UNITS.HOUR,
  
  // 定期清理检查间隔（1分钟）
  CLEANUP_CHECK_INTERVAL: 1 * TIME_UNITS.MINUTE
};

// 图表显示相关时间配置
export const CHART_TIME_CONFIG = {
  // 时间范围选项
  TIME_RANGES: {
    ONE_HOUR: 1 * TIME_UNITS.HOUR,
    TWELVE_HOURS: 12 * TIME_UNITS.HOUR,
    TWENTY_FOUR_HOURS: 24 * TIME_UNITS.HOUR
  },
  
  // 图表时间轴间隔配置
  AXIS_INTERVALS: {
    // 1小时视图：10分钟间隔
    ONE_HOUR_INTERVAL: 10 * TIME_UNITS.MINUTE,
    // 12小时和24小时视图：1小时间隔
    LONG_TERM_INTERVAL: 1 * TIME_UNITS.HOUR
  },
  
  // 图表数据采样配置
  MAX_CHART_POINTS: 30, // 图表最大显示点数
  CHART_DATA_WINDOW: 10 * TIME_UNITS.MINUTE // 图表数据窗口（最近10分钟）
};

// 奢侈品相关时间配置
export const LUXURY_TIME_CONFIG = {
  // 商品刷新时间（1分钟）
  REFRESH_TIME: 1 * TIME_UNITS.MINUTE,
  
  // 商品冷却时间（1分钟）
  COOLDOWN_TIME: 1 * TIME_UNITS.MINUTE,
  
  // 基础冷却时间（60秒）
  BASE_COOLDOWN: 60 * TIME_UNITS.SECOND
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
  
  // 卡片移除动画持续时间（1秒）
  CARD_REMOVE_DURATION: 1 * TIME_UNITS.SECOND,
  
  // 卡片滑动动画持续时间（1秒）
  CARD_SLIDE_DURATION: 1 * TIME_UNITS.SECOND,
  
  // 对话打字速度（50毫秒每字符）
  DIALOGUE_TYPING_SPEED: 50
};

// 导出所有配置的统一对象
export const TIME_CONFIG = {
  UNITS: TIME_UNITS,
  PROPERTY: PROPERTY_TIME_CONFIG,
  ASSET_TRACKING: ASSET_TRACKING_CONFIG,
  CHART: CHART_TIME_CONFIG,
  LUXURY: LUXURY_TIME_CONFIG,
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