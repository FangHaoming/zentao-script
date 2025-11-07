# Agent Guidelines for ZenTao Userscript

## Build Commands
- `yarn dev` - Start development server with hot reload
- `yarn build` - Build production userscript to `dist/zentao-userscript.user.js`
- `yarn preview` - Preview built userscript

## Code Style Guidelines

### Imports & Formatting
- Use ES6 imports with explicit file extensions for relative imports
- Import React components directly: `import { Component } from './Component'`
- No default exports - use named exports exclusively
- Inline styles with React style objects (no CSS files)

### TypeScript
- Strict mode enabled - all types must be properly defined
- Use interface for object shapes, type for unions/primitives
- Generic types: `PagedResponse<TItem, TKey extends string>`
- Prefer explicit return types for functions

### Naming Conventions
- Components: PascalCase (Panel.tsx, ResultsTable.tsx)
- Functions/variables: camelCase (formatHours, httpGet)
- Constants: UPPER_SNAKE_CASE (BASE_URL)
- Types: PascalCase (User, Project, Task)

### Error Handling
- Always handle fetch errors with try/catch
- Throw descriptive errors with status codes and context
- Use proper error boundaries in React components

### Architecture
- Separate API calls to `src/api/` directory
- Custom hooks in `src/hooks/` for stateful logic
- Utility functions in `src/utils/` for pure functions
- Types centralized in `src/types.ts`

### Userscript Specific
- Entry point: `src/app.tsx` with mount() function
- Avoid iframe mounting with `window.self !== window.top` check
- Use high z-index (2147483647) for floating elements
- Clean up existing containers on HMR reload