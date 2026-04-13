/**
 * Calls the configured AI provider and returns the text response.
 * Supports: Ollama, LM Studio, OpenRouter
 */
export async function callAI(messages, config) {
  const { aiProvider, aiUrl, aiModel, aiKey } = config

  if (aiProvider === 'ollama') {
    const res = await fetch(`${aiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: aiModel, messages, stream: false }),
    })
    if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.message?.content ?? ''
  }

  if (aiProvider === 'lmstudio') {
    const res = await fetch(`${aiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer lm-studio',
      },
      body: JSON.stringify({ model: aiModel, messages, temperature: 0.3 }),
    })
    if (!res.ok) throw new Error(`LM Studio ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  if (aiProvider === 'openrouter') {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'ImageDoc AI',
      },
      body: JSON.stringify({ model: aiModel, messages, temperature: 0.3 }),
    })
    if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  throw new Error('Proveedor de IA no reconocido: ' + aiProvider)
}

/**
 * Analyzes document text, returns structured topics with image queries.
 */
export async function analyzeDocument(text, sectionCount, config) {
  const snippet = text.slice(0, 4500)
  const prompt = `Analiza el siguiente documento y extrae entre 3 y 6 temas principales que merezcan una imagen ilustrativa.

Responde ÚNICAMENTE con un bloque JSON válido (sin markdown, sin explicaciones adicionales):

{
  "topics": [
    {
      "id": 1,
      "title": "Título corto en español (máx 6 palabras)",
      "description": "Una o dos frases que describan el tema.",
      "imageQuery": "primary english image search phrase",
      "altQueries": [
        "broader or synonym search phrase",
        "visual metaphor or abstract concept",
        "simpler one or two word search"
      ],
      "sectionIdx": 0
    }
  ]
}

Reglas:
- Todos los campos "imageQuery" y "altQueries" deben estar en INGLÉS y ser descriptivos.
- "imageQuery" debe ser la búsqueda más específica y visual del tema.
- "altQueries" son 3 alternativas si la búsqueda principal no da resultados: una más amplia, una metafórica/visual y una muy simple.
- "sectionIdx" es el índice del párrafo (0 a ${sectionCount - 1}) tras el cual insertar la imagen.
- Distribuye los temas a lo largo del documento, no todos al inicio.

Documento:
${snippet}`

  const raw = await callAI(
    [
      {
        role: 'system',
        content:
          'Eres un experto en análisis de documentos. Respondes exclusivamente con JSON válido, sin markdown ni texto adicional.',
      },
      { role: 'user', content: prompt },
    ],
    config
  )

  let parsed
  try {
    // Try parsing the full response first (model followed instructions)
    parsed = JSON.parse(raw.trim())
  } catch {
    // Fall back to extracting the last complete JSON object from the response
    const match = raw.match(/\{[\s\S]*\}/g)
    if (!match) throw new Error('La IA no devolvió JSON válido. Respuesta: ' + raw.slice(0, 150))
    const last = match[match.length - 1]
    try {
      parsed = JSON.parse(last)
    } catch {
      throw new Error('La IA devolvió JSON malformado. Respuesta: ' + raw.slice(0, 150))
    }
  }

  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0)
    throw new Error('No se detectaron temas en el documento.')

  return parsed.topics.map((t, i) => ({
    ...t,
    id:        t.id ?? i + 1,
    altQueries: Array.isArray(t.altQueries) ? t.altQueries.filter((q) => q != null && q !== '') : [],
    sectionIdx: Math.min(
      Math.max(0, parseInt(t.sectionIdx, 10) || 0),
      Math.max(0, sectionCount - 1)
    ),
  }))
}
