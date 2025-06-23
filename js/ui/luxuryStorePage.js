import { 
  LUXURY_ITEMS, 
  STOCK_CLERKS,
  DESIGNER,
  calculateRefreshProbabilities,
  calculateRefreshSpeedBonus
} from '../config/luxuryConfig.js';
import { LUXURY_TIME_CONFIG } from '../config/timeConfig.js';
import StoreInfoModal from './storeInfoModal.js';

/**
 * 奢侈品商店页面
 */
export default class LuxuryStorePage {
  constructor() {
    this.isVisible = false;
    this.items = LUXURY_ITEMS;
    this.stockClerks = STOCK_CLERKS;
    this.designer = DESIGNER;
    this.slotsPerRow = 3; // 每行3个商品位置（21个位置，7行）
    this.slotWidth = 85; // 商品栏位大小，放大图标
    this.slotHeight = 85;
    this.slotSpacing = 5; // 栏位间距
    this.hiredClerks = [null, null, null]; // 3个位置的进货员
    this.hiredDesigners = [null, null, null]; // 3个设计师位置
    this.goodsImages = {}; // 商品图片缓存
    this.backgroundImage = null; // 背景图片
    this.productSlots = []; // 21个商品位置
    this.storeInfoModal = new StoreInfoModal(); // 店铺信息弹窗
    this.loadGoodsImages(); // 加载商品图片
    this.loadBackgroundImage(); // 加载背景图片
    this.initializeSlots(); // 初始化商品位置
    
    // 获取画布尺寸
    const canvas = wx.createCanvas();
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
  }

  /**
   * 初始化商品位置
   */
  initializeSlots() {
    this.productSlots = [];
    
    // 前12个位置有商品
    for (let i = 0; i < 12; i++) {
      const item = this.items[i];
      const grade = item.baseGrade;
      this.productSlots.push({
        id: i,
        hasProduct: true,
        product: item,
        grade: grade,
        price: this.getUnifiedPrice(grade), // 使用统一价格
        cooldownEnd: 0,
        purchaseTime: 0, // 购买时间
        baseCooldown: LUXURY_TIME_CONFIG.BASE_COOLDOWN, // 基础冷却时间（从配置导入）
        isEmpty: false
      });
    }
    
    // 后9个位置为空
    for (let i = 12; i < 18; i++) {
      this.productSlots.push({
        id: i,
        hasProduct: false,
        product: null,
        grade: null,
        price: 0,
        cooldownEnd: 0,
        purchaseTime: 0, // 购买时间
        baseCooldown: LUXURY_TIME_CONFIG.BASE_COOLDOWN, // 基础冷却时间（从配置导入）
        isEmpty: true
      });
    }
  }

  /**
   * 加载商品图片
   */
  loadGoodsImages() {
    // 直接加载 image_goods_1 到 image_goods_12
    for (let i = 1; i <= 12; i++) {
      const img = wx.createImage();
      img.src = `images/image_goods_${i}.png`;
      img.onload = () => {
        this.goodsImages[i] = img;
      };
      img.onerror = () => {
        console.error(`Failed to load goods image: image_goods_${i}.png`);
        this.goodsImages[i] = null;
      };
    }
  }

  /**
   * 加载背景图片
   */
  loadBackgroundImage() {
    const img = wx.createImage();
    img.src = 'images/image_luxury_3.png';
    img.onload = () => {
      this.backgroundImage = img;
    };
    img.onerror = () => {
      console.error('Failed to load luxury background image');
      this.backgroundImage = null;
    };
  }

  /**
   * 显示页面
   */
  show() {
    this.isVisible = true;
  }

  /**
   * 隐藏页面
   */
  hide() {
    this.isVisible = false;
  }

  /**
   * 检查槽位是否可以购买
   */
  canPurchaseSlot(slotIndex) {
    // 检查槽位索引是否有效
    if (slotIndex < 0 || slotIndex >= this.productSlots.length) {
      return { canPurchase: false, reason: 'invalid_slot' };
    }

    const slot = this.productSlots[slotIndex];
    
    // 检查槽位是否有商品
    if (!slot.hasProduct || !slot.product) {
      return { canPurchase: false, reason: 'no_product' };
    }

    // 检查是否在冷却期
    if (slot.cooldownEnd > Date.now()) {
      const remainingTime = Math.ceil((slot.cooldownEnd - Date.now()) / 1000);
      return { canPurchase: false, reason: 'cooldown', remainingTime: remainingTime };
    }

    return { canPurchase: true };
  }

  /**
   * 购买商品
   */
  purchaseItem(slotIndex) {
    const canPurchase = this.canPurchaseSlot(slotIndex);
    
    if (!canPurchase.canPurchase) {
      return { success: false, ...canPurchase };
    }

    const slot = this.productSlots[slotIndex];
    
    // 购买成功，设置冷却时间，应用员工速度加成
    const now = Date.now();
    const baseCooldown = LUXURY_TIME_CONFIG.BASE_COOLDOWN; // 基础冷却时间（从配置导入）
    const speedBonus = calculateRefreshSpeedBonus(this.hiredClerks);
    const actualCooldown = baseCooldown * (1 - speedBonus / 100); // 应用速度缩短
    
    slot.purchaseTime = now;
    slot.baseCooldown = baseCooldown;
    slot.cooldownEnd = now + actualCooldown;
    
    const unifiedPrice = this.getUnifiedPrice(slot.grade);
    return {
      success: true,
      item: slot.product,
      price: unifiedPrice, // 使用统一价格
      grade: slot.grade
    };
  }

  /**
   * 招聘进货员到指定位置
   */
  hireClerk(slotIndex, resume) {
    if (slotIndex >= 0 && slotIndex < 3) {
      this.hiredClerks[slotIndex] = resume;
      // 重新计算所有冷却中商品的剩余时间
      this.recalculateCooldowns();
    }
  }

  /**
   * 解雇进货员
   */
  fireClerk(slotIndex) {
    if (slotIndex >= 0 && slotIndex < 3) {
      this.hiredClerks[slotIndex] = null;
      // 重新计算所有冷却中商品的剩余时间
      this.recalculateCooldowns();
    }
  }

  /**
   * 招聘设计师
   */
  hireDesigner(slotIndex, resume) {
    if (slotIndex >= 0 && slotIndex < 3) {
      this.hiredDesigners[slotIndex] = resume;
    }
  }

  /**
   * 解雇设计师
   */
  fireDesigner(slotIndex) {
    if (slotIndex >= 0 && slotIndex < 3) {
      const designer = this.hiredDesigners[slotIndex];
      if (designer) {
        this.hiredDesigners[slotIndex] = null;
      }
    }
  }

  /**
   * 生成设计师简历
   */
  generateDesignerResume() {
    const name = this.generateRandomName();
    const age = Math.floor(Math.random() * 20) + 20; // 20-40岁
    const abilities = this.generateDesignerAbilities();
    
    return {
      name,
      age,
      abilities,
      rating: this.generateRandomRating(), // 添加评级
      salary: this.calculateDesignerSalary(abilities) // 添加薪资
    };
  }

  /**
   * 生成设计师能力
   */
  generateDesignerAbilities() {
    const abilities = [];
    
    // 随机生成1-3个能力
    const abilityCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < abilityCount; i++) {
      const abilityType = Math.random() < 0.2 ? 'SSS_GRADE_BOOST' : 'NORMAL';
      const abilityValue = abilityType === 'SSS_GRADE_BOOST' ? 
        Math.floor(Math.random() * 10) + 1 : // 1-10%
        Math.floor(Math.random() * 5) + 1;   // 1-5%
      
      abilities.push({
        type: abilityType,
        name: abilityType === 'SSS_GRADE_BOOST' ? 'SSS级产品提升' : '普通提升',
        value: abilityValue
      });
    }
    
    return abilities;
  }

  /**
   * 计算设计师薪资
   */
  calculateDesignerSalary(abilities) {
    let baseSalary = 5000;
    abilities.forEach(ability => {
      if (ability.type === 'SSS_GRADE_BOOST') {
        baseSalary += ability.value * 1000;
      } else {
        baseSalary += ability.value * 500;
      }
    });
    return baseSalary;
  }

  /**
   * 生成随机评级
   */
  generateRandomRating() {
    const ratings = ['C', 'B', 'A', 'S', 'SS', 'SSS'];
    const weights = [30, 25, 20, 15, 7, 3]; // 各评级的权重
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return ratings[i];
      }
      random -= weights[i];
    }
    
    return ratings[0]; // 默认返回C级
  }

  /**
   * 刷新设计师简历
   */
  refreshDesignerResume() {
    const newResume = this.generateDesignerResume();
    this.currentDesignerResume = newResume;
    this.messageSystem.addMessage('刷新了设计师简历');
  }

  /**
   * 检查位置是否有设计师
   */
  hasDesignerAtSlot(slotIndex) {
    return slotIndex >= 0 && slotIndex < 3 && this.hiredDesigners[slotIndex] !== null;
  }

  /**
   * 检查位置是否有进货员
   */
  hasClerkAtSlot(slotIndex) {
    return slotIndex >= 0 && slotIndex < 3 && this.hiredClerks[slotIndex] !== null;
  }

  /**
   * 获取员工区域坐标（确保渲染和触摸处理一致）
   */
  getEmployeeAreaCoords() {
    const slotsStartX = 30;
    const slotsStartY = 180;
    const areaX = slotsStartX + 3 * (this.slotWidth + this.slotSpacing) + 20;
    const areaY = slotsStartY + 20; // 下移20px，让进货员文字顶部对齐图标第一行顶部
    const clerkSize = 60;
    const clerkSpacing = 20;
    
    return {
      areaX,
      areaY,
      clerkSize,
      clerkSpacing,
      designerY: areaY + 3 * (clerkSize + clerkSpacing) + 40 // 设计师区域下移
    };
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 处理店铺信息弹窗
    if (this.storeInfoModal.isVisible) {
      const result = this.storeInfoModal.handleTouch(x, y);
      if (result && result.type === 'close') {
        this.storeInfoModal.hide();
      }
      return result;
    }

    // 检查是否点击了返回按钮
    const backButtonX = 30;
    const backButtonY = 30;
    const backButtonSize = 60;
    
    if (x >= backButtonX && x <= backButtonX + backButtonSize &&
        y >= backButtonY && y <= backButtonY + backButtonSize) {
      return { type: 'back' };
    }

    // 检查是否点击了店铺信息按钮（与首页资产列表按钮位置一致）
    const storeInfoButtonX = this.getStoreInfoButtonX();
    const storeInfoButtonY = 100;
    const storeInfoButtonWidth = 120;
    const storeInfoButtonHeight = 45;
    
    if (x >= storeInfoButtonX && x <= storeInfoButtonX + storeInfoButtonWidth &&
        y >= storeInfoButtonY && y <= storeInfoButtonY + storeInfoButtonHeight) {
      // 准备店铺数据
      const storeData = {
        hiredClerks: [...this.hiredClerks], // 创建副本以确保数据最新
        hiredDesigners: [...this.hiredDesigners], // 创建副本以确保数据最新
        productStats: this.getProductStats() // 获取最新的商品统计
      };
      this.storeInfoModal.show(this.canvasWidth, this.canvasHeight, storeData);
      return { type: 'store_info' };
    }

    // 检查是否点击了商品栏位
    const slotsStartX = 30; // 与渲染时保持一致
    const slotsStartY = 180; // 与渲染时保持一致
    
    for (let i = 0; i < this.productSlots.length; i++) {
      const row = Math.floor(i / this.slotsPerRow);
      const col = i % this.slotsPerRow;
      const slotX = slotsStartX + col * (this.slotWidth + this.slotSpacing);
      const slotY = slotsStartY + row * (this.slotHeight + this.slotSpacing);
      
      if (x >= slotX && x <= slotX + this.slotWidth &&
          y >= slotY && y <= slotY + this.slotHeight) {
        
        const slot = this.productSlots[i];
        
        // 根据槽位状态判断点击行为
        if (slot.hasProduct && slot.product) {
          // 有商品的位置
          if (slot.cooldownEnd > Date.now()) {
            const remainingTime = Math.ceil((slot.cooldownEnd - Date.now()) / 1000);
            return { type: 'cooldown', slotIndex: i, remainingTime: remainingTime };
          } else {
            return { type: 'purchase', slotIndex: i, item: slot.product };
          }
        } else {
          // 空位置或无商品
          return { type: 'empty_slot', slotIndex: i };
        }
      }
    }

    // 检查是否点击了进货员区域
    const employeeCoords = this.getEmployeeAreaCoords();
    const { areaX, areaY, clerkSize, clerkSpacing, designerY } = employeeCoords;
    
    for (let i = 0; i < 3; i++) {
      const clerkY = areaY + i * (clerkSize + clerkSpacing);
      
      if (x >= areaX && x <= areaX + clerkSize &&
          y >= clerkY && y <= clerkY + clerkSize) {
        return { type: 'clerk_slot', slotIndex: i, hasClerk: this.hasClerkAtSlot(i) };
      }
    }

    // 检查是否点击了设计师区域（3个位置）
    for (let i = 0; i < 3; i++) {
      const designerSlotY = designerY + i * (clerkSize + clerkSpacing);
      
      if (x >= areaX && x <= areaX + clerkSize &&
          y >= designerSlotY && y <= designerSlotY + clerkSize) {
        return { type: 'designer_slot', slotIndex: i, hasDesigner: this.hasDesignerAtSlot(i) };
      }
    }

    return null;
  }

  /**
   * 更新商品状态
   */
  update() {
    const now = Date.now();
    
    this.productSlots.forEach(slot => {
      if (slot.cooldownEnd > 0) {
        // 检查冷却是否结束
        if (slot.cooldownEnd <= now) {
          slot.cooldownEnd = 0;
          
          // 如果是有商品的槽位，重新生成商品（应用员工概率加成）
          if (slot.hasProduct && slot.id < 12) {
            const probabilities = calculateRefreshProbabilities(this.hiredClerks, this.hiredDesigners);
            const grade = this.randomGrade(probabilities);
            slot.grade = grade;
            slot.price = this.getUnifiedPrice(grade);
          }
        }
      }
    });
  }

  /**
   * 根据概率随机选择商品等级
   */
  randomGrade(probabilities) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [grade, probability] of Object.entries(probabilities)) {
      cumulative += probability;
      if (rand <= cumulative) {
        return grade;
      }
    }
    
    return 'B'; // 默认返回B级
  }

  /**
   * 渲染页面
   */
  render(ctx) {
    if (!this.isVisible) return;

    // 清屏
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制背景（如果有）
    if (this.backgroundImage) {
      ctx.drawImage(this.backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // 渲染返回按钮
    this.renderBackButton(ctx);
    
    // 渲染店铺信息按钮
    this.renderStoreInfoButton(ctx);
    
    // 渲染商品栏位
    this.renderProductSlots(ctx);
    
    // 渲染员工区域
    this.renderEmployeeArea(ctx);
    
    // 渲染店铺信息弹窗
    this.storeInfoModal.render(ctx);
  }

  /**
   * 渲染返回按钮
   */
  renderBackButton(ctx) {
    const buttonX = 30;
    const buttonY = 30;
    const buttonSize = 60;
    
    // 绘制按钮背景
    ctx.fillStyle = '#3498db';
    ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);
    
    // 绘制按钮边框
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonSize, buttonSize);
    
    // 绘制返回箭头
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('←', buttonX + buttonSize / 2, buttonY + buttonSize / 2 + 8);
  }

  /**
   * 获取店铺信息按钮X坐标（与首页资产列表按钮位置一致）
   */
  getStoreInfoButtonX() {
    // 参考首页的资产按钮位置计算
    const buttonWidth = 220; // 金钱按钮宽度
    const spacing = 10;
    const totalWidth = buttonWidth + 120 + spacing;
    const moneyButtonX = (canvas.width - totalWidth) / 2;
    return moneyButtonX + buttonWidth + spacing;
  }

  /**
   * 渲染店铺信息按钮
   */
  renderStoreInfoButton(ctx) {
    const buttonX = this.getStoreInfoButtonX();
    const buttonY = 100;
    const buttonWidth = 120;
    const buttonHeight = 45;
    
    ctx.save();
    
    // 绘制按钮背景 - 金色渐变
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#FFD700'); // 金色顶部
    gradient.addColorStop(0.5, '#FFA500'); // 橙金色中间
    gradient.addColorStop(1, '#DAA520'); // 深金色底部
    ctx.fillStyle = gradient;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // 绘制按钮边框
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // 绘制按钮文字（白色）
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('店铺信息', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
    
    ctx.restore();
  }

  /**
   * 获取商品统计
   */
  getProductStats() {
    const stats = { B: 0, A: 0, S: 0, SSS: 0 };
    
    this.productSlots.forEach(slot => {
      if (slot.hasProduct && slot.grade) {
        stats[slot.grade]++;
      }
    });
    
    return stats;
  }

  /**
   * 获取等级颜色
   */
  getGradeColor(grade) {
    const colors = {
      B: '#8B4513',    // 棕色
      A: '#4169E1',    // 蓝色
      S: '#FFD700',    // 金色
      SSS: '#FF1493'   // 紫红色
    };
    return colors[grade] || '#666666';
  }

  /**
   * 渲染商品栏位
   */
  renderProductSlots(ctx) {
    const slotsStartX = 30; // 左移给右侧员工区域留空间
    const slotsStartY = 180; // 整体下移
    
    for (let i = 0; i < 18; i++) {  // 修改为18个格子
      const row = Math.floor(i / this.slotsPerRow);
      const col = i % this.slotsPerRow;
      const slotX = slotsStartX + col * (this.slotWidth + this.slotSpacing);
      const slotY = slotsStartY + row * (this.slotHeight + this.slotSpacing);
      
      if (i < 12) {
        // 有商品的位置
        this.renderProductSlot(ctx, i, slotX, slotY);
      } else {
        // 空位置
        this.renderEmptySlot(ctx, slotX, slotY);
      }
    }
  }

  /**
   * 获取等级边框样式
   */
  getGradeBorderStyle(grade) {
    switch (grade) {
      case 'SSS':
        return {
          color: '#FFD700', // 金色
          width: 4,
          glow: true,
          glowColor: '#FFF700'
        };
      case 'S':
        return {
          color: '#E6E6FA', // 亮银色
          width: 3,
          glow: true,
          glowColor: '#FFFFFF' // 白色发光效果
        };
      case 'A':
        return {
          color: '#00FF00', // 绿色
          width: 2,
          glow: false
        };
      case 'B':
        return {
          color: '#808080', // 灰色
          width: 2,
          glow: false
        };
      default:
        return {
          color: '#dee2e6',
          width: 1,
          glow: false
        };
    }
  }

  /**
   * 获取统一价格
   */
  getUnifiedPrice(grade) {
    switch (grade) {
      case 'SSS': return 5000000;  // 500万
      case 'S': return 500000;     // 50万
      case 'A': return 50000;      // 5万
      case 'B': return 10000;      // 1万
      default: return 10000;
    }
  }

  /**
   * 渲染单个商品栏位
   */
  renderProductSlot(ctx, slotIndex, x, y) {
    const slot = this.productSlots[slotIndex];
    const isOnCooldown = slot.cooldownEnd > Date.now();
    const borderStyle = this.getGradeBorderStyle(slot.grade);
    
    // 绘制商品图片（紧贴边框，无空隙）
    const goodsImage = this.goodsImages[slotIndex + 1]; // image_goods_1 到 image_goods_12
    if (goodsImage) {
      const imgSize = this.slotWidth; // 图片完全填满槽位
      const imgX = x;
      const imgY = y;
      
      // 半透明处理（如果不在冷却中）
      if (!isOnCooldown) {
        ctx.globalAlpha = 0.9;
      }
      ctx.drawImage(goodsImage, imgX, imgY, imgSize, imgSize);
      ctx.globalAlpha = 1.0;
    }
    
    // 绘制等级边框
    ctx.strokeStyle = borderStyle.color;
    ctx.lineWidth = borderStyle.width;
    
    // 如果需要发光效果
    if (borderStyle.glow) {
      ctx.shadowColor = borderStyle.glowColor;
      ctx.shadowBlur = 8;
      ctx.strokeRect(x, y, this.slotWidth, this.slotHeight);
      
      // 重复绘制增强发光效果
      ctx.shadowBlur = 4;
      ctx.strokeRect(x, y, this.slotWidth, this.slotHeight);
      
      // 清除阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeRect(x, y, this.slotWidth, this.slotHeight);
    }
    
    // 如果在冷却中，显示冷却时间
    if (isOnCooldown) {
      const remainingTime = Math.ceil((slot.cooldownEnd - Date.now()) / 1000);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x, y, this.slotWidth, this.slotHeight);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${remainingTime}s`, x + this.slotWidth / 2, y + this.slotHeight / 2);
    }
  }

  /**
   * 渲染空栏位
   */
  renderEmptySlot(ctx, x, y) {
    // 绘制栏位边框（半透明）
    ctx.strokeStyle = 'rgba(206, 212, 218, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, this.slotWidth, this.slotHeight);
    
    // 绘制空位标识（半透明）
    ctx.fillStyle = 'rgba(108, 117, 125, 0.6)';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('∅', x + this.slotWidth / 2, y + this.slotHeight / 2 + 15);
    
    // 绘制"暂未开放"文字（半透明）
    ctx.fillStyle = 'rgba(108, 117, 125, 0.6)';
    ctx.font = '10px Arial';
    ctx.fillText('暂未开放', x + this.slotWidth / 2, y + this.slotHeight - 15);
  }

  /**
   * 渲染员工区域
   */
  renderEmployeeArea(ctx) {
    const employeeCoords = this.getEmployeeAreaCoords();
    const { areaX, areaY, clerkSize, clerkSpacing, designerY } = employeeCoords;

    // 渲染进货员标题（白色加粗）
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('进货员', areaX, areaY - 10);

    // 渲染3个进货员位置
    for (let i = 0; i < 3; i++) {
      const clerkY = areaY + i * (clerkSize + clerkSpacing);
      const clerk = this.hiredClerks[i];

      // 绘制位置背景（半透明）
      if (clerk) {
        ctx.fillStyle = 'rgba(212, 237, 218, 0.8)'; // 半透明绿色背景
        ctx.strokeStyle = '#28a745';
      } else {
        ctx.fillStyle = 'rgba(248, 249, 250, 0.6)'; // 半透明灰色背景
        ctx.strokeStyle = 'rgba(222, 226, 230, 0.8)';
      }
      ctx.lineWidth = 2;
      ctx.fillRect(areaX, clerkY, clerkSize, clerkSize);
      ctx.strokeRect(areaX, clerkY, clerkSize, clerkSize);

      if (clerk) {
        // 绘制进货员图标
        ctx.fillStyle = '#2c3e50';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(clerk.icon, areaX + clerkSize / 2, clerkY + clerkSize / 2 + 8);
        
        // 绘制进货员名称（白色加粗）
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(clerk.name, areaX + clerkSize / 2, clerkY + clerkSize + 15);
      } else {
        // 绘制空位置标识（加大加粗的绿色加号）
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', areaX + clerkSize / 2, clerkY + clerkSize / 2 + 12);
      }
    }

    // 渲染设计师标题（白色加粗）
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('设计师', areaX, designerY - 10);

    // 渲染3个设计师位置
    for (let i = 0; i < 3; i++) {
      const designerSlotY = designerY + i * (clerkSize + clerkSpacing);
      const designer = this.hiredDesigners[i];

      // 绘制位置背景（半透明）
      if (designer) {
        ctx.fillStyle = 'rgba(212, 237, 218, 0.8)'; // 半透明绿色背景
        ctx.strokeStyle = '#28a745';
      } else {
        ctx.fillStyle = 'rgba(248, 249, 250, 0.6)'; // 半透明灰色背景
        ctx.strokeStyle = 'rgba(222, 226, 230, 0.8)';
      }
      ctx.lineWidth = 2;
      ctx.fillRect(areaX, designerSlotY, clerkSize, clerkSize);
      ctx.strokeRect(areaX, designerSlotY, clerkSize, clerkSize);

      if (designer) {
        // 绘制设计师图标
        ctx.fillStyle = '#2c3e50';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(designer.icon, areaX + clerkSize / 2, designerSlotY + clerkSize / 2 + 8);
        
        // 绘制设计师名称（白色加粗）
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(designer.name, areaX + clerkSize / 2, designerSlotY + clerkSize + 15);
      } else {
        // 绘制空位置标识（加大加粗的绿色加号）
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', areaX + clerkSize / 2, designerSlotY + clerkSize / 2 + 12);
      }
    }
  }

  /**
   * 重新计算所有冷却中商品的剩余时间
   * 当员工状态发生变化时调用
   */
  recalculateCooldowns() {
    const now = Date.now();
    const currentSpeedBonus = calculateRefreshSpeedBonus(this.hiredClerks);
    
    this.productSlots.forEach(slot => {
      if (slot.cooldownEnd > now && slot.purchaseTime > 0) {
        // 基于购买时间和基础冷却时间重新计算
        const timeSincePurchase = now - slot.purchaseTime;
        const newTotalCooldown = slot.baseCooldown * (1 - currentSpeedBonus / 100);
        const newEndTime = slot.purchaseTime + newTotalCooldown;
        
        // 只有当新的结束时间还在未来时才更新
        if (newEndTime > now) {
          slot.cooldownEnd = newEndTime;
        } else {
          // 如果新的冷却时间已经过期，立即结束冷却
          slot.cooldownEnd = 0;
        }
      }
    });
  }
} 