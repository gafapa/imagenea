# Rules

## Language

- Use English for code identifiers, comments, commit messages, and Markdown documentation.
- User-facing UI copy may stay in Spanish unless a product decision changes it.

## State and Security

- Never persist API keys or other sensitive credentials to browser storage.
- Keep persisted state limited to non-sensitive user preferences.
- When changing the store, verify that persisted data still hydrates safely.

## Export Consistency

- The export output must match the selection UI.
- If multiple topics target the same section, the generated `.docx` must preserve them all.
- Any change to topic placement or export rules must be reflected in `ARCHITECTURE.md`.

## Accessibility

- Interactive controls must use semantic HTML elements.
- Keyboard users must be able to operate the full workflow.
- Preserve visible focus states when editing UI controls.

## Performance

- Keep the initial application shell small.
- Lazy-load heavy workflow steps and large client-only dependencies when practical.
- Re-check the production build after changes that affect bundling.

## Maintenance Workflow

- Update the relevant Markdown files whenever behavior or architecture changes.
- Validate with `npm run build` before committing.
- Keep generated artifacts and local agent metadata out of Git.

