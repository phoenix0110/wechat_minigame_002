import { ANIMATION_TIME_CONFIG } from '../config/timeConfig.js';

/**
 * 对话系统
 * 类似galgame的剧情对话界面
 */
export default class DialogueSystem {
  constructor() {
    this.isActive = false;
    this.currentDialogueIndex = 0;
    this.isTyping = false;
    this.typingSpeed = ANIMATION_TIME_CONFIG.DIALOGUE_TYPING_SPEED; // 打字速度（从配置导入）
    this.displayedText = '';
    this.targetText = '';
    this.typingTimer = null;
    
    // 对话内容
    this.dialogues = [
      {
        speaker: '神秘老头',
        text: '你有一个测试，你现在有100亿，你需要用最快的速度花光这100亿，你成功的话将成为这个世界上最富有的人',
        avatar: '👴'
      },
      {
        speaker: '我',
        text: '什么？！还有这种好事',
        avatar: '😲'
      },
      {
        speaker: '神秘老头',
        text: '现在开始吧。',
        avatar: '👴'
      }
    ];
    
    // 对话框样式
    this.dialogueBoxHeight = 120;
    this.dialogueBoxY = 0;
    this.padding = 20;
    this.avatarSize = 60;
    this.onComplete = null; // 对话完成回调
  }

  /**
   * 开始对话
   */
  start(canvasHeight, onComplete) {
    this.isActive = true;
    this.currentDialogueIndex = 0;
    this.dialogueBoxY = canvasHeight - this.dialogueBoxHeight - 10;
    this.onComplete = onComplete;
    this.showNextDialogue();
  }

  /**
   * 显示下一段对话
   */
  showNextDialogue() {
    if (this.currentDialogueIndex >= this.dialogues.length) {
      this.end();
      return;
    }

    const dialogue = this.dialogues[this.currentDialogueIndex];
    this.targetText = dialogue.text;
    this.displayedText = '';
    this.isTyping = true;
    
    this.startTyping();
  }

  /**
   * 开始打字效果
   */
  startTyping() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
    }

    let charIndex = 0;
    this.typingTimer = setInterval(() => {
      if (charIndex < this.targetText.length) {
        this.displayedText += this.targetText[charIndex];
        charIndex++;
      } else {
        this.isTyping = false;
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
    }, this.typingSpeed);
  }

  /**
   * 跳过打字效果
   */
  skipTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      this.displayedText = this.targetText;
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
    }
  }

  /**
   * 处理点击事件
   */
  handleClick(x, y, canvasWidth, canvasHeight) {
    if (!this.isActive) return false;

    // 检查是否点击了对话框区域
    if (y >= this.dialogueBoxY && y <= this.dialogueBoxY + this.dialogueBoxHeight) {
      if (this.isTyping) {
        // 如果正在打字，跳过打字效果
        this.skipTyping();
      } else {
        // 否则进入下一段对话
        this.currentDialogueIndex++;
        this.showNextDialogue();
      }
      return true;
    }

    return false;
  }

  /**
   * 结束对话
   */
  end() {
    this.isActive = false;
    this.currentDialogueIndex = 0;
    this.displayedText = '';
    this.targetText = '';
    
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }

    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * 渲染对话界面
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!this.isActive) return;

    ctx.save();

    // 绘制半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制对话框背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 3;
    ctx.fillRect(10, this.dialogueBoxY, canvasWidth - 20, this.dialogueBoxHeight);
    ctx.strokeRect(10, this.dialogueBoxY, canvasWidth - 20, this.dialogueBoxHeight);

    const dialogue = this.dialogues[this.currentDialogueIndex];
    
    // 绘制头像背景
    ctx.fillStyle = '#ECF0F1';
    ctx.fillRect(15, this.dialogueBoxY + 10, this.avatarSize, this.avatarSize);
    ctx.strokeStyle = '#BDC3C7';
    ctx.lineWidth = 2;
    ctx.strokeRect(15, this.dialogueBoxY + 10, this.avatarSize, this.avatarSize);

    // 绘制头像
    ctx.fillStyle = '#2C3E50';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dialogue.avatar, 15 + this.avatarSize / 2, this.dialogueBoxY + 50);

    // 绘制说话人名称
    ctx.fillStyle = '#2C3E50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(dialogue.speaker, 90, this.dialogueBoxY + 25);

    // 绘制对话文本
    ctx.fillStyle = '#2C3E50';
    ctx.font = '14px Arial';
    const textX = 90;
    const textY = this.dialogueBoxY + 45;
    const maxWidth = canvasWidth - 120;
    
    this.wrapText(ctx, this.displayedText, textX, textY, maxWidth, 18);

    // 绘制继续提示
    if (!this.isTyping) {
      ctx.fillStyle = '#7F8C8D';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      const promptText = this.currentDialogueIndex < this.dialogues.length - 1 ? '点击继续...' : '点击开始游戏...';
      ctx.fillText(promptText, canvasWidth - 25, this.dialogueBoxY + this.dialogueBoxHeight - 15);
      
      // 绘制闪烁的箭头
      const time = Date.now();
      const alpha = (Math.sin(time / 300) + 1) / 2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#3498DB';
      ctx.font = '16px Arial';
      ctx.fillText('▶', canvasWidth - 45, this.dialogueBoxY + this.dialogueBoxHeight - 15);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  /**
   * 文本换行处理
   */
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }
} 