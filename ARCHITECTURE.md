# Architecture

## Overview

Imagenea is a client-side React application that transforms user-supplied document content into an image-enriched Word export.

## Main Modules

### UI Shell

- `src/main.jsx`: bootstraps React, the Buffer polyfill, and toast notifications.
- `src/App.jsx`: renders the shell and lazy-loads the active workflow step.
- `src/components/Header.jsx`: top navigation bar.
- `src/components/StepBar.jsx`: step navigation.
- `src/lib/i18n.js` and `src/hooks/useI18n.js`: client-side translation catalog and hook.
- `src/lib/providerMeta.js`: localized provider labels, hints, and onboarding guides.

### Workflow Steps

- `src/components/steps/ConfigStep.jsx`: provider setup, model discovery, and connection checks.
- `src/components/steps/UploadStep.jsx`: file upload, pasted text intake, and document analysis trigger.
- `src/components/steps/AnalysisStep.jsx`: topic review, image search, selection, and export actions.

### State

- `src/store.js`: Zustand store for workflow state, selected language, topic data, image results, selections, and runtime-only credentials.

### Service Layer

- `src/lib/ai.js`: AI provider adapters and document-topic extraction.
- `src/lib/images.js`: image provider adapters plus image download helper.
- `src/lib/docx.js`: Word document generation and file download.

## End-to-End Flow

1. The user configures AI and image providers.
2. `UploadStep` reads `.docx` or `.txt` content and extracts sections.
3. `analyzeDocument` sends a prompt to the selected AI provider and requests titles and descriptions in the active UI language.
4. The AI response becomes `topics` in the Zustand store.
5. `AnalysisStep` queries image providers for each topic, reuses cached search responses, and limits bulk search concurrency.
6. Selected images are stored by topic id.
7. `generateAndDownload` lazy-loads export dependencies, rebuilds the document, and inserts the selected images after the mapped sections.

## Persistence Rules

Only non-sensitive preferences are persisted:

- AI provider
- AI base URL
- AI model
- Image provider
- UI language

Credentials and search engine identifiers are runtime-only and are not written to local storage.

## Performance Notes

- Workflow steps are lazy-loaded to reduce the initial bundle.
- `mammoth` is dynamically imported during document upload.
- `docx` and `file-saver` are dynamically imported only during export.
- Manual chunks split React, motion, upload parsing, and export dependencies.
- The Vite production build uses the `/imagenea/` base path so lazy-loaded chunks resolve correctly when hosted from the repository subpath.

## Known Boundaries

- The app runs entirely in the browser, so provider CORS behavior directly affects image fetching.
- Export quality depends on source image URLs remaining reachable at generation time.
- No automated test suite is configured yet; `npm run build` is the current project-wide validation step.

