<template>
  <div
    class="min-h-screen flex flex-col bg-background text-text-primary"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- 背景氛围层 -->
    <div class="pointer-events-none fixed inset-0 -z-10">
      <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl"></div>
      <div class="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/10 blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30"></div>
    </div>

    <!-- 拖拽导入遮罩 -->
    <transition name="fade">
      <div v-if="isDragActive" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div class="glass-effect rounded-2xl px-10 py-8 border border-white/15 text-center max-w-lg">
          <p class="text-2xl font-bold mb-2">拖拽文件到这里导入</p>
          <p class="text-text-secondary">支持 mp3 / flac / wav / aac / ogg / m4a</p>
        </div>
      </div>
    </transition>

    <!-- 错误提示 -->
    <transition name="fade">
      <div v-if="player.errorMessage" class="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500/90 text-white rounded-lg shadow-lg glass-effect max-w-md truncate">
        {{ player.errorMessage }}
        <button @click="player.resetError" class="ml-2 hover:bg-red-600 rounded px-2">关闭</button>
      </div>
    </transition>

    <!-- 顶部栏 -->
    <header class="h-14 border-b border-white/10 flex items-center justify-between px-4 glass-effect">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-xl bg-primary/20 border border-white/10 flex items-center justify-center">
          <span class="text-lg">🎵</span>
        </div>
        <div class="leading-tight">
          <div class="font-bold">CloudNote</div>
          <div class="text-xs text-text-secondary">Music Player</div>
        </div>
      </div>

      <div class="flex items-center gap-3 w-[52rem] max-w-[60vw]">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            class="w-full h-10 rounded-xl bg-surface/50 border border-white/10 px-4 pr-10 outline-none focus:border-primary/60 transition"
            placeholder="搜索：歌曲 / 艺术家（当前队列）"
          />
          <button
            v-if="searchQuery"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary px-2"
            @click="searchQuery = ''"
            title="清空"
          >
            ✕
          </button>
        </div>

        <button class="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover transition text-white" @click="triggerFileInput">
          导入音乐
        </button>
        <button class="h-10 px-4 rounded-xl bg-surface/50 hover:bg-surface-hover transition border border-white/10" @click="showSettings = true">
          设置
        </button>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="flex-1 overflow-hidden">
      <div class="h-full grid grid-cols-[240px_1fr_360px] gap-4 p-4">
        <!-- 侧边栏 -->
        <aside class="glass-effect rounded-2xl p-3 flex flex-col gap-2 border border-white/10">
          <button
            class="h-10 rounded-xl px-3 flex items-center justify-between transition"
            :class="activeTab === 'library' ? 'bg-primary/15 border border-primary/20' : 'hover:bg-surface/60 border border-transparent'"
            @click="activeTab = 'library'"
          >
            <span class="font-medium">资料库</span>
            <span class="text-xs text-text-secondary">{{ player.playlist.length }}</span>
          </button>
          <button
            class="h-10 rounded-xl px-3 flex items-center justify-between transition"
            :class="activeTab === 'queue' ? 'bg-primary/15 border border-primary/20' : 'hover:bg-surface/60 border border-transparent'"
            @click="activeTab = 'queue'"
          >
            <span class="font-medium">播放队列</span>
            <span class="text-xs text-text-secondary">{{ filteredPlaylist.length }}</span>
          </button>
          <button
            class="h-10 rounded-xl px-3 flex items-center justify-between transition"
            :class="activeTab === 'favorites' ? 'bg-primary/15 border border-primary/20' : 'hover:bg-surface/60 border border-transparent'"
            @click="activeTab = 'favorites'"
          >
            <span class="font-medium">收藏</span>
            <span class="text-xs text-text-secondary">{{ Array.from(favoriteIds).length }}</span>
          </button>
          <button
            class="h-10 rounded-xl px-3 flex items-center justify-between transition"
            :class="activeTab === 'recents' ? 'bg-primary/15 border border-primary/20' : 'hover:bg-surface/60 border border-transparent'"
            @click="activeTab = 'recents'"
          >
            <span class="font-medium">最近播放</span>
            <span class="text-xs text-text-secondary">{{ recents.length }}</span>
          </button>

          <div class="mt-3 pt-3 border-t border-white/10 text-xs text-text-secondary space-y-1">
            <div class="flex justify-between"><span>快捷键</span><span>Space / ← →</span></div>
            <div class="flex justify-between"><span>上一/下一首</span><span>Ctrl + ← / →</span></div>
          </div>
        </aside>

        <!-- 列表区 -->
        <section class="glass-effect rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div class="h-12 px-4 flex items-center justify-between border-b border-white/10">
            <div class="font-semibold">
              {{
                activeTab === 'library'
                  ? '资料库'
                  : activeTab === 'favorites'
                    ? '收藏'
                    : activeTab === 'recents'
                      ? '最近播放'
                      : '播放队列'
              }}
              <span class="text-text-secondary text-sm font-normal ml-2">({{ filteredPlaylist.length }})</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="h-9 px-3 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition disabled:opacity-40"
                @click="locateCurrent"
                :disabled="!player.currentSong || player.playlist.length === 0"
              >
                定位当前
              </button>
              <button
                class="h-9 px-3 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition disabled:opacity-40"
                @click="clearAllPlaylist"
                :disabled="player.playlist.length === 0"
              >
                清空
              </button>
              <button
                class="h-9 px-3 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition disabled:opacity-40"
                @click="showPlaylist = true"
                :disabled="player.playlist.length === 0"
              >
                队列弹窗
              </button>
            </div>
          </div>

          <div ref="listViewportRef" class="flex-1 overflow-auto p-2">
            <div v-if="player.playlist.length === 0" class="h-full flex items-center justify-center p-8 text-center">
              <div>
                <div class="text-2xl font-bold mb-2">还没有音乐</div>
                <div class="text-text-secondary mb-6">点击右上角“导入音乐”，或直接拖拽文件到窗口</div>
                <button class="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover transition text-white" @click="triggerFileInput">
                  导入音乐
                </button>
              </div>
            </div>

            <div v-else-if="activeTab === 'library'" class="space-y-3">
              <div class="px-2 pt-2">
                <div class="text-sm text-text-secondary mb-1">按艺术家</div>
                <div class="text-xs text-text-secondary">点击艺术家可快速筛选队列</div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="item in libraryByArtist"
                  :key="item.key"
                  class="text-left p-3 rounded-2xl bg-surface/40 hover:bg-surface-hover border border-white/10 transition"
                  @click="filterByArtist(item.artist)"
                >
                  <div class="font-semibold truncate">{{ item.artist }}</div>
                  <div class="text-xs text-text-secondary mt-1">{{ item.count }} 首</div>
                </button>
              </div>
            </div>

            <div v-else class="space-y-1">
              <div
                v-for="(song, index) in filteredPlaylist"
                :key="song.id"
                :data-song-id="song.id"
                class="group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer border transition"
                :class="indexToOriginalIndex(index) === player.currentPlaylistIndex ? 'bg-primary/15 border-primary/20' : 'hover:bg-surface/60 border-transparent'"
                @click="playSongFromPlaylist(indexToOriginalIndex(index))"
              >
                <div class="h-10 w-10 rounded-xl bg-surface/70 border border-white/10 flex items-center justify-center shrink-0">
                  <span v-if="indexToOriginalIndex(index) === player.currentPlaylistIndex && player.isPlaying">⏸️</span>
                  <span v-else>▶️</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium truncate">{{ song.title }}</div>
                  <div class="text-xs text-text-secondary truncate">{{ song.artist || '未知艺术家' }}</div>
                </div>
                <div class="text-xs text-text-secondary tabular-nums w-14 text-right">
                  {{ song.duration ? formatTime(song.duration) : formatTime(player.duration) }}
                </div>
                <button
                  class="opacity-0 group-hover:opacity-100 transition h-9 px-3 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10"
                  @click.stop="toggleFavorite(song.id)"
                  :title="isFavorite(song.id) ? '取消收藏' : '收藏'"
                >
                  {{ isFavorite(song.id) ? '♥' : '♡' }}
                </button>
                <button
                  class="opacity-0 group-hover:opacity-100 transition h-9 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-200"
                  @click.stop="removeSong(indexToOriginalIndex(index))"
                  title="移除"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Now Playing -->
        <aside class="glass-effect rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div class="p-4 border-b border-white/10">
            <div class="text-sm text-text-secondary mb-1">正在播放</div>
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-lg font-bold truncate">{{ player.currentSong?.title || '未选择歌曲' }}</div>
                <div class="text-sm text-text-secondary truncate">{{ player.currentSong?.artist || '-' }}</div>
              </div>
              <button
                class="h-9 px-3 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition disabled:opacity-40"
                :disabled="!player.currentSong"
                @click="player.currentSong && toggleFavorite(player.currentSong.id)"
                :title="player.currentSong && isFavorite(player.currentSong.id) ? '取消收藏' : '收藏'"
              >
                {{ player.currentSong && isFavorite(player.currentSong.id) ? '♥' : '♡' }}
              </button>
            </div>
          </div>

          <div class="p-4 space-y-4">
            <div class="aspect-square rounded-2xl bg-surface/60 border border-white/10 flex items-center justify-center">
              <span class="text-5xl">🎧</span>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs text-text-secondary tabular-nums">
                <span>{{ formatTime(player.currentTime) }}</span>
                <span>{{ formatTime(player.duration) }}</span>
              </div>
              <input
                type="range"
                min="0"
                :max="player.duration || 1"
                step="0.1"
                :value="player.currentTime"
                @input="handleSeek($event)"
                class="w-full h-1 accent-primary cursor-pointer"
              />
            </div>

            <div class="grid grid-cols-5 gap-2">
              <button class="h-10 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition" @click="player.toggleRepeat" :title="player.repeatMode">
                🔁
              </button>
              <button class="h-10 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition" @click="player.playPrev">
                ⏮️
              </button>
              <button class="h-10 rounded-xl bg-primary hover:bg-primary-hover transition text-white" @click="player.togglePlayPause">
                {{ player.isPlaying ? '⏸️' : '▶️' }}
              </button>
              <button class="h-10 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition" @click="player.playNext">
                ⏭️
              </button>
              <button class="h-10 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition" @click="player.toggleShuffle">
                🔀
              </button>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs text-text-secondary">
                <span>音量</span>
                <span class="tabular-nums">{{ Math.round(player.volume * 100) }}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                :value="player.volume"
                @input="(e: Event) => player.setVolume(Number((e.target as HTMLInputElement).value))"
                class="w-full accent-primary"
              />
            </div>
          </div>
        </aside>
      </div>

      <!-- 隐藏的文件输入框 -->
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="audio/*,.mp3,.flac,.wav,.aac,.ogg,.m4a"
        multiple
        @change="handleFileSelect"
      />
    </main>

    <!-- 底部播放控制条 -->
    <footer class="h-14 border-t border-white/10 glass-effect flex items-center px-4 justify-between">
      <div class="text-xs text-text-secondary">
        提示：拖拽导入、搜索队列、Space 播放/暂停、方向键快进/快退
      </div>
      <button class="h-9 px-3 rounded-xl bg-surface/50 hover:bg-surface-hover border border-white/10 transition" @click="showPlaylist = true">
        打开队列 ({{ player.playlist.length }})
      </button>
    </footer>

    <!-- 播放列表弹窗 -->
    <transition name="fade">
      <div v-if="showPlaylist" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" @click.self="showPlaylist = false">
        <div class="bg-surface rounded-lg p-6 glass-effect w-full max-w-md max-h-2/3 overflow-auto">
          <h3 class="text-xl font-bold text-text-primary mb-4">播放列表 ({{ player.playlist.length }})</h3>
          <div v-if="player.playlist.length === 0" class="text-center text-text-secondary py-8">
            📭 播放列表为空
          </div>
          <div v-else class="space-y-1">
            <div 
              v-for="(song, index) in player.playlist" 
              :key="song.id"
              class="p-2 rounded cursor-pointer hover:bg-primary/20 flex items-center justify-between"
              :class="{ 'bg-primary/30': index === player.currentPlaylistIndex }"
              @click="playSongFromPlaylist(index); showPlaylist = false"
            >
              <span class="text-text-primary truncate">{{ song.title }}</span>
              <span class="text-text-secondary text-sm">
                {{ formatDuration(song.duration) }}
              </span>
            </div>
            <!-- 清空播放列表按钮 -->
            <button 
              class="mt-4 w-full py-2 bg-red-500/80 hover:bg-red-600 rounded text-white transition"
              @click="clearAllPlaylist"
            >
              🗑️ 清空播放列表
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 设置弹窗 -->
    <transition name="fade">
      <div v-if="showSettings" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" @click.self="showSettings = false">
        <div class="bg-surface rounded-lg p-6 glass-effect w-full max-w-md">
          <h3 class="text-xl font-bold text-text-primary mb-6">⚙️ 设置</h3>
          
          <div class="space-y-4">
            <!-- 音质选择 -->
            <div class="flex items-center justify-between">
              <span class="text-text-primary">🎵 默认音质</span>
              <select 
                class="bg-surface/50 border border-white/10 rounded px-3 py-2 text-text-primary focus:outline-none focus:border-primary"
                :value="defaultQuality"
                @change="(e: Event) => defaultQuality = (e.target as HTMLSelectElement).value"
              >
                <option value="standard">标准 (128kbps)</option>
                <option value="high">高品质量 (320kbps)</option>
                <option value="lossless">无损 (FLAC)</option>
              </select>
            </div>

            <!-- 自动播放 -->
            <div class="flex items-center justify-between">
              <span class="text-text-primary">▶️ 添加后自动播放</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" :checked="autoPlay" @change="autoPlay = ($event.target as HTMLInputElement).checked">
                <div class="w-11 h-6 bg-surface/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <!-- 跨会话保存 -->
            <div class="flex items-center justify-between">
              <span class="text-text-primary">💾 跨会话保存列表</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" :checked="persistPlaylist" @change="persistPlaylist = ($event.target as HTMLInputElement).checked">
                <div class="w-11 h-6 bg-surface/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <!-- 缓存清理 -->
            <div class="pt-4 border-t border-white/10">
              <button 
                class="w-full py-2 bg-red-500/80 hover:bg-red-600 rounded text-white transition"
                @click="clearCache"
              >
                🗑️ 清理缓存
              </button>
              <p class="text-xs text-text-secondary mt-2 text-center">
                将清除所有本地音乐文件（需重新上传）
              </p>
            </div>

            <!-- 关于 -->
            <div class="pt-4 border-t border-white/10 text-center">
              <p class="text-text-secondary text-sm">CloudNote Music Player</p>
              <p class="text-text-secondary text-xs">Version 1.0.0 (Beta)</p>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { usePersistStore } from '@/stores/persist'

const player = usePlayerStore()
const fileInput = ref<HTMLInputElement | null>(null)
const showPlaylist = ref(false)
const showSettings = ref(false)
const activeTab = ref<'library' | 'queue' | 'favorites' | 'recents'>('queue')
const searchQuery = ref('')
const isDragActive = ref(false)
let dragDepth = 0
const listViewportRef = ref<HTMLElement | null>(null)
const favoriteIds = ref<Set<string>>(new Set())
type PersistedSongLike = { id: string; title: string; artist: string; album?: string; duration: number; fileData?: string }
const recents = ref<PersistedSongLike[]>([])

// 设置相关
const defaultQuality = ref('high')
const autoPlay = ref(true)
const persistPlaylist = ref(true)

const {
  loadPlaylist,
  savePlaylist,
  clearPlaylist: clearPersisted,
  loadFavorites,
  saveFavorites,
  loadRecents,
  saveRecents,
  MAX_RECENTS_SIZE
} = usePersistStore()

// 组件挂载时恢复播放列表
onMounted(() => {
  favoriteIds.value = new Set(loadFavorites())
  recents.value = loadRecents()

  if (persistPlaylist.value) {
    const savedSongs = loadPlaylist()
    if (savedSongs.length > 0) {
      console.log('🎵 恢复保存的播放列表:', savedSongs.length, '首')
      player.addSongs(savedSongs.map(song => ({
        ...song,
        filePath: song.fileData || undefined // Base64 转回 URL
      })))
    }
  }

  // 键盘快捷键
  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    const tag = target?.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable) return

    if (e.code === 'Space') {
      e.preventDefault()
      player.togglePlayPause()
      return
    }

    if (e.ctrlKey && e.key === 'ArrowLeft') {
      e.preventDefault()
      player.playPrev()
      return
    }
    if (e.ctrlKey && e.key === 'ArrowRight') {
      e.preventDefault()
      player.playNext()
      return
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      player.seek(Math.max(0, player.currentTime - 5))
      return
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      player.seek(Math.min(player.duration || 0, player.currentTime + 5))
      return
    }
  }
  window.addEventListener('keydown', onKeyDown)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
})

const isFavorite = (id: string) => favoriteIds.value.has(id)

const toggleFavorite = (id: string) => {
  const next = new Set(favoriteIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  favoriteIds.value = next
  saveFavorites(Array.from(next))
}

const recordRecent = (song: any) => {
  if (!song) return
  const persisted: PersistedSongLike = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration ?? 0,
    fileData: song.fileData
  }
  const next = [persisted, ...recents.value.filter((s) => s.id !== persisted.id)].slice(0, MAX_RECENTS_SIZE)
  recents.value = next
  saveRecents(next)
}

// 格式化时间 (秒 => MM:SS)
const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 格式化时长 (显示歌曲总时长)
const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '加载...'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}'${secs}"`
}

// 触发文件选择对话框
const triggerFileInput = () => {
  fileInput.value?.click()
}

const filteredPlaylist = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const base =
    activeTab.value === 'favorites'
      ? player.playlist.filter((s) => isFavorite(s.id))
      : activeTab.value === 'recents'
        ? player.playlist.filter((s) => recents.value.some((r) => r.id === s.id))
        : player.playlist

  if (!q) return base
  return base.filter(s => {
    const t = `${s.title} ${s.artist ?? ''} ${s.album ?? ''}`.toLowerCase()
    return t.includes(q)
  })
})

const libraryByArtist = computed(() => {
  const map = new Map<string, number>()
  for (const s of player.playlist) {
    const artist = (s.artist || '未知艺术家').trim() || '未知艺术家'
    map.set(artist, (map.get(artist) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([artist, count]) => ({ key: artist.toLowerCase(), artist, count }))
    .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist))
})

const indexToOriginalIndex = (filteredIndex: number) => {
  const list = filteredPlaylist.value
  const song = list[filteredIndex]
  if (!song) return filteredIndex
  const original = player.playlist.findIndex(s => s.id === song.id)
  return original >= 0 ? original : filteredIndex
}

const locateCurrent = () => {
  const id = player.currentSong?.id
  const viewport = listViewportRef.value
  if (!id || !viewport) return
  const el = viewport.querySelector(`[data-song-id="${CSS.escape(id)}"]`) as HTMLElement | null
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const filterByArtist = (artist: string) => {
  activeTab.value = 'queue'
  searchQuery.value = artist
}

// 处理选择的文件
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) {
    console.log('⚠️ 未选择任何文件')
    return
  }
  
  console.log(`🎵 已选择 ${files.length} 个音乐文件:`)
  
  // 创建歌曲对象（使用 createObjectURL 播放，Base64 保存）
  const songs = Array.from(files).map((file, index) => ({
    id: `local-${Date.now()}-${index}`,
    title: file.name.replace(/\.[^.]+$/, ''), // 去掉扩展名
    artist: '本地文件',
    duration: 0,
    filePath: URL.createObjectURL(file),
    fileData: null as string | null // 稍后填充 Base64
  }))
  
  console.log('📝 准备添加到播放列表:', songs.map(s => s.title))
  player.addSongs(songs)
  
  // 如果启用了持久化，转换并保存（异步）
  if (persistPlaylist.value) {
    const { persistFiles } = usePersistStore()
    const persistedSongs = await persistFiles(Array.from(files))
    // 只保存“可持久化”的数据（包含 fileData），不要把运行时 blobURL 列表混入 localStorage
    const existing = loadPlaylist()
    savePlaylist([...existing, ...persistedSongs])
    console.log('💾 已保存播放列表到 localStorage')
  }
  
  // 如果当前没有正在播放的歌曲，自动播放第一首
  if (!player.currentSong && songs.length > 0) {
    player.setCurrentSong(songs[0], 0)
  }
  
  // 清空 input 以便下次可以选择相同的文件
  target.value = ''
}

// 从播放列表播放指定歌曲（已存在，保持不变）

// 从播放列表播放指定歌曲
const playSongFromPlaylist = (index: number) => {
  const song = player.playlist[index]
  if (song) {
    player.setCurrentSong(song, index)
    recordRecent(song)
  }
}

const removeSong = (index: number) => {
  player.removeFromPlaylist(index)
}

// 处理进度条拖动
const handleSeek = (event: Event) => {
  const target = event.target as HTMLInputElement
  const time = parseFloat(target.value)
  player.seek(time)
}

const onDragEnter = () => {
  dragDepth += 1
  isDragActive.value = true
}

const onDragLeave = () => {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragActive.value = false
}

const onDrop = async (e: DragEvent) => {
  dragDepth = 0
  isDragActive.value = false
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  // 复用现有导入逻辑：构造一个“类 change 事件”
  const fakeEvent = { target: { files } } as unknown as Event
  await handleFileSelect(fakeEvent)
}

// 清空播放列表
const clearAllPlaylist = () => {
  if (confirm('确定要清空所有歌曲吗？此操作不可撤销。')) {
    player.clearPlaylist()
    clearPersisted()
    recents.value = []
    saveRecents([])
    console.log('🗑️ 已清空播放列表')
  }
}

// 清理缓存
const clearCache = () => {
  if (confirm('确定要清理所有缓存吗？将删除所有本地音乐。')) {
    player.clearPlaylist()
    clearPersisted()
    showSettings.value = false
    console.log('🗑️ 已清理缓存')
    alert('✅ 缓存已清理')
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
