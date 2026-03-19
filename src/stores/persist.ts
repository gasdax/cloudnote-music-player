interface PersistedSong {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  filePath?: string
  coverArt?: string
  source?: 'local' | 'jamendo'
  permalink?: string
  license?: string
  fileData?: string
}

export interface AppSettings {
  defaultQuality: string
  autoPlay: boolean
  persistPlaylist: boolean
  jamendoClientId: string
  onlineFeaturedTag: string
}

const STORAGE_KEY = 'cloudnote_playlist'
const FAVORITES_KEY = 'cloudnote_favorites'
const RECENTS_KEY = 'cloudnote_recents'
const SETTINGS_KEY = 'cloudnote_settings'
const MAX_PLAYLIST_SIZE = 50
const SOFT_LIMIT_BYTES = 4.5 * 1024 * 1024
const MAX_RECENTS_SIZE = 50

const DEFAULT_SETTINGS: AppSettings = {
  defaultQuality: 'high',
  autoPlay: true,
  persistPlaylist: true,
  jamendoClientId: '',
  onlineFeaturedTag: 'pop',
}

export const usePersistStore = () => {
  function loadPlaylist(): PersistedSong[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('[PersistStore] failed to load playlist', error)
      return []
    }
  }

  function savePlaylist(playlist: PersistedSong[]): void {
    try {
      const limited = playlist.slice(0, MAX_PLAYLIST_SIZE)
      let toSave = limited
      let json = JSON.stringify(toSave)

      while (json.length * 2 > SOFT_LIMIT_BYTES && toSave.length > 1) {
        toSave = toSave.slice(0, Math.ceil(toSave.length / 2))
        json = JSON.stringify(toSave)
      }

      localStorage.setItem(STORAGE_KEY, json)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        try {
          const smaller = playlist.slice(0, Math.ceil(MAX_PLAYLIST_SIZE / 2))
          localStorage.setItem(STORAGE_KEY, JSON.stringify(smaller))
        } catch (nestedError) {
          console.error('[PersistStore] failed to recover from quota error', nestedError)
        }
      } else {
        console.error('[PersistStore] failed to save playlist', error)
      }
    }
  }

  function clearPlaylist(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('[PersistStore] failed to clear playlist', error)
    }
  }

  function loadFavorites(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
    } catch (error) {
      console.error('[PersistStore] failed to load favorites', error)
      return []
    }
  }

  function saveFavorites(ids: string[]): void {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(new Set(ids)).slice(0, 1000)))
    } catch (error) {
      console.error('[PersistStore] failed to save favorites', error)
    }
  }

  function loadRecents(): PersistedSong[] {
    try {
      const data = localStorage.getItem(RECENTS_KEY)
      if (!data) return []
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('[PersistStore] failed to load recents', error)
      return []
    }
  }

  function saveRecents(items: PersistedSong[]): void {
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, MAX_RECENTS_SIZE)))
    } catch (error) {
      console.error('[PersistStore] failed to save recents', error)
    }
  }

  function loadSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY)
      if (!data) return { ...DEFAULT_SETTINGS }
      const parsed = JSON.parse(data)
      return {
        ...DEFAULT_SETTINGS,
        ...(parsed && typeof parsed === 'object' ? parsed : {}),
      }
    } catch (error) {
      console.error('[PersistStore] failed to load settings', error)
      return { ...DEFAULT_SETTINGS }
    }
  }

  function saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          ...DEFAULT_SETTINGS,
          ...settings,
        }),
      )
    } catch (error) {
      console.error('[PersistStore] failed to save settings', error)
    }
  }

  async function fileToBase64(file: File, maxSizeMB = 2): Promise<string | null> {
    if (file.size > maxSizeMB * 1024 * 1024) return null

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function persistFiles(files: File[]): Promise<PersistedSong[]> {
    const songs: PersistedSong[] = []

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index]
      const title = file.name.replace(/\.[^/.]+$/, '')
      const fileData = await fileToBase64(file)

      songs.push({
        id: `persist-${Date.now()}-${index}`,
        title,
        artist: '本地文件',
        duration: 0,
        source: 'local',
        fileData: fileData || undefined,
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
    loadSettings,
    saveSettings,
    persistFiles,
    MAX_PLAYLIST_SIZE,
    MAX_RECENTS_SIZE,
  }
}
