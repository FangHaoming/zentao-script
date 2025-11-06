# AGENTS.md

## Build Commands
- `yarn dev` - Start development server with hot reload
- `yarn build` - Build production userscript to `dist/zentao-userscript.user.js`
- `yarn preview` - Preview built userscript

## Code Style Guidelines

### Imports & Dependencies
- Use ES6 imports with explicit file extensions for TypeScript files
- Group imports: React hooks first, then local modules, then types
- Import types separately: `import type { ... } from './types'`

### TypeScript & Types
- Strict TypeScript enabled - all types must be defined
- Use interfaces for object shapes, types for unions/primitives
- Prefer `const` assertions and `as const` for readonly data
- Use generic types with proper constraints (`TKey extends string`)

### Naming Conventions
- Components: PascalCase (React functional components)
- Functions: camelCase with descriptive verbs (`fetchUsers`, `formatHours`)
- Constants: UPPER_SNAKE_CASE for exports (`BASE_URL`, `STORAGE_KEYS`)
- Variables: camelCase, prefer descriptive names over abbreviations

### Error Handling
- Always handle Promise rejections with `.catch()` or try/catch
- Use meaningful error messages with context
- Gracefully handle localStorage failures with try/catch blocks
- Validate API responses and provide fallbacks

### React Patterns
- Use functional components with hooks exclusively
- Implement proper dependency arrays in useEffect
- Use useMemo for expensive computations, useState for state
- Prefer inline styles for userscript (no CSS modules)
- Handle cleanup in useEffect (remove event listeners)

### API & Data
- Use fetch API with proper headers and error handling
- Implement concurrency limiting for bulk operations
- Store API responses in appropriate state variables
- Use localStorage for persistence with error handling

### Userscript Specific
- Check `window.self !== window.top` to avoid iframe mounting
- Clean up existing containers on HMR reload
- Use high z-index values (2147483647) for UI elements
- Support both dev and production API endpoints via BASE_URL