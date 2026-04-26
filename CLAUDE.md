# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (base path: /)
npm run build     # Production build (base path: /imagenea/)
npm run preview   # Serve the production build locally
```

There are no test or lint scripts. Validate changes with `npm run build` before committing.

## Architecture

**Imagenea** is a browser-only React SPA that enriches Word documents with AI-selected images. The workflow is step-gated (not URL-routed): `step` in the Zustand store controls which of 3 lazy-loaded step components is rendered.

### Data flow

1. **ConfigStep** (`src/components/steps/ConfigStep.jsx`) — user picks an AI provider and image provider; credentials stay in runtime state only.
2. **UploadStep** (`src/components/steps/UploadStep.jsx`) — mammoth (dynamically imported) converts `.docx` → HTML; plain text also accepted. Sets `docText`, `docHtml`, `sections` in the store.
3. **AnalysisStep** (`src/components/steps/AnalysisStep.jsx`) — calls `src/lib/ai.js` to extract visual topics, calls `src/lib/images.js` to search providers in parallel, user curates selections, then `src/lib/docx.js` regenerates the `.docx` with embedded images via the `docx` package.

### Key files

| File | Role |
|------|------|
| `src/store.js` | Zustand store; persists only `language` and non-sensitive config fields (provider IDs, URL, model) |
| `src/lib/ai.js` | Adapter for each AI provider (Ollama, LM Studio, OpenRouter, Anthropic, Google, custom OpenAI-compat) |
| `src/lib/images.js` | Image provider connectors (15+ sources); in-memory `searchCache` keyed by provider + query + credentials |
| `src/lib/i18n.js` + `src/hooks/useI18n.js` | 8-locale translation layer; all UI copy must go through `t()` |
| `src/lib/providerMeta.js` | Display metadata (labels, hints, free/paid flags) for AI and image providers |
| `vite.config.js` | Sets `base: '/imagenea/'` in production; manual chunk split for react, motion/icons, export libs, upload libs |

### State persistence rules

The Zustand store (`name: 'imagenea-config'`, `version: 3`) persists only `language` and a sanitized config subset (`aiProvider`, `aiUrl`, `aiModel`, `imgProvider`). API keys, document content, topics, image results, and selections are runtime-only and reset on each session start or when `reset()` is called.

## Conventions

- **Code identifiers and comments in English**; all user-visible text via the i18n translation layer.
- When adding UI copy, update all 8 locales: Spanish, English, French, German, Portuguese, Galician, Catalan, Basque.
- Heavy dependencies (`mammoth`, `docx`, `file-saver`) are dynamically imported inside async functions to keep the initial bundle small.
- The export output must exactly match what the user selected in the UI; if topic placement or export logic changes, update `ARCHITECTURE.md`.
- When modifying the store's persisted schema, increment `version` and verify the `merge` function still hydrates safely from old storage.
