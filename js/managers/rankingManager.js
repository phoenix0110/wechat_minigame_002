import { formatMoney } from '../ui/utils.js';
import { getSystemPlayersConfig } from '../config/systemPlayersConfig.js';

/**
 * 排名管理器 - 管理系统玩家数据和排名逻辑
 */
export default class RankingManager {
  constructor() {
    this.systemPlayers = [];
    this.lastUpdateTime = Date.now();
    this.updateInterval = 5 * 60 * 1000; // 5分钟更新一次
    this.updateTimer = null;
    
    // 初始化系统玩家
    this.initializeSystemPlayers();    
    // 开始定时更新
    this.startPeriodicUpdate();
  }

  /**
   * 初始化49个系统玩家 - 使用配置表
   */
  initializeSystemPlayers() {
    // 从配置表加载系统玩家数据
    const playersConfig = getSystemPlayersConfig();
    
    this.systemPlayers = playersConfig.map(config => ({
      id: config.id,
      name: config.name,
      assets: config.initialAssets,
      lastUpdateTime: Date.now(),
      avatar: config.avatar,
      level: config.level,
      experience: config.experience
    }));

  }

  /**
   * 更新单个玩家的资产
   */
  updatePlayerAssets(player) {
    const now = Date.now();
    
    // 随机决定是增加还是减少
    const isIncrease = Math.random() > 0.4; // 60%概率增加，40%概率减少
    
    let changePercent;
    if (isIncrease) {
      changePercent = 1 + (Math.random() * 0.04 + 0.01); // 增加1%-5%
    } else {
      changePercent = 1 - (Math.random() * 0.03 + 0.01); // 减少1%-4%
    }
    
    player.assets = Math.floor(player.assets * changePercent);
    player.lastUpdateTime = now;
  }

  /**
   * 更新所有系统玩家的资产
   */
  updateAllSystemPlayers() {
    this.systemPlayers.forEach(player => {
      this.updatePlayerAssets(player);
    });
    
    this.lastUpdateTime = Date.now();
  }

  /**
   * 开始定期更新
   */
  startPeriodicUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      this.updateAllSystemPlayers();
    }, this.updateInterval);

  }
  /**
   * 获取排行榜数据（包含用户）
   */
  getRankingList(userAssets, userName = '我') {
    // 创建用户数据
    const user = {
      id: 'user',
      name: userName,
      assets: userAssets,
      isUser: true,
      level: 1,
      experience: 0,
      avatar: 'user_avatar'
    };
    
    // 合并系统玩家和用户
    const allPlayers = [...this.systemPlayers, user];
    
    // 按资产排序
    allPlayers.sort((a, b) => b.assets - a.assets);
    
    // 添加排名信息
    allPlayers.forEach((player, index) => {
      player.rank = index + 1;
    });
    
    return allPlayers;
  }

  /**
   * 获取用户排名
   */
  getUserRank(userAssets) {
    const ranking = this.getRankingList(userAssets);
    const userRank = ranking.find(player => player.isUser);
    return userRank ? userRank.rank : 50;
  }

  /**
   * 获取前三名
   */
  getTopThree(userAssets) {
    const ranking = this.getRankingList(userAssets);
    return ranking.slice(0, 3);
  }

  /**
   * 获取下次更新剩余时间
   */
  getTimeUntilNextUpdate() {
    const timeSinceLastUpdate = Date.now() - this.lastUpdateTime;
    const timeUntilNext = this.updateInterval - timeSinceLastUpdate;
    return Math.max(0, timeUntilNext);
  }

  /**
   * 获取系统玩家数据（用于保存）
   */
  getSystemPlayersData() {
    return {
      systemPlayers: this.systemPlayers,
      lastUpdateTime: this.lastUpdateTime
    };
  }

  /**
   * 恢复系统玩家数据（用于加载）
   */
  restoreSystemPlayersData(data) {
    if (data && data.systemPlayers && Array.isArray(data.systemPlayers) && data.systemPlayers.length > 0) {
      // 只有当有有效的系统玩家数据时才恢复
      this.systemPlayers = data.systemPlayers;
      this.lastUpdateTime = data.lastUpdateTime || Date.now();
    } else {
      console.log('恢复数据无效或为空，保持当前系统玩家状态，共', this.systemPlayers.length, '个玩家');
    }
  }

  /**
   * 获取排名系统统计信息
   */
  getStats() {
    const totalPlayers = this.systemPlayers.length;
    const totalAssets = this.systemPlayers.reduce((sum, player) => sum + player.assets, 0);
    const avgAssets = totalAssets / totalPlayers;
    const maxAssets = Math.max(...this.systemPlayers.map(p => p.assets));
    const minAssets = Math.min(...this.systemPlayers.map(p => p.assets));
    
    return {
      totalPlayers,
      totalAssets,
      avgAssets,
      maxAssets,
      minAssets,
      lastUpdateTime: this.lastUpdateTime,
      nextUpdateIn: this.getTimeUntilNextUpdate()
    };
  }
} 