const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0'

export interface JamendoTrack {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  streamUrl: string
  coverArt?: string
  permalink?: string
  license?: string
  source: 'jamendo'
}

interface JamendoApiTrack {
  id: string | number
  name: string
  duration?: number
  audio?: string
  artist_name?: string
  album_name?: string
  album_image?: string
  shareurl?: string
  license_ccurl?: string
}

interface JamendoApiResponse {
  headers?: {
    status?: string
    code?: number
    error_message?: string
  }
  results?: JamendoApiTrack[]
}

function mapTrack(track: JamendoApiTrack): JamendoTrack | null {
  if (!track.audio) return null

  return {
    id: `jamendo-${track.id}`,
    title: track.name || 'Untitled',
    artist: track.artist_name || 'Jamendo Artist',
    album: track.album_name || 'Jamendo Release',
    duration: Number(track.duration || 0),
    streamUrl: track.audio,
    coverArt: track.album_image,
    permalink: track.shareurl,
    license: track.license_ccurl,
    source: 'jamendo',
  }
}

async function requestTracks(params: URLSearchParams): Promise<JamendoTrack[]> {
  const response = await fetch(`${JAMENDO_BASE_URL}/tracks/?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Jamendo request failed: ${response.status}`)
  }

  const data = (await response.json()) as JamendoApiResponse
  if (data.headers?.status === 'failed') {
    throw new Error(data.headers.error_message || 'Jamendo request failed')
  }

  return (data.results || []).map(mapTrack).filter((track): track is JamendoTrack => Boolean(track))
}

export async function searchJamendoTracks(clientId: string, query: string, limit = 12): Promise<JamendoTrack[]> {
  if (!clientId.trim()) {
    throw new Error('缺少 Jamendo Client ID')
  }

  const params = new URLSearchParams({
    client_id: clientId.trim(),
    format: 'json',
    include: 'licenses',
    audioformat: 'mp32',
    order: 'popularity_total',
    limit: String(limit),
    namesearch: query.trim(),
  })

  return requestTracks(params)
}

export async function getJamendoFeaturedTracks(clientId: string, tag: string, limit = 12): Promise<JamendoTrack[]> {
  if (!clientId.trim()) {
    throw new Error('缺少 Jamendo Client ID')
  }

  const params = new URLSearchParams({
    client_id: clientId.trim(),
    format: 'json',
    include: 'licenses',
    audioformat: 'mp32',
    order: 'popularity_total',
    limit: String(limit),
    tags: tag,
  })

  return requestTracks(params)
}
