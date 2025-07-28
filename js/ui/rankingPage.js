import { 
  drawRoundRect, 
  formatMoney, 
  renderTopMoneyBar, 
  renderBottomNavigation,
  handleBottomNavigationTouch,
  drawGradientBackground
} from './utils.js';

/**
 * 排名页面 - 参考 Figma 设计
 * 上方：用户名次和前3名奖杯设计
 * 下方：50个用户的详细排名列表
 */
export default class RankingPage {
  constructor(getMoneyCallback = null, rankingManager = null) {
    this.isVisible = false;
    this.getMoneyCallback = getMoneyCallback;
    this.rankingManager = rankingManager;
    
    // 滚动控制
    this.scrollOffset = 0;
    this.maxScrollOffset = 0;
    
    // 排名数据
    this.rankingData = [];
    this.userRank = 50;
    this.topThree = [];
    
    // 常量
    this.headerHeight = 221; // 上方区域高度，参考Figma
    this.listItemHeight = 75; // 列表项高度，缩小5px并增加间距
    this.listPadding = 20;
    
    // 奖杯图片
    this.trophyImages = {};
    this.loadTrophyImages();
    
    // 玩家头像图片
    this.playerImages = {};
    this.loadPlayerImages();
  }

  /**
   * 加载奖杯图片
   */
  loadTrophyImages() {
    const trophyTypes = ['gold', 'silver', 'bronze'];
    trophyTypes.forEach(type => {
      // 兼容微信小程序和浏览器环境
      let img;
      if (typeof wx !== 'undefined' && wx.createImage) {
        // 微信小程序环境
        img = wx.createImage();
      } else if (typeof Image !== 'undefined') {
        // 浏览器环境
        img = new Image();
      } else {
        // 如果都不可用，创建空对象避免错误
        img = { complete: false, src: '' };
      }
      
      img.src = `images/trophy_${type}.png`;
      this.trophyImages[type] = img;
    });
  }

  /**
   * 加载玩家头像图片
   */
  loadPlayerImages() {
    // 根据系统玩家配置加载所有需要的头像
    const avatarFiles = [
      'player_1_g.png',
      'player_2_g.png', 
      'player_3_g.png',
      'player_4_g.png',
      'player_5_g.png',
      'player_6_g.png',
      'player_7_b.png',
      'player_8_b.png',
      'player_9_b.png',
      'player_10_b.png',
      'player_11_b.png',
      'player_12_b.png',
      'player_13_g.png',
      'player_14_g.png'
    ];

    avatarFiles.forEach(fileName => {
      // 兼容微信小程序和浏览器环境
      let img;
      if (typeof wx !== 'undefined' && wx.createImage) {
        // 微信小程序环境
        img = wx.createImage();
      } else if (typeof Image !== 'undefined') {
        // 浏览器环境
        img = new Image();
      } else {
        // 如果都不可用，创建空对象避免错误
        img = { complete: false, src: '' };
      }
      
      img.src = `images/${fileName}`;
      this.playerImages[`images/${fileName}`] = img;
    });
  }

  /**
   * 显示页面
   */
  show() {
    this.isVisible = true;
    this.updateRankingData();
    this.calculateMaxScroll();
  }

  /**
   * 隐藏页面
   */
  hide() {
    this.isVisible = false;
    this.scrollOffset = 0;
  }

  /**
   * 更新排名数据
   */
  updateRankingData() {
    if (!this.rankingManager || !this.getMoneyCallback) return;
    
    const userAssets = this.getMoneyCallback();
    this.rankingData = this.rankingManager.getRankingList(userAssets, '我');
    this.userRank = this.rankingManager.getUserRank(userAssets);
    this.topThree = this.rankingManager.getTopThree(userAssets);
  }

  /**
   * 计算最大滚动偏移量
   */
  calculateMaxScroll() {
    const listStartY = 130 + this.headerHeight; // 顶部栏 + 头部区域
    const listHeight = this.rankingData.length * this.listItemHeight;
    const visibleHeight = canvas.height - listStartY - 55; // 减去底部导航栏
    this.maxScrollOffset = Math.max(0, listHeight - visibleHeight);
  }

  /**
   * 处理滚动事件
   */
  handleScroll(deltaY) {
    if (!this.isVisible) return;
    
    this.scrollOffset = Math.max(0, Math.min(this.maxScrollOffset, this.scrollOffset + deltaY));
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 1. 首先检查底部导航栏 - 最高优先级，使用统一的导航处理函数
    const navResult = handleBottomNavigationTouch(x, y, 'ranking');
    if (navResult) {
      return navResult;
    }

    // 2. 检查加号按钮点击 (顶部money bar右侧)
    if (this.topBarClickAreas && this.topBarClickAreas.plusButton) {
      const plusBtn = this.topBarClickAreas.plusButton;
      if (x >= plusBtn.x && x <= plusBtn.x + plusBtn.width &&
          y >= plusBtn.y && y <= plusBtn.y + plusBtn.height) {
        return { type: 'showAdReward' };
      }
    }

    // 3. 检查排名列表点击（如果需要的话，暂时只是滚动）
    
    return null;
  }

  /**
   * 绘制奖杯 - 使用PNG图片
   */
  drawTrophy(ctx, x, y, type) {
    const trophyImg = this.trophyImages[type];
    
    if (trophyImg && trophyImg.complete) {
      // 奖杯尺寸
      const trophyWidth = 45;
      const trophyHeight = 41;
      
      // 绘制奖杯图片
      ctx.drawImage(trophyImg, x, y, trophyWidth, trophyHeight);
    } else {
      // 如果图片未加载完成，显示占位符
      ctx.save();
      ctx.fillStyle = '#E0E0E0';
      ctx.fillRect(x, y, 45, 41);
      ctx.restore();
    }
  }

  /**
   * 渲染头部区域（用户排名和前三名）
   */
  renderHeader(ctx) {
    const headerY = 130; // 顶部金钱栏下方
    
    // 用户排名文字
    ctx.fillStyle = '#000000';
    ctx.font = '700 20px Inter';
    ctx.textAlign = 'center';
    const rankText = `排名全市第${this.userRank}名`;
    ctx.fillText(rankText, canvas.width / 2, headerY + 30);
    
    // 前三名区域
    const topThreeY = headerY + 53;
    const cardWidth = 111;
    const cardHeight = 115; // 缩小高度从131到115
    const cardSpacing = 12;
    const totalWidth = cardWidth * 3 + cardSpacing * 2;
    const startX = (canvas.width - totalWidth) / 2;
    
    // 奖杯位置
    const trophyTypes = ['silver', 'gold', 'bronze']; // 中间是金奖
    const trophyOrder = [1, 0, 2]; // 显示顺序：银、金、铜
    
    for (let i = 0; i < 3; i++) {
      const cardX = startX + i * (cardWidth + cardSpacing);
      const actualRank = trophyOrder[i]; // 实际排名索引
      const player = this.topThree[actualRank];
      
      if (!player) continue;
      
      // 绘制卡片背景
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#F1F1F1';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, cardX, topThreeY + 37, cardWidth, cardHeight, 10);
      ctx.fill();
      ctx.stroke();
      
      // 绘制头像
      const avatarX = cardX + 14 + 17;
      const avatarY = topThreeY + 37 + 16;
      const avatarSize = 48;
      
      const avatarImg = this.playerImages[`images/${player.avatar}`];
      if (avatarImg && avatarImg.complete) {
        // 裁剪为圆形
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } else {
        // 占位符
        ctx.fillStyle = '#E0E0E0';
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 用户在线状态标识
      if (actualRank === 2) { // 第三名有绿色在线标识
        ctx.fillStyle = '#6DD400';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize - 5, avatarY + 5, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      
      // 玩家信息
      const infoY = topThreeY + 37 + 16 + 48 + 14;
      
      // 玩家名字
      ctx.fillStyle = '#000000';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, cardX + cardWidth/2, infoY);
      
      // 资产信息（替代原来的"Student"）
      ctx.fillStyle = '#FA6400';
      ctx.font = '700 8px Inter';
      ctx.fillText(formatMoney(player.assets), cardX + cardWidth/2, infoY + 14);
    }
    
    // 绘制奖杯（在卡片上方）
    for (let i = 0; i < 3; i++) {
      const cardX = startX + i * (cardWidth + cardSpacing);
      const trophyX = cardX + (cardWidth - 45) / 2;
      const trophyY = topThreeY + 4;
      
      this.drawTrophy(ctx, trophyX, trophyY, trophyTypes[i]);
    }
  }

  /**
   * 渲染排名列表
   */
  renderRankingList(ctx) {
    const listStartY = 130 + this.headerHeight;
    const listX = (canvas.width - 372) / 2; // 列表宽度372px，居中
    
    // 计算可见的列表项
    const startIndex = Math.floor(this.scrollOffset / this.listItemHeight);
    const endIndex = Math.min(this.rankingData.length, startIndex + Math.ceil(canvas.height / this.listItemHeight) + 1);
    
    for (let i = startIndex; i < endIndex; i++) {
      const player = this.rankingData[i];
      if (!player) continue;
      
      const itemY = listStartY + i * this.listItemHeight - this.scrollOffset;
      
      // 跳过不在可见区域的项目
      if (itemY + this.listItemHeight < listStartY || itemY > canvas.height - 55) {
        continue;
      }
      
      // 绘制列表项背景
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#F1F1F1';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, listX, itemY, 372, this.listItemHeight, 10);
      ctx.fill();
      ctx.stroke();
      
      // 头像
      const avatarX = listX + 19;
      const avatarY = itemY + 17;
      const avatarSize = 48;
      
      const avatarImg = this.playerImages[`images/${player.avatar}`];
      if (avatarImg && avatarImg.complete) {
        // 裁剪为圆形
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } else {
        // 占位符，使用随机颜色
        const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        ctx.fillStyle = avatarColors[player.id % avatarColors.length] || '#E0E0E0';
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 用户标识
      if (player.isUser) {
        ctx.strokeStyle = '#B620E0';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // 玩家信息区域
      const infoX = avatarX + avatarSize + 25;
      const infoY = itemY + 17;
      
      // 玩家名字
      ctx.fillStyle = player.isUser ? '#B620E0' : '#000000';
      ctx.font = '700 12px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(player.name, infoX, infoY + 12);
      
      // 资产金额 - 字体放大到18px
      ctx.fillStyle = '#FA6400';
      ctx.font = '700 18px Inter';
      const assetText = formatMoney(player.assets);
      ctx.fillText(assetText, infoX, infoY + 32);
      
      // 计算资产文字宽度，用于定位排名
      const assetTextWidth = ctx.measureText(assetText).width;
      
      // 排名编号 - 移动到资产的右侧
      ctx.fillStyle = '#666666';
      ctx.font = '700 14px Inter';
      ctx.fillText(`#${player.rank}`, infoX + assetTextWidth + 10, infoY + 32);
      
      // 简化的描述文字
      ctx.fillStyle = '#666666';
      ctx.font = '400 10px Inter';
      const description = player.isUser ? '这是您当前的排名位置' : `${player.level}级投资者，经验值${player.experience}`;
      ctx.fillText(description, infoX, infoY + 50);
    }
  }

  /**
   * 渲染滚动条
   */
  renderScrollBar(ctx) {
    if (this.maxScrollOffset <= 0) return;
    
    const scrollBarX = canvas.width - 8;
    const scrollBarY = 130 + this.headerHeight;
    const scrollBarHeight = canvas.height - scrollBarY - 55; // 减去底部导航栏
    const scrollBarWidth = 4;

    // 滚动条背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);

    // 滑块
    const visibleRatio = scrollBarHeight / (scrollBarHeight + this.maxScrollOffset);
    const sliderHeight = Math.max(20, scrollBarHeight * visibleRatio);
    const sliderY = scrollBarY + (this.scrollOffset / this.maxScrollOffset) * (scrollBarHeight - sliderHeight);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(scrollBarX, sliderY, scrollBarWidth, sliderHeight);
  }

  /**
   * 渲染页面
   */
  render(ctx) {
    if (!this.isVisible) return;
    
    ctx.save();
    
    // 绘制Figma设计的渐变背景
    drawGradientBackground(ctx, canvas.width, canvas.height);
    
    // 更新排名数据
    this.updateRankingData();
    
    // 渲染顶部金钱栏（不带返回按钮）
    const topBarResult = renderTopMoneyBar(ctx, this.getMoneyCallback, { showBackButton: false });
    this.topBarClickAreas = topBarResult;
    
    // 渲染头部区域
    this.renderHeader(ctx);
    
    // 渲染排名列表
    this.renderRankingList(ctx);
    
    // 渲染滚动条
    this.renderScrollBar(ctx);
    
    // 渲染底部导航栏
    const navResult = renderBottomNavigation(ctx, 'ranking');
    this.bottomNavClickAreas = navResult;
    
    ctx.restore();
  }
} 