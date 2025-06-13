/**
 * 员工数值系统配置
 */

/**
 * 进货员能力类型
 */
export const CLERK_ABILITY_TYPES = {
  SPEED_REDUCTION: 'speed_reduction',    // 缩短进货速度
  A_GRADE_BOOST: 'a_grade_boost',       // A级产品概率提升
  S_GRADE_BOOST: 's_grade_boost'        // S级产品概率提升
};

/**
 * 进货速度缩短的随机范围和概率
 * 范围：[-1%, -2%, -3%, -4%, -5%, -10%, -20%]
 * 概率：1-5%各19%，10%为4%，20%为1%
 */
export const SPEED_REDUCTION_CONFIG = {
  values: [-1, -2, -3, -4, -5, -10, -20],
  probabilities: [19, 19, 19, 19, 19, 4, 1], // 总和100%
  weights: [19, 38, 57, 76, 95, 99, 100] // 累积概率用于随机选择
};

/**
 * A级和S级产品概率提升的随机范围和概率
 * 范围：[+1%, +2%, +3%, +4%, +5%, +10%]
 * 概率：各1/6 (约16.67%)
 */
export const GRADE_BOOST_CONFIG = {
  values: [1, 2, 3, 4, 5, 10],
  probabilities: [16.67, 16.67, 16.67, 16.67, 16.67, 16.65], // 总和100%
  weights: [16.67, 33.34, 50.01, 66.68, 83.35, 100] // 累积概率用于随机选择
};

// S级专用配置，最大值为20%
export const S_GRADE_BOOST_CONFIG = {
  values: [1, 2, 3, 4, 5, 20],
  probabilities: [16.67, 16.67, 16.67, 16.67, 16.67, 16.65], // 总和100%
  weights: [16.67, 33.34, 50.01, 66.68, 83.35, 100] // 累积概率用于随机选择
};

/**
 * 设计师能力类型
 */
export const DESIGNER_ABILITY_TYPES = {
  SSS_GRADE_BOOST: 'sss_grade_boost'    // SSS级产品概率提升
};

/**
 * 员工评级配置
 */
export const EMPLOYEE_RATINGS = {
  GENIUS: { name: '天纵奇才', salary: 2000000, minMaxAbilities: 3 },      // 200万
  EXCEPTIONAL: { name: '万里挑一', salary: 1000000, minMaxAbilities: 2 }, // 100万
  ELITE: { name: '人中龙凤', salary: 500000, minMaxAbilities: 1 },        // 50万
  ORDINARY: { name: '普通员工', salary: 100000, minMaxAbilities: 0 }      // 10万
};

/**
 * 最强能力值定义
 */
export const MAX_ABILITY_VALUES = {
  SPEED_REDUCTION: -20,  // 进货时间缩短20%
  A_GRADE_BOOST: 10,     // A级出现+10%
  S_GRADE_BOOST: 20      // S级出现+20%
};

/**
 * 员工数值生成器
 */
export class EmployeeStatsGenerator {
  /**
   * 根据权重随机选择值
   */
  static getRandomValueByWeight(config) {
    const random = Math.random() * 100;
    
    for (let i = 0; i < config.weights.length; i++) {
      if (random <= config.weights[i]) {
        return config.values[i];
      }
    }
    
    // fallback到最后一个值
    return config.values[config.values.length - 1];
  }

  /**
   * 生成进货员数值
   */
  static generateClerkStats() {
    const abilities = [];
    
    // 每个进货员随机获得1-3个能力
    const abilityCount = Math.floor(Math.random() * 3) + 1;
    const availableAbilities = Object.values(CLERK_ABILITY_TYPES);
    
    // 随机选择能力类型（不重复）
    const selectedAbilities = [];
    while (selectedAbilities.length < abilityCount && selectedAbilities.length < availableAbilities.length) {
      const randomAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
      if (!selectedAbilities.includes(randomAbility)) {
        selectedAbilities.push(randomAbility);
      }
    }
    
    // 为每个选中的能力生成数值
    selectedAbilities.forEach(abilityType => {
      let value;
      
      switch (abilityType) {
        case CLERK_ABILITY_TYPES.SPEED_REDUCTION:
          value = this.getRandomValueByWeight(SPEED_REDUCTION_CONFIG);
          break;
        case CLERK_ABILITY_TYPES.A_GRADE_BOOST:
          value = this.getRandomValueByWeight(GRADE_BOOST_CONFIG);
          break;
        case CLERK_ABILITY_TYPES.S_GRADE_BOOST:
          value = this.getRandomValueByWeight(S_GRADE_BOOST_CONFIG);
          break;
        default:
          value = 0;
      }
      
      abilities.push({
        type: abilityType,
        value: value
      });
    });
    
    return abilities;
  }

  /**
   * 生成设计师数值
   */
  static generateDesignerStats() {
    // 设计师专门提升SSS级产品概率
    const sssBoost = this.getRandomValueByWeight(GRADE_BOOST_CONFIG);
    
    return [{
      type: DESIGNER_ABILITY_TYPES.SSS_GRADE_BOOST,
      value: sssBoost
    }];
  }

  /**
   * 计算所有进货员的叠加效果
   */
  static calculateClerkTotalEffects(clerks) {
    const totalEffects = {
      speedReduction: 0,
      aGradeBoost: 0,
      sGradeBoost: 0
    };
    
    clerks.forEach(clerk => {
      if (clerk && clerk.abilities) {
        clerk.abilities.forEach(ability => {
          switch (ability.type) {
            case CLERK_ABILITY_TYPES.SPEED_REDUCTION:
              totalEffects.speedReduction += Math.abs(ability.value); // 转为正数累加
              break;
            case CLERK_ABILITY_TYPES.A_GRADE_BOOST:
              totalEffects.aGradeBoost += ability.value;
              break;
            case CLERK_ABILITY_TYPES.S_GRADE_BOOST:
              totalEffects.sGradeBoost += ability.value;
              break;
          }
        });
      }
    });
    
    return totalEffects;
  }

  /**
   * 计算所有设计师的叠加效果
   */
  static calculateDesignerTotalEffects(designers) {
    let totalSSSBoost = 0;
    
    designers.forEach(designer => {
      if (designer && designer.abilities) {
        designer.abilities.forEach(ability => {
          if (ability.type === DESIGNER_ABILITY_TYPES.SSS_GRADE_BOOST) {
            totalSSSBoost += ability.value;
          }
        });
      }
    });
    
    return {
      sssGradeBoost: totalSSSBoost
    };
  }

  /**
   * 获取能力描述文本
   */
  static getAbilityDescription(ability) {
    switch (ability.type) {
      case CLERK_ABILITY_TYPES.SPEED_REDUCTION:
        return `进货速度 ${ability.value}%`;
      case CLERK_ABILITY_TYPES.A_GRADE_BOOST:
        return `A级概率 +${ability.value}%`;
      case CLERK_ABILITY_TYPES.S_GRADE_BOOST:
        return `S级概率 +${ability.value}%`;
      case DESIGNER_ABILITY_TYPES.SSS_GRADE_BOOST:
        return `SSS级概率 +${ability.value}%`;
      default:
        return '未知能力';
    }
  }

  /**
   * 获取能力颜色（用于UI显示）
   */
  static getAbilityColor(ability) {
    switch (ability.type) {
      case CLERK_ABILITY_TYPES.SPEED_REDUCTION:
        return '#00BFFF'; // 蓝色 - 速度
      case CLERK_ABILITY_TYPES.A_GRADE_BOOST:
        return '#00FF00'; // 绿色 - A级
      case CLERK_ABILITY_TYPES.S_GRADE_BOOST:
        return '#C0C0C0'; // 银色 - S级
      case DESIGNER_ABILITY_TYPES.SSS_GRADE_BOOST:
        return '#FFD700'; // 金色 - SSS级
      default:
        return '#FFFFFF'; // 白色 - 默认
    }
  }

  /**
   * 检查能力是否达到最强值
   */
  static isMaxAbility(ability) {
    switch (ability.type) {
      case CLERK_ABILITY_TYPES.SPEED_REDUCTION:
        return ability.value === MAX_ABILITY_VALUES.SPEED_REDUCTION;
      case CLERK_ABILITY_TYPES.A_GRADE_BOOST:
        return ability.value === MAX_ABILITY_VALUES.A_GRADE_BOOST;
      case CLERK_ABILITY_TYPES.S_GRADE_BOOST:
        return ability.value === MAX_ABILITY_VALUES.S_GRADE_BOOST;
      default:
        return false;
    }
  }

  /**
   * 计算进货员评级
   */
  static calculateClerkRating(abilities) {
    let maxAbilityCount = 0;
    
    abilities.forEach(ability => {
      if (this.isMaxAbility(ability)) {
        maxAbilityCount++;
      }
    });

    // 根据最强能力数量确定评级
    if (maxAbilityCount >= 3) {
      return EMPLOYEE_RATINGS.GENIUS;
    } else if (maxAbilityCount >= 2) {
      return EMPLOYEE_RATINGS.EXCEPTIONAL;
    } else if (maxAbilityCount >= 1) {
      return EMPLOYEE_RATINGS.ELITE;
    } else {
      return EMPLOYEE_RATINGS.ORDINARY;
    }
  }

  /**
   * 计算设计师评级（暂时使用简化逻辑）
   */
  static calculateDesignerRating(abilities) {
    // 设计师只有一个能力，根据SSS级加成值确定评级
    const sssAbility = abilities.find(ability => ability.type === DESIGNER_ABILITY_TYPES.SSS_GRADE_BOOST);
    
    if (sssAbility && sssAbility.value === 10) {
      return EMPLOYEE_RATINGS.ELITE; // 最高SSS加成的设计师为人中龙凤
    } else if (sssAbility && sssAbility.value >= 5) {
      return EMPLOYEE_RATINGS.ORDINARY; // 中等加成为普通员工
    } else {
      return EMPLOYEE_RATINGS.ORDINARY; // 其他为普通员工
    }
  }

  /**
   * 生成完整的员工对象（包含评级和薪资）
   */
  static generateCompleteEmployee(isDesigner = false, baseInfo = {}) {
    let abilities;
    let rating;
    
    if (isDesigner) {
      abilities = this.generateDesignerStats();
      rating = this.calculateDesignerRating(abilities);
    } else {
      abilities = this.generateClerkStats();
      rating = this.calculateClerkRating(abilities);
    }

    return {
      ...baseInfo,
      abilities: abilities,
      rating: rating.name,
      salary: rating.salary,
      hiredAt: Date.now()
    };
  }

  /**
   * 获取评级颜色
   */
  static getRatingColor(ratingName) {
    switch (ratingName) {
      case '天纵奇才':
        return '#FF6B35'; // 橙红色
      case '万里挑一':
        return '#9B59B6'; // 紫色
      case '人中龙凤':
        return '#3498DB'; // 蓝色
      case '普通员工':
        return '#95A5A6'; // 灰色
      default:
        return '#95A5A6';
    }
  }
}

export default EmployeeStatsGenerator; 