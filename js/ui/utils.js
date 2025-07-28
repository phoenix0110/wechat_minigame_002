/**
 * UI 工具函数集合
 * 包含在多个UI组件中重复使用的公共函数
 */

// 移除formatPropertyPrice的导入，统一使用formatMoney

/**
 * 绘制圆角矩形
 */
export function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 绘制Figma设计的渐变背景
 */
export function drawGradientBackground(ctx, width, height) {
  // 创建线性渐变：linear-gradient(315deg, #32C5FF 0%, #F7B500 100%)
  const gradient = ctx.createLinearGradient(0, height, width, 0);
  gradient.addColorStop(0, '#32C5FF'); // 蓝色
  gradient.addColorStop(1, '#F7B500'); // 黄色
  
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * 格式化金钱显示 - 统一格式，支持负数
 */
export function formatMoney(amount) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  let result;
  if (absAmount >= 100000000) {
    result = '$' + (absAmount / 100000000).toFixed(0) + '亿';
  } else if (absAmount >= 10000) {
    result = '$' + (absAmount / 10000).toFixed(0) + '万';
  } else {
    result = '$' + absAmount.toLocaleString();
  }
  
  return isNegative ? '-' + result : result;
}

// 移除formatValueInWan函数，统一使用formatMoney

/**
 * 检查点击是否在圆形区域内
 */
export function isPointInCircle(x, y, centerX, centerY, radius) {
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  return distance <= radius;
}

/**
 * 检查点击是否在矩形区域内
 */
export function isPointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
  return x >= rectX && x <= rectX + rectWidth && 
         y >= rectY && y <= rectY + rectHeight;
}

/**
 * 简单的缓动函数
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 渲染顶部金钱栏 - 统一设计
 */
export function renderTopMoneyBar(ctx, getMoneyCallback, options = {}) {
  const showBackButton = options.showBackButton || false;
  
  // 获取canvas尺寸
  const canvasWidth = ctx.canvas ? ctx.canvas.width : (typeof canvas !== 'undefined' ? canvas.width : 393);

  // 返回按钮 (左侧) - 可选显示，向下平移50px
  if (showBackButton) {
    const backButtonX = 20;
    const backButtonY = 80; // 30 + 50
    const backButtonSize = 30;
    
    // 返回按钮背景 (圆形)
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.arc(backButtonX + backButtonSize / 2, backButtonY + backButtonSize / 2, backButtonSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // 返回箭头图标
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('←', backButtonX + backButtonSize / 2, backButtonY + backButtonSize / 2 + 5);
  }
  
  // 资金显示栏 (右侧) - 按照 Figma 设计 (node-id=66-1897)，向下平移50px
  const barHeight = 30;
  const barWidth = 188; // 修改为原来的4分之3 (250 * 3/4 = 187.5)
  const plusButtonSize = 30;
  const spacing = 10;
  const barX = canvasWidth - barWidth - plusButtonSize - spacing - 20;
  const barY = 80; // 30 + 50
  const borderRadius = 10.62; // 按照 Figma 设计圆角
  
  // 绘制圆角背景
  ctx.fillStyle = '#16996B';
  drawRoundRect(ctx, barX, barY, barWidth, barHeight, borderRadius);
  ctx.fill();
  
  // 钱包图标 (左侧)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('💰', barX + 26.56 / 2, barY + 20);
  
  // 金额文字 (居中)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 16px Inter';
  ctx.textAlign = 'center';
  
  // 获取当前金额
  const currentMoney = getMoneyCallback ? getMoneyCallback() : 0;
  const moneyText = formatMoney(currentMoney);
  ctx.fillText(moneyText, barX + barWidth / 2, barY + 20);
  
  // 加号按钮 (右侧)
  const plusButtonX = barX + barWidth + spacing;
  const plusButtonY = barY;
  
  // 绘制加号按钮背景
  ctx.fillStyle = '#4CAF50'; // 绿色背景
  drawRoundRect(ctx, plusButtonX, plusButtonY, plusButtonSize, plusButtonSize, borderRadius);
  ctx.fill();
  
  // 绘制加号图标
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('+', plusButtonX + plusButtonSize / 2, plusButtonY + 21);
  
  // 返回点击区域信息，供调用者处理点击事件
  const clickAreas = {};
  
  if (showBackButton) {
    clickAreas.backButton = {
      x: 20,
      y: 80, // 30 + 50
      width: 30,
      height: 30
    };
  }
  
  // 添加加号按钮点击区域
  clickAreas.plusButton = {
    x: plusButtonX,
    y: plusButtonY,
    width: plusButtonSize,
    height: plusButtonSize
  };
  
  return clickAreas;
}

/**
 * 渲染底部导航栏 - 统一设计
 */
export function renderBottomNavigation(ctx, currentView = 'world') {
  // 获取canvas尺寸
  const canvasWidth = ctx.canvas ? ctx.canvas.width : (typeof canvas !== 'undefined' ? canvas.width : 393);
  const canvasHeight = ctx.canvas ? ctx.canvas.height : (typeof canvas !== 'undefined' ? canvas.height : 852);
  
  const navHeight = 55;
  const navY = canvasHeight - navHeight;
  const navWidth = 393;
  const navX = (canvasWidth - navWidth) / 2;
  
  // 添加阴影效果，使导航栏看起来在最上层
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = -2;
  
  // 背景 - 增加一点不透明度以确保可见性
  ctx.fillStyle = 'rgba(242, 242, 242, 0.95)';
  ctx.fillRect(navX, navY, navWidth, navHeight);
  
  // 重置阴影
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // 导航项 - 根据当前视图更新激活状态，现在有4个导航
  // 重新计算导航项布局，确保完全居中和均匀分布
  const totalMargin = 40; // 左右边距各20px
  const availableWidth = navWidth - totalMargin;
  const itemWidth = availableWidth / 4; // 每个导航项平均宽度
  const startX = navX + 20; // 左边距20px
  
  const navItems = [
    { name: '世界', icon: '🌍', x: startX, view: 'world' },
    { name: '交易', icon: '💼', x: startX + itemWidth, view: 'realEstate' },
    { name: '经营', icon: '🏢', x: startX + itemWidth * 2, view: 'business' },
    { name: '排名', icon: '🏆', x: startX + itemWidth * 3, view: 'ranking' }
  ];
  
  navItems.forEach(item => {
    const isActive = currentView === item.view;
    
    // 图标
    ctx.fillStyle = isActive ? '#007AFF' : 'rgba(0, 0, 0, 0.6)';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.icon, item.x + itemWidth/2, navY + 16);
    
    // 文字
    ctx.fillStyle = isActive ? '#007AFF' : 'rgba(0, 0, 0, 0.6)';
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText(item.name, item.x + itemWidth/2, navY + 42);
  });

  // 返回导航项配置，供调用者处理点击事件
  return {
    navItems: navItems.map(item => ({
      name: item.name,
      icon: item.icon,
      x: item.x,
      view: item.view,
      width: itemWidth, // 调整宽度以适应4个导航项
      height: navHeight,
      y: navY
    })),
    navArea: {
      x: navX,
      y: navY,
      width: navWidth,
      height: navHeight
    }
  };
}

/**
 * 处理底部导航栏点击事件 - 统一逻辑
 */
export function handleBottomNavigationTouch(x, y, currentView) {
  const navHeight = 55;
  const navY = canvas.height - navHeight;
  const navWidth = 393;
  const navX = (canvas.width - navWidth) / 2;
  
  // 检查是否点击在导航栏区域内
  if (y >= navY && y <= navY + navHeight && x >= navX && x <= navX + navWidth) {
    // 使用与renderBottomNavigation相同的计算方式
    const totalMargin = 40; // 左右边距各20px
    const availableWidth = navWidth - totalMargin;
    const itemWidth = availableWidth / 4; // 每个导航项平均宽度
    const startX = navX + 20; // 左边距20px
    
    const navItems = [
      { name: '世界', view: 'world', action: 'world' },
      { name: '交易', view: 'realEstate', action: 'trading' },
      { name: '经营', view: 'business', action: 'business' },
      { name: '排名', view: 'ranking', action: 'ranking' }
    ];
    
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      const itemX = startX + i * itemWidth;
      
      if (x >= itemX && x <= itemX + itemWidth) {
        if (item.view === currentView) {
          // 当前页面，不需要跳转
          return null;
        } else {
          // 跳转到其他页面
          return { type: 'navigation', tab: item.action };
        }
      }
    }
  }
  
  return null;
} 