# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

**Note:** Do not run `npm run dev` or `npm run build` without explicit user instruction.

## Architecture

This is an experiential landing page for Paper Crane featuring scroll-driven 3D particle animations with GSAP and React Three Fiber.

### Core Flow

```
App.jsx
├── EnterScreen (click-to-enter gate, triggers audio)
├── Experience (full-screen Canvas background, z-index: 1)
│   └── EtherealParticles (GPU shader-based helix particles)
└── ContentSections (fixed overlay text, z-index: 10)
    └── Section components tied to scroll triggers
```

### Key Patterns

**Scroll-Particle Synchronization:**
- `ContentSections` defines scroll trigger regions (one `<div id="trigger-*">` per section, each 100vh)
- When a section enters viewport center, it calls `onSectionChange(sectionId)`
- This triggers `Experience.transitionToState()` via imperative handle
- `EtherealParticles` animates shader uniforms (tightness, radius, speed, opacity) to match section mood

**Particle States** (`src/components/Canvas/EtherealParticles.jsx`):
```js
particleStates = {
  hero: { tightness: 2.5, radius: 3.5, speed: 0.5, opacity: 0.9 },
  problem: { tightness: 3.5, radius: 3.0, speed: 0.35, opacity: 0.75 },
  // ... one config per section
}
```

**Shader Architecture:**
- Custom vertex/fragment shaders for helical particle system
- Uniforms controlled via GSAP for smooth transitions
- Mouse repulsion, scroll twist, and flow animation baked into vertex shader

### Libraries

- **React Three Fiber + Drei** - 3D canvas and helpers
- **GSAP + ScrollTrigger** - All animations and scroll-linked effects
- **Lenis** - Smooth scroll wrapper (`ReactLenis` at root)

### Constraints

- Never use `any` type to suppress TypeScript/ESLint errors
- ESLint ignores unused vars starting with uppercase or underscore (`varsIgnorePattern: '^[A-Z_]'`)
