interface PersistedSong {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  fileData?: string // Base64 for small files
}

export const usePersistStore = () => {
  const STORAGE_KEY = 'cloudnote_playlist'
  const FAVORITES_KEY = 'cloudnote_favorites'
  const RECENTS_KEY = 'cloudnote_recents'
  const MAX_PLAYLIST_SIZE = 50 // 最多保存 50 首歌
  const SOFT_LIMIT_BYTES = 4.5 * 1024 * 1024 // ~5MB localStorage 的保守阈值（按 UTF-16 估算）
  const MAX_RECENTS_SIZE = 50
  
  // 从 localStorage 加载播放列表
  function loadPlaylist(): PersistedSong[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      
      const parsed = JSON.parse(data)
      console.log('[PersistStore] ✅ 加载播放列表:', parsed.length, '首歌曲')
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('[PersistStore] ❌ 加载失败:', error)
      return []
    }
  }
  
  // 保存播放列表到 localStorage
  function savePlaylist(playlist: PersistedSong[]): void {
    try {
      // 限制数量，避免超出 localStorage 容量
      const limited = playlist.slice(0, MAX_PLAYLIST_SIZE)
      const data = JSON.stringify(limited)
      
      // localStorage 以字符串形式存储，通常按 UTF-16 计算，粗略用 2 bytes/char 估算
      const estimatedBytes = data.length * 2
      if (estimatedBytes > SOFT_LIMIT_BYTES) {
        console.warn('[PersistStore] ⚠️ 播放列表预计过大(≈', Math.round(estimatedBytes / 1024), 'KB)，将尝试缩减')
      }
      
      // 如果数据太大，逐步缩减直到能写入
      let toSave = limited
      let json = data
      while (json.length * 2 > SOFT_LIMIT_BYTES && toSave.length > 1) {
        toSave = toSave.slice(0, Math.ceil(toSave.length / 2))
        json = JSON.stringify(toSave)
      }

      localStorage.setItem(STORAGE_KEY, json)
      console.log('[PersistStore] ✅ 已保存', toSave.length, '首歌曲')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('[PersistStore] ❌ localStorage 空间不足，尝试清理...')
        // 尝试删除部分数据
        const smaller = playlist.slice(0, MAX_PLAYLIST_SIZE / 2)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(smaller))
      } else {
        console.error('[PersistStore] ❌ 保存失败:', error)
      }
    }
  }
  
  // 清除播放列表
  function clearPlaylist(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log('[PersistStore] 🗑️ 已清空播放列表')
    } catch (error) {
      console.error('[PersistStore] ❌ 清空失败:', error)
    }
  }

  function loadFavorites(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
    } catch (error) {
      console.error('[PersistStore] ❌ 加载收藏失败:', error)
      return []
    }
  }

  function saveFavorites(ids: string[]): void {
    try {
      const uniq = Array.from(new Set(ids)).slice(0, 1000)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(uniq))
    } catch (error) {
      console.error('[PersistStore] ❌ 保存收藏失败:', error)
    }
  }

  function loadRecents(): PersistedSong[] {
    try {
      const data = localStorage.getItem(RECENTS_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('[PersistStore] ❌ 加载最近播放失败:', error)
      return []
    }
  }

  function saveRecents(items: PersistedSong[]): void {
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, MAX_RECENTS_SIZE)))
    } catch (error) {
      console.error('[PersistStore] ❌ 保存最近播放失败:', error)
    }
  }
  
  // 文件转 Base64（仅小文件）
  async function fileToBase64(file: File, maxSizeMB = 2): Promise<string | null> {
    if (file.size > maxSizeMB * 1024 * 1024) {
      console.warn('[PersistStore] ⚠️ 文件过大，跳过 Base64 转换:', file.name)
      return null
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  // 从 File 数组创建持久化歌曲列表
  async function persistFiles(files: File[]): Promise<PersistedSong[]> {
    const songs: PersistedSong[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      
      // 尝试转换为 Base64（小文件）
      const base64Data = await fileToBase64(file)
      
      songs.push({
        id: `persist-${Date.now()}-${i}`,
        title: filenameWithoutExt,
        artist: '本地文件',
        duration: 0, // 将在播放时获取真实时长
        fileData: base64Data || undefined // Base64 数据用于持久化
      })
    }
    
    return songs
  }
  
  return {
    loadPlaylist,
    savePlaylist,
    clearPlaylist,
    loadFavorites,
    saveFavorites,
    loadRecents,
    saveRecents,
    persistFiles,
    MAX_PLAYLIST_SIZE,
    MAX_RECENTS_SIZE
  }
}
