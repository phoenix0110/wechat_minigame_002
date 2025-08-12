/**
 * 经营页面 - 包含新闻和成就两个标签页
 * 参考 Figma 设计稿实现
 */

import { 
  drawRoundRect, 
  renderTopMoneyBar, 
  renderBottomNavigation,
  handleBottomNavigationTouch,
  drawGradientBackground
} from './utils.js';
import { newsManager } from '../config/newsConfig.js';
import CircularTimer from './circularTimer.js';

import { mapDistrictTypeToNewsDistrict } from '../config/realEstateConfig.js';

export default class BusinessPage {
  constructor(getMoneyCallback = null, achievementManager = null) {
    this.isVisible = false;
    this.getMoneyCallback = getMoneyCallback;
    this.achievementManager = achievementManager;
    
    // 标签页状态
    this.activeTab = 'news'; // 'news' 或 'achievements'
    this.tabs = [
      { id: 'news', label: '新闻' },
      { id: 'achievements', label: '成就' }
    ];
    
    // 新闻相关
    this.newsList = [];
    this.newsScrollY = 0;
    this.maxNewsScrollY = 0;
    
    // 自动新闻刷新相关
    this.newsRefreshTimer = null;
    this.newsRefreshInterval = 1 * 60 * 1000; // 1分钟
    this.lastNewsRefreshTime = 0;
    this.nextNewsRefreshTime = 0;
    
    // 成就相关
    this.achievements = this.initializeAchievements();
    this.achievementScrollY = 0;
    this.maxAchievementScrollY = 0;
    this.onClaimReward = null; // 奖励领取回调
    
    // 点击区域
    this.clickAreas = [];
    
    // 触摸控制
    this.lastTouchY = 0;
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartScrollY = 0;
    
    // 演示数据初始化标志
    this.demoDataInitialized = false;
    
    // 初始化圆形倒计时器
    this.circularTimer = new CircularTimer();
    
    // 更新新闻列表
    this.updateNewsList();
  }

  /**
   * 初始化成就数据
   */
  initializeAchievements() {
    if (this.achievementManager) {
      return this.achievementManager.getAllAchievements();
    }
    return [];
  }

  /**
   * 更新新闻列表
   */
  updateNewsList() {
    this.newsList = newsManager.getActiveNews();
    this.calculateNewsScroll();
  }

  /**
   * 更新成就数据
   */
  updateAchievements() {
    if (this.achievementManager) {
      this.achievements = this.achievementManager.getAllAchievements();
      this.calculateAchievementScroll();
    }
  }

  /**
   * 设置奖励领取回调
   */
  setClaimRewardCallback(callback) {
    this.onClaimReward = callback;
  }

  /**
   * 计算下一次新闻刷新时间（30秒后）
   */
  getNextRefreshTime() {
    const now = Date.now();
    return now + 30 * 1000; // 30秒后
  }

  /**
   * 启动自动新闻刷新 - 基于系统时间固定间隔
   */
  startAutoNewsRefresh() {
    // 清除现有定时器
    if (this.newsRefreshTimer) {
      clearInterval(this.newsRefreshTimer);
    }
    
    // 计算下一次刷新时间
    this.nextNewsRefreshTime = this.getNextRefreshTime();
    
    // 检查是否需要立即刷新（如果从未刷新过或已过期）
    const now = Date.now();
    if (this.lastNewsRefreshTime === 0 || now >= this.nextNewsRefreshTime) {
      this.addSingleNews();
      this.lastNewsRefreshTime = now;
      this.nextNewsRefreshTime = this.getNextRefreshTime();
    }  
    
    // 启动定时器，每分钟检查一次是否需要刷新
    this.newsRefreshTimer = setInterval(() => {
      const currentTime = Date.now();
      if (currentTime >= this.nextNewsRefreshTime) {
        this.addSingleNews();
        this.lastNewsRefreshTime = currentTime;
        this.nextNewsRefreshTime = this.getNextRefreshTime();
      }
    }, 60 * 1000); // 每分钟检查一次

  }

  /**
   * 停止自动新闻刷新
   */
  stopAutoNewsRefresh() {
    if (this.newsRefreshTimer) {
      clearInterval(this.newsRefreshTimer);
      this.newsRefreshTimer = null;
    }
  }

  /**
   * 添加单条新闻
   */
  addSingleNews() {
    const news = newsManager.addSingleNews();
    // 更新新闻列表
    this.updateNewsList();
  }

  /**
   * 随机刷新5条新闻（保留用于初始化）
   */
  refreshRandomNews() {    
    // 动态获取所有可用的新闻ID
    const allNewsIds = newsManager.getAllAvailableNewsIds();
    
    // 清空之前的新闻
    newsManager.clearAllNews();
    
    // 随机选择5条新闻（或所有可用新闻，如果总数少于5条）
    const shuffledIds = [...allNewsIds];
    for (let i = shuffledIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIds[i], shuffledIds[j]] = [shuffledIds[j], shuffledIds[i]];
    }
    
    const newsCount = Math.min(5, allNewsIds.length);
    const selectedNewsIds = shuffledIds.slice(0, newsCount);
    
    // 发布选中的新闻
    selectedNewsIds.forEach((newsId, index) => {
      const news = newsManager.publishNews(newsId);
    });
    
    // 更新新闻列表
    this.updateNewsList();
  }

  /**
   * 计算新闻列表滚动范围
   */
  calculateNewsScroll() {
    const contentHeight = this.newsList.length * 127 + 40; // 每个新闻项107px高度+20px间距，加上padding
    const viewportHeight = canvas.height - 180 - 55; // 减去顶部和底部导航栏，130+32+18间距
    this.maxNewsScrollY = Math.max(0, contentHeight - viewportHeight);
  }

  /**
   * 计算成就列表滚动范围
   */
  calculateAchievementScroll() {
    const contentHeight = this.achievements.length * 120 + 40; // 每个成就项约120px高度（111+间距），加上padding
    const viewportHeight = canvas.height - 180 - 55; // 减去顶部和底部导航栏，130+32+18间距
    this.maxAchievementScrollY = Math.max(0, contentHeight - viewportHeight);
  }

  /**
   * 检查是否需要刷新新闻
   */
  checkNewsNeedsRefresh() {
    const now = Date.now();
    return this.lastNewsRefreshTime === 0 || now >= this.nextNewsRefreshTime;
  }

  /**
   * 获取到下次刷新的剩余时间（分钟数）
   */
  getTimeToNextRefresh() {
    if (this.nextNewsRefreshTime === 0) return 0;
    
    const now = Date.now();
    const remainingTime = Math.max(0, this.nextNewsRefreshTime - now);
    return Math.ceil(remainingTime / (60 * 1000)); // 转换为分钟，向上取整
  }

  /**
   * 显示页面
   */
  show() {
    this.isVisible = true;
    
    // 启动新闻刷新系统（如果尚未启动）
    if (!this.newsRefreshTimer) {
      this.startAutoNewsRefresh();
    } else {
          // 检查是否需要刷新新闻
    if (this.checkNewsNeedsRefresh()) {
      this.addSingleNews();
      this.lastNewsRefreshTime = Date.now();
      this.nextNewsRefreshTime = this.getNextRefreshTime();
    }
    }
    
    this.updateNewsList();
    this.updateAchievements();
  }

  /**
   * 隐藏页面
   */
  hide() {
    this.isVisible = false;
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y, touchType = 'tap') {
    if (!this.isVisible) return false;

    // 处理底部导航栏
    const bottomNavResult = handleBottomNavigationTouch(x, y, touchType);
    if (bottomNavResult) {
      return bottomNavResult;
    }

    // 处理标签页切换
    if (this.handleTabTouch(x, y, touchType)) {
      return true;
    }

    // 处理滚动
    if (this.handleScrollTouch(x, y, touchType)) {
      return true;
    }

    // 处理内容区域点击（用于手动刷新新闻）
    if (this.handleContentTouch(x, y, touchType)) {
      return true;
    }

    return false;
  }

  /**
   * 处理标签页触摸
   */
  handleTabTouch(x, y, touchType) {
    const tabBarY = 130; // 80 + 50，与售楼处页面保持一致
    const tabBarHeight = 32;
    
    if (y >= tabBarY && y <= tabBarY + tabBarHeight) {
      const tabWidth = canvas.width / this.tabs.length;
      const tabIndex = Math.floor(x / tabWidth);
      
      if (tabIndex >= 0 && tabIndex < this.tabs.length) {
        const newTab = this.tabs[tabIndex].id;
        if (newTab !== this.activeTab) {
          this.activeTab = newTab;
          // 重置滚动位置
          this.newsScrollY = 0;
          this.achievementScrollY = 0;
          
          if (this.activeTab === 'achievements') {
            this.calculateAchievementScroll();
          } else {
            this.calculateNewsScroll();
          }
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * 处理滚动触摸
   */
  handleScrollTouch(x, y, touchType) {
    const contentAreaY = 180; // 130 + 32 + 18，标签栏下方留18px间距，与售楼处页面保持一致
    const contentAreaHeight = canvas.height - contentAreaY - 55;
    
    if (y >= contentAreaY && y <= contentAreaY + contentAreaHeight) {
      if (touchType === 'start') {
        this.isDragging = true;
        this.dragStartY = y;
        this.dragStartScrollY = this.activeTab === 'news' ? this.newsScrollY : this.achievementScrollY;
        return true;
      } else if (touchType === 'move' && this.isDragging) {
        const deltaY = this.dragStartY - y;
        const newScrollY = this.dragStartScrollY + deltaY;
        
        if (this.activeTab === 'news') {
          this.newsScrollY = Math.max(0, Math.min(this.maxNewsScrollY, newScrollY));
        } else {
          this.achievementScrollY = Math.max(0, Math.min(this.maxAchievementScrollY, newScrollY));
        }
        return true;
      } else if (touchType === 'end') {
        this.isDragging = false;
        return true;
      }
    }
    
    return false;
  }

  /**
   * 处理内容区域触摸
   */
  handleContentTouch(x, y, touchType) {
    const contentAreaY = 180; // 130 + 32 + 18，标签栏下方留18px间距，与售楼处页面保持一致
    const contentAreaHeight = canvas.height - contentAreaY - 55;
    
    // 如果是成就标签页，检查成就按钮点击
    if (this.activeTab === 'achievements' && touchType === 'tap') {
      for (const area of this.clickAreas) {
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
          if (area.type === 'claim_reward') {
            this.handleClaimReward(area.achievementId);
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * 处理领取奖励
   */
  handleClaimReward(achievementId) {
    if (!this.achievementManager) return;
    
    const result = this.achievementManager.claimAchievement(achievementId);
    if (result.success) {
      // 发放奖励 - 通过回调函数通知主游戏
      if (this.onClaimReward) {
        this.onClaimReward(result.reward);
      }
      
      // 更新成就数据
      this.updateAchievements();
    } else {
      console.log(`❌ 领取失败: ${result.message}`);
    }
  }

  /**
   * 渲染页面
   */
  render(ctx) {
    if (!this.isVisible) return;

    // 绘制Figma设计的渐变背景 - 与售楼处页面保持一致
    drawGradientBackground(ctx, canvas.width, canvas.height);

    // 渲染顶部资金栏
    renderTopMoneyBar(ctx, this.getMoneyCallback);

    // 渲染标签页
    this.renderTabs(ctx);

    // 渲染内容
    if (this.activeTab === 'news') {
      this.renderNewsContent(ctx);
    } else {
      this.renderAchievementsContent(ctx);
    }

    // 渲染底部导航栏
    renderBottomNavigation(ctx, 'business');
  }

  /**
   * 渲染标签页
   */
  renderTabs(ctx) {
    const tabBarY = 130; // 80 + 50，与售楼处页面保持一致
    const tabBarHeight = 32;
    
    // 使用固定宽度384px，居中对齐，与售楼处页面和Figma设计稿保持一致
    const segmentedControlWidth = 384;
    const segmentedControlX = (canvas.width - segmentedControlWidth) / 2;
    const borderRadius = 9; // 与Figma设计稿保持一致
    
    // 绘制整体背景 (浅灰色半透明)
    ctx.fillStyle = 'rgba(120, 120, 128, 0.12)';
    drawRoundRect(ctx, segmentedControlX, tabBarY, segmentedControlWidth, tabBarHeight, borderRadius);
    ctx.fill();
    
    // 绘制两个选项卡
    const tabWidth = (segmentedControlWidth - 4) / 2; // 减去间隙
    
    this.tabs.forEach((tab, index) => {
      const isActive = tab.id === this.activeTab;
      
      const tabX = segmentedControlX + 2 + index * tabWidth;
      const tabY = tabBarY + 2;
      const tabHeight = tabBarHeight - 4;
      
      if (isActive) {
        // 激活状态：白色背景，阴影效果 - 与售楼处页面保持一致
        ctx.fillStyle = '#FFFFFF';
        drawRoundRect(ctx, tabX, tabY, tabWidth, tabHeight, 7);
        ctx.fill();
        
        // 阴影效果 (模拟iOS分段控制器) - 与售楼处页面保持一致
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 0.29;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1.5;
        
        drawRoundRect(ctx, tabX, tabY, tabWidth, tabHeight, 7);
        ctx.fill();
        
        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // 文字 - 与售楼处页面保持一致
      ctx.fillStyle = isActive ? '#000000' : 'rgba(60, 60, 67, 0.6)';
      ctx.font = '500 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, tabX + tabWidth / 2, tabBarY + 20);
    });
  }

  /**
   * 渲染新闻内容
   */
  renderNewsContent(ctx) {
    const contentY = 180; // 130 + 32 + 18，标签栏下方留18px间距，与售楼处页面保持一致
    const contentHeight = canvas.height - contentY - 55;
    
    // 设置裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, contentY, canvas.width, contentHeight);
    ctx.clip();
    
    // 更新新闻列表
    this.updateNewsList();
    
    if (this.newsList.length === 0) {
      // 显示暂无新闻
      ctx.fillStyle = '#999999';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无新闻', canvas.width / 2, contentY + contentHeight / 2);
      
      // 显示自动刷新提示
      ctx.fillStyle = '#666666';
      ctx.font = '12px Inter';
      const remainingMinutes = this.getTimeToNextRefresh();
      if (remainingMinutes > 0) {
        ctx.fillText(`新闻每1分钟刷新，${remainingMinutes}分钟后更新`, canvas.width / 2, contentY + contentHeight / 2 + 30);
      } else {
        ctx.fillText('新闻即将刷新...', canvas.width / 2, contentY + contentHeight / 2 + 30);
      }
    } else {
      // 渲染新闻列表
      this.newsList.forEach((news, index) => {
        const newsY = contentY + index * 127 - this.newsScrollY + 20; // 107px高度+20px间距
        // 只渲染在可见区域内的新闻项
        if (newsY > -127 && newsY < contentY + contentHeight + 127) {
          this.renderNewsItem(ctx, news, newsY);
        }
      });
    }
    
    ctx.restore();
  }

  /**
   * 渲染单个新闻项
   */
  renderNewsItem(ctx, news, y) {
    const itemHeight = 107; // 按照Figma设计调整高度
    const margin = 10;
    const itemWidth = canvas.width - 2 * margin;
    const now = Date.now();
    const isActive = now >= news.effectStartTime && now <= news.effectEndTime;
    const isCooling = now < news.effectStartTime;
    
    // 绘制新闻背景 - 按照Figma设计
    ctx.fillStyle = '#F5F5F5';
    drawRoundRect(ctx, margin, y, itemWidth, itemHeight, 12);
    ctx.fill();
    
    // 绘制新闻优先级指示器（左边的蓝色竖条）
    ctx.fillStyle = '#00C2FF';
    ctx.fillRect(margin + 10, y + 10, 4, itemHeight - 20);
    
    // 绘制新闻标题 - 按照Figma设计 (16px, 粗体)
    ctx.fillStyle = '#3E3232';
    ctx.font = '700 16px Roboto, Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(news.title, margin + 25, y + 21);
    
    // 只有新闻生效时才显示详细内容
    if (isActive) {
      // 绘制新闻内容 - 按照Figma设计 (14px, 普通)
      ctx.fillStyle = '#3E3232';
      ctx.font = '400 14px Roboto, Inter';
      ctx.textAlign = 'left';
      const contentLines = this.wrapText(ctx, news.content, itemWidth - 100); // 为右侧倒计时器留空间
      contentLines.slice(0, 1).forEach((line, index) => {
        ctx.fillText(line, margin + 25, y + 45 + index * 22);
      });
      
      // 绘制圆形倒计时器 - 移至右侧
      const remainingTime = (news.effectEndTime - now) / 1000;
      const totalTime = news.actualDuration / 1000;
      const timerX = margin + itemWidth - 40;
      const timerY = y + 50;
      this.circularTimer.render(ctx, timerX, timerY, remainingTime, totalTime);
    } else if (isCooling) {
      // 冷却期间只显示冷却提示
      ctx.fillStyle = '#999999';
      ctx.font = '400 14px Roboto, Inter';
      ctx.textAlign = 'left';
      ctx.fillText('记者正在赶往现场...', margin + 25, y + 50);
    }
  }

  /**
   * 渲染成就内容
   */
  renderAchievementsContent(ctx) {
    const contentY = 180; // 130 + 32 + 18，标签栏下方留18px间距，与售楼处页面保持一致
    const contentHeight = canvas.height - contentY - 55;
    
    // 设置裁剪区域
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, contentY, canvas.width, contentHeight);
    ctx.clip();
    
    // 清空点击区域
    this.clickAreas = [];
    
    // 更新成就数据
    this.updateAchievements();
    
    if (this.achievements.length === 0) {
      // 显示暂无成就
      ctx.fillStyle = '#999999';
      ctx.font = '16px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无成就数据', canvas.width / 2, contentY + contentHeight / 2);
    } else {
      // 渲染成就列表
      this.achievements.forEach((achievement, index) => {
        const achievementY = contentY + index * 120 - this.achievementScrollY + 20;
        // 只渲染在可见区域内的成就项
        if (achievementY > -120 && achievementY < contentY + contentHeight + 120) {
          this.renderAchievementItem(ctx, achievement, achievementY);
        }
      });
    }
    
    ctx.restore();
  }

  /**
   * 渲染单个成就项
   */
  renderAchievementItem(ctx, achievement, y) {
    const itemHeight = 111; // 与Figma设计一致
    const margin = 10;
    const itemWidth = canvas.width - 2 * margin;
    
    // 检查是否可见
    if (y + itemHeight < 180 || y > canvas.height - 55) {
      return;
    }
    
    // 绘制成就背景
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#EDEDED';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, margin, y, itemWidth, itemHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // 绘制成就图标
    const iconX = margin + 19;
    const iconY = y + 20;
    const iconSize = 28;
    
    ctx.fillStyle = '#1GG1NL'; // 图标背景色
    drawRoundRect(ctx, iconX, iconY, iconSize, iconSize, 4);
    ctx.fill();
    
    // 绘制图标文字
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(achievement.icon, iconX + iconSize/2, iconY + iconSize/2);
    
    // 绘制成就信息
    const infoX = iconX + iconSize + 21;
    const infoY = y + 20;
    
    // 成就标题
    ctx.fillStyle = '#000000';
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(achievement.title, infoX, infoY);
    
    // 进度条背景
    const progressBarX = infoX + 2;
    const progressBarY = infoY + 30;
    const progressBarWidth = itemWidth - infoX - margin - 130; // 为按钮留出空间
    const progressBarHeight = 5;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    drawRoundRect(ctx, progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5);
    ctx.fill();
    
    // 进度条前景
    let progressPercentage = 0;
    if (achievement.condition === 'user_rank_or_better') {
      // 排名成就的进度计算
      if (this.achievementManager && this.achievementManager.playerStats.userRank <= achievement.target) {
        progressPercentage = 1;
      } else {
        // 显示当前排名相对于目标的进度
        const currentRank = this.achievementManager ? this.achievementManager.playerStats.userRank : 50;
        progressPercentage = Math.max(0, (50 - currentRank) / (50 - achievement.target));
      }
    } else {
      progressPercentage = Math.min(achievement.progress / achievement.target, 1);
    }
    
    const progressWidth = progressBarWidth * progressPercentage;
    
    // 渐变进度条
    const gradient = ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + progressWidth, progressBarY);
    gradient.addColorStop(0, '#FD9D00');
    gradient.addColorStop(1, '#FA6400');
    ctx.fillStyle = gradient;
    drawRoundRect(ctx, progressBarX, progressBarY, progressWidth, progressBarHeight, 5);
    ctx.fill();
    
    // 进度文字
    ctx.fillStyle = '#FA6400';
    ctx.font = '10px Inter';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    let progressText = '';
    if (achievement.condition === 'user_rank_or_better') {
      const currentRank = this.achievementManager ? this.achievementManager.playerStats.userRank : 50;
      progressText = `当前排名 ${currentRank} / 目标排名 ${achievement.target}`;
    } else {
      progressText = `成就进度 ${achievement.progress} / ${achievement.target}`;
    }
    
    ctx.fillText(progressText, progressBarX, progressBarY + 9);
    
    // 领取奖励按钮
    if (achievement.completed && !achievement.claimed) {
      const buttonX = margin + itemWidth - 115 - 19;
      const buttonY = y + 20;
      const buttonWidth = 115;
      const buttonHeight = 31;
      
      // 按钮背景
      ctx.fillStyle = '#24B874';
      drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 8.98);
      ctx.fill();
      
      // 按钮文字
      ctx.fillStyle = '#000000';
      ctx.font = '700 10.9px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('领取奖励', buttonX + buttonWidth/2, buttonY + buttonHeight/2);
      
      // 添加点击区域
      this.clickAreas.push({
        type: 'claim_reward',
        achievementId: achievement.id,
        x: buttonX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
      });
    } else if (achievement.claimed) {
      // 已领取标识
      const statusX = margin + itemWidth - 80 - 19;
      const statusY = y + 25;
      
      ctx.fillStyle = '#666666';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('已领取', statusX, statusY);
    }
  }

  /**
   * 获取优先级颜色
   */
  getPriorityColor(priority) {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#007AFF';
    }
  }
  /**
   * 文本换行
   */
  wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine !== '') {
      lines.push(currentLine);
    }
    
    return lines;
  }
} 