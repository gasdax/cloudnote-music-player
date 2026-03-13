import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  // 状态
  const currentSong = ref<Song | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const shuffleMode = ref(false)
  const repeatMode = ref<'none' | 'one' | 'all'>('none')
  
  // 播放列表
  const playlist = ref<Song[]>([])
  const currentPlaylistIndex = ref(-1)
  
  // 计算属性
  const isShuffle = computed(() => shuffleMode.value)
  const isRepeat = computed(() => repeatMode.value !== 'none')
  
  // Actions
  function setCurrentSong(song: Song, index: number = -1) {
    currentSong.value = song
    if (index >= 0) {
      currentPlaylistIndex.value = index
    }
    isPlaying.value = true
    currentTime.value = 0
  }
  
  function togglePlayPause() {
    isPlaying.value = !isPlaying.value
  }
  
  function playNext() {
    if (currentPlaylistIndex.value < playlist.value.length - 1) {
      const nextIndex = currentPlaylistIndex.value + 1
      setCurrentSong(playlist.value[nextIndex], nextIndex)
    }
  }
  
  function playPrev() {
    if (currentPlaylistIndex.value > 0) {
      const prevIndex = currentPlaylistIndex.value - 1
      setCurrentSong(playlist.value[prevIndex], prevIndex)
    }
  }
  
  function setVolume(newVolume: number) {
    volume.value = Math.max(0, Math.min(1, newVolume))
  }
  
  function setTimeUpdate(time: number, dur: number) {
    currentTime.value = time
    duration.value = dur
  }
  
  function addSong(song: Song) {
    playlist.value.push(song)
  }
  
  function removeFromPlaylist(index: number) {
    if (index === currentPlaylistIndex.value) {
      isPlaying.value = false
      currentSong.value = null
    }
    playlist.value.splice(index, 1)
  }
  
  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffleMode,
    repeatMode,
    playlist,
    currentPlaylistIndex,
    isShuffle,
    isRepeat,
    setCurrentSong,
    togglePlayPause,
    playNext,
    playPrev,
    setVolume,
    setTimeUpdate,
    addSong,
    removeFromPlaylist
  }
})
