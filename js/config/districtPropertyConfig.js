/**
 * 地块房产配置表
 * 每个district中的每个block对应一个房产配置
 * 
 * 配置说明：
 * - districtType: 地块类型（金融街/市中心/科创园区/老城区/工业开发新区）
 * - blockId: 地块编号
 * - propertyName: 房屋名称
 * - decorationType: 装修类型（毛坯/简装/精装/传说）
 * - houseType: 房屋类型（平房/高楼/大平层/别墅）
 * - monthlyRent: 月租金收入（单位：元）
 * - initialPrice: 初始游戏房价（月租金 × 12个月 × 50）
 * - starRating: 房屋登记星号（1-6星，新的分级标准）
 *   1星：500万以下
 *   2星：500-1000万
 *   3星：1000-2000万
 *   4星：2000-5000万
 *   5星：5000万-1亿
 *   6星：1亿以上
 */

// 根据房价自动计算星级的函数
function calculateStarRating(price) {
  if (price < 5000000) return 1;       // 500万以下：1星
  if (price < 10000000) return 2;      // 500-1000万：2星
  if (price < 20000000) return 3;      // 1000-2000万：3星
  if (price < 50000000) return 4;      // 2000-5000万：4星
  if (price < 100000000) return 5;     // 5000万-1亿：5星
  return 6;                            // 1亿以上：6星
}

export const DISTRICT_PROPERTY_CONFIG = [
  // 金融街区域 - 19个block
  {
    districtType: "金融街",
    blockId: "JRJ_01",
    propertyName: "国际金融中心",
    decorationType: "传说",
    houseType: "别墅",
    monthlyRent: 200000, // 20W
    initialPrice: 120000000, // 1.2亿
    starRating: 6 // 1亿以上：6星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_02", 
    propertyName: "九间堂",
    decorationType: "传说",
    houseType: "别墅",
    monthlyRent: 150000, // 15W
    initialPrice: 90000000, // 9000万
    starRating: 5 // 5000万-1亿：5星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_03",
    propertyName: "和园",
    decorationType: "精装",
    houseType: "别墅", 
    monthlyRent: 100000, // 10W
    initialPrice: 60000000, // 6000万
    starRating: 5 // 5000万-1亿：5星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_04",
    propertyName: "翠湖天地",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 50000, // 5W
    initialPrice: 30000000, // 3000万
    starRating: 4 // 2000-5000万：4星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_05",
    propertyName: "紫玉山庄",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 30000, // 3W
    initialPrice: 18000000, // 1800万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_06",
    propertyName: "金融豪庭",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 25000, // 2W5
    initialPrice: 15000000, // 1500万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_07",
    propertyName: "中央公园",
    decorationType: "简装",
    houseType: "大平层",
    monthlyRent: 20000, // 2W
    initialPrice: 12000000, // 1200万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_08",
    propertyName: "银座公寓",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 15000, // 1W5
    initialPrice: 9000000, // 900万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_09",
    propertyName: "金融街小区",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 10000, // 1W
    initialPrice: 6000000, // 600万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_10",
    propertyName: "华贸中心",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 8000, // 8K
    initialPrice: 4800000, // 480万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_11",
    propertyName: "金汇小区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 6000, // 6K
    initialPrice: 3600000, // 360万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_12",
    propertyName: "融景花园",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 4000, // 4K
    initialPrice: 2400000, // 240万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_13",
    propertyName: "财富小区",
    decorationType: "毛坯",
    houseType: "高楼",
    monthlyRent: 3000, // 3K
    initialPrice: 1800000, // 180万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_14",
    propertyName: "金融社区",
    decorationType: "毛坯",
    houseType: "高楼",
    monthlyRent: 2000, // 2K
    initialPrice: 1200000, // 120万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_15",
    propertyName: "银河小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_16",
    propertyName: "第一小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_17",
    propertyName: "第二小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_18",
    propertyName: "第三小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "金融街",
    blockId: "JRJ_19",
    propertyName: "第四小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },

  // 市中心区域 - 16个block
  {
    districtType: "市中心",
    blockId: "SZX_01",
    propertyName: "中央豪庭",
    decorationType: "传说",
    houseType: "别墅",
    monthlyRent: 150000, // 15W
    initialPrice: 90000000, // 9000万
    starRating: 5 // 5000万-1亿：5星
  },
  {
    districtType: "市中心",
    blockId: "SZX_02",
    propertyName: "皇家花园",
    decorationType: "精装",
    houseType: "别墅",
    monthlyRent: 100000, // 10W
    initialPrice: 60000000, // 6000万
    starRating: 5 // 5000万-1亿：5星
  },
  {
    districtType: "市中心",
    blockId: "SZX_03",
    propertyName: "万象天地",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 50000, // 5W
    initialPrice: 30000000, // 3000万
    starRating: 4 // 2000-5000万：4星
  },
  {
    districtType: "市中心",
    blockId: "SZX_04",
    propertyName: "中央广场",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 30000, // 3W
    initialPrice: 18000000, // 1800万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "市中心",
    blockId: "SZX_05",
    propertyName: "国贸大厦",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 25000, // 2W5
    initialPrice: 15000000, // 1500万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "市中心",
    blockId: "SZX_06",
    propertyName: "CBD公寓",
    decorationType: "简装",
    houseType: "大平层",
    monthlyRent: 20000, // 2W
    initialPrice: 12000000, // 1200万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "市中心",
    blockId: "SZX_07",
    propertyName: "市中心小区",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 15000, // 1W5
    initialPrice: 9000000, // 900万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "市中心",
    blockId: "SZX_08",
    propertyName: "商务公寓",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 10000, // 1W
    initialPrice: 6000000, // 600万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "市中心",
    blockId: "SZX_09",
    propertyName: "中心花园",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 8000, // 8K
    initialPrice: 4800000, // 480万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "市中心",
    blockId: "SZX_10",
    propertyName: "都市家园",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 6000, // 6K
    initialPrice: 3600000, // 360万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "市中心",
    blockId: "SZX_11",
    propertyName: "城市小区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 4000, // 4K
    initialPrice: 2400000, // 240万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "市中心",
    blockId: "SZX_12",
    propertyName: "中心社区",
    decorationType: "毛坯",
    houseType: "高楼",
    monthlyRent: 3000, // 3K
    initialPrice: 1800000, // 180万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "市中心",
    blockId: "SZX_13",
    propertyName: "市区小区",
    decorationType: "毛坯",
    houseType: "高楼",
    monthlyRent: 2000, // 2K
    initialPrice: 1200000, // 120万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "市中心",
    blockId: "SZX_14",
    propertyName: "第五小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "市中心",
    blockId: "SZX_15",
    propertyName: "第六小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "市中心",
    blockId: "SZX_16",
    propertyName: "第七小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },

  // 科创园区 - 14个block
  {
    districtType: "科创园区",
    blockId: "KCY_01",
    propertyName: "创新谷",
    decorationType: "精装",
    houseType: "别墅",
    monthlyRent: 100000, // 10W
    initialPrice: 60000000, // 6000万
    starRating: 5 // 5000万-1亿：5星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_02",
    propertyName: "科技园",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 50000, // 5W
    initialPrice: 30000000, // 3000万
    starRating: 4 // 2000-5000万：4星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_03",
    propertyName: "智慧湾",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 30000, // 3W
    initialPrice: 18000000, // 1800万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_04",
    propertyName: "未来城",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 25000, // 2W5
    initialPrice: 15000000, // 1500万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_05",
    propertyName: "创客空间",
    decorationType: "简装",
    houseType: "大平层",
    monthlyRent: 20000, // 2W
    initialPrice: 12000000, // 1200万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_06",
    propertyName: "科创小区",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 15000, // 1W5
    initialPrice: 9000000, // 900万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_07",
    propertyName: "科技花园",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 10000, // 1W
    initialPrice: 6000000, // 600万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_08",
    propertyName: "创新社区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 8000, // 8K
    initialPrice: 4800000, // 480万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_09",
    propertyName: "科研公寓",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 6000, // 6K
    initialPrice: 3600000, // 360万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_10",
    propertyName: "园区小区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 4000, // 4K
    initialPrice: 2400000, // 240万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_11",
    propertyName: "创新小区",
    decorationType: "毛坯",
    houseType: "高楼",
    monthlyRent: 3000, // 3K
    initialPrice: 1800000, // 180万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_12",
    propertyName: "第八小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 2000, // 2K
    initialPrice: 1200000, // 120万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_13",
    propertyName: "第九小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "科创园区",
    blockId: "KCY_14",
    propertyName: "第十小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },

  // 老城区 - 12个block
  {
    districtType: "老城区",
    blockId: "LCQ_01",
    propertyName: "古韵雅居",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 30000, // 3W
    initialPrice: 18000000, // 1800万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_02",
    propertyName: "文化小区",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 25000, // 2W5
    initialPrice: 15000000, // 1500万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_03",
    propertyName: "历史名苑",
    decorationType: "简装",
    houseType: "大平层",
    monthlyRent: 20000, // 2W
    initialPrice: 12000000, // 1200万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_04",
    propertyName: "老城花园",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 15000, // 1W5
    initialPrice: 9000000, // 900万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_05",
    propertyName: "传统小区",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 10000, // 1W
    initialPrice: 6000000, // 600万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_06",
    propertyName: "老城社区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 8000, // 8K
    initialPrice: 4800000, // 480万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_07",
    propertyName: "怀旧小区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 6000, // 6K
    initialPrice: 3600000, // 360万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_08",
    propertyName: "古城小区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 4000, // 4K
    initialPrice: 2400000, // 240万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_09",
    propertyName: "老街社区",
    decorationType: "毛坯",
    houseType: "高楼",
    monthlyRent: 3000, // 3K
    initialPrice: 1800000, // 180万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_10",
    propertyName: "第十一小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 2000, // 2K
    initialPrice: 1200000, // 120万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_11",
    propertyName: "第十二小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "老城区",
    blockId: "LCQ_12",
    propertyName: "第十三小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  },

  // 工业开发新区 - 10个block
  {
    districtType: "工业开发新区",
    blockId: "GY_01",
    propertyName: "工业新城",
    decorationType: "精装",
    houseType: "大平层",
    monthlyRent: 25000, // 2W5
    initialPrice: 15000000, // 1500万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_02",
    propertyName: "开发区花园",
    decorationType: "简装",
    houseType: "大平层",
    monthlyRent: 20000, // 2W
    initialPrice: 12000000, // 1200万
    starRating: 3 // 1000-2000万：3星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_03",
    propertyName: "工业小区",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 15000, // 1W5
    initialPrice: 9000000, // 900万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_04",
    propertyName: "新区公寓",
    decorationType: "精装",
    houseType: "高楼",
    monthlyRent: 10000, // 1W
    initialPrice: 6000000, // 600万
    starRating: 2 // 500-1000万：2星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_05",
    propertyName: "工业社区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 8000, // 8K
    initialPrice: 4800000, // 480万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_06",
    propertyName: "开发小区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 6000, // 6K
    initialPrice: 3600000, // 360万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_07",
    propertyName: "新区小区",
    decorationType: "简装",
    houseType: "高楼",
    monthlyRent: 4000, // 4K
    initialPrice: 2400000, // 240万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_08",
    propertyName: "第十四小区",
    decorationType: "毛坯",
    houseType: "高楼",
    monthlyRent: 3000, // 3K
    initialPrice: 1800000, // 180万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_09",
    propertyName: "第十五小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 2000, // 2K
    initialPrice: 1200000, // 120万
    starRating: 1 // 500万以下：1星
  },
  {
    districtType: "工业开发新区",
    blockId: "GY_10",
    propertyName: "第十六小区",
    decorationType: "毛坯",
    houseType: "平房",
    monthlyRent: 1000, // 1K
    initialPrice: 600000, // 60万
    starRating: 1 // 500万以下：1星
  }
];

/**
 * 根据区域类型获取房产列表
 */
export function getPropertiesByDistrict(districtType) {
  return DISTRICT_PROPERTY_CONFIG.filter(property => 
    property.districtType === districtType
  );
}

/**
 * 根据地块ID获取房产信息
 */
export function getPropertyByBlockId(blockId) {
  return DISTRICT_PROPERTY_CONFIG.find(property => property.blockId === blockId);
}

/**
 * 根据房屋类型获取对应的图片路径
 */
export function getPropertyImageByHouseType(houseType) {
  const imageMap = {
    '别墅': ['villa_1.png', 'villa_2.png', 'villa_3.png', 'villa_4.png'],
    '大平层': ['highrise_1.png', 'highrise_2.png', 'highrise_3.png'],
    '高楼': ['normal_1.png', 'normal_2.png', 'normal_3.png', 'normal_4.png'],
    '平房': ['small_1.png', 'small_2.png']
  };
  
  const imageFiles = imageMap[houseType];
  if (imageFiles && imageFiles.length > 0) {
    // 根据房屋名称或随机选择一个图片
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    return `images/${imageFiles[randomIndex]}`;
  }
  
  // 默认图片
  return 'images/image_building_1.png';
}

/**
 * 根据blockId获取特定的图片路径（更精确的映射）
 */
export function getPropertyImageByBlockId(blockId) {
  const property = getPropertyByBlockId(blockId);
  if (!property) {
    return 'images/image_building_1.png';
  }
  
  return getPropertyImageByHouseType(property.houseType);
}

// 根据房价动态计算星级的函数，供其他模块使用
export function getStarRatingByPrice(price) {
  return calculateStarRating(price);
} 