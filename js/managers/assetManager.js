/**
 * 资产管理系统
 * 负责跟踪和管理玩家的所有购买记录
 */
export default class AssetManager {
  constructor() {
    this.assets = new Map(); // 使用Map存储资产，key为资产ID，value为资产信息
    this.totalSpent = 0; // 总花费
    this.totalEarned = 0; // 总收入（出售获得）
  }

  /**
   * 添加资产购买记录
   */
  addAsset(item, price) {
    if (this.assets.has(item.id)) {
      // 房产已存在，不允许重复购买
      return;
    }
    
    // 新资产
    const asset = {
      id: item.id,
      name: item.name,
      price: price,
      quantity: 1,
      totalPrice: price,
      icon: item.icon || '📦',
      firstPurchaseTime: Date.now(),
      originalItem: item // 保存原始物品信息，用于出售时的处理
    };
    this.assets.set(item.id, asset);

    this.totalSpent += price;
  }

  /**
   * 出售资产
   */
  sellAsset(asset) {
    if (!this.assets.has(asset.id)) {
      return null; // 资产不存在
    }

    const storedAsset = this.assets.get(asset.id);
    
    // 计算出售价格
    const sellPrice = storedAsset.originalItem.currentPrice;

    this.assets.delete(asset.id);

    this.totalEarned += sellPrice;

    return {
      sellPrice: sellPrice,
      assetName: asset.name,
      remainingQuantity: storedAsset ? storedAsset.quantity : 0
    };
  }

  /**
   * 获取所有资产
   */
  getAllAssets() {
    return Array.from(this.assets.values()).sort((a, b) => b.totalPrice - a.totalPrice);
  }

  /**
   * 获取总资产数量
   */
  getTotalAssetCount() {
    return this.assets.size;
  }

  /**
   * 获取总花费
   */
  getTotalSpent() {
    return this.totalSpent;
  }

  /**
   * 获取总收入
   */
  getTotalEarned() {
    return this.totalEarned;
  }

  /**
   * 获取净支出（花费 - 收入）
   */
  getNetSpent() {
    return this.totalSpent - this.totalEarned;
  }

  /**
   * 获取当前总资产价值（房产使用当前市场价格）
   */
  getTotalAssetValue() {
    let totalValue = 0;
    
    for (const asset of this.assets.values()) {
      if (asset.originalItem && asset.originalItem.currentPrice) {
        // 房产使用当前市场价格
        totalValue += asset.originalItem.currentPrice * asset.quantity;
      } else {
        // 其他资产使用购买价格
        totalValue += asset.totalPrice;
      }
    }
    
    return totalValue;
  }

  /**
   * 获取资产统计信息
   */
  getStats() {
    return {
      totalAssets: this.getTotalAssetCount(),
      totalSpent: this.totalSpent,
      totalEarned: this.totalEarned,
      netSpent: this.getNetSpent()
    };
  }

  /**
   * 清空所有资产（重置游戏时使用）
   */
  clear() {
    this.assets.clear();
    this.totalSpent = 0;
    this.totalEarned = 0;
  }
} 