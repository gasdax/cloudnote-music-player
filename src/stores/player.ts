import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { audioService, type AudioEventCallbacks } from '@/services/audio'

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  filePath?: string
  coverArt?: string
}

export const usePlayerStore = defineStore('player', () => {
  // ==================== 状态 ====================
  const currentSong = ref<Song | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  
  // 播放列表相关
  const shuffleMode = ref(false)
  const repeatMode = ref<'none' | 'one' | 'all'>('none')
  const playlist = ref<Song[]>([])
  const currentPlaylistIndex = ref(-1)
  
  // ==================== 计算属性 ====================
  const isShuffle = computed(() => shuffleMode.value)
  const isRepeat = computed(() => repeatMode.value !== 'none')
  
  // ==================== 音频事件回调 ====================
  const audioCallbacks: AudioEventCallbacks = {
    onPlay: () => {
      isPlaying.value = true
      errorMessage.value = null
    },
    onPause: () => {
      isPlaying.value = false
    },
    onEnded: () => {
      isPlaying.value = false
      currentTime.value = 0
      handleTrackEnded()
    },
    onLoad: (dur: number) => {
      duration.value = dur
      isLoading.value = false
      // 如果有自定义时长，更新当前歌曲
      if (currentSong.value && currentSong.value.filePath) {
        currentSong.value.duration = dur
      }
    },
    onError: (error: Error) => {
      isLoading.value = false
      isPlaying.value = false
      errorMessage.value = error.message
      console.error('[PlayerStore] 音频错误:', error)
    },
    onProgress: (time: number, dur: number) => {
      currentTime.value = time
      if (dur > 0) duration.value = dur
    }
  }

  // ==================== 核心功能 ====================
  
  /**
   * 设置并播放歌曲
   */
  function setCurrentSong(song: Song, index: number = -1) {
    if (!song.filePath) {
      errorMessage.value = '歌曲缺少文件路径'
      return
    }

    // 清除之前的错误
    errorMessage.value = null
    
    // 更新状态
    currentSong.value = song
    if (index >= 0) {
      currentPlaylistIndex.value = index
    }
    
    isLoading.value = true
    currentTime.value = 0
    
    // 加载并播放音频
    audioService.setCallbacks(audioCallbacks)
    audioService.load(song.filePath, audioCallbacks)
    audioService.setVolume(volume.value)
  }
  
  /**
   * 切换播放/暂停状态
   */
  function togglePlayPause() {
    const newState = audioService.togglePlayPause()
    isPlaying.value = newState
  }
  
  /**
   * 跳转到指定时间（秒）
   */
  function seek(time: number) {
    audioService.seek(time)
    currentTime.value = time
  }
  
  /**
   * 播放下一首
   */
  function playNext() {
    let nextIndex: number
    
    if (shuffleMode.value && playlist.value.length > 0) {
      // 随机模式
      nextIndex = Math.floor(Math.random() * playlist.value.length)
    } else {
      // 顺序模式
      nextIndex = currentPlaylistIndex.value + 1
      
      // 如果超出播放列表，根据循环模式处理
      if (nextIndex >= playlist.value.length) {
        if (repeatMode.value === 'all') {
          nextIndex = 0 // 从头开始
        } else {
          return // 不播放下一首
        }
      }
    }
    
    const nextSong = playlist.value[nextIndex]
    if (nextSong) {
      setCurrentSong(nextSong, nextIndex)
    }
  }
  
  /**
   * 播放上一首
   */
  function playPrev() {
    // 如果当前进度 > 3 秒，则重新开始当前歌曲
    if (currentTime.value > 3) {
      seek(0)
      return
    }
    
    let prevIndex = currentPlaylistIndex.value - 1
    
    if (prevIndex < 0) {
      if (repeatMode.value === 'all') {
        prevIndex = playlist.value.length - 1
      } else {
        return
      }
    }
    
    const prevSong = playlist.value[prevIndex]
    if (prevSong) {
      setCurrentSong(prevSong, prevIndex)
    }
  }
  
  /**
   * 设置音量
   */
  function setVolume(newVolume: number) {
    const clamped = Math.max(0, Math.min(1, newVolume))
    volume.value = clamped
    audioService.setVolume(clamped)
  }
  
  /**
   * 切换循环模式
   */
  function toggleRepeat() {
    if (repeatMode.value === 'none') {
      repeatMode.value = 'all'
    } else if (repeatMode.value === 'all') {
      repeatMode.value = 'one'
    } else {
      repeatMode.value = 'none'
    }
  }
  
  /**
   * 切换随机播放
   */
  function toggleShuffle() {
    shuffleMode.value = !shuffleMode.value
  }
  
  /**
   * 歌曲结束后处理
   */
  function handleTrackEnded() {
    // 单曲循环
    if (repeatMode.value === 'one') {
      seek(0)
      audioService.play()
      return
    }
    
    // 播放列表循环已在 playNext 中处理
    playNext()
  }
  
  // ==================== 播放列表操作 ====================
  
  /**
   * 添加歌曲到播放列表
   */
  function addSong(song: Song) {
    playlist.value.push(song)
  }
  
  /**
   * 批量添加歌曲
   */
  function addSongs(songs: Song[]) {
    playlist.value.push(...songs)
  }
  
  /**
   * 从播放列表移除
   */
  function removeFromPlaylist(index: number) {
    if (index < 0 || index >= playlist.value.length) return
    
    const removed = playlist.value.splice(index, 1)[0]
    
    // 如果移除的是当前歌曲，停止播放
    if (removed.id === currentSong.value?.id) {
      audioService.destroy()
      isPlaying.value = false
      currentSong.value = null
      currentTime.value = 0
    }
    
    // 更新索引
    if (index < currentPlaylistIndex.value) {
      currentPlaylistIndex.value--
    } else if (index === currentPlaylistIndex.value) {
      // 移除当前歌曲后，播放同一位置的下一首
      if (currentPlaylistIndex.value >= playlist.value.length) {
        currentPlaylistIndex.value = Math.max(0, playlist.value.length - 1)
      }
    }
  }
  
  /**
   * 清空播放列表
   */
  function clearPlaylist() {
    playlist.value = []
    currentPlaylistIndex.value = -1
    audioService.destroy()
    isPlaying.value = false
    currentSong.value = null
    currentTime.value = 0
    duration.value = 0
  }
  
  /**
   * 重置错误状态
   */
  function resetError() {
    errorMessage.value = null
  }

  // ==================== 暴露的 API ====================
  return {
    // 状态
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    errorMessage,
    shuffleMode,
    repeatMode,
    playlist,
    currentPlaylistIndex,
    
    // 计算属性
    isShuffle,
    isRepeat,
    
    // 方法
    setCurrentSong,
    togglePlayPause,
    seek,
    playNext,
    playPrev,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    addSong,
    addSongs,
    removeFromPlaylist,
    clearPlaylist,
    resetError
  }
})
