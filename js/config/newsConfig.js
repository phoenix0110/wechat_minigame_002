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
    isRealNews: true, // 是否为真新闻
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
  },
  {
    id: "news_006",
    title: "金融街新增多条地铁线路",
    content: "市交通局发布公告，金融街周边将新增 3 条地铁线路，预计明年年底通车，将极大提升区域交通便利性。",
    district: "financial_district",
    priceEffect: "increase",
    effectValue: 0.03,
    isRealNews: true,
    },
    {
    id: "news_007",
    title: "市中心大型商圈宣布停业改造",
    content: "市中心标志性商圈因设施老化将停业进行为期半年的改造，期间周边商业活动将大幅减少。",
    district: "commercial_district",
    priceEffect: "decrease",
    effectValue: 0.06,
    isRealNews: true,
    },
    {
    id: "news_008",
    title: "科创园区引入国家级实验室",
    content: "国家科技部正式批复在科创园区建设国家级人工智能实验室，将吸引大量科研人才入驻。",
    district: "tech_park",
    priceEffect: "increase",
    effectValue: 0.07,
    isRealNews: true,
    },
    {
    id: "news_009",
    title: "老城区发现历史文物遗址",
    content: "老城区在旧房改造过程中发现一处明清时期文物遗址，相关部门已暂停施工并启动保护程序，周边改造项目可能延期。",
    district: "residential_district",
    priceEffect: "decrease",
    effectValue: 0.02,
    isRealNews: true,
    },
    {
    id: "news_010",
    title: "工业开发新区获重大外资项目",
    content: "全球知名制造业企业宣布在工业开发新区投资 50 亿元建设生产基地，预计将创造上万就业岗位。",
    district: "industrial_district",
    priceEffect: "increase",
    effectValue: 0.04,
    isRealNews: true,
    },
    {
    id: "news_011",
    title: "金融街多家银行传出裁员消息",
    content: "网传金融街内三家大型银行将进行结构性裁员，涉及员工数千人，银行方面暂未回应。",
    district: "financial_district",
    priceEffect: "decrease",
    effectValue: 0.05,
    isRealNews: false,
    },
    {
    id: "news_012",
    title: "老城区将新建多所优质学校",
    content: "教育局规划显示，老城区未来两年内将新建 5 所中小学及 2 所幼儿园，均引入名校教育资源。",
    district: "residential_district",
    priceEffect: "increase",
    effectValue: 0.08,
    isRealNews: true,
    },
    {
    id: "news_013",
    title: "工业开发新区遭遇严重污染事件",
    content: "工业开发新区某化工厂发生泄漏事故，导致周边水源受到污染，环保部门已介入处理。",
    district: "industrial_district",
    priceEffect: "decrease",
    effectValue: 0.04,
    isRealNews: true,
    },
    {
    id: "news_014",
    title: "市中心将建设超高层地标建筑",
    content: "某跨国集团宣布将在市中心投资建设一座 500 米高的超高层地标建筑，包含高端酒店和写字楼。",
    district: "commercial_district",
    priceEffect: "increase",
    effectValue: 0.05,
    isRealNews: false,
    },
    {
    id: "news_015",
    title: "科创园区多家企业面临资金链断裂",
    content: "有媒体报道，科创园区内近 10 家初创企业因融资困难即将停止运营，园区活跃度可能下降。",
    district: "tech_park",
    priceEffect: "decrease",
    effectValue: 0.02,
    isRealNews: true,
    },
    {
    id: "news_016",
    title: "金融街获批国家级金融改革试点",
    content: "国务院正式批复金融街为国家级金融改革试点区域，将享受多项政策红利，吸引更多金融机构聚集。",
    district: "financial_district",
    priceEffect: "increase",
    effectValue: 0.06,
    isRealNews: true,
    },
    {
    id: "news_017",
    title: "市中心大型批发市场将搬迁",
    content: "因城市规划调整，市中心经营 30 年的大型批发市场将整体搬迁至郊区，周边商业氛围或受影响。",
    district: "commercial_district",
    priceEffect: "decrease",
    effectValue: 0.04,
    isRealNews: true,
    },
    {
    id: "news_018",
    title: "科创园区与知名高校共建研发中心",
    content: "科创园区与国内顶尖高校签署合作协议，将共建 5 个前沿科技研发中心，预计引入科研团队 20 余个。",
    district: "tech_park",
    priceEffect: "increase",
    effectValue: 0.07,
    isRealNews: true,
    },
    {
    id: "news_019",
    title: "老城区传言将实施限购政策",
    content: "网络流传老城区即将出台严格的住房限购政策，引发部分业主恐慌性抛售，官方尚未回应。",
    district: "residential_district",
    priceEffect: "decrease",
    effectValue: 0.03,
    isRealNews: false,
    },
    {
    id: "news_020",
    title: "工业开发新区引进新能源汽车龙头企业",
    content: "全球知名新能源汽车企业宣布在工业开发新区建设生产基地，将带动产业链集聚。",
    district: "industrial_district",
    priceEffect: "increase",
    effectValue: 0.03,
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
    this.maxActiveNews = 5; // 最大同时活跃新闻数
  }

  /**
   * 发布新闻
   */
  publishNews(newsId) {
    const newsTemplate = newsConfig.find(news => news.id === newsId);
    if (!newsTemplate) return null;

    // 统一冷却时间为15秒
    const cooldownTime = 15 * 1000; // 15秒
    
    // 随机生效时长：1-4分钟
    const minDuration = 1 * 60 * 1000; // 1分钟
    const maxDuration = 4 * 60 * 1000; // 4分钟
    const randomDuration = minDuration + Math.random() * (maxDuration - minDuration);

    // 创建新闻实例
    const news = {
      ...newsTemplate,
      createdAt: Date.now(),
      effectStartTime: Date.now() + cooldownTime,
      effectEndTime: Date.now() + cooldownTime + randomDuration,
      actualDuration: randomDuration // 保存实际生效时长
    };

    // 如果活跃新闻数量已满，移除最旧的
    if (this.activeNews.length >= this.maxActiveNews) {
      const oldestNews = this.activeNews.shift();
      this.newsHistory.push(oldestNews);
    }

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
   */
  getDistrictEffect(district) {
    const now = Date.now();
    const activeNews = this.getActiveNews();
    
    let totalEffect = 0;
    let effectCount = 0;

    activeNews.forEach(news => {
      // 检查新闻是否已经生效且影响目标district
      if (news.district === district && now >= news.effectStartTime && now <= news.effectEndTime) {
        let effect = news.effectValue;
        
        // 如果是假新闻，效果相反
        if (!news.isRealNews) {
          effect = -effect;
        }
        
        // 如果是下跌新闻，效果为负
        if (news.priceEffect === 'decrease') {
          effect = -Math.abs(effect);
        } else {
          effect = Math.abs(effect);
        }
        
        totalEffect += effect;
        effectCount++;
      }
    });

    return {
      hasEffect: effectCount > 0,
      totalEffect: totalEffect,
      effectCount: effectCount
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
}

// 全局新闻管理器实例
export const newsManager = new NewsManager(); 