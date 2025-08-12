/**
 * 成就配置文件
 * 定义游戏中的成就系统
 */

export const achievementConfig = [
  // 房产持有数量成就
  {
    id: 'property_holder_1',
    title: '初次置业',
    description: '同时持有1栋房产',
    target: 1,
    icon: '🏠',
    category: 'property_count',
    reward: 500000, // 1 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_3',
    title: '小有资产',
    description: '同时持有3栋房产',
    target: 3,
    icon: '🏘️',
    category: 'property_count',
    reward: 1500000, // 3 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_5',
    title: '房产达人',
    description: '同时持有5栋房产',
    target: 5,
    icon: '🏗️',
    category: 'property_count',
    reward: 2500000, // 5 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_10',
    title: '投资高手',
    description: '同时持有10栋房产',
    target: 10,
    icon: '🏛️',
    category: 'property_count',
    reward: 5000000, // 10 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_15',
    title: '房产专家',
    description: '同时持有15栋房产',
    target: 15,
    icon: '🏙️',
    category: 'property_count',
    reward: 7500000, // 15 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_20',
    title: '地产大亨',
    description: '同时持有20栋房产',
    target: 20,
    icon: '🌆',
    category: 'property_count',
    reward: 10000000, // 20 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_25',
    title: '房产巨头',
    description: '同时持有25栋房产',
    target: 25,
    icon: '🌇',
    category: 'property_count',
    reward: 12500000, // 25 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_30',
    title: '投资帝国',
    description: '同时持有30栋房产',
    target: 30,
    icon: '🏗️',
    category: 'property_count',
    reward: 15000000, // 30 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_35',
    title: '房产王者',
    description: '同时持有35栋房产',
    target: 35,
    icon: '👑',
    category: 'property_count',
    reward: 17500000, // 35 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_40',
    title: '地产霸主',
    description: '同时持有40栋房产',
    target: 40,
    icon: '🏰',
    category: 'property_count',
    reward: 20000000, // 40 * 50万
    condition: 'current_property_count'
  },
  {
    id: 'property_holder_45',
    title: '房产帝王',
    description: '同时持有45栋房产',
    target: 45,
    icon: '🏯',
    category: 'property_count',
    reward: 22500000, // 45 * 50万
    condition: 'current_property_count'
  },

  // 排名成就
  {
    id: 'ranking_40',
    title: '进入前40',
    description: '排名达到前40名',
    target: 40,
    icon: '🥉',
    category: 'ranking',
    reward: 3750000, // 1.5亿 / 40
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_30',
    title: '进入前30',
    description: '排名达到前30名',
    target: 30,
    icon: '🥈',
    category: 'ranking',
    reward: 5000000, // 1.5亿 / 30
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_20',
    title: '进入前20',
    description: '排名达到前20名',
    target: 20,
    icon: '🥇',
    category: 'ranking',
    reward: 7500000, // 1.5亿 / 20
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_10',
    title: '进入前10',
    description: '排名达到前10名',
    target: 10,
    icon: '🏆',
    category: 'ranking',
    reward: 15000000, // 1.5亿 / 10
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_5',
    title: '第五名',
    description: '排名达到第5名',
    target: 5,
    icon: '🌟',
    category: 'ranking',
    reward: 30000000, // 1.5亿 / 5
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_4',
    title: '第四名',
    description: '排名达到第4名',
    target: 4,
    icon: '⭐',
    category: 'ranking',
    reward: 37500000, // 1.5亿 / 4
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_3',
    title: '第三名',
    description: '排名达到第3名',
    target: 3,
    icon: '🥉',
    category: 'ranking',
    reward: 50000000, // 1.5亿 / 3
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_2',
    title: '第二名',
    description: '排名达到第2名',
    target: 2,
    icon: '🥈',
    category: 'ranking',
    reward: 75000000, // 1.5亿 / 2
    condition: 'user_rank_or_better'
  },
  {
    id: 'ranking_1',
    title: '第一名',
    description: '排名达到第1名',
    target: 1,
    icon: '🥇',
    category: 'ranking',
    reward: 150000000, // 1.5亿 / 1
    condition: 'user_rank_or_better'
  },

  // 区域霸主成就
  {
    id: 'district_master_financial',
    title: '金融街霸主',
    description: '同时持有金融街所有房产',
    target: 19, // 金融街有19个房产
    icon: '💼',
    category: 'district_master',
    reward: 50000000, // 5千万
    condition: 'district_domination',
    districtType: '金融街'
  },
  {
    id: 'district_master_commercial',
    title: '市中心霸主',
    description: '同时持有市中心所有房产',
    target: 16, // 市中心有16个房产
    icon: '🏪',
    category: 'district_master',
    reward: 50000000, // 5千万
    condition: 'district_domination',
    districtType: '市中心'
  },
  {
    id: 'district_master_tech',
    title: '科创园区霸主',
    description: '同时持有科创园区所有房产',
    target: 14, // 科创园区有14个房产
    icon: '🔬',
    category: 'district_master',
    reward: 50000000, // 5千万
    condition: 'district_domination',
    districtType: '科创园区'
  },
  {
    id: 'district_master_old',
    title: '老城区霸主',
    description: '同时持有老城区所有房产',
    target: 12, // 老城区有12个房产
    icon: '🏛️',
    category: 'district_master',
    reward: 50000000, // 5千万
    condition: 'district_domination',
    districtType: '老城区'
  },
  {
    id: 'district_master_industrial',
    title: '工业开发新区霸主',
    description: '同时持有工业开发新区所有房产',
    target: 10, // 工业开发新区有10个房产
    icon: '🏭',
    category: 'district_master',
    reward: 50000000, // 5千万
    condition: 'district_domination',
    districtType: '工业开发新区'
  }
];

/**
 * 成就管理器
 */
export class AchievementManager {
  constructor() {
    this.achievements = new Map();
    this.playerStats = {
      purchaseCount: 0,
      sellCount: 0,
      totalEarned: 0,
      upgradeCount: 0,
      rentCollectCount: 0,
      currentPropertyCount: 0,
      districtStats: {}, // 每个区域的房产数量
      maxSingleProfit: 0,
      recentTrades: [], // 最近的交易时间戳
      userRank: 50, // 用户当前排名
      claimedAchievements: new Set() // 已领取的成就ID
    };
    
    this.initializeAchievements();
  }

  /**
   * 初始化成就
   */
  initializeAchievements() {
    achievementConfig.forEach(config => {
      this.achievements.set(config.id, {
        ...config,
        progress: 0,
        completed: false,
        completedAt: null,
        claimed: false,
        claimedAt: null
      });
    });
  }

  /**
   * 更新玩家统计数据
   */
  updateStats(action, data) {
    switch (action) {
      case 'purchase':
        this.playerStats.purchaseCount++;
        this.playerStats.currentPropertyCount++;
        // 更新区域统计
        const district = data.district || data.districtType;
        if (district) {
          if (!this.playerStats.districtStats[district]) {
            this.playerStats.districtStats[district] = 0;
          }
          this.playerStats.districtStats[district]++;
        }
        break;
        
      case 'sell':
        this.playerStats.sellCount++;
        this.playerStats.currentPropertyCount--;
        this.playerStats.totalEarned += data.profit;
        this.playerStats.maxSingleProfit = Math.max(this.playerStats.maxSingleProfit, data.profit);
        // 更新区域统计
        const sellDistrict = data.district || data.districtType;
        if (sellDistrict && this.playerStats.districtStats[sellDistrict]) {
          this.playerStats.districtStats[sellDistrict]--;
        }
        // 记录交易时间
        this.playerStats.recentTrades.push(Date.now());
        // 只保留最近1分钟的交易记录
        this.playerStats.recentTrades = this.playerStats.recentTrades.filter(
          time => Date.now() - time < 60000
        );
        break;
        
      case 'upgrade':
        this.playerStats.upgradeCount++;
        break;
        
      case 'rent':
        this.playerStats.rentCollectCount++;
        break;
        
      case 'earn':
        this.playerStats.totalEarned += data.amount;
        break;
        
      case 'rank_update':
        this.playerStats.userRank = data.rank;
        break;
    }
    
    // 更新成就进度
    this.updateAchievementProgress();
  }

  /**
   * 更新成就进度
   */
  updateAchievementProgress() {
    this.achievements.forEach((achievement, id) => {
      if (achievement.completed) return;
      
      let progress = 0;
      
      switch (achievement.condition) {
        case 'current_property_count':
          progress = this.playerStats.currentPropertyCount;
          break;
        case 'user_rank_or_better':
          // 排名成就：用户排名小于等于目标排名时完成
          progress = this.playerStats.userRank <= achievement.target ? achievement.target : this.playerStats.userRank;
          break;
        case 'district_domination':
          // 区域霸主：检查特定区域的房产数量
          const districtCount = this.playerStats.districtStats[achievement.districtType] || 0;
          progress = districtCount;
          break;
        case 'purchase_count':
          progress = this.playerStats.purchaseCount;
          break;
        case 'sell_count':
          progress = this.playerStats.sellCount;
          break;
        case 'total_earned':
          progress = this.playerStats.totalEarned;
          break;
        case 'upgrade_count':
          progress = this.playerStats.upgradeCount;
          break;
        case 'rent_collect_count':
          progress = this.playerStats.rentCollectCount;
          break;
        case 'single_profit':
          progress = this.playerStats.maxSingleProfit;
          break;
        case 'quick_trades':
          progress = this.playerStats.recentTrades.length;
          break;
      }
      
      achievement.progress = progress;
      
      // 检查是否完成
      let isCompleted = false;
      if (achievement.condition === 'user_rank_or_better') {
        isCompleted = this.playerStats.userRank <= achievement.target;
      } else {
        isCompleted = progress >= achievement.target;
      }
      
      if (isCompleted && !achievement.completed) {
        achievement.completed = true;
        achievement.completedAt = Date.now();

      }
    });
  }

  /**
   * 领取成就奖励
   */
  claimAchievement(achievementId) {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) {
      return { success: false, message: '成就不存在' };
    }
    
    if (!achievement.completed) {
      return { success: false, message: '成就未完成' };
    }
    
    if (achievement.claimed) {
      return { success: false, message: '奖励已领取' };
    }
    
    // 标记为已领取
    achievement.claimed = true;
    achievement.claimedAt = Date.now();
    this.playerStats.claimedAchievements.add(achievementId);
    
    return { 
      success: true, 
      reward: achievement.reward,
      achievement: achievement
    };
  }

  /**
   * 获取可领取的成就
   */
  getClaimableAchievements() {
    return Array.from(this.achievements.values()).filter(
      achievement => achievement.completed && !achievement.claimed
    );
  }

  /**
   * 获取已完成的成就
   */
  getCompletedAchievements() {
    return Array.from(this.achievements.values()).filter(
      achievement => achievement.completed
    );
  }

  /**
   * 获取未完成的成就
   */
  getUncompletedAchievements() {
    return Array.from(this.achievements.values()).filter(
      achievement => !achievement.completed
    );
  }

  /**
   * 获取成就进度
   */
  getAchievementProgress(id) {
    const achievement = this.achievements.get(id);
    if (!achievement) return null;
    
    return {
      progress: achievement.progress,
      target: achievement.target,
      percentage: Math.min((achievement.progress / achievement.target) * 100, 100),
      completed: achievement.completed,
      claimed: achievement.claimed
    };
  }

  /**
   * 获取所有成就
   */
  getAllAchievements() {
    return Array.from(this.achievements.values());
  }

  /**
   * 重置所有成就
   */
  resetAchievements() {
    this.achievements.clear();
    this.playerStats = {
      purchaseCount: 0,
      sellCount: 0,
      totalEarned: 0,
      upgradeCount: 0,
      rentCollectCount: 0,
      currentPropertyCount: 0,
      districtStats: {},
      maxSingleProfit: 0,
      recentTrades: [],
      userRank: 50,
      claimedAchievements: new Set()
    };
    
    this.initializeAchievements();
  }

  /**
   * 保存数据
   */
  saveData() {
    return {
      playerStats: {
        ...this.playerStats,
        claimedAchievements: Array.from(this.playerStats.claimedAchievements)
      },
      achievements: Array.from(this.achievements.entries()).map(([id, achievement]) => ({
        id,
        progress: achievement.progress,
        completed: achievement.completed,
        completedAt: achievement.completedAt,
        claimed: achievement.claimed,
        claimedAt: achievement.claimedAt
      }))
    };
  }

  /**
   * 加载数据
   */
  loadData(data) {
    if (data && data.playerStats) {
      this.playerStats = {
        ...data.playerStats,
        claimedAchievements: new Set(data.playerStats.claimedAchievements || [])
      };
    }
    
    if (data && data.achievements) {
      data.achievements.forEach(savedAchievement => {
        const achievement = this.achievements.get(savedAchievement.id);
        if (achievement) {
          achievement.progress = savedAchievement.progress;
          achievement.completed = savedAchievement.completed;
          achievement.completedAt = savedAchievement.completedAt;
          achievement.claimed = savedAchievement.claimed;
          achievement.claimedAt = savedAchievement.claimedAt;
        }
      });
    }
  }
}

// 全局成就管理器实例
export const achievementManager = new AchievementManager(); 