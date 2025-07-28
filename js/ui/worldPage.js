/**
 * 世界页面 - 显示地图世界界面
 * 参考 Figma 设计，使用 JSON 地图数据绘制地图
 */

import { 
  drawRoundRect, 
  renderTopMoneyBar, 
  renderBottomNavigation,
  handleBottomNavigationTouch
} from './utils.js';
import { getDistrictPinImage } from '../config/realEstateConfig.js';

export default class WorldPage {
  constructor(getMoneyCallback = null, getUserPropertiesCallback = null) {
    this.isVisible = false;
    this.getMoneyCallback = getMoneyCallback;
    this.getUserPropertiesCallback = getUserPropertiesCallback;
    
    // 地图图钉图片
    this.mapPinImages = {};
    this.loadMapPinImages();
    
    // 地图数据
    this.mapData = null;
    this.mapLoaded = false;
    
    // 地图视图控制
    this.scale = 0.3; // 地图缩放比例
    this.offsetX = 0; // 地图X偏移
    this.offsetY = 0; // 地图Y偏移
    this.minScale = 0.3;
    this.maxScale = 0.8;
    
    // 地图边界
    this.mapBounds = {
      minX: -2000,
      maxX: 2000,
      minY: -2000,
      maxY: 2000
    };
    
    // 加载地图数据
    this.loadMapData();
    
    // 触摸控制
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.isDragging = true;
  }

  /**
   * 加载地图图钉图片
   */
  loadMapPinImages() {
    const pinFiles = ['map_pin_1.png', 'map_pin_2.png', 'map_pin_3.png', 'map_pin_4.png', 'map_pin_5.png'];
    
    pinFiles.forEach(fileName => {
      // 兼容微信小程序和浏览器环境
      let img;
      if (typeof wx !== 'undefined' && wx.createImage) {
        // 微信小程序环境
        img = wx.createImage();
      } else if (typeof Image !== 'undefined') {
        // 浏览器环境
        img = new Image();
      } else {
        // 如果都不可用，创建空对象避免错误
        img = { complete: false, src: '' };
      }
      
      img.src = `images/${fileName}`;
      this.mapPinImages[fileName] = img;
    });
  }

  /**
   * 加载地图数据
   */
  async loadMapData() {
    try {
      // 在微信小游戏环境中使用 wx.getFileSystemManager 加载本地 JSON 文件
      if (typeof wx !== 'undefined' && wx.getFileSystemManager) {
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: 'map/underbloom_market.json',
          encoding: 'utf8',  
          success: (res) => {
            try {
              this.mapData = JSON.parse(res.data);
              this.mapLoaded = true;
              this.calculateMapBounds();
            } catch (parseError) {
              console.error('JSON 解析失败:', parseError);
              this.createFallbackMap();
            }
          },
          fail: (error) => {
            console.error('地图文件读取失败:', error);
            this.createFallbackMap();
          }
        });
      } else {
        // 开发环境使用 fetch
        const response = await fetch('map/underbloom_market.json');
        this.mapData = await response.json();
        this.mapLoaded = true;
        this.calculateMapBounds();
        console.log('地图数据加载成功');
      }
    } catch (error) {
      console.error('地图数据加载失败:', error);
      this.createFallbackMap();
    }
  }

  /**
   * 计算地图边界
   */
  calculateMapBounds() {
    if (!this.mapData || !this.mapData.features) return;
    
    // 只计算districts的边界
    const districtsFeature = this.mapData.features.find(feature => feature.id === 'districts');
    if (!districtsFeature || !districtsFeature.geometries) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    districtsFeature.geometries.forEach(district => {
      if (district.coordinates) {
        this.processCoordinates(district.coordinates, (x, y) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });
      }
    });
    
    this.mapBounds = { minX, maxX, minY, maxY };
    
    // 自动计算缩放比例和居中位置
    this.autoFitDistricts();
  }

  /**
   * 自动调整地图以适应所有districts
   */
  autoFitDistricts() {
    const mapAreaY = 130; // 80 + 50，向下平移50px
    const mapAreaHeight = canvas.height - 130 - 55; // 减去顶部和底部导航栏，向下平移50px
    const mapAreaWidth = canvas.width;
    
    const districtWidth = this.mapBounds.maxX - this.mapBounds.minX;
    const districtHeight = this.mapBounds.maxY - this.mapBounds.minY;
    
    // 计算合适的缩放比例，留出10%的边距
    const scaleX = (mapAreaWidth * 0.9) / districtWidth;
    const scaleY = (mapAreaHeight * 0.9) / districtHeight;
    this.scale = Math.min(scaleX, scaleY);
    
    // 限制缩放范围
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale));
    
    // 计算居中位置
    const centerX = (this.mapBounds.minX + this.mapBounds.maxX) / 2;
    const centerY = (this.mapBounds.minY + this.mapBounds.maxY) / 2;
    this.offsetX = -centerX * this.scale + mapAreaWidth / 2;
    this.offsetY = -centerY * this.scale + mapAreaY + mapAreaHeight / 2;
  }

  /**
   * 递归处理坐标数据
   */
  processCoordinates(coords, callback) {
    if (typeof coords[0] === 'number') {
      // 单个坐标点
      callback(coords[0], coords[1]);
    } else {
      // 坐标数组
      coords.forEach(coord => this.processCoordinates(coord, callback));
    }
  }

  /**
   * 创建备用地图（如果加载失败）
   */
  createFallbackMap() {
    this.mapData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "fallback",
          coordinates: [
            [[-100, -100], [100, -100], [100, 100], [-100, 100], [-100, -100]]
          ]
        }
      ]
    };
    this.mapLoaded = true;
    this.calculateMapBounds();
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
   * 放大地图
   */
  zoomIn() {
    const oldScale = this.scale;
    this.scale = Math.min(this.maxScale, this.scale * 1.2);
    
    // 调整偏移以保持中心点不变
    const centerX = canvas.width / 2;
    const centerY = (130 + canvas.height - 130 - 55) / 2 + 130; // 向下平移50px
    
    this.offsetX = centerX - (centerX - this.offsetX) * (this.scale / oldScale);
    this.offsetY = centerY - (centerY - this.offsetY) * (this.scale / oldScale);
  }

  /**
   * 缩小地图
   */
  zoomOut() {
    const oldScale = this.scale;
    this.scale = Math.max(this.minScale, this.scale / 1.2);
    
    // 调整偏移以保持中心点不变
    const centerX = canvas.width / 2;
    const centerY = (130 + canvas.height - 130 - 55) / 2 + 130; // 向下平移50px
    
    this.offsetX = centerX - (centerX - this.offsetX) * (this.scale / oldScale);
    this.offsetY = centerY - (centerY - this.offsetY) * (this.scale / oldScale);
  }

  /**
   * 处理触摸事件
   */
  handleTouch(x, y, touchType = 'tap') {
    // 检查是否点击了缩放按钮
    const zoomButtonSize = 50;
    const zoomButtonMargin = 20;
    const mapAreaY = 130; // 80 + 50，向下平移50px
    const mapAreaHeight = canvas.height - 130 - 55; // 向下平移50px
    
    // 放大按钮位置（右上角）
    const zoomInX = canvas.width - zoomButtonMargin - zoomButtonSize;
    const zoomInY = mapAreaY + zoomButtonMargin;
    
    // 缩小按钮位置（放大按钮下方）
    const zoomOutX = canvas.width - zoomButtonMargin - zoomButtonSize;
    const zoomOutY = mapAreaY + zoomButtonMargin + zoomButtonSize + 10;
    
    if (x >= zoomInX && x <= zoomInX + zoomButtonSize && 
        y >= zoomInY && y <= zoomInY + zoomButtonSize) {
      // 点击了放大按钮
      this.zoomIn();
      return null;
    }
    
    if (x >= zoomOutX && x <= zoomOutX + zoomButtonSize && 
        y >= zoomOutY && y <= zoomOutY + zoomButtonSize) {
      // 点击了缩小按钮
      this.zoomOut();
      return null;
    }
    
    // 检查加号按钮点击 (顶部money bar右侧)
    if (this.topBarClickAreas && this.topBarClickAreas.plusButton) {
      const plusBtn = this.topBarClickAreas.plusButton;
      if (x >= plusBtn.x && x <= plusBtn.x + plusBtn.width &&
          y >= plusBtn.y && y <= plusBtn.y + plusBtn.height) {
        return { type: 'showAdReward' };
      }
    }

    // 检查是否点击了底部导航栏 - 使用统一的导航处理函数
    const navResult = handleBottomNavigationTouch(x, y, 'world');
    if (navResult) {
      return navResult;
    }
    
    // 地图区域的拖拽处理（仅在缩放大于最小缩放时启用）
    if (y >= mapAreaY && y < mapAreaY + mapAreaHeight && this.scale > this.minScale) {
      return { type: 'map_interaction', x: x, y: y };
    }
    
    return null;
  }

  /**
   * 处理地图拖拽开始
   */
  handleDragStart(x, y) {
    if (this.scale > this.minScale) {
      this.isDragging = true;
      this.lastTouchX = x;
      this.lastTouchY = y;
    }
  }

  /**
   * 处理地图拖拽移动
   */
  handleDragMove(x, y) {
    if (this.isDragging && this.scale > this.minScale) {
      const deltaX = x - this.lastTouchX;
      const deltaY = y - this.lastTouchY;
      
      // 更新地图偏移
      this.offsetX += deltaX;
      this.offsetY += deltaY;
      
      // 限制拖拽范围，防止地图拖得太远
      this.constrainMapPosition();
      
      // 更新上次触摸位置
      this.lastTouchX = x;
      this.lastTouchY = y;
    }
  }

  /**
   * 处理地图拖拽结束
   */
  handleDragEnd() {
    this.isDragging = false;
  }

  /**
   * 限制地图位置，防止拖拽超出合理范围
   */
  constrainMapPosition() {
    const mapAreaY = 130; // 80 + 50，向下平移50px
    const mapAreaHeight = canvas.height - 130 - 55; // 向下平移50px
    const mapAreaWidth = canvas.width;
    
    // 计算地图在当前缩放下的尺寸
    const scaledMapWidth = (this.mapBounds.maxX - this.mapBounds.minX) * this.scale;
    const scaledMapHeight = (this.mapBounds.maxY - this.mapBounds.minY) * this.scale;
    
    // 计算允许的最大偏移（地图边缘不能离开屏幕太远）
    const maxOffsetX = mapAreaWidth * 0.5;
    const minOffsetX = mapAreaWidth - scaledMapWidth - mapAreaWidth * 0.5;
    const maxOffsetY = mapAreaY + mapAreaHeight * 0.5;
    const minOffsetY = mapAreaY + mapAreaHeight - scaledMapHeight - mapAreaHeight * 0.5;
    
    // 应用限制
    this.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, this.offsetX));
    this.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, this.offsetY));
  }

  /**
   * 绘制圆角矩形
   */
  // 移除本地的drawRoundRect函数，使用utils中的版本

  /**
   * 渲染页面
   */
  render(ctx) {
    if (!this.isVisible) {
      return;
    }
    
    // 渲染地图区域（包括背景图）
    this.renderMap(ctx);

    // 渲染顶部金钱栏
    const topBarResult = renderTopMoneyBar(ctx, this.getMoneyCallback, { showBackButton: false });
    this.topBarClickAreas = topBarResult;

    // 渲染底部导航栏
    const navResult = renderBottomNavigation(ctx, 'world');
    this.bottomNavClickAreas = navResult;
  }

  /**
   * 渲染地图
   */
  renderMap(ctx) {
    const mapAreaY = 130; // 向下平移50px，原来80px + 50px
    const mapAreaHeight = canvas.height - 130 - 55; // 减去顶部和底部导航栏，向下平移50px
    
    // 渲染背景图片（不裁剪，覆盖整个屏幕）
    this.renderWorldBackground(ctx, mapAreaY, mapAreaHeight);
    
    // 设置地图绘制区域裁剪
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, mapAreaY, canvas.width, mapAreaHeight);
    ctx.clip();
    
    if (!this.mapLoaded || !this.mapData) {
      // 加载中显示
      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('地图加载中...', canvas.width / 2, mapAreaY + mapAreaHeight / 2);
      ctx.restore();
      return;
    }

    this.renderMapFeatures(ctx);
    ctx.restore();
    
    // 渲染缩放按钮
    this.renderZoomButtons(ctx, mapAreaY, mapAreaHeight);
  }

  /**
   * 渲染世界背景图片
   */
  renderWorldBackground(ctx, mapAreaY, mapAreaHeight) {
    // 如果背景图片还未加载，先加载
    if (!this.worldBackgroundImage) {
      // 兼容微信小程序和浏览器环境
      if (typeof wx !== 'undefined' && wx.createImage) {
        // 微信小程序环境
        this.worldBackgroundImage = wx.createImage();
      } else if (typeof Image !== 'undefined') {
        // 浏览器环境
        this.worldBackgroundImage = new Image();
      } else {
        // 如果都不可用，创建空对象避免错误
        this.worldBackgroundImage = { complete: false, src: '' };
      }
      
      this.worldBackgroundImage.src = 'images/image_world_2.png';
      this.worldBackgroundImage.onload = () => {
      };
      this.worldBackgroundImage.onerror = () => {
        console.error('世界背景图片加载失败');
      };
    }
    
    // 如果图片已加载，绘制为背景
    if (this.worldBackgroundImage && this.worldBackgroundImage.complete) {
      ctx.save();
      
      // 计算背景图片的缩放和位置，使其覆盖整个屏幕
      const scaleX = canvas.width / this.worldBackgroundImage.width;
      const scaleY = canvas.height / this.worldBackgroundImage.height;
      
      const imgWidth = this.worldBackgroundImage.width * scaleX;
      const imgHeight = this.worldBackgroundImage.height * scaleY;
      
      // 居中绘制，从屏幕顶部开始
      const imgX = (canvas.width - imgWidth) / 2;
      const imgY = (canvas.height - imgHeight) / 2;
      
      ctx.drawImage(this.worldBackgroundImage, imgX, imgY, imgWidth, imgHeight);
      
      // 添加半透明遮罩以增强地图要素的对比度
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, mapAreaY, canvas.width, mapAreaHeight);
      
      ctx.restore();
    } else {
      // 备用背景色
      ctx.fillStyle = '#e8f4f8'; // 浅蓝色背景，更好的对比度
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * 渲染地图要素
   */
  renderMapFeatures(ctx) {
    if (!this.mapData || !this.mapData.features) {
      return;
    }

    // 首先渲染roads作为底层，显示districts之间的连接
    const roadsFeature = this.mapData.features.find(feature => feature.id === 'roads');
    if (roadsFeature && roadsFeature.coordinates) {
      this.renderRoads(ctx, roadsFeature);
    }
    
    // 然后渲染districts
    const districtsFeature = this.mapData.features.find(feature => feature.id === 'districts');
    if (!districtsFeature || !districtsFeature.geometries) {
      return;
    }
    
    // 渲染每个district
    districtsFeature.geometries.forEach((district, index) => {
      if (district.type === 'Polygon' && district.coordinates) {
        this.renderDistrict(ctx, district, index);
      }
    });
    
    // 最后渲染一些内部结构帮助区分，比如buildings（但是比较淡）
    const buildingsFeature = this.mapData.features.find(feature => feature.id === 'buildings');
    if (buildingsFeature && buildingsFeature.coordinates) {
      this.renderBuildings(ctx, buildingsFeature);
    }
  }

  /**
   * 渲染roads
   */
  renderRoads(ctx, roadsFeature) {
    if (!roadsFeature.coordinates) return;
    
    // 绘制深灰色边框
    ctx.strokeStyle = '#666666'; // 深灰色边框
    ctx.lineWidth = Math.max(3, 4 * this.scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    this.drawCoordinates(ctx, roadsFeature.coordinates);
    ctx.stroke();
    
    // 绘制白色道路内容
    ctx.strokeStyle = '#FFFFFF'; // 白色道路
    ctx.lineWidth = Math.max(1, 2 * this.scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    this.drawCoordinates(ctx, roadsFeature.coordinates);
    ctx.stroke();
  }

  /**
   * 渲染buildings（淡化显示，用于内部结构区分）
   */
  renderBuildings(ctx, buildingsFeature) {
    if (!buildingsFeature.coordinates) return;
    
    ctx.fillStyle = 'rgba(180, 180, 180, 0.3)'; // 非常淡的灰色
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = Math.max(0.5, 1 * this.scale);
    
    ctx.beginPath();
    this.drawCoordinates(ctx, buildingsFeature.coordinates);
    ctx.fill();
    ctx.stroke();
    
    // 渲染已购房产的旗帜标记
    this.renderPropertyFlags(ctx, buildingsFeature);
  }

  /**
   * 渲染已购房产的旗帜标记
   */
  renderPropertyFlags(ctx, buildingsFeature) {
    if (!this.getUserPropertiesCallback) return;
    
    const userProperties = this.getUserPropertiesCallback();
    if (!userProperties || userProperties.length === 0) return;
    
    userProperties.forEach(property => {
      // 基于房产的districtType在对应区域内生成坐标
      const coordinates = this.getPropertyCoordinatesFromDistrict(property);
      if (coordinates) {
        this.renderFlag(ctx, coordinates.x, coordinates.y, property);
      }
    });
  }

  /**
   * 基于房产的districtType获取在对应区域内的坐标
   */
  getPropertyCoordinatesFromDistrict(property) {
    if (!this.mapData || !this.mapData.features) return null;
    
    const districtsFeature = this.mapData.features.find(feature => feature.id === 'districts');
    if (!districtsFeature || !districtsFeature.geometries) return null;
    
    // 查找匹配的district
    const matchingDistrict = districtsFeature.geometries.find(district => 
      district.name === property.districtType
    );
    
    if (!matchingDistrict || !matchingDistrict.coordinates) return null;
    
    // 在district区域内生成一个伪随机位置
    // 使用房产ID作为种子，确保同一房产总是显示在相同位置
    const seed = this.hashCode(property.id);
    const randomPoint = this.getRandomPointInPolygon(matchingDistrict.coordinates, seed);
    
    return randomPoint;
  }
  
  /**
   * 生成字符串的简单哈希值（用作随机种子）
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
  
  /**
   * 在多边形内生成伪随机点
   */
  getRandomPointInPolygon(coordinates, seed) {
    if (!coordinates || !Array.isArray(coordinates[0])) return null;
    
    const polygon = coordinates[0]; // 取第一个环（外边界）
    if (polygon.length < 3) return null;
    
    // 找到多边形的边界框
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    polygon.forEach(point => {
      minX = Math.min(minX, point[0]);
      maxX = Math.max(maxX, point[0]);
      minY = Math.min(minY, point[1]);
      maxY = Math.max(maxY, point[1]);
    });
    
    // 使用种子生成伪随机数生成器
    const rng = this.seededRandom(seed);
    
    // 生成边界框内的随机点，并检查是否在多边形内
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const x = minX + (maxX - minX) * rng();
      const y = minY + (maxY - minY) * rng();
      
      if (this.isPointInPolygon(x, y, polygon)) {
        return { x, y };
      }
      attempts++;
    }
    
    // 如果无法在多边形内找到点，返回中心点
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    return { x: centerX, y: centerY };
  }
  
  /**
   * 基于种子的伪随机数生成器
   */
  seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }
  
  /**
   * 检查点是否在多边形内（射线投射算法）
   */
  isPointInPolygon(x, y, polygon) {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  /**
   * 从房产ID获取block索引（已弃用，保留用于兼容性）
   * 注意：此函数已不再使用，新实现基于districtType
   */
  getBlockIndexFromPropertyId(propertyId) {
    // 简化处理：从blockId中提取数字部分作为索引
    const match = propertyId.match(/(\d+)$/);
    if (match) {
      return parseInt(match[1]) - 1; // 转换为0基索引
    }
    return -1;
  }

  /**
   * 计算建筑物中心点
   */
  calculateBuildingCenter(buildingCoords) {
    if (!buildingCoords || !Array.isArray(buildingCoords[0])) return null;
    
    let sumX = 0, sumY = 0, count = 0;
    
    // 处理MultiPolygon结构
    buildingCoords[0].forEach(coord => {
      if (typeof coord[0] === 'number' && typeof coord[1] === 'number') {
        sumX += coord[0];
        sumY += coord[1];
        count++;
      }
    });
    
    if (count === 0) return null;
    
    return {
      x: sumX / count,
      y: sumY / count
    };
  }

  /**
   * 渲染旗帜标记 - 使用对应的地图图钉图片
   */
  renderFlag(ctx, worldX, worldY, property) {
    const screenX = worldX * this.scale + this.offsetX;
    const screenY = worldY * this.scale + this.offsetY;
    
    // 检查旗帜是否在可见区域内
    const mapAreaY = 130; // 80 + 50，向下平移50px
    const mapAreaHeight = canvas.height - 130 - 55; // 向下平移50px
    
    if (screenX < -20 || screenX > canvas.width + 20 || 
        screenY < mapAreaY - 20 || screenY > mapAreaY + mapAreaHeight + 20) {
      return; // 不在可见区域，跳过绘制
    }
    
    ctx.save();
    
    // 使用统一的映射函数选择对应的图钉图片
    const pinImageName = getDistrictPinImage(property.districtType);
    
    const pinImage = this.mapPinImages[pinImageName];
    
    if (pinImage && pinImage.complete) {
      // 计算图钉大小（根据缩放调整）
      const pinWidth = Math.max(20, 30 * this.scale);
      const pinHeight = Math.max(24, 36 * this.scale);
      
      // 绘制图钉（图钉的"针尖"应该指向房产位置）
      ctx.drawImage(
        pinImage, 
        screenX - pinWidth / 2, 
        screenY - pinHeight, 
        pinWidth, 
        pinHeight
      );
      
      // 为传说级别房产添加闪光效果
      if (property.decorationType === '传说') {
        this.renderFlagGlow(ctx, screenX, screenY - pinHeight / 2, pinWidth / 2);
      }
    } else {
      // 如果图片未加载，使用备用显示
      const flagSize = Math.max(8, 12 * this.scale);
      ctx.fillStyle = '#FF4444';
      ctx.beginPath();
      ctx.arc(screenX, screenY, flagSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制简单文字标记
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `${Math.max(8, 10 * this.scale)}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('🏠', screenX, screenY + flagSize / 4);
    }
    
    ctx.restore();
  }

  /**
   * 渲染旗帜闪光效果
   */
  renderFlagGlow(ctx, centerX, centerY, size) {
    const time = Date.now() * 0.005;
    const glowRadius = size * (1 + 0.3 * Math.sin(time));
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, glowRadius
    );
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 渲染单个district
   */
  renderDistrict(ctx, district, index) {
    if (!district.coordinates) return;
    
    // 为不同区域使用不同颜色，增强对比度
    const districtColors = [
      'rgba(52, 152, 219, 0.7)',  // 蓝色 - 金融街
      'rgba(155, 89, 182, 0.7)',  // 紫色 - 市中心  
      'rgba(46, 204, 113, 0.7)',  // 绿色 - 科创园区
      'rgba(241, 196, 15, 0.7)',  // 黄色 - 老城区
      'rgba(231, 76, 60, 0.7)'    // 红色 - 工业开发新区
    ];
    
    const strokeColors = [
      'rgba(41, 128, 185, 1.0)',  // 深蓝色描边
      'rgba(142, 68, 173, 1.0)',  // 深紫色描边
      'rgba(39, 174, 96, 1.0)',   // 深绿色描边
      'rgba(243, 156, 18, 1.0)',  // 深黄色描边
      'rgba(192, 57, 43, 1.0)'    // 深红色描边
    ];
    
    const fillColor = districtColors[index % districtColors.length];
    const strokeColor = strokeColors[index % strokeColors.length];
    
    // 绘制district形状
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(2, 3 * this.scale); // 增加描边宽度以提高对比度
    
    ctx.beginPath();
    this.drawCoordinates(ctx, district.coordinates);
    ctx.fill();
    ctx.stroke();
    
    // 计算并渲染district名称
    const center = this.calculatePolygonCenter(district.coordinates);
    if (center) {
      const worldX = center.x * this.scale + this.offsetX;
      const worldY = center.y * this.scale + this.offsetY;
      
      // 优先使用地图数据中的name属性，如果没有则使用备用名称
      let districtName = district.name;
      if (!districtName) {
        const defaultNames = ['金融街', '市中心', '科创园区', '老城区', '工业开发新区'];
        districtName = defaultNames[index % defaultNames.length];
      }
       
      this.renderDistrictName(ctx, districtName, worldX, worldY, index);
    }
  }

  /**
   * 计算polygon的中心点
   */
  calculatePolygonCenter(coordinates) {
    if (!coordinates || coordinates.length === 0) return null;
    
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    
    // 处理嵌套的坐标数组结构
    const processCoords = (coords) => {
      if (Array.isArray(coords)) {
        if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          // 这是一个坐标点 [x, y]
          sumX += coords[0];
          sumY += coords[1];
          count++;
        } else {
          // 这是一个嵌套数组，递归处理
          coords.forEach(coord => processCoords(coord));
        }
      }
    };
    
    processCoords(coordinates);
    
    if (count === 0) {
      console.log('没有找到有效的坐标点');
      return null;
    }
    
    const center = {
      x: sumX / count,
      y: sumY / count
    };
    
    return center;
  }

  /**
   * 渲染district名称
   */
  renderDistrictName(ctx, name, centerX, centerY, districtIndex = 0) {
    
    // centerX和centerY已经是屏幕坐标，不需要再次转换
    const screenX = centerX;
    const screenY = centerY;
    ctx.save();
    
    // 设置文字样式 - 增大字体以确保可见性
    const fontSize = 16;
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 测量文字尺寸
    const textMetrics = ctx.measureText(name);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    const padding = 10;
    
    // 使用对应district的颜色作为背景
    const districtColors = [
      'rgba(52, 152, 219, 0.7)',  // 蓝色 - 金融街
      'rgba(155, 89, 182, 0.7)',  // 紫色 - 市中心  
      'rgba(46, 204, 113, 0.7)',  // 绿色 - 科创园区
      'rgba(241, 196, 15, 0.7)',  // 黄色 - 老城区
      'rgba(231, 76, 60, 0.7)'    // 红色 - 工业开发新区
    ];
    
    const backgroundColor = districtColors[districtIndex % districtColors.length];
    
    // 绘制圆角背景
    ctx.fillStyle = backgroundColor;
    const bgX = screenX - textWidth/2 - padding;
    const bgY = screenY - textHeight/2 - padding;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding * 2;
    const radius = 8;
    
          drawRoundRect(ctx, bgX, bgY, bgWidth, bgHeight, radius);
    ctx.fill();
    
    // 绘制加粗的黑色文字
    ctx.fillStyle = '#000000';  // 纯黑色
    ctx.font = `bold ${fontSize}px Arial`;  // 确保加粗
    
    // 绘制文字
    ctx.fillText(name, screenX, screenY);
    
    ctx.restore();
  }

  /**
   * 绘制坐标路径
   */
  drawCoordinates(ctx, coords) {
    if (typeof coords[0] === 'number') {
      // 单个坐标点
      const x = coords[0] * this.scale + this.offsetX;
      const y = coords[1] * this.scale + this.offsetY;
      ctx.lineTo(x, y);
    } else if (coords.length > 0) {
      // 坐标数组
      coords.forEach((coord, index) => {
        if (typeof coord[0] === 'number') {
          const x = coord[0] * this.scale + this.offsetX;
          const y = coord[1] * this.scale + this.offsetY;
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        } else {
          // 嵌套数组，递归处理
          this.drawCoordinates(ctx, coord);
        }
      });
    }
  }

  /**
   * 渲染缩放按钮
   */
  renderZoomButtons(ctx, mapAreaY, mapAreaHeight) {
    const zoomButtonSize = 50;
    const zoomButtonMargin = 20;
    
    // 放大按钮位置（右上角）
    const zoomInX = canvas.width - zoomButtonMargin - zoomButtonSize;
    const zoomInY = mapAreaY + zoomButtonMargin;
    
    // 缩小按钮位置（放大按钮下方）
    const zoomOutX = canvas.width - zoomButtonMargin - zoomButtonSize;
    const zoomOutY = mapAreaY + zoomButtonMargin + zoomButtonSize + 10;
    
    // 绘制放大按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, zoomInX, zoomInY, zoomButtonSize, zoomButtonSize, 8);
    ctx.fill();
    ctx.stroke();
    
    // 放大按钮图标 (+)
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', zoomInX + zoomButtonSize/2, zoomInY + zoomButtonSize/2);
    
    // 绘制缩小按钮
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, zoomOutX, zoomOutY, zoomButtonSize, zoomButtonSize, 8);
    ctx.fill();
    ctx.stroke();
    
    // 缩小按钮图标 (-)
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('−', zoomOutX + zoomButtonSize/2, zoomOutY + zoomButtonSize/2);
  }

  /**
   * 渲染坐标系（已移除）
   */
  renderCoordinateSystem(ctx, mapAreaY, mapAreaHeight) {
    if (!this.mapBounds) return;
    
    ctx.save();
    
    // 设置坐标系样式
    ctx.fillStyle = '#333333';
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const mapAreaWidth = canvas.width;
    
    // 计算坐标范围
    const worldMinX = this.mapBounds.minX;
    const worldMaxX = this.mapBounds.maxX;
    const worldMinY = this.mapBounds.minY;
    const worldMaxY = this.mapBounds.maxY;
    
    // 计算合适的刻度间隔
    const xRange = worldMaxX - worldMinX;
    const yRange = worldMaxY - worldMinY;
    
    // 自动计算刻度间隔
    const xInterval = this.calculateInterval(xRange);
    const yInterval = this.calculateInterval(yRange);
    
    // 绘制垂直网格线和X轴坐标
    const startX = Math.ceil(worldMinX / xInterval) * xInterval;
    for (let worldX = startX; worldX <= worldMaxX; worldX += xInterval) {
      const screenX = worldX * this.scale + this.offsetX;
      
      if (screenX >= 0 && screenX <= mapAreaWidth) {
        // 绘制垂直网格线
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(screenX, mapAreaY);
        ctx.lineTo(screenX, mapAreaY + mapAreaHeight);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 在地图上方显示X坐标
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(worldX).toString(), screenX, mapAreaY - 10);
        
        // 在地图下方也显示X坐标
        ctx.fillText(Math.round(worldX).toString(), screenX, mapAreaY + mapAreaHeight + 15);
      }
    }
    
    // 绘制水平网格线和Y轴坐标
    const startY = Math.ceil(worldMinY / yInterval) * yInterval;
    for (let worldY = startY; worldY <= worldMaxY; worldY += yInterval) {
      const screenY = worldY * this.scale + this.offsetY;
      
      if (screenY >= mapAreaY && screenY <= mapAreaY + mapAreaHeight) {
        // 绘制水平网格线
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(mapAreaWidth, screenY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 在地图左侧显示Y坐标
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(worldY).toString(), 25, screenY);
        
        // 在地图右侧也显示Y坐标
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(worldY).toString(), mapAreaWidth - 25, screenY);
      }
    }
    
    // 绘制坐标系标签
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    
    // X轴标签
    ctx.fillText('X轴', mapAreaWidth / 2, mapAreaY - 25);
    
    // Y轴标签
    ctx.save();
    ctx.translate(10, mapAreaY + mapAreaHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y轴', 0, 0);
    ctx.restore();
    
    // 显示当前显示范围
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666666';
    ctx.fillText(`显示范围: X[${Math.round(worldMinX)}, ${Math.round(worldMaxX)}], Y[${Math.round(worldMinY)}, ${Math.round(worldMaxY)}]`, 
                 10, mapAreaY + mapAreaHeight + 35);
    
    ctx.restore();
  }

  /**
   * 计算合适的刻度间隔
   */
  calculateInterval(range) {
    const targetTicks = 8; // 目标刻度数量
    const rawInterval = range / targetTicks;
    
    // 找到最接近的"好看"的间隔
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)));
    const normalized = rawInterval / magnitude;
    
    let interval;
    if (normalized <= 1) {
      interval = magnitude;
    } else if (normalized <= 2) {
      interval = 2 * magnitude;
    } else if (normalized <= 5) {
      interval = 5 * magnitude;
    } else {
      interval = 10 * magnitude;
    }
    
    return interval;
  }

  // 移除本地的renderBottomNavigation函数，使用utils中的版本
} 