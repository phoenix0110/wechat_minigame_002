/**
 * 游戏时间管理器
 * 负责管理游戏内的时间系统，只有在前台活跃状态时才累积时间
 */
export default class GameTimeManager {
  constructor() {
    // 游戏时间相关
    this.gameStartTime = Date.now(); // 游戏开始的现实时间
    this.totalGameTime = 0; // 总游戏时间（毫秒）
    this.lastActiveTime = Date.now(); // 上次活跃时间
    this.isActive = true; // 游戏是否处于活跃状态（前台）
    
    // 时间更新定时器
    this.updateTimer = null;
    this.updateInterval = 1000; // 每秒更新一次
    
    // 游戏时间监听器
    this.listeners = [];
    
    // 启动时间更新
    this.startTimeUpdate();
  }
  
  /**
   * 启动时间更新
   */
  startTimeUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      if (this.isActive) {
        const now = Date.now();
        const deltaTime = now - this.lastActiveTime;
        this.totalGameTime += deltaTime;
        this.lastActiveTime = now;
        
        // 通知监听器
        this.notifyListeners();
      }
    }, this.updateInterval);
  }
  
  /**
   * 停止时间更新
   */
  stopTimeUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }
  
  /**
   * 设置游戏活跃状态
   * @param {boolean} isActive 是否活跃
   */
  setActive(isActive) {
    const now = Date.now();
    
    if (this.isActive && !isActive) {
      // 从活跃变为非活跃，累积时间
      const deltaTime = now - this.lastActiveTime;
      this.totalGameTime += deltaTime;
    } else if (!this.isActive && isActive) {
      // 从非活跃变为活跃，重置活跃时间
      this.lastActiveTime = now;
    }
    
    this.isActive = isActive;

    // 通知监听器
    this.notifyListeners();
  }
  
  /**
   * 获取总游戏时间（毫秒）
   */
  getTotalGameTime() {
    if (this.isActive) {
      const now = Date.now();
      const deltaTime = now - this.lastActiveTime;
      return this.totalGameTime + deltaTime;
    }
    return this.totalGameTime;
  }
  
  /**
   * 获取游戏时间戳（相对于游戏开始的时间）
   */
  getGameTimestamp() {
    return this.getTotalGameTime();
  }
  /**
   * 将游戏时间转换为现实时间（用于显示）
   * @param {number} gameTime 游戏时间（毫秒）
   */
  gameTimeToRealTime(gameTime) {
    return this.gameStartTime + gameTime;
  }
  
  /**
   * 格式化游戏时间显示
   */
  formatGameTime() {
    const totalMs = this.getTotalGameTime();
    const seconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
  
  /**
   * 检查是否超过指定的游戏时间
   * @param {number} timeMs 时间（毫秒）
   */
  hasGameTimePassed(timeMs) {
    return this.getTotalGameTime() >= timeMs;
  }
  
  /**
   * 获取最近指定游戏时间的时间戳
   * @param {number} timeMs 时间（毫秒）
   */
  getGameTimeAgo(timeMs) {
    const currentGameTime = this.getTotalGameTime();
    return Math.max(0, currentGameTime - timeMs);
  }
  
  /**
   * 添加时间监听器
   * @param {Function} callback 回调函数
   */
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  /**
   * 移除时间监听器
   * @param {Function} callback 回调函数
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * 通知所有监听器
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getTotalGameTime(), this.isActive);
      } catch (error) {
        console.error('游戏时间监听器执行错误:', error);
      }
    });
  }
  
  /**
   * 保存游戏时间状态
   */
  saveTimeState() {
    return {
      gameStartTime: this.gameStartTime,
      totalGameTime: this.getTotalGameTime(),
      lastActiveTime: this.lastActiveTime
    };
  }
  
  /**
   * 恢复游戏时间状态
   * @param {Object} state 保存的状态
   */
  restoreTimeState(state) {
    if (state) {
      this.gameStartTime = state.gameStartTime || Date.now();
      this.totalGameTime = state.totalGameTime || 0;
      this.lastActiveTime = state.lastActiveTime || Date.now();
    }
  }
  
} 