/**
 * 资产列表弹窗界面
 */
export default class AssetModal {
  constructor(assetManager) {
    this.assetManager = assetManager;
    this.isVisible = false;
    this.modalWidth = 400; // 恢复原来的宽度
    this.modalHeight = 500;
    this.modalX = 0;
    this.modalY = 0;
    this.scrollY = 0; // 滚动位置
    this.maxScrollY = 0; // 最大滚动距离
    this.expandedCategories = new Set(); // 展开的分类
  }

  /**
   * 显示弹窗
   */
  show(canvasWidth, canvasHeight) {
    this.isVisible = true;
    // 居中显示弹窗
    this.modalX = (canvasWidth - this.modalWidth) / 2;
    this.modalY = (canvasHeight - this.modalHeight) / 2;
    this.scrollY = 0;
    
    // 默认展开所有分类
    const categories = this.assetManager.getCategories();
    categories.forEach(category => {
      this.expandedCategories.add(category.name);
    });
    
    this.calculateScrollHeight();
  }

  /**
   * 隐藏弹窗
   */
  hide() {
    this.isVisible = false;
    this.expandedCategories.clear();
  }

  /**
   * 计算滚动高度
   */
  calculateScrollHeight() {
    const categories = this.assetManager.getCategories();
    let totalHeight = 80; // 标题和统计区域
    
    categories.forEach(category => {
      totalHeight += 40; // 分类标题高度
      if (this.expandedCategories.has(category.name)) {
        totalHeight += category.assets.length * 35; // 每个资产35px高度
      }
    });
    
    this.maxScrollY = Math.max(0, totalHeight - (this.modalHeight - 100));
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

    // 检查是否点击了分类标题（折叠/展开）
    const contentX = this.modalX + 10;
    const contentStartY = this.modalY + 80;
    let currentY = contentStartY - this.scrollY;
    
    const categories = this.assetManager.getCategories();
    for (const category of categories) {
      if (y >= currentY && y <= currentY + 40 && 
          x >= contentX && x <= contentX + this.modalWidth - 20) {
        // 点击了分类标题，切换展开状态
        if (this.expandedCategories.has(category.name)) {
          this.expandedCategories.delete(category.name);
        } else {
          this.expandedCategories.add(category.name);
        }
        this.calculateScrollHeight();
        return { type: 'toggle_category', category: category.name };
      }
      
      currentY += 40; // 分类标题高度
      if (this.expandedCategories.has(category.name)) {
        currentY += category.assets.length * 35; // 资产列表高度
      }
    }

    return null;
  }

  /**
   * 处理滚动
   */
  handleScroll(deltaY) {
    if (!this.isVisible) return;
    
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + deltaY));
  }

  /**
   * 渲染弹窗
   */
  render(ctx) {
    if (!this.isVisible) return;

    ctx.save();

    // 绘制半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 绘制弹窗背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 3;
    ctx.fillRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);
    ctx.strokeRect(this.modalX, this.modalY, this.modalWidth, this.modalHeight);

    // 绘制标题
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('资产列表', this.modalX + this.modalWidth / 2, this.modalY + 30);

    // 绘制关闭按钮
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(this.modalX + this.modalWidth - 30, this.modalY + 10, 20, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('×', this.modalX + this.modalWidth - 20, this.modalY + 23);

    // 绘制统计信息
    this.renderStats(ctx);

    // 设置内容区域裁剪
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.modalX + 5, this.modalY + 75, this.modalWidth - 10, this.modalHeight - 85);
    ctx.clip();

    // 绘制资产分类列表
    this.renderAssetList(ctx);

    ctx.restore();

    // 绘制滚动条
    if (this.maxScrollY > 0) {
      this.renderScrollbar(ctx);
    }

    ctx.restore();
  }

  /**
   * 渲染统计信息
   */
  renderStats(ctx) {
    const stats = this.assetManager.getStats();
    
    ctx.fillStyle = '#34495E';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    const statsY = this.modalY + 45;
    const leftX = this.modalX + 15;
    const rightX = this.modalX + this.modalWidth / 2 + 10;
    
    ctx.fillText(`总资产: ${stats.totalAssets}件`, leftX, statsY);
    ctx.fillText(`总分类: ${stats.totalCategories}个`, rightX, statsY);
    
    ctx.fillText(`总花费: ${this.assetManager.formatPrice(stats.totalSpent)}`, leftX, statsY + 12);
    ctx.fillText(`出售收入: ${this.assetManager.formatPrice(stats.totalEarned)}`, rightX, statsY + 12);
    
    // 显示净支出
    const netSpent = stats.netSpent;
    ctx.fillStyle = netSpent >= 0 ? '#E74C3C' : '#27AE60';
    ctx.fillText(`净支出: ${this.assetManager.formatPrice(Math.abs(netSpent))}`, leftX, statsY + 24);
    
    // 显示最贵分类
    if (stats.mostExpensiveCategory) {
      ctx.fillStyle = '#34495E';
      ctx.fillText(`最贵分类: ${stats.mostExpensiveCategory}`, rightX, statsY + 24);
    }
  }

  /**
   * 渲染资产列表
   */
  renderAssetList(ctx) {
    const categories = this.assetManager.getCategories();
    const contentX = this.modalX + 10;
    let currentY = this.modalY + 80 - this.scrollY;

    categories.forEach(category => {
      // 绘制分类标题
      if (currentY > this.modalY + 60 && currentY < this.modalY + this.modalHeight) {
        const isExpanded = this.expandedCategories.has(category.name);
        
        // 分类背景
        ctx.fillStyle = '#ECF0F1';
        ctx.fillRect(contentX, currentY, this.modalWidth - 20, 35);
        
        // 分类标题
        ctx.fillStyle = '#2C3E50';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(
          `${isExpanded ? '▼' : '▶'} ${category.name}`, 
          contentX + 10, 
          currentY + 22
        );
        
        // 分类统计
        ctx.fillStyle = '#7F8C8D';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${category.totalItems}件 ${this.assetManager.formatPrice(category.totalValue)}`,
          contentX + this.modalWidth - 30,
          currentY + 22
        );
      }
      
      currentY += 40;
      
      // 如果分类展开，绘制资产列表
      if (this.expandedCategories.has(category.name)) {
        category.assets.forEach(asset => {
          if (currentY > this.modalY + 60 && currentY < this.modalY + this.modalHeight) {
            this.renderAssetItem(ctx, asset, contentX + 20, currentY);
          }
          currentY += 35;
        });
      }
    });
  }

  /**
   * 渲染单个资产项
   */
  renderAssetItem(ctx, asset, x, y) {
    // 资产背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, this.modalWidth - 40, 30);
    
    // 资产边框
    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, this.modalWidth - 40, 30);
    
    // 资产名称
    ctx.fillStyle = '#2C3E50';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    const displayName = asset.quantity > 1 ? `${asset.name} ×${asset.quantity}` : asset.name;
    ctx.fillText(displayName, x + 10, y + 20);
    
    // 资产价值
    ctx.fillStyle = '#27AE60';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.assetManager.formatPrice(asset.totalPrice),
      x + this.modalWidth - 50,
      y + 20
    );
  }

  /**
   * 渲染滚动条
   */
  renderScrollbar(ctx) {
    const scrollbarX = this.modalX + this.modalWidth - 8;
    const scrollbarY = this.modalY + 80;
    const scrollbarHeight = this.modalHeight - 90;
    
    // 滚动条背景
    ctx.fillStyle = '#ECF0F1';
    ctx.fillRect(scrollbarX, scrollbarY, 6, scrollbarHeight);
    
    // 滚动条滑块
    const thumbHeight = Math.max(20, scrollbarHeight * (scrollbarHeight / (scrollbarHeight + this.maxScrollY)));
    const thumbY = scrollbarY + (this.scrollY / this.maxScrollY) * (scrollbarHeight - thumbHeight);
    
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(scrollbarX, thumbY, 6, thumbHeight);
  }
} 