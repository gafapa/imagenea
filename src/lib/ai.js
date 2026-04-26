import { getDocumentLanguageName } from './i18n'
import { smartFetch } from './bridge'

export async function callAI(messages, config) {
  const { aiProvider, aiUrl, aiModel, aiKey } = config

  if (aiProvider === 'ollama') {
    const response = await smartFetch(`${aiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: aiModel, messages, stream: false }),
    })

    if (!response.ok) {
      throw new Error(`Ollama ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return data.message?.content ?? ''
  }

  if (aiProvider === 'lmstudio') {
    const response = await smartFetch(`${aiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer lm-studio',
      },
      body: JSON.stringify({ model: aiModel, messages, temperature: 0.3 }),
    })

    if (!response.ok) {
      throw new Error(`LM Studio ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  if (aiProvider === 'openrouter') {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Imagenea',
      },
      body: JSON.stringify({ model: aiModel, messages, temperature: 0.3 }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  throw new Error(`Unsupported AI provider: ${aiProvider}`)
}

export async function analyzeDocument(text, sectionCount, config, language = 'es') {
  const snippet = text.slice(0, 4500)
  const targetLanguage = getDocumentLanguageName(language)

  const prompt = `Analyze the following document and extract between 3 and 6 main topics that deserve an illustrative image.

Return ONLY a valid JSON object with no markdown fences and no extra explanation:

{
  "topics": [
    {
      "id": 1,
      "title": "Short title in ${targetLanguage} (max 6 words)",
      "description": "One or two sentences in ${targetLanguage}.",
      "imageQuery": "primary english image search phrase",
      "altQueries": [
        "broader or synonym search phrase",
        "visual metaphor or abstract concept",
        "simple one or two word search"
      ],
      "sectionIdx": 0
    }
  ]
}

Rules:
- "title" and "description" must be written in ${targetLanguage}.
- "imageQuery" and every item in "altQueries" must stay in English.
- "imageQuery" should be the most visual and specific query.
- "altQueries" must provide three useful fallbacks.
- "sectionIdx" must be a paragraph index between 0 and ${Math.max(0, sectionCount - 1)}.
- Spread the topics across the document instead of clustering them at the start.

Document:
${snippet}`

  const raw = await callAI(
    [
      {
        role: 'system',
        content:
          'You are a document analysis expert. You answer with valid JSON only, with no markdown and no extra prose.',
      },
      { role: 'user', content: prompt },
    ],
    config
  )

  let parsed

  try {
    parsed = JSON.parse(raw.trim())
  } catch {
    const match = raw.match(/\{[\s\S]*\}/g)

    if (!match) {
      throw new Error(`The AI response did not contain valid JSON. Response: ${raw.slice(0, 150)}`)
    }

    const last = match[match.length - 1]

    try {
      parsed = JSON.parse(last)
    } catch {
      throw new Error(`The AI response returned malformed JSON. Response: ${raw.slice(0, 150)}`)
    }
  }

  if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
    throw new Error('No topics were detected in the document.')
  }

  return parsed.topics.map((topic, index) => ({
    ...topic,
    id: topic.id ?? index + 1,
    altQueries: Array.isArray(topic.altQueries)
      ? topic.altQueries.filter((query) => query != null && query !== '')
      : [],
    sectionIdx: Math.min(
      Math.max(0, parseInt(topic.sectionIdx, 10) || 0),
      Math.max(0, sectionCount - 1)
    ),
  }))
}
