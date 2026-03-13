<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- 顶部栏 -->
    <header class="h-12 border-b border-white/10 flex items-center justify-between px-4 glass-effect">
      <div class="flex items-center gap-2">
        <span class="text-xl">🎵</span>
        <span class="font-bold text-text-primary">CloudNote</span>
      </div>
      <div class="flex items-center gap-4">
        <button class="text-text-secondary hover:text-text-primary transition" @click="showSearch = true">
          🔍 搜索
        </button>
        <button class="text-text-secondary hover:text-text-primary transition">
          ⚙️ 设置
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 overflow-auto p-6">
      <div v-if="!player.currentSong" class="text-center pt-20">
        <h1 class="text-4xl font-bold mb-4 text-text-primary">欢迎使用 CloudNote</h1>
        <p class="text-text-secondary mb-8">拖拽音乐文件到这里开始播放</p>
        <button 
          class="px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg transition"
          @click="openFilePicker"
        >
          选择音乐
        </button>
      </div>
    </main>

    <!-- 底部播放控制条 -->
    <footer class="h-16 border-t border-white/10 glass-effect flex items-center px-4 gap-4">
      <!-- 歌曲信息 -->
      <div class="flex items-center gap-3 w-64">
        <div class="w-12 h-12 bg-surface rounded flex items-center justify-center">
          <span v-if="player.currentSong">🎵</span>
          <span v-else>📀</span>
        </div>
        <div class="min-w-0">
          <p class="text-text-primary font-medium truncate">{{ player.currentSong?.title || '未选择歌曲' }}</p>
          <p class="text-text-secondary text-sm truncate">{{ player.currentSong?.artist || '-' }}</p>
        </div>
      </div>

      <!-- 播放控制 -->
      <div class="flex-1 flex flex-col items-center">
        <div class="flex items-center gap-4 mb-1">
          <button 
            class="text-text-secondary hover:text-text-primary transition"
            :class="{ 'text-primary': player.repeatMode !== 'none' }"
            @click="toggleRepeat"
          >
            🔁
          </button>
          <button class="text-text-primary hover:text-white transition" @click="player.playPrev">
            ⏮️
          </button>
          <button 
            class="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-white transition"
            @click="player.togglePlayPause"
          >
            {{ player.isPlaying ? '⏸️' : '▶️' }}
          </button>
          <button class="text-text-primary hover:text-white transition" @click="player.playNext">
            ⏭️
          </button>
          <button 
            class="text-text-secondary hover:text-text-primary transition"
            :class="{ 'text-primary': player.shuffleMode }"
            @click="toggleShuffle"
          >
            🔀
          </button>
        </div>

        <!-- 进度条 -->
        <div class="flex items-center gap-2 w-full max-w-md text-xs text-text-secondary">
          <span>{{ formatTime(player.currentTime) }}</span>
          <div class="flex-1 h-1 bg-surface rounded overflow-hidden cursor-pointer" @click="seek">
            <div 
              class="h-full bg-primary transition-all"
              :style="{ width: `${(player.currentTime / player.duration) * 100}%` }"
            ></div>
          </div>
          <span>{{ formatTime(player.duration) }}</span>
        </div>
      </div>

      <!-- 音量控制 -->
      <div class="flex items-center gap-2 w-48">
        <button class="text-text-secondary hover:text-text-primary transition" @click="player.volume = player.volume === 0 ? 0.8 : 0">
          {{ player.volume === 0 ? '🔇' : '🔊' }}
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01"
          :value="player.volume"
          @input="(e: Event) => player.setVolume(Number((e.target as HTMLInputElement).value))"
          class="flex-1 accent-primary"
        />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const showSearch = ref(false)

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const toggleRepeat = () => {
  player.repeatMode = player.repeatMode === 'none' ? 'all' : 
                      player.repeatMode === 'all' ? 'one' : 'none'
}

const toggleShuffle = () => {
  player.shuffleMode = !player.shuffleMode
}

const openFilePicker = () => {
  // TODO: Implement file picker using Tauri
  console.log('Open file picker')
}

const seek = (event: MouseEvent) => {
  // TODO: Implement seek functionality
  console.log('Seek to:', event.offsetX)
}
</script>
