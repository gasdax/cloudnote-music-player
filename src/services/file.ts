/**
 * 文件导入服务 - Web/Tauri compatible
 * 
 * For web development, this provides stub implementations using web APIs.
 * For Tauri desktop app, replace with @tauri-apps/api imports.
 */
// TODO: Uncomment for Tauri desktop app
// import { open } from '@tauri-apps/api/dialog'
// import { readTextFile, readFile as tauriReadFile } from '@tauri-apps/api/fs'

export interface MusicFileInfo {
  path: string
  name: string
  size: number
  format: 'mp3' | 'flac' | 'wav' | 'aac' | 'ogg' | 'm4a' | 'ape' | 'dsd'
}

export interface SongMetadata {
  title: string
  artist: string
  album?: string
  duration?: number
  filePath: string
  format: MusicFileInfo['format']
}

/**
 * 文件导入服务类
 */
export class FileService {
  /**
   * 支持的音频文件扩展名
   */
  private static readonly SUPPORTED_EXTENSIONS = [
    '.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.ape', '.dsd'
  ]

  /**
   * Get supported extensions (static getter)
   */
  public static getSupportedExtensions(): string[] {
    return FileService.SUPPORTED_EXTENSIONS;
  }

  /**
   * 选择音乐文件（支持多选）- Web implementation using file input
   */
  async selectFiles(): Promise<MusicFileInfo[]> {
    const supportedExtensions = FileService.SUPPORTED_EXTENSIONS;
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = supportedExtensions.join(',')
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement
        const files = target.files
        if (!files || files.length === 0) {
          resolve([])
          return
        }
        
        const result: MusicFileInfo[] = []
        for (const file of Array.from(files)) {
          const ext = this.getFileExtension(file.name).toLowerCase()
          if (supportedExtensions.includes(ext)) {
            // Create a blob URL for web playback
            const blobUrl = URL.createObjectURL(file)
            result.push({
              path: blobUrl,
              name: file.name,
              size: file.size,
              format: this.detectFormat(file.name)
            })
          }
        }
        resolve(result)
      }
      
      input.click()
    })
  }

  /**
   * 检测文件格式
   */
  private detectFormat(filePath: string): MusicFileInfo['format'] {
    const ext = this.getFileExtension(filePath).toLowerCase()
    const formatMap: Record<string, MusicFileInfo['format']> = {
      '.mp3': 'mp3',
      '.flac': 'flac',
      '.wav': 'wav',
      '.aac': 'aac',
      '.ogg': 'ogg',
      '.m4a': 'm4a',
      '.ape': 'ape',
      '.dsd': 'dsd'
    }
    return formatMap[ext] || 'mp3'
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(path: string): string {
    const parts = path.split('.')
    return parts.length > 1 ? `.${parts.pop()}` : ''
  }

  /**
   * 从文件路径解析元数据（简化版）
   */
  async parseMetadata(fileInfo: MusicFileInfo): Promise<SongMetadata> {
    // TODO: Implement ID3 tag reading for real metadata
    const filenameWithoutExt = fileInfo.name.replace(/\.[^/.]+$/, '')
    
    return {
      title: filenameWithoutExt,
      artist: 'Unknown Artist',
      filePath: fileInfo.path,
      format: fileInfo.format
    }
  }

  /**
   * 拖拽文件处理
   */
  async handleDrop(files: FileList): Promise<MusicFileInfo[]> {
    const supportedExtensions = FileService.SUPPORTED_EXTENSIONS;
    const validFiles: MusicFileInfo[] = []
    
    for (const file of Array.from(files)) {
      const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`
      if (supportedExtensions.includes(ext)) {
        // Create a blob URL for web playback
        const blobUrl = URL.createObjectURL(file)
        validFiles.push({
          path: blobUrl,
          name: file.name,
          size: file.size,
          format: this.detectFormat(file.name)
        })
      }
    }
    
    return validFiles
  }

  /**
   * Check if extension is supported
   */
  public isSupportedExtension(ext: string): boolean {
    const normalized = `.${ext.toLowerCase()}`
    return FileService.SUPPORTED_EXTENSIONS.includes(normalized)
  }
}

export default new FileService()
