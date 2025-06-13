/**
 * 建筑管理器
 * 负责管理所有建筑的数据和交互逻辑
 */
export default class BuildingManager {
  constructor() {
    this.buildings = [
      { 
        id: 0,
        name: '奢侈品店', 
        color: '#96CEB4', 
        icon: 'images/image_luxury_1.png',
        description: '购买奢侈品',
        costRange: { min: 10000000, max: 500000000 }, // 1000万-5亿
        unlocked: true
      },
      { 
        id: 1,
        name: '4S店', 
        color: '#BB8FCE', 
        icon: 'images/image_4s_1.png',
        description: '购买豪车',
        costRange: { min: 5000000, max: 100000000 }, // 500万-1亿
        unlocked: true
      },
      { 
        id: 2,
        name: '售楼处', 
        color: '#98D8C8', 
        icon: 'images/image_sell_house_1.png',
        description: '购买房产',
        costRange: { min: 50000000, max: 1000000000 }, // 5000万-10亿
        unlocked: true
      },
      { 
        id: 3,
        name: '学校', 
        color: '#4ECDC4', 
        icon: 'images/image_school_1.png',
        description: '教育投资',
        costRange: { min: 50000000, max: 200000000 }, // 5000万-2亿
        unlocked: true
      },
      { 
        id: 4,
        name: '写字楼', 
        color: '#DDA0DD', 
        icon: 'images/image_office_1.png',
        description: '商业投资',
        costRange: { min: 100000000, max: 2000000000 }, // 1亿-20亿
        unlocked: true
      },
      { 
        id: 5,
        name: '体育场', 
        color: '#F7DC6F', 
        icon: 'images/image_stadium_1.png',
        description: '体育投资',
        costRange: { min: 200000000, max: 3000000000 }, // 2亿-30亿
        unlocked: true
      }
    ];
  }

  /**
   * 获取所有建筑
   */
  getAllBuildings() {
    return this.buildings;
  }

  /**
   * 根据ID获取建筑
   */
  getBuildingById(id) {
    return this.buildings.find(building => building.id === id);
  }

  /**
   * 获取建筑的随机花费金额
   */
  getRandomCost(buildingId) {
    const building = this.getBuildingById(buildingId);
    if (!building) return 0;
    
    const { min, max } = building.costRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 处理建筑交互
   */
  interactWithBuilding(buildingId, currentMoney) {
    const building = this.getBuildingById(buildingId);
    if (!building || !building.unlocked) return null;

    const cost = this.getRandomCost(buildingId);
    
    if (currentMoney >= cost) {
      return {
        success: true,
        building,
        cost,
        message: `在${building.name}花费了${this.formatMoney(cost)}`
      };
    } else {
      return {
        success: false,
        building,
        cost,
        message: `余额不足，无法在${building.name}消费`
      };
    }
  }

  /**
   * 格式化金钱显示
   */
  formatMoney(amount) {
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(1) + '亿';
    } else if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    } else {
      return amount.toString();
    }
  }
} 