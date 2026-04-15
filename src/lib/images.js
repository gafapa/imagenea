/**
 * Image search service
 *
 * Free (no API key): openverse, wikimedia, nasa, inaturalist
 * Optional (free API key): pexels, pixabay, unsplash
 */

export const PROVIDERS = {
  // ── General (free) ─────────────────────────────────────────────────────────
  all:         { label: '✦ Todos (gratis)',        free: true,  hint: 'Busca en paralelo en Openverse, Wikimedia, NASA, iNaturalist y GBIF' },
  openverse:   { label: 'Openverse',               free: true,  hint: 'Sin API key — Millones de imágenes' },
  wikimedia:   { label: 'Wikimedia Commons',       free: true,  hint: 'Sin API key — Contenido enciclopédico' },
  nasa:        { label: 'NASA Images',             free: true,  hint: 'Sin API key — Ciencia, espacio y tecnología' },
  inaturalist: { label: 'iNaturalist',             free: true,  hint: 'Sin API key — Naturaleza y biodiversidad' },
  gbif:        { label: 'GBIF',                    free: true,  hint: 'Sin API key — Biodiversidad global' },
  // ── Arte (free) ─────────────────────────────────────────────────────────────
  allart:      { label: '🎨 Todos los museos',      free: true,  hint: 'Busca en paralelo en Art Institute of Chicago, Cleveland Museum y más' },
  artic:       { label: 'Art Institute Chicago',   free: true,  hint: 'Sin API key — 300 000+ obras, IIIF de alta resolución' },
  cleveland:   { label: 'Cleveland Museum of Art', free: true,  hint: 'Sin API key — 61 000+ obras en acceso abierto' },
  // ── Arte (key gratuita) ─────────────────────────────────────────────────────
  rijksmuseum: { label: 'Rijksmuseum',             free: false, hint: 'API key gratuita en data.rijksmuseum.nl — Arte neerlandés e internacional' },
  prado:       { label: 'Museo del Prado',         free: false, hint: 'Usa tu API key de Europeana (pro.europeana.eu) — Colección completa del Prado' },
  europeana:   { label: 'Europeana',               free: false, hint: 'API key gratuita en pro.europeana.eu — Patrimonio cultural europeo' },
  // ── Fotografía (key gratuita) ───────────────────────────────────────────────
  google:      { label: 'Google Images',           free: false, hint: 'API key + CX ID — 100 búsquedas/día gratis (console.cloud.google.com)', cx: true },
  pexels:      { label: 'Pexels',                  free: false, hint: 'API key gratuita en pexels.com/api' },
  pixabay:     { label: 'Pixabay',                 free: false, hint: 'API key gratuita en pixabay.com/api' },
  unsplash:    { label: 'Unsplash',                free: false, hint: 'Access key gratuita en unsplash.com/developers' },
}

const searchCache = new Map()

function getCacheKey(query, config) {
  return [
    config.imgProvider,
    query.trim().toLowerCase(),
    config.imgKey ?? '',
    config.imgProvider === 'google' ? config.googleCx : '',
  ].join('::')
}

export async function searchImages(query, config) {
  const q = query.trim()
  if (!q) return []

  const cacheKey = getCacheKey(q, config)
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)
  }

  const request = executeSearch(q, config).catch((error) => {
    searchCache.delete(cacheKey)
    throw error
  })

  searchCache.set(cacheKey, request)
  return request
}

async function executeSearch(q, config) {
  switch (config.imgProvider) {
    case 'all':         return searchAllFree(q)
    case 'openverse':   return searchOpenverse(q)
    case 'wikimedia':   return searchWikimedia(q)
    case 'nasa':        return searchNasa(q)
    case 'inaturalist': return searchINaturalist(q)
    case 'allart':      return searchAllArt(q, config.imgKey)
    case 'artic':       return searchArtIC(q)
    case 'cleveland':   return searchCleveland(q)
    case 'rijksmuseum': return searchRijksmuseum(q, config.imgKey)
    case 'prado':       return searchPrado(q, config.imgKey)
    case 'europeana':   return searchEuropeana(q, config.imgKey)
    case 'gbif':        return searchGBIF(q)
    case 'google':      return searchGoogle(q, config.imgKey, config.googleCx)
    case 'pexels':      return searchPexels(q, config.imgKey)
    case 'pixabay':     return searchPixabay(q, config.imgKey)
    case 'unsplash':    return searchUnsplash(q, config.imgKey)
    default: throw new Error('Proveedor no reconocido: ' + config.imgProvider)
  }
}

// ── ALL FREE PROVIDERS IN PARALLEL ────────────────────────────────────────────
async function searchAllFree(query) {
  const [openverse, wikimedia, nasa, inaturalist, gbif] = await Promise.all([
    searchOpenverse(query).catch((e)  => { console.warn('[Openverse]',   e.message); return [] }),
    searchWikimedia(query).catch((e)  => { console.warn('[Wikimedia]',   e.message); return [] }),
    searchNasa(query).catch((e)       => { console.warn('[NASA]',        e.message); return [] }),
    searchINaturalist(query).catch((e)=> { console.warn('[iNaturalist]', e.message); return [] }),
    searchGBIF(query).catch((e)       => { console.warn('[GBIF]',        e.message); return [] }),
  ])

  // Interleave so every source is represented throughout the grid
  const sources = [openverse, wikimedia, nasa, inaturalist, gbif]
  const merged  = []
  const maxLen  = Math.max(...sources.map((s) => s.length))
  for (let i = 0; i < maxLen; i++) {
    for (const src of sources) {
      if (src[i]) merged.push(src[i])
    }
  }
  return merged
}

// ── OPENVERSE ──────────────────────────────────────────────────────────────────
// Docs: https://api.openverse.org/v1/
async function searchOpenverse(query) {
  const url = `https://api.openverse.org/v1/images/?${new URLSearchParams({
    q:         query,
    page_size: '20',
  })}`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ImageDocAI/1.0 (open-source educational tool)' },
  })
  if (!res.ok) throw new Error(`Openverse ${res.status}: ${await res.text().then(t => t.slice(0,120))}`)
  const data = await res.json()

  return (data.results ?? [])
    .filter((r) => r.url || r.thumbnail)
    .map((r) => ({
      id:          r.id,
      thumb:       r.thumbnail ?? r.url,
      src:         r.url,
      photographer: r.creator  ?? 'Openverse',
      source:      'Openverse',
      license:     (r.license_version ? `${(r.license ?? 'CC').toUpperCase()} ${r.license_version}` : (r.license ?? 'CC').toUpperCase()),
      attribution: r.attribution ?? r.creator ?? '',
    }))
}

// ── WIKIMEDIA COMMONS ──────────────────────────────────────────────────────────
// Docs: https://commons.wikimedia.org/w/api.php
async function searchWikimedia(query) {
  const params = new URLSearchParams({
    action:       'query',
    generator:    'search',
    gsrsearch:    query,          // plain query, no filetype prefix
    gsrnamespace: '6',            // File namespace
    gsrlimit:     '20',
    prop:         'imageinfo',
    iiprop:       'url|thumburl|extmetadata|mediatype',
    iiurlwidth:   '600',
    format:       'json',
    origin:       '*',
  })
  const url = `https://commons.wikimedia.org/w/api.php?${params}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Wikimedia ${res.status}`)
  const data = await res.json()

  return Object.values(data.query?.pages ?? {})
    .filter((p) => {
      const info = p.imageinfo?.[0]
      if (!info?.url) return false
      // Only bitmap/raster (skip SVG/OGG/PDF)
      const mt = (info.mediatype ?? '').toLowerCase()
      if (mt && mt !== 'bitmap' && mt !== 'drawing') return false
      return /\.(jpe?g|png|gif|webp)/i.test(info.url)
    })
    .map((p) => {
      const info   = p.imageinfo[0]
      const artist = info.extmetadata?.Artist?.value
        ?.replace(/<[^>]+>/g, '').trim() ?? 'Wikimedia'
      const license = info.extmetadata?.LicenseShortName?.value ?? 'Various'
      return {
        id:          p.pageid,
        thumb:       info.thumburl ?? info.url,
        src:         info.url,
        photographer: artist,
        source:      'Wikimedia Commons',
        license,
        attribution: `${artist} — Wikimedia Commons (${license})`,
      }
    })
    .slice(0, 16)
}

// ── NASA IMAGES ────────────────────────────────────────────────────────────────
// Docs: https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
async function searchNasa(query) {
  const url = `https://images-api.nasa.gov/search?${new URLSearchParams({
    q:          query,
    media_type: 'image',
    page_size:  '20',
  })}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`NASA Images ${res.status}`)
  const data = await res.json()

  return (data.collection?.items ?? [])
    .filter((item) => item.links?.[0]?.href && item.data?.[0])
    .map((item) => {
      const meta = item.data[0]
      return {
        id:          meta.nasa_id,
        thumb:       item.links[0].href,
        src:         item.links[0].href,
        photographer: meta.photographer ?? meta.center ?? 'NASA',
        source:      'NASA Images',
        license:     'NASA (public domain)',
        attribution: `${meta.title} — NASA`,
      }
    })
    .slice(0, 16)
}

// ── iNATURALIST ────────────────────────────────────────────────────────────────
// Docs: https://api.inaturalist.org/v1/docs/
async function searchINaturalist(query) {
  const url = `https://api.inaturalist.org/v1/observations?${new URLSearchParams({
    q:        query,
    photos:   'true',
    per_page: '20',
    order:         'votes',
    order_by:      'desc',
  })}`

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`iNaturalist ${res.status}`)
  const data = await res.json()

  return (data.results ?? [])
    .flatMap((obs) =>
      (obs.photos ?? []).slice(0, 1).map((photo) => ({
        id:          photo.id,
        thumb:       photo.url?.replace('square', 'medium') ?? photo.url,
        src:         photo.url?.replace('square', 'large')  ?? photo.url,
        photographer: obs.user?.name ?? obs.user?.login ?? 'iNaturalist',
        source:      'iNaturalist',
        license:     (photo.license_code ?? 'CC').toUpperCase(),
        attribution: `${obs.user?.name ?? obs.user?.login ?? 'iNaturalist'} — iNaturalist`,
      }))
    )
    .filter((r) => r.thumb)
    .slice(0, 16)
}

// ── ALL ART MUSEUMS IN PARALLEL ───────────────────────────────────────────────
async function searchAllArt(query, apiKey) {
  const [artic, cleveland, rijks] = await Promise.all([
    searchArtIC(query).catch((e)      => { console.warn('[ArtIC]',      e.message); return [] }),
    searchCleveland(query).catch((e)  => { console.warn('[Cleveland]',  e.message); return [] }),
    searchRijksmuseum(query, apiKey).catch((e) => { console.warn('[Rijks]', e.message); return [] }),
  ])
  // Interleave results
  const sources = [artic, cleveland, rijks]
  const merged  = []
  const maxLen  = Math.max(...sources.map((s) => s.length))
  for (let i = 0; i < maxLen; i++) {
    for (const src of sources) { if (src[i]) merged.push(src[i]) }
  }
  return merged
}

// ── ART INSTITUTE OF CHICAGO ───────────────────────────────────────────────────
// Docs: https://api.artic.edu/docs/  — No API key, CORS enabled, CC0
async function searchArtIC(query) {
  const res = await fetch(`https://api.artic.edu/api/v1/artworks/search?${new URLSearchParams({
    q:      query,
    fields: 'id,title,image_id,artist_display,date_display,place_of_origin',
    limit:  '20',
  })}`)
  if (!res.ok) throw new Error(`Art Institute of Chicago ${res.status}`)
  const data   = await res.json()
  const iiif   = data.config?.iiif_url ?? 'https://www.artic.edu/iiif/2'

  return (data.data ?? [])
    .filter((a) => a.image_id)
    .map((a) => ({
      id:          a.id,
      thumb:       `${iiif}/${a.image_id}/full/400,/0/default.jpg`,
      src:         `${iiif}/${a.image_id}/full/843,/0/default.jpg`,
      photographer: a.artist_display?.split('\n')[0]?.trim() ?? 'Art Institute of Chicago',
      source:      'Art Institute Chicago',
      license:     'CC0',
      attribution: `${a.title}${a.date_display ? ' (' + a.date_display + ')' : ''} — Art Institute of Chicago`,
    }))
}

// ── CLEVELAND MUSEUM OF ART ────────────────────────────────────────────────────
// Docs: https://openaccess-api.clevelandart.org  — No API key, CORS enabled, CC0
async function searchCleveland(query) {
  const res = await fetch(`https://openaccess-api.clevelandart.org/api/artworks/?${new URLSearchParams({
    q:         query,
    limit:     '20',
    has_image: '1',
  })}`)
  if (!res.ok) throw new Error(`Cleveland Museum ${res.status}`)
  const data = await res.json()

  return (data.data ?? [])
    .filter((a) => a.images?.web?.url)
    .map((a) => ({
      id:          a.id,
      thumb:       a.images.web.url,
      src:         a.images.print?.url ?? a.images.web.url,
      photographer: a.creators?.[0]?.description?.split('(')[0]?.trim() ?? 'Cleveland Museum',
      source:      'Cleveland Museum of Art',
      license:     'CC0',
      attribution: `${a.title}${a.creation_date ? ', ' + a.creation_date : ''} — Cleveland Museum of Art`,
    }))
}

// ── RIJKSMUSEUM ────────────────────────────────────────────────────────────────
// Docs: https://data.rijksmuseum.nl/object-metadata/api/ — Free API key
async function searchRijksmuseum(query, apiKey) {
  if (!apiKey) throw new Error('Rijksmuseum requiere una API key (gratuita en data.rijksmuseum.nl)')
  const res = await fetch(`https://www.rijksmuseum.nl/api/en/collection?${new URLSearchParams({
    key:     apiKey,
    q:       query,
    imgonly: 'true',
    ps:      '20',
    format:  'json',
  })}`)
  if (!res.ok) throw new Error(`Rijksmuseum ${res.status}`)
  const data = await res.json()

  return (data.artObjects ?? [])
    .filter((a) => a.webImage?.url)
    .map((a) => ({
      id:          a.objectNumber,
      thumb:       a.webImage.url,
      src:         a.webImage.url,
      photographer: a.principalOrFirstMaker ?? 'Rijksmuseum',
      source:      'Rijksmuseum',
      license:     'CC0',
      attribution: `${a.title} — Rijksmuseum`,
    }))
}

// ── MUSEO DEL PRADO (vía Europeana) ───────────────────────────────────────────
// Filtra DATA_PROVIDER del Prado sobre la API de Europeana (misma clave gratuita).
// CORS: YES (heredado de Europeana).
async function searchPrado(query, apiKey) {
  if (!apiKey) throw new Error('El Prado requiere una API key de Europeana (gratuita en pro.europeana.eu)')

  // qf repetido para múltiples filtros — URLSearchParams los serializa como múltiples pares
  const params = new URLSearchParams([
    ['wskey',   apiKey],
    ['query',   query],
    ['qf',      'TYPE:IMAGE'],
    ['qf',      'DATA_PROVIDER:"Museo Nacional del Prado"'],
    ['rows',    '20'],
    ['profile', 'rich'],
  ])
  const res = await fetch(`https://api.europeana.eu/api/v2/search.json?${params}`)
  if (!res.ok) throw new Error(`Prado/Europeana ${res.status}: ${await res.text().then(t => t.slice(0, 120))}`)
  const data = await res.json()

  return (data.items ?? [])
    .filter((item) => item.edmPreview?.[0])
    .map((item) => ({
      id:          item.id,
      thumb:       item.edmPreview[0],
      src:         item.edmIsShownBy?.[0] ?? item.edmPreview[0],
      photographer: 'Museo Nacional del Prado',
      source:      'Museo del Prado',
      license:     item.rights?.[0]?.replace('http://creativecommons.org/licenses/', 'CC ') ?? '',
      attribution: `${item.title?.[0] ?? 'Sin título'} — Museo Nacional del Prado`,
    }))
}

// ── EUROPEANA ─────────────────────────────────────────────────────────────────
// Docs: https://pro.europeana.eu/page/search
// CORS: YES (confirmed). API key gratuita en pro.europeana.eu
async function searchEuropeana(query, apiKey) {
  if (!apiKey) throw new Error('Europeana requiere una API key (gratuita en pro.europeana.eu)')

  const url = `https://api.europeana.eu/api/v2/search.json?${new URLSearchParams({
    wskey:   apiKey,
    query,
    rows:    '20',
    qf:      'TYPE:IMAGE',
    profile: 'rich',
  })}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Europeana ${res.status}: ${await res.text().then(t => t.slice(0, 120))}`)
  const data = await res.json()

  return (data.items ?? [])
    .filter((item) => item.edmPreview?.[0])
    .map((item) => ({
      id:          item.id,
      thumb:       item.edmPreview[0],
      src:         item.edmIsShownBy?.[0] ?? item.edmPreview[0],
      photographer: (item.dataProvider?.[0] ?? item.provider?.[0] ?? 'Europeana'),
      source:      'Europeana',
      license:     item.rights?.[0]?.replace('http://creativecommons.org/licenses/', 'CC ') ?? '',
      attribution: `${(item.title?.[0] ?? 'Sin título')} — Europeana`,
    }))
}

// ── GBIF ───────────────────────────────────────────────────────────────────────
// Docs: https://techdocs.gbif.org/en/openapi/v1/occurrence
// No API key needed. Nature & biodiversity images.
async function searchGBIF(query) {
  const url = `https://api.gbif.org/v1/occurrence/search?${new URLSearchParams({
    q:          query,
    mediaType:  'StillImage',
    limit:      '20',
  })}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`GBIF ${res.status}`)
  const data = await res.json()

  return (data.results ?? [])
    .flatMap((occ) =>
      (occ.media ?? []).slice(0, 1).map((m) => ({
        id:          `${occ.key}-${m.identifier}`,
        thumb:       m.identifier,
        src:         m.identifier,
        photographer: occ.recordedBy ?? occ.institutionCode ?? 'GBIF',
        source:      'GBIF',
        license:     (m.license ?? '').replace('http://creativecommons.org/licenses/', 'CC '),
        attribution: `${occ.scientificName ?? query} — GBIF`,
      }))
    )
    .filter((r) => r.thumb && /^https?:\/\//.test(r.thumb))
    .slice(0, 16)
}

// ── GOOGLE CUSTOM SEARCH ──────────────────────────────────────────────────────
// Docs: https://developers.google.com/custom-search/v1/overview
// Setup:
//   1. Crea API key en console.cloud.google.com → Custom Search JSON API
//   2. Crea un motor en cse.google.com → activa "Buscar en toda la web"
//   3. Copia el CX (ID del motor)
async function searchGoogle(query, apiKey, cx) {
  if (!apiKey) throw new Error('Google requiere una API key')
  if (!cx)     throw new Error('Google requiere el ID del motor de búsqueda (CX)')

  const url = `https://www.googleapis.com/customsearch/v1?${new URLSearchParams({
    key:        apiKey,
    cx,
    q:          query,
    searchType: 'image',
    num:        '10',
    safe:       'off',
  })}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Google ${res.status}: ${err.error?.message ?? res.statusText}`)
  }
  const data = await res.json()

  return (data.items ?? []).map((item) => ({
    id:          item.cacheId ?? item.link,
    thumb:       item.image?.thumbnailLink ?? item.link,
    src:         item.link,
    photographer: item.displayLink ?? 'Google Images',
    source:      'Google',
    license:     '',
    attribution: item.title ?? '',
  }))
}

// ── PEXELS ─────────────────────────────────────────────────────────────────────
async function searchPexels(query, key) {
  if (!key) throw new Error('Pexels requiere una API key')
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=18&orientation=landscape`,
    { headers: { Authorization: key } }
  )
  if (!res.ok) throw new Error(`Pexels ${res.status}`)
  const data = await res.json()
  return (data.photos ?? []).map((p) => ({
    id:          p.id,
    thumb:       p.src.medium,
    src:         p.src.large2x ?? p.src.large,
    photographer: p.photographer,
    source:      'Pexels',
    license:     'Pexels License',
    attribution: `${p.photographer} — Pexels`,
  }))
}

// ── PIXABAY ────────────────────────────────────────────────────────────────────
async function searchPixabay(query, key) {
  if (!key) throw new Error('Pixabay requiere una API key')
  const res = await fetch(
    `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&per_page=18&orientation=horizontal`
  )
  if (!res.ok) throw new Error(`Pixabay ${res.status}`)
  const data = await res.json()
  return (data.hits ?? []).map((p) => ({
    id:          p.id,
    thumb:       p.webformatURL,
    src:         p.largeImageURL,
    photographer: p.user,
    source:      'Pixabay',
    license:     'Pixabay License',
    attribution: `${p.user} — Pixabay`,
  }))
}

// ── UNSPLASH ───────────────────────────────────────────────────────────────────
async function searchUnsplash(query, key) {
  if (!key) throw new Error('Unsplash requiere una Access Key')
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=18&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${key}` } }
  )
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const data = await res.json()
  return (data.results ?? []).map((p) => ({
    id:          p.id,
    thumb:       p.urls.small,
    src:         p.urls.regular,
    photographer: p.user.name,
    source:      'Unsplash',
    license:     'Unsplash License',
    attribution: `${p.user.name} — Unsplash`,
  }))
}

// ── FETCH IMAGE BUFFER (for docx embedding) ────────────────────────────────────
export async function fetchImageBuffer(url) {
  const proxies = [
    url,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ]

  for (const attempt of proxies) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    try {
      const res = await fetch(attempt, { mode: 'cors', signal: controller.signal })
      if (res.ok) return res.arrayBuffer()
    } catch (_) { /* try next */ } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error('No se pudo descargar la imagen (CORS o timeout)')
}
