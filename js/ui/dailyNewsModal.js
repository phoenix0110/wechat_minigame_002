import { drawRoundRect, formatMoney } from './utils.js';

/**
 * 每日新闻弹窗 - 富豪排行榜通报
 * 每天更新时显示富豪排行榜相关新闻
 */
export default class DailyNewsModal {
  constructor(rankingManager = null) {
    this.rankingManager = rankingManager;
    this.isVisible = false;
    
    // 弹窗尺寸和位置
    this.modalWidth = 320;
    this.modalHeight = 420;
    this.modalX = 0;
    this.modalY = 0;
    
    // 新闻数据
    this.newsData = null;
    
    // 人像图片
    this.playerImages = {};
    this.loadPlayerImages();
    
    // 女生图片池（用于随机选择）
    this.femaleAvatars = [
      'player_1_g.png',
      'player_2_g.png', 
      'player_3_g.png',
      'player_4_g.png',
      'player_5_g.png',
      'player_6_g.png',
      'player_13_g.png',
      'player_14_g.png'
    ];
  }
  
  /**
   * 加载玩家头像图片
   */
  loadPlayerImages() {
    const avatarFiles = [
      'player_1_g.png', 'player_2_g.png', 'player_3_g.png', 'player_4_g.png',
      'player_5_g.png', 'player_6_g.png', 'player_7_b.png', 'player_8_b.png',
      'player_9_b.png', 'player_10_b.png', 'player_11_b.png', 'player_12_b.png',
      'player_13_g.png', 'player_14_g.png'
    ];
    
    avatarFiles.forEach(filename => {
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
      
      img.src = `images/${filename}`;
      this.playerImages[filename] = img;
    });
  }
  
  /**
   * 显示新闻弹窗
   */
  show(canvasWidth, canvasHeight, userAssets, userName = '我') {
    if (!this.rankingManager) {
      console.warn('DailyNewsModal: rankingManager not available');
      return;
    }
    
    this.isVisible = true;
    
    // 计算弹窗位置（居中显示）
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
    
    // 生成新闻数据
    this.generateNewsData(userAssets, userName);
  }
  
  /**
   * 隐藏新闻弹窗
   */
  hide() {
    this.isVisible = false;
    this.newsData = null;
  }
  
  /**
   * 生成新闻数据
   */
  generateNewsData(userAssets, userName) {
    const ranking = this.rankingManager.getRankingList(userAssets, userName);
    const user = ranking.find(player => player.isUser);
    
    // 获取首富
    const richest = ranking[0];
    
    // 获取排名增长最快的富豪（模拟逻辑，这里简单取第2-5名中的随机一个）
    const fastestGrower = ranking[Math.floor(Math.random() * 4) + 1]; // 第2-5名随机选择
    
    // 随机选择一个女生头像
    const randomFemaleAvatar = this.femaleAvatars[Math.floor(Math.random() * this.femaleAvatars.length)];
    
    this.newsData = {
      date: this.getCurrentDateString(),
      characters: [
        {
          name: richest.name,
          role: '本市首富',
          avatar: richest.avatar,
          assets: richest.assets
        },
        {
          name: fastestGrower.name,
          role: '排名增长最快',
          avatar: fastestGrower.avatar,
          assets: fastestGrower.assets,
          rankChange: '+' + Math.floor(Math.random() * 5 + 1) // 模拟排名提升1-5位
        },
        {
          name: '市民代表',
          role: '随机采访',
          avatar: randomFemaleAvatar,
          assets: 0
        }
      ],
      news: [
        {
          title: '首富风采',
          content: `${richest.name}以${formatMoney(richest.assets)}的总资产稳坐本市首富宝座，继续在投资领域展现卓越实力。`
        },
        {
          title: '新星崛起',
          content: `${fastestGrower.name}表现亮眼，资产增长迅速，成为本期排名增长最快的投资者，令人瞩目。`
        },
        {
          title: '新进富豪',
          content: user ? this.generateUserNewsContent(user, ranking.length) : '暂无新进富豪信息。'
        }
      ]
    };
  }
  
  /**
   * 生成用户新闻内容
   */
  generateUserNewsContent(user, totalPlayers) {
    const rank = user.rank;
    const assets = user.assets;
    
    if (rank <= 10) {
      return `新进富豪"${user.name}"强势崛起，以${formatMoney(assets)}跻身前十强，成为投资界的耀眼新星！`;
    } else if (rank <= 20) {
      return `投资新秀"${user.name}"表现不俗，以${formatMoney(assets)}位列第${rank}名，展现了不凡的投资天赋。`;
    } else if (rank <= 30) {
      return `"${user.name}"作为投资市场的新面孔，以${formatMoney(assets)}获得第${rank}名，前景可期。`;
    } else {
      const percentage = Math.round(((totalPlayers - rank + 1) / totalPlayers) * 100);
      return `新进投资者"${user.name}"目前以${formatMoney(assets)}排名第${rank}，已超越${percentage}%的参与者，加油！`;
    }
  }
  
  /**
   * 获取当前日期字符串
   */
  getCurrentDateString() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    return `${month}月${date}日`;
  }
  
  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;
    
    // 点击弹窗外部关闭
    if (x < this.modalX || x > this.modalX + this.modalWidth ||
        y < this.modalY || y > this.modalY + this.modalHeight) {
      this.hide();
      return { type: 'close' };
    }
    
    // 点击确定按钮区域
    const buttonY = this.modalY + this.modalHeight - 50;
    const buttonHeight = 40;
    if (y >= buttonY && y <= buttonY + buttonHeight) {
      this.hide();
      return { type: 'confirm' };
    }
    
    return null;
  }
  
  /**
   * 渲染新闻弹窗
   */
  render(ctx) {
    if (!this.isVisible || !this.newsData) return;
    
    ctx.save();
    
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制弹窗背景
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, this.modalX, this.modalY, this.modalWidth, this.modalHeight, 12);
    ctx.fill();
    ctx.stroke();
    
    // 绘制标题
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.newsData.date} 富豪排行榜快讯`, this.modalX + this.modalWidth / 2, this.modalY + 35);
    
    // 绘制分割线
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.modalX + 20, this.modalY + 50);
    ctx.lineTo(this.modalX + this.modalWidth - 20, this.modalY + 50);
    ctx.stroke();
    
    // 绘制三个人像
    this.renderCharacters(ctx);
    
    // 绘制新闻内容
    this.renderNewsContent(ctx);
    
    // 绘制确定按钮
    this.renderConfirmButton(ctx);
    
    ctx.restore();
  }
  
  /**
   * 渲染人物头像区域
   */
  renderCharacters(ctx) {
    const startY = this.modalY + 65;
    const characterWidth = 80;
    const characterHeight = 100;
    const spacing = (this.modalWidth - 60 - characterWidth * 3) / 2;
    
    this.newsData.characters.forEach((character, index) => {
      const characterX = this.modalX + 20 + index * (characterWidth + spacing);
      
      // 绘制人像背景
      ctx.fillStyle = '#F8F9FA';
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
      drawRoundRect(ctx, characterX, startY, characterWidth, characterHeight, 8);
      ctx.fill();
      ctx.stroke();
      
      // 绘制头像
      const avatarSize = 48;
      const avatarX = characterX + (characterWidth - avatarSize) / 2;
      const avatarY = startY + 10;
      
      const avatarImg = this.playerImages[character.avatar];
      if (avatarImg && avatarImg.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // 头像边框
        ctx.strokeStyle = '#6425FE';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // 占位符
        ctx.fillStyle = '#DDD';
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 绘制角色信息
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(character.role, characterX + characterWidth / 2, startY + 70);
      
      ctx.fillStyle = '#666666';
      ctx.font = '10px Inter';
      ctx.fillText(character.name, characterX + characterWidth / 2, startY + 85);
    });
  }
  
  /**
   * 渲染新闻内容区域
   */
  renderNewsContent(ctx) {
    const startY = this.modalY + 180;
    const contentWidth = this.modalWidth - 40;
    
    this.newsData.news.forEach((newsItem, index) => {
      const itemY = startY + index * 60;
      
      // 新闻标题
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(newsItem.title, this.modalX + 20, itemY);
      
      // 新闻内容（自动换行）
      ctx.fillStyle = '#666666';
      ctx.font = '12px Inter';
      this.wrapText(ctx, newsItem.content, this.modalX + 20, itemY + 20, contentWidth, 16);
    });
  }
  
  /**
   * 渲染确定按钮
   */
  renderConfirmButton(ctx) {
    const buttonY = this.modalY + this.modalHeight - 50;
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonX = this.modalX + (this.modalWidth - buttonWidth) / 2;
    
    // 绘制按钮背景
    ctx.fillStyle = '#6425FE';
    drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 8);
    ctx.fill();
    
    // 绘制按钮文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('确定', buttonX + buttonWidth / 2, buttonY + 25);
  }
  
  /**
   * 文本自动换行辅助函数
   */
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let lineCount = 0;
    const maxLines = 2; // 最多显示2行
    
    for (let i = 0; i < words.length && lineCount < maxLines; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && line.length > 0) {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = words[i];
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    if (lineCount < maxLines && line.length > 0) {
      // 如果文本太长，添加省略号
      if (lineCount === maxLines - 1 && line.length > maxWidth / 8) {
        line = line.substring(0, Math.floor(maxWidth / 8) - 2) + '...';
      }
      ctx.fillText(line, x, y + lineCount * lineHeight);
    }
  }
} 