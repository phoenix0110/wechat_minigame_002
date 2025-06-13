/**
 * 资产管理系统
 * 负责跟踪和管理玩家的所有购买记录
 */
export default class AssetManager {
  constructor() {
    this.assets = new Map(); // 使用Map存储资产，key为资产ID，value为资产信息
    this.categories = new Map(); // 按类别分组的资产
    this.totalSpent = 0; // 总花费
  }

  /**
   * 添加资产购买记录
   */
  addAsset(item, category, price) {
    const assetKey = `${category}_${item.id || item.name}`;
    
    if (this.assets.has(assetKey)) {
      // 已存在，增加数量
      const asset = this.assets.get(assetKey);
      asset.quantity += 1;
      asset.totalPrice += price;
    } else {
      // 新资产
      const asset = {
        id: item.id || item.name,
        name: item.name,
        category: category,
        price: price,
        quantity: 1,
        totalPrice: price,
        icon: item.icon || '📦',
        firstPurchaseTime: Date.now()
      };
      this.assets.set(assetKey, asset);
    }

    this.totalSpent += price;
    this.updateCategories();
  }

  /**
   * 更新分类统计
   */
  updateCategories() {
    this.categories.clear();
    
    for (const asset of this.assets.values()) {
      if (!this.categories.has(asset.category)) {
        this.categories.set(asset.category, {
          name: asset.category,
          assets: [],
          totalValue: 0,
          totalItems: 0
        });
      }
      
      const category = this.categories.get(asset.category);
      category.assets.push(asset);
      category.totalValue += asset.totalPrice;
      category.totalItems += asset.quantity;
    }

    // 按总价值排序每个分类的资产
    for (const category of this.categories.values()) {
      category.assets.sort((a, b) => b.totalPrice - a.totalPrice);
    }
  }

  /**
   * 获取所有分类
   */
  getCategories() {
    return Array.from(this.categories.values()).sort((a, b) => b.totalValue - a.totalValue);
  }

  /**
   * 获取指定分类的资产
   */
  getCategoryAssets(categoryName) {
    return this.categories.get(categoryName)?.assets || [];
  }

  /**
   * 获取总资产数量
   */
  getTotalAssetCount() {
    let total = 0;
    for (const asset of this.assets.values()) {
      total += asset.quantity;
    }
    return total;
  }

  /**
   * 获取总花费
   */
  getTotalSpent() {
    return this.totalSpent;
  }

  /**
   * 格式化价格显示
   */
  formatPrice(price) {
    if (price >= 100000000) {
      return (price / 100000000).toFixed(1) + '亿';
    } else if (price >= 10000) {
      return (price / 10000).toFixed(1) + '万';
    } else {
      return price.toString() + '元';
    }
  }

  /**
   * 获取资产统计信息
   */
  getStats() {
    return {
      totalAssets: this.getTotalAssetCount(),
      totalCategories: this.categories.size,
      totalSpent: this.totalSpent,
      mostExpensiveCategory: this.getMostExpensiveCategory()
    };
  }

  /**
   * 获取最昂贵的分类
   */
  getMostExpensiveCategory() {
    let maxCategory = null;
    let maxValue = 0;
    
    for (const category of this.categories.values()) {
      if (category.totalValue > maxValue) {
        maxValue = category.totalValue;
        maxCategory = category.name;
      }
    }
    
    return maxCategory;
  }

  /**
   * 清空所有资产（重置游戏时使用）
   */
  clear() {
    this.assets.clear();
    this.categories.clear();
    this.totalSpent = 0;
  }
} 