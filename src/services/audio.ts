// @ts-nocheck - 使用原生 HTML5 Audio API

/**
 * 支持的音频格式
 */
export type AudioFormat = 'mp3' | 'flac' | 'wav' | 'aac' | 'ogg' | 'm4a' | 'ape' | 'dsd'

/**
 * 音频播放状态
 */
export interface AudioState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isLoading: boolean
}

/**
 * 音频事件回调类型
 */
export interface AudioEventCallbacks {
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onLoad?: (duration: number) => void
  onError?: (error: Error) => void
  onProgress?: (time: number, duration: number) => void
}

/**
 * 音频服务类 - 使用原生 HTML5 Audio API
 */
export class AudioService {
  private currentAudio: HTMLAudioElement | null = null
  private rafId: number | null = null // requestAnimationFrame ID
  private callbacks: AudioEventCallbacks = {}
  private lastKnownState: AudioState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isLoading: false
  }

  /**
   * 检测音频文件格式
   */
  detectFormat(filePath: string): AudioFormat {
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    const formatMap: Record<string, AudioFormat> = {
      'mp3': 'mp3',
      'm4a': 'm4a',
      'flac': 'flac',
      'wav': 'wav',
      'ogg': 'ogg',
      'oga': 'ogg',
      'aac': 'aac',
      'ape': 'ape',
      'dsd': 'dsd',
      'dff': 'dsd',
      'dsf': 'dsd'
    }
    return formatMap[ext] || 'mp3'
  }

  /**
   * 加载音频文件
   */
  load(filePath: string, callbacks?: AudioEventCallbacks): void {
    const format = this.detectFormat(filePath)
    
    console.log(`[AudioService] 开始加载：${filePath}, 格式：${format}`)

    // 将本次调用传入的回调合并到统一回调集合中
    if (callbacks) {
      this.callbacks = { ...this.callbacks, ...callbacks }
    }
    
    // 检查是否支持该格式
    if (!this.isSupported(format)) {
      const error = new Error(`不支持的音频格式：${format}`)
      this.lastKnownState.isLoading = false
      this.callbacks.onError?.(error)
      return
    }

    // 清理旧实例
    this.destroy()

    this.lastKnownState.isLoading = true

    try {
      // 创建新的 HTMLAudioElement
      this.currentAudio = new Audio()
      this.currentAudio.src = filePath
      this.currentAudio.crossOrigin = "anonymous" // 允许跨域
      this.currentAudio.preload = "auto"
      this.currentAudio.volume = this.lastKnownState.volume

      // 加载元数据完成
      this.currentAudio.addEventListener('loadedmetadata', () => {
        const duration = this.currentAudio?.duration || 0
        this.lastKnownState.duration = duration
        this.lastKnownState.isLoading = false
        console.log(`[AudioService] ✅ 音频加载完成，时长：${duration.toFixed(2)}s`)
        this.callbacks.onLoad?.(duration)
      })

      // 播放开始
      this.currentAudio.addEventListener('play', () => {
        this.lastKnownState.isPlaying = true
        console.log(`[AudioService] ▶️ 开始播放`)
        this.startProgressLoop()
        this.callbacks.onPlay?.()
      })

      // 暂停
      this.currentAudio.addEventListener('pause', () => {
        this.lastKnownState.isPlaying = false
        console.log(`[AudioService] ⏸️ 已暂停`)
        this.callbacks.onPause?.()
      })

      // 播放结束
      this.currentAudio.addEventListener('ended', () => {
        this.lastKnownState.isPlaying = false
        this.lastKnownState.currentTime = 0
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId)
          this.rafId = null
        }
        console.log(`[AudioService] 🔚 播放结束`)
        this.callbacks.onEnded?.()
      })

      // 错误处理
      this.currentAudio.addEventListener('error', (e) => {
        this.lastKnownState.isLoading = false
        const error = new Error(`音频加载失败：${this.currentAudio.error?.message || '未知错误'}`)
        console.error('[AudioService] ❌', error, e)
        this.callbacks.onError?.(error)
      })

      // 音量变化
      this.currentAudio.addEventListener('volumechange', () => {
        this.lastKnownState.volume = this.currentAudio?.volume || 1
      })

      // 开始加载
      this.currentAudio.load()

    } catch (error) {
      this.lastKnownState.isLoading = false
      const err = error instanceof Error ? error : new Error('未知的加载错误')
      console.error('[AudioService] ❌', err)
      this.callbacks.onError?.(err)
    }
  }

  /**
   * 检查格式是否支持
   */
  private isSupported(format: AudioFormat): boolean {
    const supported: AudioFormat[] = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a']
    
    if (supported.includes(format)) {
      return true
    }

    console.warn(`[AudioService] ⚠️ 格式 ${format} 需要转码，当前不支持直接播放`)
    return false
  }

  /**
   * 播放音频
   */
  play(): void {
    if (!this.currentAudio) {
      console.warn('[AudioService] ⚠️ 没有可播放的音频')
      return
    }

    try {
      this.currentAudio.play()
        .then(() => {
          this.lastKnownState.isPlaying = true
          console.log(`[AudioService] ▶️ 播放成功`)
        })
        .catch((error) => {
          console.error('[AudioService] ❌ 播放失败:', error)
        })
    } catch (error) {
      console.error('[AudioService] ❌ 播放失败:', error)
    }
  }

  /**
   * 暂停音频
   */
  pause(): void {
    if (!this.currentAudio) return

    try {
      this.currentAudio.pause()
      this.lastKnownState.isPlaying = false
      console.log(`[AudioService] ⏸️ 已暂停`)
    } catch (error) {
      console.error('[AudioService] ❌ 暂停失败:', error)
    }
  }

  /**
   * 切换播放/暂停状态
   * @returns 切换后的播放状态（true=正在播放）
   */
  togglePlayPause(): boolean {
    if (!this.currentAudio) return false

    if (this.lastKnownState.isPlaying) {
      this.pause()
      return false
    } else {
      this.play()
      return true
    }
  }

  /**
   * 跳转到指定时间
   */
  seek(time: number): void {
    if (!this.currentAudio) return

    const duration = this.getDuration()
    const clampedTime = Math.max(0, Math.min(time, duration))

    try {
      this.currentAudio.currentTime = clampedTime
      this.lastKnownState.currentTime = clampedTime
      console.log(`[AudioService] 🎚️ 跳转到：${clampedTime.toFixed(1)}s`)
    } catch (error) {
      console.error('[AudioService] ❌ 跳转失败:', error)
    }
  }

  /**
   * 获取当前播放时间
   */
  getCurrentTime(): number {
    if (!this.currentAudio) return 0
    return this.currentAudio.currentTime || 0
  }

  /**
   * 获取音频总时长
   */
  getDuration(): number {
    if (!this.currentAudio) return 0
    return this.currentAudio.duration || 0
  }

  /**
   * 设置音量 (0-1)
   */
  setVolume(value: number): void {
    const clamped = Math.max(0, Math.min(1, value))
    
    if (!this.currentAudio) {
      this.lastKnownState.volume = clamped
      return
    }

    try {
      this.currentAudio.volume = clamped
      this.lastKnownState.volume = clamped
    } catch (error) {
      console.error('[AudioService] ❌ 设置音量失败:', error)
    }
  }

  /**
   * 获取当前音量
   */
  getVolume(): number {
    return this.lastKnownState.volume
  }

  /**
   * 开始进度更新循环
   */
  private startProgressLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }

    const update = () => {
      if (!this.currentAudio) return

      const time = this.getCurrentTime()
      const duration = this.getDuration()
      
      // 通知回调
      this.callbacks.onProgress?.(time, duration)

      // 继续循环（如果还在播放）
      if (this.currentAudio && !this.currentAudio.paused) {
        this.rafId = requestAnimationFrame(update)
      }
    }

    this.rafId = requestAnimationFrame(update)
  }

  /**
   * 设置事件回调
   */
  setCallbacks(callbacks: AudioEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * 获取当前状态
   */
  getState(): AudioState {
    if (!this.currentAudio) return this.lastKnownState

    return {
      isPlaying: !this.currentAudio.paused,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.getVolume(),
      isLoading: this.lastKnownState.isLoading
    }
  }

  /**
   * 销毁当前音频实例，释放资源
   */
  destroy(): void {
    // 停止进度循环
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    // 卸载旧音频
    if (this.currentAudio) {
      try {
        this.currentAudio.pause()
        this.currentAudio.src = ''
        this.currentAudio.load()
        console.log(`[AudioService] 🗑️ 已释放音频资源`)
      } catch (e) {
        console.warn('[AudioService] ⚠️ release 失败:', e)
      }
      this.currentAudio = null
    }

    // 重置状态
    this.lastKnownState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: this.lastKnownState.volume, // 保留音量设置
      isLoading: false
    }
  }
}

// 导出单例实例
export const audioService = new AudioService()
