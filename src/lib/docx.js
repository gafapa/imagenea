import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  ShadingType,
} from 'docx'
import { saveAs } from 'file-saver'
import { fetchImageBuffer } from './images'

/**
 * Builds and downloads a .docx with the document sections and selected images
 * inserted after their designated paragraphs.
 */
export async function generateAndDownload(sections, topics, selected, onProgress) {
  // Sort topics by sectionIdx (insertion order)
  const insertMap = {}
  topics.forEach((t) => {
    if (selected[t.id]) insertMap[t.sectionIdx] = t
  })

  const children = []

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]

    // Add paragraph
    children.push(
      sec.isHeading
        ? new Paragraph({
            text: sec.text,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 320, after: 160 },
          })
        : new Paragraph({
            children: [new TextRun({ text: sec.text, size: 24 })],
            spacing: { after: 180 },
          })
    )

    // Insert image after this paragraph if one is assigned here
    const topic = insertMap[i]
    if (topic) {
      const img = selected[topic.id]
      onProgress?.(`Descargando imagen: "${topic.title}"…`)
      try {
        const buffer = await fetchImageBuffer(img.src)
        const ext = getExt(img.src)

        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data:           buffer,
                type:           ext,
                transformation: { width: 500, height: 281 },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing:   { before: 240, after: 120 },
          })
        )

        // Caption
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text:    `${topic.title} — ${img.attribution ?? ((img.photographer ?? 'Desconocido') + ' (' + (img.source ?? 'Fuente desconocida') + ')')}`,
                size:    18,
                italics: true,
                color:   '64748b',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing:   { after: 360 },
          })
        )
      } catch (e) {
        // Add a note if image couldn't be fetched
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text:  `[Imagen no disponible: ${topic.title}]`,
                size:  20,
                color: 'ef4444',
              }),
            ],
            spacing: { after: 200 },
          })
        )
        console.warn('Image fetch failed:', e)
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
  saveAs(blob, 'documento_con_imagenes.docx')
}

function getExt(url) {
  const match = url.match(/\.(jpe?g|png|gif|webp)/i)
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg'
}
