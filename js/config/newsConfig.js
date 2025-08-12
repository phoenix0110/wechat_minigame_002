/**
 * 新闻配置文件
 * 包含游戏中的新闻数据，新闻会影响特定district的房价
 */

export const newsConfig = [
  {
    id: 'news_001',
    title: '顶级金融机构即将入驻金融街',
    content: '据权威消息，三大国际投行将在下月正式入驻金融街核心区域，预计将带来数千个高薪就业岗位。',
    district: 'financial_district', // 影响的区域
    priceEffect: 'increase', // 'increase' 或 'decrease'
    effectValue: 0.05,
  },
  {
    id: 'news_002', 
    title: '科创园区获得大力支持',
    content: '将投入100亿元用于科技园区基础设施建设，重点发展人工智能和新能源产业。',
    district: 'tech_park',
    priceEffect: 'increase',
    effectValue: 0.02, // 每30秒房价变化2%
    isRealNews: true,
  },
  {
    id: 'news_003',
    title: '市中心发生重大事故',
    content: '商业区中心商场发生严重安全事故，相关部门正在调查原因，预计短期内将影响周边商业活动。',
    district: 'commercial_district',
    priceEffect: 'decrease',
    effectValue: 0.03, // 每30秒房价下跌3%
    isRealNews: true,
  },
  {
    id: 'news_004',
    title: '老城区将建设大型购物中心',
    content: '某知名地产商计划在老城区建设大型购物中心。',
    district: 'residential_district',
    priceEffect: 'increase',
    effectValue: 0.06, // 每30秒房价变化6%
    isRealNews: false, // 假新闻，实际会让房价下跌
  },
  {
    id: 'news_005',
    title: '工业开发新区环保整治即将开始',
    content: '环保部门宣布将对工业开发新区进行为期三个月的环保整治，多家企业面临停产风险。',
    district: 'industrial_district',
    priceEffect: 'decrease',
    effectValue: 0.05, // 每30秒房价下跌5%
    isRealNews: true,
  }
];

/**
 * 新闻管理器
 */
export class NewsManager {
  constructor() {
    this.activeNews = []; // 当前活跃的新闻
    this.newsHistory = []; // 历史新闻
  }

  /**
   * 发布新闻
   */
  publishNews(newsId) {
    const newsTemplate = newsConfig.find(news => news.id === newsId);
    if (!newsTemplate) return null;
    
    // 随机生效时长：1-4分钟
    const minDuration = 1 * 60 * 1000; // 1分钟
    const maxDuration = 3 * 60 * 1000; // 3分钟
    const randomDuration = minDuration + Math.random() * (maxDuration - minDuration);

    // 创建新闻实例
    const news = {
      ...newsTemplate,
      createdAt: Date.now(),
      effectStartTime: Date.now(),
      effectEndTime: Date.now() +  randomDuration,
      actualDuration: randomDuration // 保存实际生效时长
    };

    this.activeNews.push(news);
    return news;
  }

  /**
   * 获取当前活跃的新闻
   */
  getActiveNews() {
    const now = Date.now();
    
    // 过滤掉已过期的新闻
    this.activeNews = this.activeNews.filter(news => {
      if (now > news.effectEndTime) {
        this.newsHistory.push(news);
        return false;
      }
      return true;
    });

    return this.activeNews;
  }

  /**
   * 检查新闻是否对特定district产生影响
   * 只生效最新的新闻（如果有多个相同地区的新闻）
   */
  getDistrictEffect(district) {
    const now = Date.now();
    const activeNews = this.getActiveNews();
    
    // 找到影响该地区的所有生效新闻
    const districtNews = activeNews.filter(news => 
      news.district === district && 
      now >= news.effectStartTime && 
      now <= news.effectEndTime
    );

    if (districtNews.length === 0) {
      return {
        hasEffect: false,
        totalEffect: 0,
        effectCount: 0
      };
    }

    // 只取最新的新闻（按创建时间排序，取最新的）
    const latestNews = districtNews.sort((a, b) => b.createdAt - a.createdAt)[0];
    
    let effect = latestNews.effectValue;
    
    // 如果是假新闻，效果相反
    if (!latestNews.isRealNews) {
      effect = -effect;
    }
    
    // 如果是下跌新闻，效果为负
    if (latestNews.priceEffect === 'decrease') {
      effect = -Math.abs(effect);
    } else {
      effect = Math.abs(effect);
    }

    return {
      hasEffect: true,
      totalEffect: effect,
      effectCount: 1,
      activeNews: latestNews
    };
  }

  /**
   * 获取新闻历史
   */
  getNewsHistory() {
    return this.newsHistory;
  }

  /**
   * 清空所有新闻
   */
  clearAllNews() {
    this.activeNews = [];
    this.newsHistory = [];
  }

  /**
   * 获取所有可用的新闻ID
   */
  getAllAvailableNewsIds() {
    return newsConfig.map(news => news.id);
  }

  /**
   * 保存新闻数据（用于存档）
   */
  saveNewsData() {
    return {
      activeNews: this.activeNews,
      newsHistory: this.newsHistory
    };
  }

  /**
   * 恢复新闻数据（用于读档）
   */
  restoreNewsData(data) {
    if (data) {
      this.activeNews = data.activeNews || [];
      this.newsHistory = data.newsHistory || [];
    }
  }

  /**
   * 添加单条新闻（不清空现有新闻）
   */
  addSingleNews() {
    const allNewsIds = this.getAllAvailableNewsIds();
    const availableIds = allNewsIds.filter(id => 
      !this.activeNews.some(news => news.id === id)
    );
    
    if (availableIds.length === 0) {
      // 如果没有可用的新闻，随机选择一个
      const randomId = allNewsIds[Math.floor(Math.random() * allNewsIds.length)];
      return this.publishNews(randomId);
    }
    
    // 随机选择一个未激活的新闻
    const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
    return this.publishNews(randomId);
  }
}

// 全局新闻管理器实例
export const newsManager = new NewsManager(); 