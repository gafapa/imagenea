# Imagenea

Imagenea is a Vite + React application that enriches Word documents with AI-assisted image selection.

## What It Does

- Connects to an AI provider to analyze a document and extract visual topics.
- Searches multiple image providers for each detected topic.
- Lets the user review, replace, and position images before export.
- Generates a new `.docx` file with the selected images embedded after the chosen sections.

## Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Zustand for client state
- Mammoth for `.docx` HTML conversion
- `docx` for Word export

## Local Development

### Requirements

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The production build is configured to run under the `/imagenea/` base path so it can be served from the repository subpath without breaking lazy-loaded assets.

## Application Flow

1. Configure AI and image providers.
2. Upload or paste document content.
3. Let the AI extract topics and search queries.
4. Search and select images for each topic.
5. Export a new Word file with the inserted images.

## Configuration Notes

- API keys are kept only in runtime state and are no longer persisted to browser storage.
- Provider preferences such as selected engines and model names are persisted locally.
- The export pipeline supports multiple images assigned to the same document section.
- Vite uses `/imagenea/` as the production base path and `/` during local development.

## Repository Documents

- `README.md`: product overview and setup.
- `ARCHITECTURE.md`: technical structure and data flow.
- `RULES.md`: repository conventions and maintenance rules.

