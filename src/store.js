import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
  // ── STEP ────────────────────────────────────────────
  step: 1,
  setStep: (step) => set({ step }),

  // ── CONFIG ──────────────────────────────────────────
  config: {
    aiProvider:  'ollama',
    aiUrl:       'http://localhost:11434',
    aiModel:     'llama3.2',
    aiKey:       '',
    imgProvider: 'all',
    imgKey:      '',
    googleCx:    '',
  },
  setConfig: (patch) =>
    set((s) => ({ config: { ...s.config, ...patch } })),

  // ── DOCUMENT ────────────────────────────────────────
  docName:     '',
  docText:     '',
  docHtml:     '',
  sections:    [],   // [{idx, text, html, isHeading}]
  setDocument: ({ name, text, html, sections }) =>
    set({ docName: name, docText: text, docHtml: html, sections }),

  // ── TOPICS (AI output) ──────────────────────────────
  topics:     [],   // [{id, title, description, imageQuery, sectionIdx}]
  setTopics:  (topics) => set({ topics }),
  updateTopic: (id, patch) =>
    set((s) => ({
      topics: s.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  // ── IMAGE SEARCH RESULTS ────────────────────────────
  imageResults:    {},   // topicId → [{id, thumb, src, photographer, source, attribution}]
  imageLoading:    {},   // topicId → bool
  setImageResults: (topicId, imgs) =>
    set((s) => ({ imageResults: { ...s.imageResults, [topicId]: imgs } })),
  setImageLoading: (topicId, loading) =>
    set((s) => ({ imageLoading: { ...s.imageLoading, [topicId]: loading } })),

  // ── SELECTED IMAGES ─────────────────────────────────
  selected:    {},   // topicId → image object
  selectImage: (topicId, img) =>
    set((s) => ({ selected: { ...s.selected, [topicId]: img } })),
  clearSelected: () => set({ selected: {} }),

  // ── GENERATION STATE ────────────────────────────────
  generating:    false,
  generationMsg: '',
  setGenerating: (generating, msg = '') => set({ generating, generationMsg: msg }),

  // ── RESET ───────────────────────────────────────────
  reset: () =>
    set({
      step: 1,
      docName: '', docText: '', docHtml: '', sections: [],
      topics: [], imageResults: {}, imageLoading: {}, selected: {},
      generating: false, generationMsg: '',
    }),
    }),
    {
      name: 'imagenea-config',          // localStorage key
      partialize: (s) => ({ config: s.config }),  // solo persiste config
    }
  )
)
