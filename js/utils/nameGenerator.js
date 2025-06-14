/**
 * 中国人姓名随机生成器
 */

// 常见姓氏
const SURNAMES = [
  '李', '王', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
  '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '梁',
  '郑', '罗', '宋', '谢', '唐', '韩', '曹', '许', '邓', '萧',
  '冯', '曾', '程', '蔡', '彭', '潘', '袁', '于', '董', '余',
  '苏', '叶', '吕', '魏', '蒋', '田', '杜', '丁', '沈', '姜'
];

// 常见名字（单字）
const GIVEN_NAMES_SINGLE = [
  '伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋',
  '勇', '艳', '杰', '娟', '涛', '明', '超', '秀', '霞', '平',
  '刚', '桂', '英', '华', '辉', '鑫', '嘉', '博', '宇', '昊',
  '琳', '薇', '雯', '萍', '红', '丹', '蕾', '莉', '倩', '颖'
];

// 常见名字（双字）
const GIVEN_NAMES_DOUBLE = [
  '志强', '建华', '海燕', '晓明', '春花', '国强', '建军', '海涛',
  '志华', '建国', '春梅', '海军', '志明', '建平', '春燕', '海峰',
  '俊杰', '美丽', '文华', '小明', '雅芳', '建伟', '春霞', '海龙',
  '志勇', '建林', '春兰', '海波', '志平', '建设', '春玲', '海斌',
  '嘉豪', '思雨', '浩然', '雨萱', '子轩', '梓涵', '欣怡', '佳怡'
];

/**
 * 生成随机中国人姓名
 */
export function generateRandomChineseName() {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  
  // 70%概率生成双字名，30%概率生成单字名
  if (Math.random() < 0.7) {
    const givenName = GIVEN_NAMES_DOUBLE[Math.floor(Math.random() * GIVEN_NAMES_DOUBLE.length)];
    return surname + givenName;
  } else {
    const givenName = GIVEN_NAMES_SINGLE[Math.floor(Math.random() * GIVEN_NAMES_SINGLE.length)];
    return surname + givenName;
  }
}

/**
 * 生成随机年龄（22-50岁）
 */
export function generateRandomAge() {
  return Math.floor(Math.random() * (50 - 22 + 1)) + 22;
}

// 员工图标列表
const EMPLOYEE_ICONS = [
  '👨‍💼', '👩‍💼', '🧑‍💼', '👨‍💻', '👩‍💻', '🧑‍💻',
  '👨‍🔧', '👩‍🔧', '🧑‍🔧', '👨‍🎨', '👩‍🎨', '🧑‍🎨',
  '👨‍🏭', '👩‍🏭', '🧑‍🏭', '👨‍🔬', '👩‍🔬', '🧑‍🔬'
];

/**
 * 生成随机进货员简历
 */
export function generateClerkResume(clerkType) {
  const name = generateRandomChineseName();
  const age = generateRandomAge();
  const icon = EMPLOYEE_ICONS[Math.floor(Math.random() * EMPLOYEE_ICONS.length)];
  
  // 根据进货员类型生成不同的能力范围
  let speedBonus, sLevelBonus, sssLevelBonus;
  
  switch (clerkType) {
    case 1: // 初级进货员
      speedBonus = Math.floor(Math.random() * 15) + 10; // 10-25%
      sLevelBonus = Math.floor(Math.random() * 8) + 2;  // 2-10%
      sssLevelBonus = Math.floor(Math.random() * 3) + 1; // 1-3%
      break;
    case 2: // 高级进货员
      speedBonus = Math.floor(Math.random() * 20) + 30; // 30-50%
      sLevelBonus = Math.floor(Math.random() * 10) + 8; // 8-18%
      sssLevelBonus = Math.floor(Math.random() * 5) + 3; // 3-8%
      break;
    case 3: // 专业进货员
      speedBonus = Math.floor(Math.random() * 30) + 60; // 60-90%
      sLevelBonus = Math.floor(Math.random() * 15) + 15; // 15-30%
      sssLevelBonus = Math.floor(Math.random() * 8) + 7; // 7-15%
      break;
    default:
      speedBonus = 20;
      sLevelBonus = 5;
      sssLevelBonus = 2;
  }
  
  return {
    name,
    age,
    icon,
    speedBonus,
    sLevelBonus,
    sssLevelBonus,
    clerkType
  };
} 


/**
 * 生成随机进货员简历
 */
export function generateDesignerResume() {
  const name = generateRandomChineseName();
  const age = generateRandomAge();
  const icon = EMPLOYEE_ICONS[Math.floor(Math.random() * EMPLOYEE_ICONS.length)];
  
  // 根据设计师类型生成不同的能力范围
  let sssLevelBonus = Math.floor(Math.random() * 3) + 1; // 1-3% 
  
  return {
    name,
    age,
    icon,
    sssLevelBonus
  };
} 