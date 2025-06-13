import { 
  LUXURY_ITEMS,
  PRODUCT_GRADES,
  REFRESH_CONFIG,
  STOCK_CLERKS,
  DESIGNER,
  SLOT_STATUS,
  formatPrice, 
  formatTime,
  isItemOnCooldown, 
  getRemainingCooldown, 
  setItemCooldown,
  getStockClerkById,
  applySpeedBonus,
  getStoreLevel,
  getGradeStats,
  getProductSlots,
  initializeProductSlots,
  updateProductSlots,
  purchaseProduct,
  getSlotCooldown,
  calculateRefreshProbabilities
} from '../config/luxuryConfig.js';

/**
 * 奢侈品商店弹窗界面
 */
export default class LuxuryModal {
  constructor() {
    this.isVisible = false;
    this.items = LUXURY_ITEMS;
    this.stockClerks = STOCK_CLERKS;
    this.designer = DESIGNER;
    this.slotsPerRow = 7; // 每行7个商品位置（21个位置，3行）
    this.slotWidth = 50; // 减小位置大小以适应更多位置
    this.slotHeight = 70; // 位置高度
    this.modalWidth = 420; // 增加弹窗宽度以适应7列
    this.modalHeight = 580; // 增加弹窗高度
    this.modalX = 0;
    this.modalY = 0;
    this.hiredClerks = [null, null, null]; // 3个位置的进货员，null表示空位置
    this.hiredDesigner = null; // 设计师位置
    this.goodsImages = {}; // 商品图片缓存
    this.backgroundImage = null; // 背景图片
    this.updateTimer = null; // 更新定时器
    this.loadGoodsImages(); // 加载商品图片
    this.loadBackgroundImage(); // 加载背景图片
    
    // 初始化商品位置
    initializeProductSlots();
    
    // 启动更新定时器
    this.startUpdateTimer();
  }

  /**
   * 启动更新定时器
   */
  startUpdateTimer() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    this.updateTimer = setInterval(() => {
      updateProductSlots(this.hiredClerks.filter(clerk => clerk !== null), this.hiredDesigner !== null);
    }, 1000); // 每秒更新一次
  }

  /**
   * 停止更新定时器
   */
  stopUpdateTimer() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * 加载商品图片
   */
  loadGoodsImages() {
    this.items.forEach(item => {
      const img = wx.createImage();
      img.src = item.icon;
      img.onload = () => {
        this.goodsImages[item.id] = img;
      };
      img.onerror = () => {
        console.error(`Failed to load goods image: ${item.name}`);
        this.goodsImages[item.id] = null;
      };
    });
  }

  /**
   * 加载背景图片
   */
  loadBackgroundImage() {
    const img = wx.createImage();
    img.src = 'images/image_luxury_2.png';
    img.onload = () => {
      this.backgroundImage = img;
    };
    img.onerror = () => {
      console.error('Failed to load luxury background image');
      this.backgroundImage = null;
    };
  }

  /**
   * 显示弹窗
   */
  show(canvasWidth, canvasHeight) {
    this.isVisible = true;
    // 居中显示弹窗
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
    
    // 启动更新定时器
    this.startUpdateTimer();
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    // 停止更新定时器
    this.stopUpdateTimer();
  }

  /**
   * 招聘进货员到指定位置
   */
  hireClerk(slotIndex, resume) {
    if (slotIndex >= 0 && slotIndex < 3) {
      this.hiredClerks[slotIndex] = resume;
    }
  }

  /**
   * 解雇进货员
   */
  fireClerk(slotIndex) {
    if (slotIndex >= 0 && slotIndex < 3) {
      this.hiredClerks[slotIndex] = null;
    }
  }

  /**
   * 招聘设计师
   */
  hireDesigner(resume) {
    this.hiredDesigner = resume;
  }

  /**
   * 解雇设计师
   */
  fireDesigner() {
    this.hiredDesigner = null;
  }

  /**
   * 检查位置是否有进货员
   */
  hasClerkAtSlot(slotIndex) {
    return slotIndex >= 0 && slotIndex < 3 && this.hiredClerks[slotIndex] !== null;
  }

  /**
   * 获取进货员总加速效果
   */
  getTotalSpeedBonus() {
    let totalBonus = 0;
    this.hiredClerks.forEach(clerk => {
      if (clerk) {
        totalBonus += clerk.speedBonus;
      }
    });
    return totalBonus;
  }

  /**
   * 购买商品位置
   */
  purchaseSlot(slotIndex) {
    return purchaseProduct(slotIndex);
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    if (!this.isVisible) return null;

    // 检查是否点击了关闭按钮
    const closeButtonX = this.modalX + this.modalWidth - 30;
    const closeButtonY = this.modalY + 10;
    if (x >= closeButtonX && x <= closeButtonX + 20 && 
        y >= closeButtonY && y <= closeButtonY + 20) {
      this.hide();
      return { type: 'close' };
    }

    // 检查是否点击了商品位置
    const contentX = this.modalX + 15;
    const contentY = this.modalY + 80; // 为概率显示留出空间
    const slots = getProductSlots();
    
    for (let i = 0; i < slots.length; i++) {
      const row = Math.floor(i / this.slotsPerRow);
      const col = i % this.slotsPerRow;
      const slotX = contentX + col * (this.slotWidth + 3);
      const slotY = contentY + row * (this.slotHeight + 3);
      
      if (x >= slotX && x <= slotX + this.slotWidth &&
          y >= slotY && y <= slotY + this.slotHeight) {
        
        const slot = slots[i];
        
        if (slot.status === SLOT_STATUS.EMPTY) {
          return { type: 'empty_slot', slotIndex: i };
        } else if (slot.status === SLOT_STATUS.COOLDOWN) {
          return { type: 'cooldown', slotIndex: i, remainingTime: getSlotCooldown(i) };
        } else if (slot.status === SLOT_STATUS.AVAILABLE && slot.product) {
          return { type: 'purchase', slotIndex: i, slot: slot };
        }
      }
    }

    // 检查是否点击了进货员区域
    const clerkAreaX = this.modalX + this.modalWidth - 45;
    const clerkAreaY = this.modalY + 300;
    const clerkSize = 40;
    const clerkSpacing = 15;
    
    for (let i = 0; i < 3; i++) {
      const clerkY = clerkAreaY + i * (clerkSize + clerkSpacing);
      
      if (x >= clerkAreaX && x <= clerkAreaX + clerkSize &&
          y >= clerkY && y <= clerkY + clerkSize) {
        return { type: 'clerk_slot', slotIndex: i, hasClerk: this.hasClerkAtSlot(i) };
      }
    }

    // 检查是否点击了设计师区域
    const designerAreaX = this.modalX + this.modalWidth - 45;
    const designerAreaY = this.modalY + 450;
    const designerSize = 40;
    
    if (x >= designerAreaX && x <= designerAreaX + designerSize &&
        y >= designerAreaY && y <= designerAreaY + designerSize) {
      return { type: 'designer_slot', hasDesigner: this.hiredDesigner !== null };
    }

    return null;
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible) return;

    // 绘制模糊背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制弹窗背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制边框
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制关闭按钮
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(this.modalX + this.modalWidth - 30, this.modalY + 10, 20, 20);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', this.modalX + this.modalWidth - 20, this.modalY + 25);

    // 绘制标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('奢侈品商店', this.modalX + 20, this.modalY + 30);

    // 绘制概率信息
    this.renderProbabilityInfo(ctx);

    // 绘制商品网格
    this.renderSlotGrid(ctx);
    
    // 绘制进货员区域
    this.renderStockClerkArea(ctx);
    
    // 绘制商店信息
    this.renderStoreInfo(ctx);
  }

  /**
   * 渲染概率信息
   */
  renderProbabilityInfo(ctx) {
    const probabilities = calculateRefreshProbabilities(
      this.hiredClerks.filter(clerk => clerk !== null),
      this.hiredDesigner !== null
    );
    
    const infoY = this.modalY + 50;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    let infoText = `刷新概率: `;
    infoText += `B级${(probabilities.B * 100).toFixed(1)}% `;
    infoText += `A级${(probabilities.A * 100).toFixed(1)}% `;
    infoText += `S级${(probabilities.S * 100).toFixed(1)}% `;
    infoText += `SSS级${(probabilities.SSS * 100).toFixed(1)}%`;
    
    ctx.fillStyle = '#6c757d';
    ctx.fillText(infoText, this.modalX + 20, infoY);
  }

  /**
   * 渲染商品位置网格
   */
  renderSlotGrid(ctx) {
    const contentX = this.modalX + 15;
    const contentY = this.modalY + 80;
    const slots = getProductSlots();
    
    for (let i = 0; i < slots.length; i++) {
      const row = Math.floor(i / this.slotsPerRow);
      const col = i % this.slotsPerRow;
      const slotX = contentX + col * (this.slotWidth + 3);
      const slotY = contentY + row * (this.slotHeight + 3);
      
      const slot = slots[i];
      
      // 绘制位置背景
      if (slot.status === SLOT_STATUS.EMPTY) {
        ctx.fillStyle = '#e9ecef';
        ctx.strokeStyle = '#ced4da';
      } else if (slot.status === SLOT_STATUS.COOLDOWN) {
        ctx.fillStyle = '#fff3cd';
        ctx.strokeStyle = '#ffeaa7';
      } else {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#dee2e6';
      }
      
      ctx.fillRect(slotX, slotY, this.slotWidth, this.slotHeight);
      ctx.lineWidth = 1;
      ctx.strokeRect(slotX, slotY, this.slotWidth, this.slotHeight);
      
      if (slot.status === SLOT_STATUS.EMPTY) {
        // 绘制空位置标识
        ctx.fillStyle = '#6c757d';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('∅', slotX + this.slotWidth / 2, slotY + this.slotHeight / 2 + 8);
      } else if (slot.status === SLOT_STATUS.COOLDOWN) {
        // 绘制冷却时间
        const cooldown = getSlotCooldown(i);
        ctx.fillStyle = '#e17055';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${cooldown}s`, slotX + this.slotWidth / 2, slotY + this.slotHeight / 2);
      } else if (slot.product) {
        // 绘制商品
        this.renderSlotProduct(ctx, slot, slotX, slotY);
      }
    }
  }

  /**
   * 渲染单个位置的商品
   */
  renderSlotProduct(ctx, slot, x, y) {
    // 绘制等级背景色
    const gradeColor = PRODUCT_GRADES[slot.grade]?.color || '#8B4513';
    ctx.fillStyle = gradeColor + '20'; // 20% 透明度
    ctx.fillRect(x + 2, y + 2, this.slotWidth - 4, 15);
    
    // 绘制等级标签
    ctx.fillStyle = gradeColor;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(slot.grade, x + this.slotWidth / 2, y + 12);
    
    // 绘制商品图片（如果有）
    if (this.goodsImages[slot.product.id]) {
      const img = this.goodsImages[slot.product.id];
      const imgSize = 24;
      const imgX = x + (this.slotWidth - imgSize) / 2;
      const imgY = y + 18;
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    }
    
    // 绘制价格
    ctx.fillStyle = '#2c3e50';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    const priceText = formatPrice(slot.price);
    ctx.fillText(priceText, x + this.slotWidth / 2, y + this.slotHeight - 5);
  }

  /**
   * 渲染进货员区域
   */
  renderStockClerkArea(ctx) {
    const clerkAreaX = this.modalX + this.modalWidth - 45;
    const clerkAreaY = this.modalY + 300;
    const clerkSize = 40;
    const clerkSpacing = 15;

    // 绘制进货员标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('进货员', this.modalX + this.modalWidth - 90, clerkAreaY - 10);

    // 绘制进货员位置
    for (let i = 0; i < 3; i++) {
      const clerkY = clerkAreaY + i * (clerkSize + clerkSpacing);
      const clerk = this.hiredClerks[i];

      // 绘制位置背景
      ctx.fillStyle = clerk ? '#d4edda' : '#f8f9fa';
      ctx.strokeStyle = clerk ? '#28a745' : '#dee2e6';
      ctx.lineWidth = 2;
      ctx.fillRect(clerkAreaX, clerkY, clerkSize, clerkSize);
      ctx.strokeRect(clerkAreaX, clerkY, clerkSize, clerkSize);

      if (clerk) {
        // 绘制进货员图标和信息
        ctx.fillStyle = '#2c3e50';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(clerk.icon, clerkAreaX + clerkSize / 2, clerkY + clerkSize / 2 + 7);
        
        // 绘制加成信息
        ctx.fillStyle = '#28a745';
        ctx.font = '8px Arial';
        ctx.textAlign = 'left';
        const bonusText = `A+${clerk.aProbabilityBonus}% S+${clerk.sProbabilityBonus}%`;
        ctx.fillText(bonusText, clerkAreaX - 80, clerkY + 12);
      } else {
        // 绘制空位置标识
        ctx.fillStyle = '#6c757d';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', clerkAreaX + clerkSize / 2, clerkY + clerkSize / 2 + 7);
      }
    }

    // 绘制设计师区域
    const designerAreaX = clerkAreaX;
    const designerAreaY = clerkAreaY + 150;
    const designerSize = 40;

    // 绘制设计师标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('设计师', this.modalX + this.modalWidth - 90, designerAreaY - 10);

    // 绘制设计师位置
    ctx.fillStyle = this.hiredDesigner ? '#d4edda' : '#f8f9fa';
    ctx.strokeStyle = this.hiredDesigner ? '#28a745' : '#dee2e6';
    ctx.lineWidth = 2;
    ctx.fillRect(designerAreaX, designerAreaY, designerSize, designerSize);
    ctx.strokeRect(designerAreaX, designerAreaY, designerSize, designerSize);

    if (this.hiredDesigner) {
      // 绘制设计师图标和信息
      ctx.fillStyle = '#2c3e50';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.hiredDesigner.icon, designerAreaX + designerSize / 2, designerAreaY + designerSize / 2 + 7);
      
      // 绘制加成信息
      ctx.fillStyle = '#28a745';
      ctx.font = '8px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`SSS+${DESIGNER.sssProbabilityBonus}%`, designerAreaX - 80, designerAreaY + 12);
    } else {
      // 绘制空位置标识
      ctx.fillStyle = '#6c757d';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('+', designerAreaX + designerSize / 2, designerAreaY + designerSize / 2 + 7);
    }
  }

  /**
   * 渲染商店信息
   */
  renderStoreInfo(ctx) {
    const infoX = this.modalX + 20;
    const infoY = this.modalY + this.modalHeight - 80;
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    
    // 商店等级
    const totalEmployees = this.hiredClerks.filter(c => c !== null).length;
    const hasDesigner = this.hiredDesigner !== null;
    const storeLevel = getStoreLevel(totalEmployees, hasDesigner);
    ctx.fillText(`商店等级: ${storeLevel}`, infoX, infoY);

    // 商品统计
    const stats = getGradeStats();
    const statsText = `在售商品: B${stats.B} A${stats.A} S${stats.S} SSS${stats.SSS}`;
    ctx.fillText(statsText, infoX, infoY + 15);
    
    // 位置统计
    const slots = getProductSlots();
    const availableCount = slots.filter(s => s.status === SLOT_STATUS.AVAILABLE).length;
    const cooldownCount = slots.filter(s => s.status === SLOT_STATUS.COOLDOWN).length;
    const emptyCount = slots.filter(s => s.status === SLOT_STATUS.EMPTY).length;
    
    ctx.fillText(`位置统计: 可购买${availableCount} 冷却${cooldownCount} 空位${emptyCount}`, infoX, infoY + 30);
  }
}