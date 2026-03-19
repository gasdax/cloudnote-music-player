<template>
  <div
    class="app-shell min-h-screen text-text-primary"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.24),_transparent_32%),radial-gradient(circle_at_82%_12%,_rgba(251,146,60,0.18),_transparent_26%),linear-gradient(160deg,_#07111f_0%,_#0b1426_48%,_#121826_100%)]"></div>
      <div class="absolute left-[6%] top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"></div>
      <div class="absolute right-[8%] top-12 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl"></div>
      <div class="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl"></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30"></div>
    </div>

    <transition name="fade">
      <div
        v-if="isDragActive"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md"
      >
        <div class="panel-card max-w-xl rounded-[2rem] border border-white/15 px-8 py-10 text-center shadow-2xl">
          <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-cyan-100">
            <Upload class="h-8 w-8" />
          </div>
          <p class="text-2xl font-semibold tracking-tight text-white">拖拽文件到这里导入</p>
          <p class="mt-3 text-sm text-text-secondary">支持 mp3、flac、wav、aac、ogg、m4a</p>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="player.errorMessage"
        class="fixed left-1/2 top-6 z-50 flex max-w-lg -translate-x-1/2 items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/90 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-md"
      >
        <AlertCircle class="h-4 w-4 shrink-0" />
        <span class="truncate">{{ player.errorMessage }}</span>
        <button class="rounded-lg px-2 py-1 text-white/80 transition hover:bg-white/10 hover:text-white" @click="player.resetError">
          关闭
        </button>
      </div>
    </transition>

    <div class="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-5 lg:px-6">
      <header class="panel-card rounded-[2rem] px-4 py-4 sm:px-6">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex items-center gap-4">
            <div class="brand-mark flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/15">
              <Music4 class="h-7 w-7 text-white" />
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-[0.4em] text-cyan-200/75">Cloudnote Player</div>
              <h1 class="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">更像播放器，不像后台面板</h1>
              <p class="mt-1 text-sm text-text-secondary">导入、筛选、收藏和播放都集中在一个更清爽的工作台里。</p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] xl:min-w-[720px] xl:max-w-[780px] xl:flex-1">
            <label class="relative block">
              <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                v-model="searchQuery"
                class="input-shell h-12 w-full rounded-2xl pl-11 pr-12 text-sm text-white outline-none transition"
                placeholder="搜索歌曲、歌手、专辑"
              />
              <button
                v-if="searchQuery"
                class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-text-secondary transition hover:bg-white/10 hover:text-white"
                title="清空搜索"
                @click="searchQuery = ''"
              >
                <X class="h-4 w-4" />
              </button>
            </label>

            <button class="primary-button h-12 rounded-2xl px-5 text-sm font-medium text-white" @click="triggerFileInput">
              <Upload class="mr-2 inline h-4 w-4" />
              导入音乐
            </button>
            <button class="secondary-button h-12 rounded-2xl px-5 text-sm font-medium text-white" @click="showSettings = true">
              <Settings2 class="mr-2 inline h-4 w-4" />
              设置
            </button>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-4">
          <div v-for="card in topStats" :key="card.label" class="stat-card rounded-[1.5rem] px-4 py-4">
            <div class="text-[11px] uppercase tracking-[0.24em] text-text-secondary">{{ card.label }}</div>
            <div class="mt-2 text-2xl font-semibold text-white">{{ card.value }}</div>
            <div class="mt-1 text-xs text-text-secondary">{{ card.hint }}</div>
          </div>
        </div>
      </header>

      <main class="mt-4 grid flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside class="panel-card rounded-[2rem] p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[11px] uppercase tracking-[0.35em] text-text-secondary">Workspace</p>
              <h2 class="mt-1 text-lg font-semibold text-white">音乐视图</h2>
            </div>
            <div class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-text-secondary">
              {{ player.playlist.length }} 首
            </div>
          </div>

          <div class="mt-4 space-y-2">
            <button
              v-for="tab in tabItems"
              :key="tab.key"
              class="tab-button flex w-full items-center justify-between rounded-[1.4rem] px-4 py-3 text-left transition"
              :class="activeTab === tab.key ? 'tab-button-active' : 'tab-button-idle'"
              @click="activeTab = tab.key"
            >
              <span class="flex items-center gap-3">
                <component :is="tab.icon" class="h-4 w-4" />
                <span>
                  <span class="block text-sm font-medium text-white">{{ tab.label }}</span>
                  <span class="mt-0.5 block text-xs text-text-secondary">{{ tab.description }}</span>
                </span>
              </span>
              <span class="rounded-full bg-black/20 px-2.5 py-1 text-xs text-text-secondary">{{ tab.count() }}</span>
            </button>
          </div>

          <div class="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles class="h-4 w-4 text-amber-200" />
              当前氛围
            </div>
            <p class="mt-2 text-sm text-text-secondary">
              {{ player.currentSong ? `正在播放 ${player.currentSong.title}` : '还没有选中歌曲，先导入一批音乐吧。' }}
            </p>
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <div class="rounded-2xl border border-white/10 bg-black/15 px-3 py-3">
                <div class="text-[11px] uppercase tracking-[0.24em]">模式</div>
                <div class="mt-1 text-sm text-white">{{ repeatModeLabel }}</div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-black/15 px-3 py-3">
                <div class="text-[11px] uppercase tracking-[0.24em]">随机</div>
                <div class="mt-1 text-sm text-white">{{ player.shuffleMode ? '已开启' : '关闭' }}</div>
              </div>
            </div>
          </div>

          <div class="mt-5 rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-text-secondary">
            <div class="flex items-center gap-2 text-white">
              <Keyboard class="h-4 w-4 text-cyan-200" />
              快捷键
            </div>
            <div class="mt-3 space-y-2">
              <div class="flex items-center justify-between">
                <span>播放 / 暂停</span>
                <kbd class="shortcut-key">Space</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>上一首 / 下一首</span>
                <kbd class="shortcut-key">Ctrl + ← →</kbd>
              </div>
              <div class="flex items-center justify-between">
                <span>快退 / 快进</span>
                <kbd class="shortcut-key">← →</kbd>
              </div>
            </div>
          </div>
        </aside>

        <section class="panel-card flex min-h-[480px] flex-col overflow-hidden rounded-[2rem]">
          <div class="border-b border-white/10 px-4 py-4 sm:px-5">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-[0.34em] text-text-secondary">{{ activeViewEyebrow }}</p>
                <h2 class="mt-1 text-xl font-semibold tracking-tight text-white">{{ activeViewTitle }}</h2>
                <p class="mt-1 text-sm text-text-secondary">{{ activeViewDescription }}</p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  class="secondary-button h-11 rounded-2xl px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!player.currentSong || player.playlist.length === 0"
                  @click="locateCurrent"
                >
                  <MapPinned class="mr-2 inline h-4 w-4" />
                  定位当前
                </button>
                <button
                  class="secondary-button h-11 rounded-2xl px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="player.playlist.length === 0"
                  @click="showPlaylist = true"
                >
                  <Rows3 class="mr-2 inline h-4 w-4" />
                  队列弹窗
                </button>
                <button
                  class="danger-button h-11 rounded-2xl px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="player.playlist.length === 0"
                  @click="clearAllPlaylist"
                >
                  <Trash2 class="mr-2 inline h-4 w-4" />
                  清空列表
                </button>
              </div>
            </div>
          </div>

          <div ref="listViewportRef" class="flex-1 overflow-auto px-3 py-3 sm:px-4 sm:py-4">
            <div v-if="player.playlist.length === 0" class="flex h-full min-h-[360px] items-center justify-center px-4 py-10">
              <div class="max-w-md text-center">
                <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.8rem] border border-white/10 bg-white/5">
                  <Disc3 class="h-9 w-9 text-cyan-100" />
                </div>
                <h3 class="mt-6 text-2xl font-semibold tracking-tight text-white">先把音乐拖进来</h3>
                <p class="mt-3 text-sm leading-6 text-text-secondary">
                  这个版本更强调沉浸感，所以我把空状态也做成了入口。点击导入，或者直接把音频文件拖进窗口即可。
                </p>
                <button class="primary-button mt-6 h-12 rounded-2xl px-5 text-sm font-medium text-white" @click="triggerFileInput">
                  <Upload class="mr-2 inline h-4 w-4" />
                  导入音乐
                </button>
              </div>
            </div>

            <div v-else-if="activeTab === 'library'" class="space-y-4">
              <div class="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                <button
                  v-for="item in libraryByArtist"
                  :key="item.key"
                  class="artist-card rounded-[1.6rem] border border-white/10 px-4 py-4 text-left transition hover:-translate-y-0.5"
                  @click="filterByArtist(item.artist)"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <div class="text-[11px] uppercase tracking-[0.28em] text-text-secondary">Artist</div>
                      <div class="mt-2 truncate text-lg font-semibold text-white">{{ item.artist }}</div>
                    </div>
                    <div class="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-text-secondary">
                      {{ item.count }} 首
                    </div>
                  </div>
                  <div class="mt-5 flex items-center justify-between text-sm text-text-secondary">
                    <span>点击筛选到播放队列</span>
                    <ArrowRight class="h-4 w-4" />
                  </div>
                </button>
              </div>
            </div>

            <div v-else-if="filteredPlaylist.length === 0" class="flex h-full min-h-[280px] items-center justify-center px-4 py-10 text-center">
              <div class="max-w-sm">
                <h3 class="text-xl font-semibold text-white">没有匹配内容</h3>
                <p class="mt-2 text-sm leading-6 text-text-secondary">试试更换搜索词，或者切到别的视图看看。</p>
              </div>
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="(song, index) in filteredPlaylist"
                :key="song.id"
                :data-song-id="song.id"
                class="track-row group flex w-full items-center gap-3 rounded-[1.5rem] border px-3 py-3 text-left transition sm:px-4"
                :class="indexToOriginalIndex(index) === player.currentPlaylistIndex ? 'track-row-active' : 'track-row-idle'"
                @click="playSongFromPlaylist(indexToOriginalIndex(index))"
              >
                <div class="track-number flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-white/10">
                  <Pause v-if="indexToOriginalIndex(index) === player.currentPlaylistIndex && player.isPlaying" class="h-4 w-4 text-cyan-100" />
                  <Play v-else class="h-4 w-4 text-white/80" />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="truncate text-sm font-medium text-white sm:text-[15px]">{{ song.title }}</span>
                    <span
                      v-if="indexToOriginalIndex(index) === player.currentPlaylistIndex"
                      class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-cyan-100"
                    >
                      Now
                    </span>
                  </div>
                  <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span>{{ song.artist || '未知艺术家' }}</span>
                    <span>{{ song.album || '未命名专辑' }}</span>
                  </div>
                </div>

                <div class="hidden text-right text-xs text-text-secondary sm:block">
                  <div class="tabular-nums text-sm text-white/90">{{ song.duration ? formatTime(song.duration) : formatTime(player.duration) }}</div>
                  <div class="mt-1">{{ queuePositionLabel(index) }}</div>
                </div>

                <div class="flex items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <button
                    class="secondary-icon-button"
                    :title="isFavorite(song.id) ? '取消收藏' : '收藏歌曲'"
                    @click.stop="toggleFavorite(song.id)"
                  >
                    <Heart :class="isFavorite(song.id) ? 'fill-rose-300 text-rose-300' : 'text-white/80'" class="h-4 w-4" />
                  </button>
                  <button class="danger-icon-button" title="移除歌曲" @click.stop="removeSong(indexToOriginalIndex(index))">
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </button>
            </div>
          </div>
        </section>

        <aside class="panel-card overflow-hidden rounded-[2rem]">
          <div class="border-b border-white/10 px-5 py-5">
            <p class="text-[11px] uppercase tracking-[0.34em] text-text-secondary">Now Playing</p>
            <div class="mt-3 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-2xl font-semibold tracking-tight text-white">{{ player.currentSong?.title || '还没有选中歌曲' }}</h2>
                <p class="mt-1 truncate text-sm text-text-secondary">{{ player.currentSong?.artist || '等待播放' }}</p>
              </div>
              <button
                class="secondary-icon-button h-11 w-11 shrink-0"
                :disabled="!player.currentSong"
                :title="player.currentSong && isFavorite(player.currentSong.id) ? '取消收藏' : '收藏歌曲'"
                @click="player.currentSong && toggleFavorite(player.currentSong.id)"
              >
                <Heart
                  :class="player.currentSong && isFavorite(player.currentSong.id) ? 'fill-rose-300 text-rose-300' : 'text-white/80'"
                  class="h-5 w-5"
                />
              </button>
            </div>
          </div>

          <div class="space-y-5 px-5 py-5">
            <div class="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
              <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%,rgba(255,255,255,0.04))]"></div>
              <div class="relative mx-auto flex aspect-square max-w-[260px] items-center justify-center rounded-full border border-white/10 bg-slate-950/30 shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
                <div
                  class="record-disc flex h-[78%] w-[78%] items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle,_rgba(255,255,255,0.13)_0%,_rgba(255,255,255,0.05)_28%,_rgba(8,14,27,0.9)_29%,_rgba(4,10,20,1)_100%)]"
                  :class="player.isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''"
                >
                  <div class="flex h-20 w-20 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/10">
                    <Disc3 class="h-9 w-9 text-cyan-100" />
                  </div>
                </div>
              </div>
              <div class="relative mt-6 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <div class="flex items-center justify-between text-xs text-text-secondary">
                  <span>进度</span>
                  <span class="tabular-nums">{{ progressPercent }}%</span>
                </div>
                <div class="mt-3 flex items-center justify-between text-xs tabular-nums text-text-secondary">
                  <span>{{ formatTime(player.currentTime) }}</span>
                  <span>{{ formatTime(player.duration) }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  :max="player.duration || 1"
                  step="0.1"
                  :value="player.currentTime"
                  class="player-range mt-3 w-full cursor-pointer"
                  @input="handleSeek($event)"
                />
              </div>
            </div>

            <div class="grid grid-cols-5 gap-2">
              <button class="secondary-icon-button h-12 w-full" :class="player.repeatMode !== 'none' ? 'is-enabled' : ''" :title="repeatModeLabel" @click="player.toggleRepeat">
                <Repeat class="h-4 w-4" />
              </button>
              <button class="secondary-icon-button h-12 w-full" title="上一首" @click="player.playPrev">
                <SkipBack class="h-4 w-4" />
              </button>
              <button class="primary-icon-button h-12 w-full" :title="player.isPlaying ? '暂停' : '播放'" @click="player.togglePlayPause">
                <Pause v-if="player.isPlaying" class="h-5 w-5" />
                <Play v-else class="h-5 w-5" />
              </button>
              <button class="secondary-icon-button h-12 w-full" title="下一首" @click="player.playNext">
                <SkipForward class="h-4 w-4" />
              </button>
              <button class="secondary-icon-button h-12 w-full" :class="player.shuffleMode ? 'is-enabled' : ''" title="随机播放" @click="player.toggleShuffle">
                <Shuffle class="h-4 w-4" />
              </button>
            </div>

            <div class="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
              <div class="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-text-secondary">
                <span>Volume</span>
                <span class="tabular-nums">{{ Math.round(player.volume * 100) }}%</span>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <Volume2 class="h-4 w-4 text-text-secondary" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  :value="player.volume"
                  class="player-range w-full"
                  @input="(e: Event) => player.setVolume(Number((e.target as HTMLInputElement).value))"
                />
              </div>
            </div>

            <div class="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-[11px] uppercase tracking-[0.3em] text-text-secondary">Up Next</div>
                  <div class="mt-1 text-sm font-medium text-white">接下来播放</div>
                </div>
                <span class="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-text-secondary">
                  {{ queuePreview.length }}
                </span>
              </div>

              <div v-if="queuePreview.length === 0" class="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-text-secondary">
                没有更多候选歌曲了。
              </div>

              <div v-else class="mt-4 space-y-2">
                <button
                  v-for="song in queuePreview"
                  :key="song.id"
                  class="secondary-row flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition"
                  @click="playSongById(song.id)"
                >
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium text-white">{{ song.title }}</div>
                    <div class="mt-1 truncate text-xs text-text-secondary">{{ song.artist || '未知艺术家' }}</div>
                  </div>
                  <ArrowUpRight class="h-4 w-4 shrink-0 text-text-secondary" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer class="panel-card mt-4 rounded-[2rem] px-4 py-3 sm:px-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-secondary">
            <span>默认音质：{{ qualityLabel }}</span>
            <span>自动播放：{{ autoPlay ? '开启' : '关闭' }}</span>
            <span>会话保持：{{ persistPlaylist ? '开启' : '关闭' }}</span>
          </div>
          <button class="secondary-button h-10 rounded-2xl px-4 text-sm font-medium text-white" @click="showPlaylist = true">
            打开队列（{{ player.playlist.length }}）
          </button>
        </div>
      </footer>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="hidden"
      accept="audio/*,.mp3,.flac,.wav,.aac,.ogg,.m4a"
      multiple
      @change="handleFileSelect"
    />

    <transition name="fade">
      <div
        v-if="showPlaylist"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md"
        @click.self="showPlaylist = false"
      >
        <div class="panel-card max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/15">
          <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div class="text-[11px] uppercase tracking-[0.3em] text-text-secondary">Queue</div>
              <h3 class="mt-1 text-xl font-semibold text-white">播放队列</h3>
            </div>
            <button class="secondary-icon-button h-10 w-10" title="关闭" @click="showPlaylist = false">
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="max-h-[55vh] overflow-auto px-4 py-4">
            <div v-if="player.playlist.length === 0" class="rounded-[1.6rem] border border-dashed border-white/10 px-5 py-10 text-center text-text-secondary">
              播放队列为空。
            </div>
            <div v-else class="space-y-2">
              <button
                v-for="(song, index) in player.playlist"
                :key="song.id"
                class="secondary-row flex w-full items-center justify-between rounded-[1.4rem] px-4 py-3 text-left"
                :class="index === player.currentPlaylistIndex ? 'ring-1 ring-cyan-300/30' : ''"
                @click="playSongFromPlaylist(index); showPlaylist = false"
              >
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium text-white">{{ song.title }}</div>
                  <div class="mt-1 truncate text-xs text-text-secondary">{{ song.artist || '未知艺术家' }}</div>
                </div>
                <div class="ml-4 text-right text-xs text-text-secondary">
                  <div class="tabular-nums text-sm text-white/90">{{ formatDuration(song.duration) }}</div>
                  <div class="mt-1">{{ index === player.currentPlaylistIndex ? '当前播放' : `第 ${index + 1} 首` }}</div>
                </div>
              </button>
            </div>
          </div>

          <div class="border-t border-white/10 px-5 py-4">
            <button class="danger-button h-11 w-full rounded-2xl text-sm font-medium text-white" @click="clearAllPlaylist">
              清空播放队列
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="showSettings"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md"
        @click.self="showSettings = false"
      >
        <div class="panel-card w-full max-w-xl rounded-[2rem] border border-white/15">
          <div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div class="text-[11px] uppercase tracking-[0.3em] text-text-secondary">Settings</div>
              <h3 class="mt-1 text-xl font-semibold text-white">播放设置</h3>
            </div>
            <button class="secondary-icon-button h-10 w-10" title="关闭" @click="showSettings = false">
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="space-y-4 px-5 py-5">
            <div class="settings-row">
              <div>
                <div class="text-sm font-medium text-white">默认音质</div>
                <div class="mt-1 text-xs text-text-secondary">仅用于界面偏好展示，便于后续接真实音质策略。</div>
              </div>
              <select
                class="settings-select"
                :value="defaultQuality"
                @change="(e: Event) => defaultQuality = (e.target as HTMLSelectElement).value"
              >
                <option value="standard">标准 128kbps</option>
                <option value="high">高品质 320kbps</option>
                <option value="lossless">无损 FLAC</option>
              </select>
            </div>

            <div class="settings-row">
              <div>
                <div class="text-sm font-medium text-white">导入后自动播放</div>
                <div class="mt-1 text-xs text-text-secondary">当当前没有正在播放的歌曲时，导入后自动开始第一首。</div>
              </div>
              <button class="settings-switch" :class="autoPlay ? 'settings-switch-on' : 'settings-switch-off'" @click="autoPlay = !autoPlay">
                <span class="settings-switch-thumb" :class="autoPlay ? 'translate-x-5' : 'translate-x-0'" />
              </button>
            </div>

            <div class="settings-row">
              <div>
                <div class="text-sm font-medium text-white">跨会话保留列表</div>
                <div class="mt-1 text-xs text-text-secondary">重新打开应用时恢复播放队列与收藏信息。</div>
              </div>
              <button
                class="settings-switch"
                :class="persistPlaylist ? 'settings-switch-on' : 'settings-switch-off'"
                @click="persistPlaylist = !persistPlaylist"
              >
                <span class="settings-switch-thumb" :class="persistPlaylist ? 'translate-x-5' : 'translate-x-0'" />
              </button>
            </div>

            <div class="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
              <div class="text-sm font-medium text-white">清理缓存</div>
              <p class="mt-1 text-xs leading-5 text-text-secondary">会清空当前列表、持久化缓存和最近播放记录。</p>
              <button class="danger-button mt-4 h-11 w-full rounded-2xl text-sm font-medium text-white" @click="clearCache">
                立即清理
              </button>
            </div>

            <div class="rounded-[1.6rem] border border-dashed border-white/10 bg-black/10 px-4 py-4 text-center">
              <div class="text-sm font-medium text-white">CloudNote Music Player</div>
              <div class="mt-1 text-xs text-text-secondary">Version 1.0.0 Beta</div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Disc3,
  Heart,
  History,
  Keyboard,
  Library,
  ListMusic,
  MapPinned,
  Music4,
  Pause,
  Play,
  Repeat,
  Rows3,
  Search,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-vue-next'
import { usePlayerStore } from '@/stores/player'
import { usePersistStore } from '@/stores/persist'

const player = usePlayerStore()
const persistStore = usePersistStore()

const fileInput = ref<HTMLInputElement | null>(null)
const showPlaylist = ref(false)
const showSettings = ref(false)
const activeTab = ref<'library' | 'queue' | 'favorites' | 'recents'>('queue')
const searchQuery = ref('')
const isDragActive = ref(false)
const listViewportRef = ref<HTMLElement | null>(null)
const favoriteIds = ref<Set<string>>(new Set())

let dragDepth = 0

type PersistedSongLike = {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  fileData?: string
}

const recents = ref<PersistedSongLike[]>([])

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
  MAX_RECENTS_SIZE,
} = persistStore

const isFavorite = (id: string) => favoriteIds.value.has(id)

const filteredPlaylist = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const base =
    activeTab.value === 'favorites'
      ? player.playlist.filter((song) => isFavorite(song.id))
      : activeTab.value === 'recents'
        ? player.playlist.filter((song) => recents.value.some((recent) => recent.id === song.id))
        : player.playlist

  if (!q) return base

  return base.filter((song) => {
    const text = `${song.title} ${song.artist ?? ''} ${song.album ?? ''}`.toLowerCase()
    return text.includes(q)
  })
})

const libraryByArtist = computed(() => {
  const artistMap = new Map<string, number>()
  for (const song of player.playlist) {
    const artist = (song.artist || '未知艺术家').trim() || '未知艺术家'
    artistMap.set(artist, (artistMap.get(artist) ?? 0) + 1)
  }

  return Array.from(artistMap.entries())
    .map(([artist, count]) => ({ key: artist.toLowerCase(), artist, count }))
    .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist))
})

const tabItems = computed(() => [
  {
    key: 'queue' as const,
    label: '播放队列',
    description: '你准备播放的全部歌曲',
    icon: ListMusic,
    count: () => filteredPlaylist.value.length,
  },
  {
    key: 'library' as const,
    label: '资料库',
    description: '按艺术家快速浏览',
    icon: Library,
    count: () => libraryByArtist.value.length,
  },
  {
    key: 'favorites' as const,
    label: '收藏',
    description: '你标记过的歌曲',
    icon: Heart,
    count: () => favoriteIds.value.size,
  },
  {
    key: 'recents' as const,
    label: '最近播放',
    description: '最近听过的内容',
    icon: History,
    count: () => recents.value.length,
  },
])

const totalDuration = computed(() =>
  player.playlist.reduce((sum, song) => sum + (Number.isFinite(song.duration) ? song.duration : 0), 0),
)

const progressPercent = computed(() => {
  if (!player.duration) return 0
  return Math.min(100, Math.round((player.currentTime / player.duration) * 100))
})

const queuePreview = computed(() => {
  if (player.playlist.length === 0) return []
  const currentIndex = player.currentPlaylistIndex >= 0 ? player.currentPlaylistIndex : -1
  return player.playlist.filter((_, index) => index !== currentIndex).slice(0, 3)
})

const topStats = computed(() => [
  {
    label: '总曲目',
    value: `${player.playlist.length}`,
    hint: '当前导入的全部音频文件',
  },
  {
    label: '总时长',
    value: formatLargeDuration(totalDuration.value),
    hint: '按已识别时长估算',
  },
  {
    label: '收藏',
    value: `${favoriteIds.value.size}`,
    hint: '高频循环的歌曲',
  },
  {
    label: '最近播放',
    value: `${recents.value.length}`,
    hint: '帮助你快速回到刚听过的内容',
  },
])

const activeViewTitle = computed(() => {
  if (activeTab.value === 'library') return '按艺术家浏览资料库'
  if (activeTab.value === 'favorites') return '收藏歌曲'
  if (activeTab.value === 'recents') return '最近播放'
  return '当前播放队列'
})

const activeViewEyebrow = computed(() => {
  if (activeTab.value === 'library') return 'Library'
  if (activeTab.value === 'favorites') return 'Favorites'
  if (activeTab.value === 'recents') return 'Recent Plays'
  return 'Queue'
})

const activeViewDescription = computed(() => {
  if (activeTab.value === 'library') return '聚合展示艺术家，让大列表也更容易快速跳转。'
  if (activeTab.value === 'favorites') return '这一页只保留你主动收藏过的内容。'
  if (activeTab.value === 'recents') return '找回刚刚听过的歌，不用再从头翻列表。'
  return '顺着队列浏览、点选和管理歌曲，比普通列表更轻松。'
})

const repeatModeLabel = computed(() => {
  if (player.repeatMode === 'all') return '列表循环'
  if (player.repeatMode === 'one') return '单曲循环'
  return '不循环'
})

const qualityLabel = computed(() => {
  if (defaultQuality.value === 'lossless') return '无损 FLAC'
  if (defaultQuality.value === 'high') return '高品质 320kbps'
  return '标准 128kbps'
})

watch(
  () => player.currentSong?.id,
  (songId) => {
    if (!songId || !player.currentSong) return
    recordRecent(player.currentSong)
  },
)

const onKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  const tagName = target?.tagName?.toLowerCase()

  if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return

  if (event.code === 'Space') {
    event.preventDefault()
    player.togglePlayPause()
    return
  }

  if (event.ctrlKey && event.key === 'ArrowLeft') {
    event.preventDefault()
    player.playPrev()
    return
  }

  if (event.ctrlKey && event.key === 'ArrowRight') {
    event.preventDefault()
    player.playNext()
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    player.seek(Math.max(0, player.currentTime - 5))
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    player.seek(Math.min(player.duration || 0, player.currentTime + 5))
  }
}

onMounted(() => {
  favoriteIds.value = new Set(loadFavorites())
  recents.value = loadRecents()

  if (persistPlaylist.value) {
    const savedSongs = loadPlaylist()
    if (savedSongs.length > 0) {
      player.addSongs(
        savedSongs.map((song) => ({
          ...song,
          filePath: song.fileData || undefined,
        })),
      )
    }
  }

  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

const toggleFavorite = (id: string) => {
  const next = new Set(favoriteIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)

  favoriteIds.value = next
  saveFavorites(Array.from(next))
}

const recordRecent = (song: { id: string; title: string; artist: string; album?: string; duration: number; fileData?: string }) => {
  const persisted: PersistedSongLike = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration ?? 0,
    fileData: song.fileData,
  }

  const next = [persisted, ...recents.value.filter((item) => item.id !== persisted.id)].slice(0, MAX_RECENTS_SIZE)
  recents.value = next
  saveRecents(next)
}

const formatTime = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (seconds: number) => {
  if (!seconds || Number.isNaN(seconds)) return '加载中'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatLargeDuration = (seconds: number) => {
  if (!seconds) return '0 分钟'

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  if (hours > 0) return `${hours} 小时 ${mins} 分`
  return `${Math.max(1, mins)} 分钟`
}

const queuePositionLabel = (index: number) => {
  const originalIndex = indexToOriginalIndex(index)
  return `队列 ${originalIndex + 1}`
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const indexToOriginalIndex = (filteredIndex: number) => {
  const song = filteredPlaylist.value[filteredIndex]
  if (!song) return filteredIndex

  const originalIndex = player.playlist.findIndex((item) => item.id === song.id)
  return originalIndex >= 0 ? originalIndex : filteredIndex
}

const locateCurrent = () => {
  const id = player.currentSong?.id
  const viewport = listViewportRef.value
  if (!id || !viewport) return

  const element = viewport.querySelector(`[data-song-id="${CSS.escape(id)}"]`) as HTMLElement | null
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const filterByArtist = (artist: string) => {
  activeTab.value = 'queue'
  searchQuery.value = artist
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const songs = Array.from(files).map((file, index) => ({
    id: `local-${Date.now()}-${index}`,
    title: file.name.replace(/\.[^.]+$/, ''),
    artist: '本地文件',
    duration: 0,
    filePath: URL.createObjectURL(file),
    fileData: null as string | null,
  }))

  player.addSongs(songs)

  if (persistPlaylist.value) {
    const persistedSongs = await persistStore.persistFiles(Array.from(files))
    const existing = loadPlaylist()
    savePlaylist([...existing, ...persistedSongs])
  }

  if (autoPlay.value && !player.currentSong && songs.length > 0) {
    player.setCurrentSong(songs[0], 0)
  }

  target.value = ''
}

const playSongFromPlaylist = (index: number) => {
  const song = player.playlist[index]
  if (!song) return
  player.setCurrentSong(song, index)
}

const playSongById = (id: string) => {
  const index = player.playlist.findIndex((song) => song.id === id)
  if (index >= 0) playSongFromPlaylist(index)
}

const removeSong = (index: number) => {
  player.removeFromPlaylist(index)
}

const handleSeek = (event: Event) => {
  const target = event.target as HTMLInputElement
  player.seek(parseFloat(target.value))
}

const onDragEnter = () => {
  dragDepth += 1
  isDragActive.value = true
}

const onDragLeave = () => {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragActive.value = false
}

const onDrop = async (event: DragEvent) => {
  dragDepth = 0
  isDragActive.value = false

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  const fakeEvent = { target: { files } } as unknown as Event
  await handleFileSelect(fakeEvent)
}

const clearAllPlaylist = () => {
  if (!confirm('确定要清空所有歌曲吗？此操作不可撤销。')) return

  player.clearPlaylist()
  clearPersisted()
  recents.value = []
  saveRecents([])
  showPlaylist.value = false
}

const clearCache = () => {
  if (!confirm('确定要清理所有缓存吗？这会删除本地保存的队列和最近播放记录。')) return

  player.clearPlaylist()
  clearPersisted()
  recents.value = []
  saveRecents([])
  showSettings.value = false
  alert('缓存已清理')
}
</script>

<style scoped>
.app-shell {
  position: relative;
}

.panel-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.035)),
    rgba(8, 15, 28, 0.72);
  backdrop-filter: blur(22px);
  box-shadow:
    0 24px 80px rgba(3, 8, 20, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  background:
    linear-gradient(135deg, rgba(34, 211, 238, 0.5), rgba(14, 165, 233, 0.16)),
    rgba(255, 255, 255, 0.04);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.input-shell,
.settings-select {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 16, 30, 0.52);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.input-shell:focus,
.settings-select:focus {
  border-color: rgba(103, 232, 249, 0.55);
  box-shadow:
    0 0 0 4px rgba(34, 211, 238, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.primary-button,
.primary-icon-button {
  background: linear-gradient(135deg, #06b6d4, #2563eb);
  box-shadow: 0 16px 30px rgba(14, 116, 255, 0.28);
}

.primary-button:hover,
.primary-icon-button:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.secondary-button,
.secondary-icon-button,
.secondary-row {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.secondary-button:hover,
.secondary-icon-button:hover,
.secondary-row:hover {
  background: rgba(255, 255, 255, 0.09);
}

.danger-button,
.danger-icon-button {
  border: 1px solid rgba(251, 113, 133, 0.22);
  background: rgba(244, 63, 94, 0.18);
}

.danger-button:hover,
.danger-icon-button:hover {
  background: rgba(244, 63, 94, 0.26);
}

.secondary-icon-button,
.danger-icon-button,
.primary-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    opacity 0.2s ease;
}

.tab-button-active {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(59, 130, 246, 0.08));
  border: 1px solid rgba(103, 232, 249, 0.18);
}

.tab-button-idle {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
}

.tab-button-idle:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.06);
}

.stat-card,
.artist-card,
.track-row-idle,
.track-row-active {
  background: rgba(255, 255, 255, 0.04);
}

.stat-card {
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.artist-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(103, 232, 249, 0.12);
}

.track-row-idle {
  border-color: rgba(255, 255, 255, 0.05);
}

.track-row-idle:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.09);
}

.track-row-active {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.14), rgba(59, 130, 246, 0.08));
  border-color: rgba(103, 232, 249, 0.18);
}

.track-number {
  background: rgba(3, 10, 20, 0.3);
}

.shortcut-key {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.22);
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  color: rgba(226, 232, 240, 0.9);
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem 1rem 1rem 1.1rem;
}

.settings-switch {
  display: inline-flex;
  width: 3rem;
  height: 1.75rem;
  border-radius: 999px;
  padding: 0.2rem;
  transition: background-color 0.2s ease;
}

.settings-switch-on {
  background: rgba(34, 211, 238, 0.6);
}

.settings-switch-off {
  background: rgba(148, 163, 184, 0.28);
}

.settings-switch-thumb {
  display: block;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  background: white;
  transition: transform 0.2s ease;
}

.player-range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

.player-range::-webkit-slider-runnable-track {
  height: 0.4rem;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.8), rgba(59, 130, 246, 0.35));
}

.player-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1rem;
  height: 1rem;
  margin-top: -0.3rem;
  border-radius: 999px;
  background: white;
  box-shadow: 0 6px 14px rgba(8, 15, 28, 0.35);
}

.is-enabled {
  border-color: rgba(103, 232, 249, 0.24);
  background: rgba(34, 211, 238, 0.15);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.24s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .settings-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
