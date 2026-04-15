import { fetchImageBuffer } from './images'

export async function generateAndDownload(sections, topics, selected, options = {}) {
  const {
    onProgress,
    filename = 'imagenea-document.docx',
    missingImageLabel = 'Image unavailable',
    unknownPhotographer = 'Unknown',
    unknownSource = 'Unknown source',
  } = options

  const [{ saveAs }, docxModule] = await Promise.all([
    import('file-saver'),
    import('docx'),
  ])

  const {
    AlignmentType,
    Document,
    HeadingLevel,
    ImageRun,
    Packer,
    Paragraph,
    TextRun,
  } = docxModule

  const insertMap = {}

  topics.forEach((topic) => {
    if (!selected[topic.id]) return

    if (!insertMap[topic.sectionIdx]) {
      insertMap[topic.sectionIdx] = []
    }

    insertMap[topic.sectionIdx].push(topic)
  })

  const children = []

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index]

    children.push(
      section.isHeading
        ? new Paragraph({
            text: section.text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 320, after: 160 },
          })
        : new Paragraph({
            children: [new TextRun({ text: section.text, size: 24 })],
            spacing: { after: 180 },
          })
    )

    for (const topic of insertMap[index] ?? []) {
      const img = selected[topic.id]
      onProgress?.(topic)

      try {
        const buffer = await fetchImageBuffer(img.src)
        const ext = getExt(img.src)

        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: buffer,
                type: ext,
                transformation: { width: 500, height: 281 },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
          })
        )

        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${topic.title} - ${img.attribution ?? `${img.photographer ?? unknownPhotographer} (${img.source ?? unknownSource})`}`,
                size: 18,
                italics: true,
                color: '64748b',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 360 },
          })
        )
      } catch (error) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[${missingImageLabel}: ${topic.title}]`,
                size: 20,
                color: 'ef4444',
              }),
            ],
            spacing: { after: 200 },
          })
        )
        console.warn('Image fetch failed:', error)
      }
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 24, color: '1e293b' },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename)
}

function getExt(url) {
  const match = url.match(/\.(jpe?g|png|gif|webp)/i)
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg'
}
