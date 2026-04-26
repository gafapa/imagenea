import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LANGUAGE } from './lib/i18n'

const DEFAULT_CONFIG = {
  aiProvider: 'ollama',
  aiUrl: 'http://localhost:11434',
  aiModel: 'llama3.2',
  aiKey: '',
  imgProvider: 'all',
  imgKey: '',
  googleCx: '',
}

function sanitizePersistedConfig(config = {}) {
  return {
    aiProvider: config.aiProvider ?? DEFAULT_CONFIG.aiProvider,
    aiUrl: config.aiUrl ?? DEFAULT_CONFIG.aiUrl,
    aiModel: config.aiModel ?? DEFAULT_CONFIG.aiModel,
    imgProvider: config.imgProvider ?? DEFAULT_CONFIG.imgProvider,
  }
}

export const useStore = create(
  persist(
    (set) => ({
      step: 1,
      setStep: (step) => set({ step }),

      language: DEFAULT_LANGUAGE,
      setLanguage: (language) => set({ language }),

      config: { ...DEFAULT_CONFIG },
      setConfig: (patch) =>
        set((state) => ({ config: { ...state.config, ...patch } })),

      docName: '',
      docText: '',
      docHtml: '',
      sections: [],
      setDocument: ({ name, text, html, sections }) =>
        set({ docName: name, docText: text, docHtml: html, sections }),

      topics: [],
      setTopics: (topics) => set({ topics }),
      updateTopic: (id, patch) =>
        set((state) => ({
          topics: state.topics.map((topic) => (topic.id === id ? { ...topic, ...patch } : topic)),
        })),
      addTopic: (topic) => set((state) => ({ topics: [...state.topics, topic] })),
      removeTopic: (id) =>
        set((state) => {
          const nextImageResults = { ...state.imageResults }
          const nextImageLoading = { ...state.imageLoading }
          const nextSelected = { ...state.selected }
          delete nextImageResults[id]
          delete nextImageLoading[id]
          delete nextSelected[id]
          return {
            topics: state.topics.filter((t) => t.id !== id),
            imageResults: nextImageResults,
            imageLoading: nextImageLoading,
            selected: nextSelected,
          }
        }),

      imageResults: {},
      imageLoading: {},
      setImageResults: (topicId, imgs) =>
        set((state) => ({ imageResults: { ...state.imageResults, [topicId]: imgs } })),
      setImageLoading: (topicId, loading) =>
        set((state) => ({ imageLoading: { ...state.imageLoading, [topicId]: loading } })),

      selected: {},
      selectImage: (topicId, img) =>
        set((state) => {
          if (!img) {
            const nextSelected = { ...state.selected }
            delete nextSelected[topicId]
            return { selected: nextSelected }
          }

          return { selected: { ...state.selected, [topicId]: img } }
        }),
      clearSelected: () => set({ selected: {} }),

      generating: false,
      generationMsg: '',
      setGenerating: (generating, msg = '') => set({ generating, generationMsg: msg }),

      reset: () =>
        set({
          step: 1,
          docName: '',
          docText: '',
          docHtml: '',
          sections: [],
          topics: [],
          imageResults: {},
          imageLoading: {},
          selected: {},
          generating: false,
          generationMsg: '',
        }),
    }),
    {
      name: 'imagenea-config',
      version: 3,
      partialize: (state) => ({
        language: state.language,
        config: sanitizePersistedConfig(state.config),
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState ?? {}),
        language: persistedState?.language ?? currentState.language,
        config: {
          ...currentState.config,
          ...sanitizePersistedConfig(persistedState?.config),
        },
      }),
    }
  )
)
