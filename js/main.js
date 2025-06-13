import './render'; // 初始化Canvas
import GameInfo from './runtime/gameinfo'; // 导入游戏UI类
import BuildingManager from './buildings/buildingManager'; // 导入建筑管理器
import MessageSystem from './ui/messageSystem'; // 导入消息系统
import LuxuryStorePage from './ui/luxuryStorePage'; // 导入奢侈品商店页面
import RealEstateModal from './ui/realEstateModal'; // 导入售楼处弹窗
import DialogueSystem from './ui/dialogue'; // 导入对话系统
import ClerkResumeModal from './ui/clerkResumeModal'; // 导入进货员简历弹窗
import ClerkInfoModal from './ui/clerkInfoModal'; // 导入进货员信息弹窗
import AssetManager from './managers/assetManager'; // 导入资产管理器
import AssetModal from './ui/assetModal'; // 导入资产列表弹窗
import { EmployeeStatsGenerator } from './config/employeeStats.js'; // 导入员工数值生成器


const ctx = canvas.getContext('2d'); // 获取canvas的2D绘图上下文

/**
 * 游戏主函数
 */
export default class Main {
  aniId = 0; // 用于存储动画帧的ID
  gameInfo = new GameInfo(); // 创建游戏UI显示
  buildingManager = new BuildingManager(); // 建筑管理器
  messageSystem = new MessageSystem(); // 消息系统
  luxuryStorePage = new LuxuryStorePage(); // 奢侈品商店页面
  gameView = 'main'; // 游戏视图: 'main'(主界面), 'luxury'(奢侈品店)
  realEstateModal = new RealEstateModal(); // 售楼处弹窗
  dialogueSystem = new DialogueSystem(); // 对话系统
  clerkResumeModal = new ClerkResumeModal(); // 进货员简历弹窗
  clerkInfoModal = new ClerkInfoModal(); // 进货员信息弹窗
  assetManager = new AssetManager(); // 资产管理器
  assetModal = new AssetModal(this.assetManager); // 资产列表弹窗

  gameState = 'loading'; // 游戏状态: 'loading'(加载中), 'intro'(剧情), 'playing'(游戏中)
  loadingProgress = 0; // 加载进度
  money = 10000000000; // 初始资金100亿元
  gridCols = 2; // 每行2个建筑
  gridRows = 3; // 总共3行
  cellSize = 160; // 每个格子的大小，适当放大
  gridStartX = 0; // 网格起始X坐标
  gridStartY = 0; // 网格起始Y坐标
  backgroundImage = null; // 背景图片
  buildingImages = {}; // 建筑图标图片缓存
  buildingImagesLoaded = 0; // 已加载的建筑图片数量
  currentClerkSlot = -1; // 当前选择的进货员位置
  
  // 购买通知系统
  purchaseNotifications = []; // 存储购买通知动画

  constructor() {
    console.log('Main constructor called');
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    console.log('wx object available:', !!wx);
    
    // 计算2x3网格居中位置
    this.gridStartX = (canvas.width - this.gridCols * this.cellSize) / 2;
    this.gridStartY = (canvas.height - this.gridRows * this.cellSize) / 2 + 20;

    console.log('Grid position:', this.gridStartX, this.gridStartY);

    // 绑定触摸事件
    this.bindTouchEvents();
    
    // 开始游戏
    this.start();
    
    // 模拟加载进度
    this.simulateLoading();
  }

  /**
   * 模拟加载进度
   */
  simulateLoading() {
    const loadingInterval = setInterval(() => {
      if (this.loadingProgress < 30) {
        this.loadingProgress += Math.random() * 10 + 5;
      }
      
      if (this.loadingProgress >= 30) {
        clearInterval(loadingInterval);
        // 开始加载建筑图片
        this.loadBuildingImages();
      }
    }, 100);
  }

  /**
   * 加载建筑图片
   */
  loadBuildingImages() {
    const buildings = this.buildingManager.getAllBuildings();
    const totalImages = buildings.length + 1; // 建筑图片 + 背景图片
    let loadedImages = 0;
    
    // 加载建筑图片
    buildings.forEach((building, index) => {
      const img = wx.createImage();
      img.src = building.icon;
      
      img.onload = () => {
        this.buildingImages[building.id] = img;
        loadedImages++;
        this.loadingProgress = 30 + (loadedImages / totalImages) * 60; // 30-90%
  
        if (loadedImages === totalImages) {
          this.finishLoading();
        }
      };
      
      img.onerror = () => {
        console.error(`Failed to load building image: ${building.name}`);
        // 创建一个占位图片
        this.buildingImages[building.id] = null;
        loadedImages++;
        this.loadingProgress = 30 + (loadedImages / totalImages) * 60;
        
        if (loadedImages === totalImages) {
          this.finishLoading();
        }
      };
    });

    // 加载背景图片
    this.loadBackgroundImage(totalImages, () => {
      loadedImages++;
      this.loadingProgress = 30 + (loadedImages / totalImages) * 60;
      
      if (loadedImages === totalImages) {
        this.finishLoading();
      }
    });
  }

  /**
   * 加载背景图片
   */
  loadBackgroundImage(totalImages = 1, callback = null) {
    // 在微信小游戏中使用 wx.createImage()
    this.backgroundImage = wx.createImage();
    this.backgroundImage.src = 'images/image_building_1.png';
    this.backgroundImage.onload = () => {
      if (callback) callback();
    };
    this.backgroundImage.onerror = () => {
      console.error('背景图片加载失败');
      if (callback) callback();
    };
  }

  /**
   * 完成加载，开始游戏
   */
  finishLoading() {
    console.log('Loading finished, starting intro...');
    this.loadingProgress = 100;
    setTimeout(() => {
      this.startIntroDialogue();
    }, 500); // 稍微延迟一下，让加载完成的提示显示一会儿
  }

  /**
   * 绑定触摸事件
   */
  bindTouchEvents() {
    // 微信小游戏使用全局触摸事件API
    wx.onTouchStart(this.onTouchStart.bind(this));
    wx.onTouchMove(this.onTouchMove.bind(this));
    wx.onTouchEnd(this.onTouchEnd.bind(this));

  }

  /**
   * 触摸开始事件
   */
  onTouchStart(e) {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      // 微信小游戏中直接使用触摸坐标，无需减去canvas偏移
      const x = touch.clientX;
      const y = touch.clientY;
      
      this.handleTouch(x, y);
    }
  }

  onTouchMove(e) {
    // 可以在这里处理拖拽等操作
  }

  onTouchEnd(e) {
    // 触摸结束处理
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y) {
    // 调试：记录所有触摸事件
    console.log('触摸事件:', {
      x, y,
      gameState: this.gameState,
      gameView: this.gameView,
      clerkResumeVisible: this.clerkResumeModal.isVisible,
      clerkInfoVisible: this.clerkInfoModal.isVisible,
      currentClerkSlot: this.currentClerkSlot
    });

    // 如果在剧情模式，优先处理对话事件
    if (this.gameState === 'intro') {
      const handled = this.dialogueSystem.handleClick(x, y, canvas.width, canvas.height);
      if (handled) return;
    }

    // 如果不在游戏模式，不处理其他交互
    if (this.gameState !== 'playing') return;

    // 处理奢侈品店页面
    if (this.gameView === 'luxury') {
      // 优先处理弹窗（如果有弹窗打开，只处理弹窗交互）
      if (this.clerkResumeModal.isVisible) {
        const result = this.clerkResumeModal.handleTouch(x, y);
        if (result) {
          if (result.type === 'hire') {
            this.handleClerkHire(result.resume);
          } else if (result.type === 'refresh') {
            this.messageSystem.addMessage('简历已刷新！', 'info');
          } else if (result.type === 'close') {
            this.currentClerkSlot = -1; // 关闭弹窗时重置状态
          }
        }
        return; // 有弹窗时不处理其他交互
      }

      if (this.clerkInfoModal.isVisible) {
        const result = this.clerkInfoModal.handleTouch(x, y);
        if (result) {
          if (result.type === 'fire') {
            this.handleClerkFire(result.clerkSlot);
          } else if (result.type === 'close') {
            this.currentClerkSlot = -1; // 关闭弹窗时重置状态
          }
        }
        return; // 有弹窗时不处理其他交互
      }

      // 处理奢侈品店页面本身的交互
      const result = this.luxuryStorePage.handleTouch(x, y);
      if (result) {
        if (result.type === 'back') {
          this.gameView = 'main';
          this.luxuryStorePage.hide();
        } else if (result.type === 'purchase') {
          this.handleLuxuryPurchase(result);
        } else if (result.type === 'cooldown') {
          this.messageSystem.addMessage(`商品冷却中，剩余${result.remainingTime}秒`, 'warning');
        } else if (result.type === 'empty_slot') {
          this.messageSystem.addMessage('此位置暂无商品', 'info');
        } else if (result.type === 'clerk_slot') {
          this.currentClerkSlot = result.slotIndex;
          if (result.hasClerk) {
            // 显示进货员信息弹窗
            this.clerkInfoModal.show(canvas.width, canvas.height, this.luxuryStorePage.hiredClerks[result.slotIndex], result.slotIndex);
          } else {
            // 显示进货员招聘弹窗
            const baseClerk = this.luxuryStorePage.stockClerks[this.currentClerkSlot];
            this.clerkResumeModal.show(canvas.width, canvas.height, this.currentClerkSlot + 1, baseClerk.price);
          }
        } else if (result.type === 'designer_slot') {
          this.currentClerkSlot = 3 + result.slotIndex; // 设计师位置标记为3+索引（3,4,5）
          if (result.hasDesigner) {
            // 显示设计师信息弹窗
            this.clerkInfoModal.show(canvas.width, canvas.height, this.luxuryStorePage.hiredDesigners[result.slotIndex], this.currentClerkSlot);
          } else {
            // 显示设计师招聘弹窗
            this.clerkResumeModal.show(canvas.width, canvas.height, 4, this.luxuryStorePage.designer.price);
          }
        } else if (result.type === 'store_info') {
          // 显示店铺信息弹窗
          const storeData = {
            hiredClerks: this.luxuryStorePage.hiredClerks,
            hiredDesigners: this.luxuryStorePage.hiredDesigners,
            productStats: this.luxuryStorePage.getProductStats()
          };
          this.luxuryStorePage.storeInfoModal.show(canvas.width, canvas.height, storeData);
        }
      }
      return;
    }

    // 处理进货员简历弹窗（仅在主页面时）
    if (this.gameView === 'main' && this.clerkResumeModal.isVisible) {
      const result = this.clerkResumeModal.handleTouch(x, y);
      if (result) {
        if (result.type === 'hire') {
          this.handleClerkHire(result.resume);
        } else if (result.type === 'refresh') {
          this.messageSystem.addMessage('简历已刷新！', 'info');
        }
        return;
      }
    }

    // 处理进货员信息弹窗（仅在主页面时）
    if (this.gameView === 'main' && this.clerkInfoModal.isVisible) {
      const result = this.clerkInfoModal.handleTouch(x, y);
      if (result) {
        if (result.type === 'fire') {
          this.handleClerkFire(result.clerkSlot);
        }
        return;
      }
    }

    // 处理资产列表弹窗
    if (this.assetModal.isVisible) {
      const result = this.assetModal.handleTouch(x, y);
      if (result) {
        return;
      }
    }

    if (this.realEstateModal.isVisible) {
      const result = this.realEstateModal.handleTouch(x, y);
      if (result) {
        if (result.type === 'purchase') {
          this.handleRealEstatePurchase(result.option);
        }
        return;
      }
    }

    // 检查是否点击了资产列表按钮
    if (this.assetButtonX && x >= this.assetButtonX && x <= this.assetButtonX + this.assetButtonWidth &&
        y >= this.assetButtonY && y <= this.assetButtonY + this.assetButtonHeight) {
      this.assetModal.show(canvas.width, canvas.height);
      return;
    }

    // 检查是否有任何弹窗打开，如果有则不处理9宫格点击
    if (this.realEstateModal.isVisible || 
        this.clerkResumeModal.isVisible || this.clerkInfoModal.isVisible || this.assetModal.isVisible) {
      return; // 有弹窗时不处理9宫格点击
    }

    // 检查是否点击了2x3网格中的某个建筑
    const col = Math.floor((x - this.gridStartX) / this.cellSize);
    const row = Math.floor((y - this.gridStartY) / this.cellSize);
    
    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
      const index = row * this.gridCols + col;
      const buildings = this.buildingManager.getAllBuildings();
      if (index < buildings.length) {
        this.onBuildingClick(index);
      }
    }
  }

  /**
   * 建筑点击事件
   */
  onBuildingClick(index) {
    const buildings = this.buildingManager.getAllBuildings();
    const building = buildings[index];
    
    // 特殊建筑打开弹窗或页面
    if (building.name === '奢侈品店') {
      this.gameView = 'luxury';
      this.luxuryStorePage.show();
      return;
    }
    
    if (building.name === '售楼处') {
      this.realEstateModal.show(canvas.width, canvas.height);
      return;
    }
    
    this.lastClickTime = Date.now();
    
    // 其他建筑使用默认逻辑
    const result = this.buildingManager.interactWithBuilding(index, this.money);
    
    if (result && result.success) {
      this.money -= result.cost;
      
      // 记录到资产管理器
      const purchaseItem = {
        id: building.id,
        name: result.purchasedItem || building.name,
        price: result.cost
      };
      this.assetManager.addAsset(purchaseItem, building.name, result.cost);
      
      // 添加购买通知动画
      this.addPurchaseNotification(result.purchasedItem || building.name);
      
      // 检查是否花光了钱
      if (this.money <= 0) {
        this.messageSystem.addMessage('你成功了，终于花光了100亿！！', 'success');
      }
    } else if (result) {
      this.messageSystem.addMessage(result.message, 'warning');
    }
  }

  /**
   * 处理奢侈品购买
   */
  handleLuxuryPurchase(purchaseData) {
    if (!purchaseData || !purchaseData.item) return;
    
    const { slotIndex, item } = purchaseData;
    
    // 从奢侈品店页面购买商品
    const result = this.luxuryStorePage.purchaseItem(slotIndex);
    
    if (result.success) {
      // 检查是否有足够的资金
      if (this.money >= result.price) {
        this.money -= result.price;
        
        this.addPurchaseNotification(result.item.name);
        this.messageSystem.addMessage(`购买了 ${result.grade}级 ${result.item.name}！`, 'success');
        
        // 添加到资产管理器
        this.assetManager.addAsset({
          id: Date.now(),
          name: result.item.name,
          type: 'luxury',
          category: result.item.type,
          grade: result.grade,
          price: result.price
        }, '奢侈品店', result.price);
        
        // 检查是否花光了钱
        if (this.money <= 0) {
          this.messageSystem.addMessage('恭喜！你成功花光了所有的钱！', 'success');
        }
      } else {
        this.messageSystem.addMessage('余额不足，无法购买此商品', 'warning');
      }
    } else {
      // 根据失败原因显示不同消息
      switch (result.reason) {
        case 'no_product':
          this.messageSystem.addMessage('此位置暂无商品', 'info');
          break;
        case 'cooldown':
          this.messageSystem.addMessage(`商品冷却中，剩余${result.remainingTime}秒`, 'warning');
          break;
        case 'invalid_slot':
          this.messageSystem.addMessage('无效的商品位置', 'error');
          break;
        default:
          this.messageSystem.addMessage('购买失败！', 'error');
          break;
      }
    }
  }

  /**
   * 重置所有弹窗和交互状态
   */
  resetAllModalStates() {
    console.log('重置前状态:', {
      clerkResumeVisible: this.clerkResumeModal.isVisible,
      clerkInfoVisible: this.clerkInfoModal.isVisible,
      currentClerkSlot: this.currentClerkSlot
    });
    
    this.clerkResumeModal.hide();
    this.clerkInfoModal.hide();
    this.currentClerkSlot = -1;
    
    // 重置奢侈品店页面的内部弹窗状态
    if (this.luxuryStorePage.storeInfoModal) {
      this.luxuryStorePage.storeInfoModal.hide();
    }
    
    console.log('重置后状态:', {
      clerkResumeVisible: this.clerkResumeModal.isVisible,
      clerkInfoVisible: this.clerkInfoModal.isVisible,
      currentClerkSlot: this.currentClerkSlot
    });
  }

  /**
   * 处理员工招聘
   */
  handleClerkHire(resume) {
    let basePrice;
    let isDesigner = false;
    let designerSlotIndex = -1;
    
    if (this.currentClerkSlot >= 3) {
      // 设计师位置（3,4,5）
      designerSlotIndex = this.currentClerkSlot - 3;
      isDesigner = true;
    }
    
    // 简历弹窗已经生成了完整的员工对象，直接使用
    const employee = resume;
    basePrice = employee.salary;
    
    if (this.money >= basePrice) {
      this.money -= basePrice;
      
      if (isDesigner) {
        this.luxuryStorePage.hireDesigner(designerSlotIndex, employee);
      } else {
        this.luxuryStorePage.hireClerk(this.currentClerkSlot, employee);
      }
      
      // 重置所有弹窗和交互状态
      this.resetAllModalStates();
      
      // 强制确保状态重置
      setTimeout(() => {
        this.clerkResumeModal.isVisible = false;
        this.clerkInfoModal.isVisible = false;
        this.currentClerkSlot = -1;
        console.log('强制重置后状态:', {
          clerkResumeModal: this.clerkResumeModal.isVisible,
          clerkInfoModal: this.clerkInfoModal.isVisible,
          currentClerkSlot: this.currentClerkSlot
        });
      }, 100);
      
      console.log(`招聘了${employee.name}，剩余金额：${this.formatMoney(this.money)}`);
      console.log('员工能力:', employee.abilities);
      
      // 检查是否花光了钱
      if (this.money <= 0) {
        this.messageSystem.addMessage('恭喜！你成功花光了所有的钱！', 'success');
      }
    } else {
      this.messageSystem.addMessage('余额不足，无法招聘员工！', 'error');
    }
  }

  /**
   * 处理员工解雇
   */
  handleClerkFire(slotIndex) {
    if (slotIndex >= 3) {
      // 解雇设计师（3,4,5）
      const designerSlotIndex = slotIndex - 3;
      const hiredDesigner = this.luxuryStorePage.hiredDesigners[designerSlotIndex];
      if (hiredDesigner) {
        this.luxuryStorePage.fireDesigner(designerSlotIndex);
        this.resetAllModalStates();
        this.messageSystem.addMessage(`已解雇设计师${hiredDesigner.name}`, 'info');
        console.log(`解雇了设计师${hiredDesigner.name}`);
      }
    } else {
      // 解雇进货员（0,1,2）
      const hiredClerk = this.luxuryStorePage.hiredClerks[slotIndex];
      if (hiredClerk) {
        this.luxuryStorePage.fireClerk(slotIndex);
        this.resetAllModalStates();
        this.messageSystem.addMessage(`已解雇进货员${hiredClerk.name}`, 'info');
        console.log(`解雇了进货员${hiredClerk.name}`);
      }
    }
  }

  /**
   * 处理房产购买
   */
  handleRealEstatePurchase(option) {
    if (this.money >= option.totalPrice) {
      this.money -= option.totalPrice;
      
      // 记录到资产管理器
      this.assetManager.addAsset(option, '售楼处', option.totalPrice);
      
      // 添加购买通知动画
      this.addPurchaseNotification(option.name);
      
      // 检查是否花光了钱
      if (this.money <= 0) {
        this.messageSystem.addMessage('恭喜！你成功花光了所有的钱！', 'success');
      }
    } else {
      this.messageSystem.addMessage('余额不足，无法购买此房产', 'warning');
    }
  }

  /**
   * 格式化金钱显示
   */
  formatMoney(amount) {
    // 会计形式显示，保留所有0
    return amount.toLocaleString('en-US');
  }

  /**
   * 添加购买通知动画
   */
  addPurchaseNotification(itemName) {
    // 计算资产按钮位置（与renderMoney中的计算一致）
    const baseY = 100;
    const buttonWidth = 180;
    const spacing = 10;
    const totalWidth = buttonWidth * 2 + spacing;
    const assetButtonX = canvas.width / 2 - totalWidth / 2 + buttonWidth + spacing;
    
    const notification = {
      text: itemName + ' +1',
      x: assetButtonX + 60, // 资产按钮中心（120宽度的一半是60）
      y: baseY - 10, // 按钮上方
      startY: baseY - 10,
      targetY: baseY - 50, // 向上移动40px
      alpha: 1.0,
      startTime: Date.now(),
      duration: 2000 // 2秒动画
    };
    
    this.purchaseNotifications.push(notification);
  }

  /**
   * 更新购买通知动画
   */
  updatePurchaseNotifications() {
    const currentTime = Date.now();
    
    this.purchaseNotifications = this.purchaseNotifications.filter(notification => {
      const elapsed = currentTime - notification.startTime;
      const progress = elapsed / notification.duration;
      
      if (progress >= 1) {
        return false; // 移除已完成的动画
      }
      
      // 更新位置和透明度
      notification.y = notification.startY + (notification.targetY - notification.startY) * progress;
      notification.alpha = 1 - progress; // 淡出效果
      
      return true;
    });
  }

  /**
   * 渲染购买通知动画
   */
  renderPurchaseNotifications(ctx) {
    this.purchaseNotifications.forEach(notification => {
      ctx.save();
      ctx.globalAlpha = notification.alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#27AE60';
      ctx.lineWidth = 2;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      
      // 绘制文字描边
      ctx.strokeText(notification.text, notification.x, notification.y);
      // 绘制文字填充
      ctx.fillText(notification.text, notification.x, notification.y);
      
      ctx.restore();
    });
  }

  /**
   * 开始游戏
   */
  start() {
    cancelAnimationFrame(this.aniId); // 清除上一局的动画
    
    // 开始加载资源
    console.log('Game start called, beginning loading...');
    this.gameState = 'loading';
    this.loadingProgress = 0;
    
    this.aniId = requestAnimationFrame(this.loop.bind(this)); // 开始新的动画循环
  }

  /**
   * 开始新手剧情对话
   */
  startIntroDialogue() {
    try {
      // 检查是否是首次进入游戏
      const hasSeenIntro = wx.getStorageSync('hasSeenIntro');
      
      if (!hasSeenIntro) {
        // 首次进入，播放剧情
        console.log('First time user, showing intro');
        this.gameState = 'intro';
        this.dialogueSystem.start(canvas.height, () => {
          // 剧情结束后进入游戏
          this.gameState = 'playing';
          
          // 标记已看过剧情
          try {
            wx.setStorageSync('hasSeenIntro', true);
          } catch (error) {
            console.error('Failed to save intro status:', error);
          }
        });
      } else {
        // 非首次进入，直接开始游戏
        this.gameState = 'playing';
      }
    } catch (error) {
      console.error('Storage error, defaulting to show intro:', error);
      // 如果存储出错，默认显示剧情
      this.gameState = 'intro';
      this.dialogueSystem.start(canvas.height, () => {
        this.gameState = 'playing';
      });
    }
  }

  /**
   * 绘制金钱余额和资产按钮
   */
  renderMoney(ctx) {
    ctx.save();
    
    // 计算显示位置，确保顶部对齐
    const baseY = 100; // 基准Y位置
    const buttonWidth = 220; // 金钱按钮宽度，增加以适应更大字体
    const buttonHeight = 45; // 按钮高度稍微增加
    const spacing = 10; // 按钮间距
    const totalWidth = buttonWidth + 120 + spacing; // 金钱按钮 + 资产按钮 + 间距
    const moneyButtonX = canvas.width / 2 - totalWidth / 2; // 金钱按钮位置
    const assetButtonX = moneyButtonX + buttonWidth + spacing; // 资产按钮位置
    
    // 绘制金钱按钮
    this.renderMoneyButton(ctx, moneyButtonX, baseY, buttonWidth, buttonHeight);
    
    // 绘制资产列表按钮
    this.renderAssetButton(ctx, assetButtonX, baseY);
    
    ctx.restore();
  }

  /**
   * 绘制金钱按钮
   */
  renderMoneyButton(ctx, buttonX, buttonY, buttonWidth, buttonHeight) {
    // 完全透明的背景，直接绘制内容
    
    // 绘制美元符号（无闪光效果）
    const dollarSize = 28;
    const dollarX = buttonX + 10;
    const dollarY = buttonY + buttonHeight / 2;
    
    ctx.save();
    
    // 金色美元符号
    ctx.fillStyle = '#FFD700'; // 金色
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('$', dollarX, dollarY + 8);
    
    // 金色描边
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.strokeText('$', dollarX, dollarY + 8);
    
    ctx.restore();
    
    // 绘制金钱数字（放大字体）
    const text = this.formatMoney(this.money);
    const textX = dollarX + 30; // 美元符号右侧
    const textY = buttonY + buttonHeight / 2 + 8;
    
    ctx.fillStyle = '#27AE60'; // 美元绿色
    ctx.font = 'bold 22px Arial'; // 从16px增加到22px
    ctx.textAlign = 'left';
    ctx.fillText(text, textX, textY);
    
    // 为数字添加轻微阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
  }

  /**
   * 绘制资产列表按钮
   */
  renderAssetButton(ctx, buttonX, baseY) {
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonY = baseY;
    
    // 保存按钮位置用于点击检测
    this.assetButtonX = buttonX;
    this.assetButtonY = buttonY;
    this.assetButtonWidth = buttonWidth;
    this.assetButtonHeight = buttonHeight;
    
    // 绘制立体阴影效果
    ctx.save();
    
    // 底层阴影（更深）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 8;
    
    // 主按钮背景 - 金色渐变
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#FFD700'); // 金色顶部
    gradient.addColorStop(0.5, '#FFA500'); // 橙金色中间
    gradient.addColorStop(1, '#DAA520'); // 深金色底部
    ctx.fillStyle = gradient;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.restore();
    
    // 绘制高光效果
    const highlightGradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight / 3);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight / 3);
    
    // 绘制按钮边框 - 多层边框效果
    ctx.strokeStyle = '#B8860B'; // 深金色边框
    ctx.lineWidth = 3;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    // 内层边框
    ctx.strokeStyle = '#FFFF80'; // 浅金色内边框
    ctx.lineWidth = 1;
    ctx.strokeRect(buttonX + 2, buttonY + 2, buttonWidth - 4, buttonHeight - 4);
    
    // 闪光动画效果
    const time = Date.now() * 0.003;
    const shimmer = Math.sin(time) * 0.3 + 0.7;
    ctx.save();
    ctx.globalAlpha = shimmer;
    
    // 闪光条纹
    const shimmerGradient = ctx.createLinearGradient(
      buttonX - 20, buttonY - 20, 
      buttonX + buttonWidth + 20, buttonY + buttonHeight + 20
    );
    shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shimmerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = shimmerGradient;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    ctx.restore();
    
    // 绘制按钮文字
    ctx.fillStyle = '#2C3E50'; // 深色文字确保可读性
    ctx.font = 'bold 16px Arial'; // 与余额文字大小一致
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
    
    // 获取资产统计
    const stats = this.assetManager.getStats();
    const buttonText = `资产列表(${stats.totalAssets})`;
    
    ctx.fillText(buttonText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);
    
    // 为文字添加轻微的金色描边
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 0.5;
    ctx.strokeText(buttonText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 6);
  }

  /**
   * 绘制2x3网格建筑
   */
  renderBuildings(ctx) {
    ctx.save();
    
    const buildings = this.buildingManager.getAllBuildings();
    for (let i = 0; i < buildings.length; i++) {
      const row = Math.floor(i / this.gridCols);
      const col = i % this.gridCols;
      const x = this.gridStartX + col * this.cellSize;
      const y = this.gridStartY + row * this.cellSize;
      const building = buildings[i];
      
      // 绘制按钮立体效果
      const buttonPadding = 6;
      const buttonX = x + buttonPadding;
      const buttonY = y + buttonPadding;
      const buttonSize = this.cellSize - buttonPadding * 2;
      
      // 绘制按钮阴影（立体效果）
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 8;
      
      // 绘制按钮背景（渐变效果）
      const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonSize);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);
      
      ctx.restore();
      
      // 绘制按钮边框（双重边框效果）
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(buttonX, buttonY, buttonSize, buttonSize);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(buttonX + 1, buttonY + 1, buttonSize - 2, buttonSize - 2);
      
      // 绘制建筑图标（占满整个按钮区域）
      const buildingImg = this.buildingImages[building.id];
      if (buildingImg) {
        // 图标区域，留出底部文字空间
        const imgPadding = 4;
        const imgSize = buttonSize - imgPadding * 2;
        const imgX = buttonX + imgPadding;
        const imgY = buttonY + imgPadding;
        const imgHeight = imgSize - 25; // 为文字留出25px空间
        
        // 绘制图片
        ctx.save();
        ctx.drawImage(buildingImg, imgX, imgY, imgSize, imgHeight);
        ctx.restore();
      } else {
        // 如果图片没有加载，显示占位符
        ctx.fillStyle = '#BDC3C7';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('?', x + this.cellSize / 2, y + this.cellSize / 2 - 10);
      }
      
      // 绘制建筑名称，使用更柔和的阴影
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#2C3E50';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.textAlign = 'center';
      
      // 添加轻微的文字阴影
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 255, 0.65)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 2;
      
      const nameY = buttonY + buttonSize - 8;
      ctx.strokeText(building.name, x + this.cellSize / 2, nameY);
      ctx.fillText(building.name, x + this.cellSize / 2, nameY);
      
      ctx.restore();
    }
    
    ctx.restore();
  }

  /**
   * 绘制背景
   */
  renderBackground(ctx) {
    // 如果背景图片已加载，则使用背景图片
    if (this.backgroundImage) {
      ctx.save();
      
      // 设置透明度
      ctx.globalAlpha = 0.7;
      
      // 计算背景图片的缩放比例，保持比例并填满屏幕
      const scaleX = canvas.width / this.backgroundImage.width;
      const scaleY = canvas.height / this.backgroundImage.height;
      const scale = Math.max(scaleX, scaleY);
      
      const newWidth = this.backgroundImage.width * scale;
      const newHeight = this.backgroundImage.height * scale;
      
      // 居中绘制
      const x = (canvas.width - newWidth) / 2;
      const y = (canvas.height - newHeight) / 2;
      
      ctx.drawImage(this.backgroundImage, x, y, newWidth, newHeight);
      
      ctx.restore();
    } else {
      // 备用渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#74b9ff');
      gradient.addColorStop(1, '#0984e3');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有的需要展示的元素
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布

    if (this.gameState === 'loading') {
      this.renderLoadingScreen(ctx);
    } else if (this.gameState === 'playing' && this.gameView === 'luxury') {
      // 奢侈品店页面
      this.luxuryStorePage.render(ctx);
      
      // 绘制弹窗
      this.clerkResumeModal.render(ctx);
      this.clerkInfoModal.render(ctx);
      
      // 绘制消息系统和通知
      this.messageSystem.render(ctx, canvas.width);
      this.renderPurchaseNotifications(ctx);
    } else {
      // 主界面
      this.renderBackground(ctx); // 绘制背景
      this.renderMoney(ctx); // 绘制金钱余额
      this.renderBuildings(ctx); // 绘制九宫格建筑
      
      // 只在游戏模式下显示消息提示
      if (this.gameState === 'playing') {
        this.messageSystem.render(ctx, canvas.width); // 绘制消息提示
        this.renderPurchaseNotifications(ctx); // 绘制购买通知动画
      }
      
      // 绘制弹窗（在最上层）
      if (this.gameState === 'playing') {
        this.realEstateModal.render(ctx);
        this.clerkResumeModal.render(ctx);
        this.clerkInfoModal.render(ctx);
        this.assetModal.render(ctx);
      }
      
      // 绘制对话系统（最上层）
      this.dialogueSystem.render(ctx, canvas.width, canvas.height);
    }
  }

  /**
   * 渲染加载页面
   */
  renderLoadingScreen(ctx) {
    // 绘制背景
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#74b9ff');
    gradient.addColorStop(1, '#0984e3');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制游戏标题
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 3;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    
    const title = '花光100亿';
    const titleY = canvas.height / 2 - 60;
    
    ctx.strokeText(title, canvas.width / 2, titleY);
    ctx.fillText(title, canvas.width / 2, titleY);

    // 绘制副标题
    ctx.font = 'bold 16px Arial';
    ctx.fillText('成为世界首富的挑战', canvas.width / 2, titleY + 40);

    // 绘制加载进度条
    const progressBarWidth = 200;
    const progressBarHeight = 8;
    const progressBarX = (canvas.width - progressBarWidth) / 2;
    const progressBarY = canvas.height / 2 + 40;

    // 进度条背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // 进度条填充
    ctx.fillStyle = '#FFFFFF';
    const progressWidth = (this.loadingProgress / 100) * progressBarWidth;
    ctx.fillRect(progressBarX, progressBarY, progressWidth, progressBarHeight);

    // 加载文字
    ctx.font = '14px Arial';
    let loadingText = '正在初始化...';
    if (this.loadingProgress >= 30 && this.loadingProgress < 100) {
      loadingText = '正在加载建筑图片...';
    } else if (this.loadingProgress >= 100) {
      loadingText = '加载完成！';
    }
    ctx.fillText(`${loadingText} ${Math.floor(this.loadingProgress)}%`, canvas.width / 2, progressBarY + 30);

    ctx.restore();
  }

  // 游戏逻辑更新主函数
  update() {
    // 只在游戏模式下更新消息系统
    if (this.gameState === 'playing') {
      this.messageSystem.update(); // 更新消息系统
      this.updatePurchaseNotifications(); // 更新购买通知动画
      
      // 如果在奢侈品店页面，更新奢侈品店状态
      if (this.gameView === 'luxury') {
        this.luxuryStorePage.update();
      }
    }
  }

  // 实现游戏帧循环
  loop() {
    this.update(); // 更新游戏逻辑
    this.render(); // 渲染游戏画面

    // 请求下一帧动画
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
