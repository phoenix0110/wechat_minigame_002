/**
 * 音频管理器
 * 负责管理游戏中的背景音乐和音效
 */
export default class AudioManager {
  constructor() {
    this.bgMusicList = [
      'audio/bg/Now or Never.mp3'
    ];
    this.currentBgMusicIndex = 0;
    this.bgMusic = null;
    this.isPlaying = false;
  }

  /**
   * 初始化背景音乐
   */
  init() {
    // 创建背景音乐实例
    this.bgMusic = wx.createInnerAudioContext();
    this.bgMusic.loop = true;
    
    // 监听音乐播放结束事件
    this.bgMusic.onEnded(() => {
      this.playNextBgMusic();
    });

    // 监听音乐播放错误事件
    this.bgMusic.onError((err) => {
      console.error('背景音乐播放错误:', err);
      this.playNextBgMusic(); // 出错时尝试播放下一首
    });
  }

  /**
   * 开始播放背景音乐
   */
  startBgMusic() {
    if (!this.bgMusic) {
      this.init();
    }
    
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.playCurrentBgMusic();
    }
  }

  /**
   * 停止播放背景音乐
   */
  stopBgMusic() {
    if (this.bgMusic) {
      this.isPlaying = false;
      this.bgMusic.stop();
    }
  }

  /**
   * 暂停播放背景音乐
   */
  pauseBgMusic() {
    if (this.bgMusic) {
      this.isPlaying = false;
      this.bgMusic.pause();
    }
  }

  /**
   * 恢复播放背景音乐
   */
  resumeBgMusic() {
    if (this.bgMusic && !this.isPlaying) {
      this.isPlaying = true;
      this.bgMusic.play();
    }
  }

  /**
   * 播放当前背景音乐
   */
  playCurrentBgMusic() {
    if (this.bgMusic && this.isPlaying) {
      this.bgMusic.src = this.bgMusicList[this.currentBgMusicIndex];
      this.bgMusic.play();
    }
  }

  /**
   * 设置背景音乐音量
   * @param {number} volume 音量大小，范围0-1
   */
  setBgMusicVolume(volume) {
    if (this.bgMusic) {
      this.bgMusic.volume = Math.max(0, Math.min(1, volume));
    }
  }
} 