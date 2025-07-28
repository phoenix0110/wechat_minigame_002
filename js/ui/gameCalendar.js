import { drawRoundRect } from './utils.js';

/**
 * 游戏时间日历组件
 * 全局显示在每个界面的左上角，显示游戏时间
 */
export default class GameCalendar {
  constructor(gameTimeManager = null) {
    this.gameTimeManager = gameTimeManager;
    this.isVisible = true;
    
    // 日历样式配置 - 根据需求调整
    this.calendarWidth = 112;
    this.calendarHeight = 62;
    this.x = 20; // 左边与顶部导航栏左边对齐
    this.y = 48; // 调整位置使底部与金钱bar底边对齐 (金钱bar Y=80, 高度=30, 所以底边在110, 日历高度62, 所以Y=110-62=48)
    this.borderRadius = 6;
    
    // 颜色配置 - 淡橘黄色，与经营和交易页背景色系一致
    this.backgroundColor = '#F7B500'; // 橘黄色，与渐变背景的黄色端点一致
    this.textColor = '#F2F2F2'; // 浅色文字
    
    // 字体配置 - 根据 Figma 设计
    this.timeFont = '400 40px Inter'; // 大字体显示时间
    this.dateFont = '600 14px Inter'; // 较小字体显示日期
    
    // 日期变更检测
    this.lastDate = null; // 记录上一次的日期
    this.dayChangeCallback = null; // 日期变更回调函数
    
    // 监听时间变化
    this.lastUpdateTime = 0;
    if (this.gameTimeManager) {
      this.gameTimeManager.addListener(this.onTimeUpdate.bind(this));
    }
  }
  
  /**
   * 设置日期变更回调函数
   */
  setDayChangeCallback(callback) {
    this.dayChangeCallback = callback;
  }
  
  /**
   * 设置游戏时间管理器
   */
  setGameTimeManager(gameTimeManager) {
    this.gameTimeManager = gameTimeManager;
    if (this.gameTimeManager) {
      this.gameTimeManager.addListener(this.onTimeUpdate.bind(this));
    }
  }
  
  /**
   * 时间更新回调
   */
  onTimeUpdate(totalGameTime, isActive) {
    this.lastUpdateTime = Date.now();
    
    // 检测日期变更
    this.checkDayChange();
  }
  
  /**
   * 检测日期是否变更
   */
  checkDayChange() {
    const currentTimeInfo = this.getGameTimeInfo();
    const currentDateString = `${currentTimeInfo.year}-${currentTimeInfo.month}-${currentTimeInfo.day}`;
    
    if (this.lastDate === null) {
      // 首次运行，记录当前日期
      this.lastDate = currentDateString;
      return;
    }
    
    if (this.lastDate !== currentDateString) {
      // 日期发生变化，触发回调
      this.lastDate = currentDateString;
      
      if (this.dayChangeCallback) {
        this.dayChangeCallback(currentTimeInfo);
      }
    }
  }
  
  /**
   * 显示日历
   */
  show() {
    this.isVisible = true;
  }
  
  /**
   * 隐藏日历
   */
  hide() {
    this.isVisible = false;
  }
  
  /**
   * 获取游戏时间信息
   */
  getGameTimeInfo() {
    if (!this.gameTimeManager) {
      return {
        day: 1,
        month: 1,
        year: 2024,
        totalTime: 0
      };
    }
    
    // 获取游戏开始到现在的现实时间（毫秒）
    const currentRealTime = Date.now();
    const gameStartTime = this.gameTimeManager.gameStartTime || currentRealTime;
    const realTimeElapsed = currentRealTime - gameStartTime;
    
    // 每5分钟现实时间 = 1天游戏时间
    const realMinutesPerGameDay = 5;
    const msPerGameDay = realMinutesPerGameDay * 60 * 1000; // 5分钟 = 300,000毫秒
    
    // 计算已经过去的游戏天数
    const gameDaysPassed = Math.floor(realTimeElapsed / msPerGameDay);
    
    // 从2024年1月1日开始计算日期
    const startDate = new Date(2024, 0, 1); // 2024年1月1日
    const currentGameDate = new Date(startDate);
    currentGameDate.setDate(startDate.getDate() + gameDaysPassed);
    
    return {
      day: currentGameDate.getDate(),
      month: currentGameDate.getMonth() + 1, // getMonth()返回0-11，所以+1
      year: currentGameDate.getFullYear(),
      totalTime: realTimeElapsed
    };
  }
  
  /**
   * 格式化月日显示
   */
  formatMonthDay(month, day) {
    return `${month}月${day}号`;
  }
  
  /**
   * 渲染日历
   */
  render(ctx) {
    if (!this.isVisible) return;
    
    ctx.save();
    
    // 绘制阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    // 绘制日历背景 - 橘黄色
    ctx.fillStyle = this.backgroundColor;
    drawRoundRect(ctx, this.x, this.y, this.calendarWidth, this.calendarHeight, this.borderRadius);
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 获取游戏时间信息
    const timeInfo = this.getGameTimeInfo();
    
    // 绘制日期 - 使用与原来分钟秒相同的字体大小，居中显示
    ctx.fillStyle = this.textColor;
    ctx.font = this.dateFont; // 使用小字体，与原来的分钟秒字体大小一致
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const mainDateText = this.formatMonthDay(timeInfo.month, timeInfo.day);
    ctx.fillText(mainDateText, this.x + this.calendarWidth / 2, this.y + this.calendarHeight / 2);
    
    ctx.restore();
  }
  
  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;
    
    // 检查是否点击在日历区域内
    if (x >= this.x && x <= this.x + this.calendarWidth &&
        y >= this.y && y <= this.y + this.calendarHeight) {
      return { type: 'calendar_click' };
    }
    
    return null;
  }
} 