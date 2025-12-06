# Particle Animation Expert Agent

> A comprehensive guide for building scroll-driven 3D particle experiences with React Three Fiber, GSAP, and custom shaders.

---

## Table of Contents

1. [Core Technologies](#1-core-technologies)
2. [React Three Fiber Patterns](#2-react-three-fiber-patterns)
3. [Custom Shader Architecture](#3-custom-shader-architecture)
4. [GLB Model Particle Morphing](#4-glb-model-particle-morphing)
5. [Scroll-Based Animation Integration](#5-scroll-based-animation-integration)
6. [useFrame Patterns](#6-useframe-patterns)
7. [Mouse & Interaction Effects](#7-mouse--interaction-effects)
8. [State Machine Pattern](#8-state-machine-pattern)
9. [drei Helper Components](#9-drei-helper-components)
10. [three.quarks Particle System](#10-threequarks-particle-system)
11. [Performance Optimization](#11-performance-optimization)
12. [Complete Implementation Patterns](#12-complete-implementation-patterns)

---

## 1. Core Technologies

### Technology Stack

| Library | Purpose | When to Use |
|---------|---------|-------------|
| **React Three Fiber** | React renderer for Three.js | Always - foundation layer |
| **@react-three/drei** | Helper components | Points, Instances, ScrollControls |
| **GSAP + ScrollTrigger** | Animation & scroll sync | State transitions, scrubbed timelines |
| **Lenis** | Smooth scroll | User experience layer |
| **three.quarks** | Particle system library | Standard effects (fire, smoke, sparks) |
| **Custom Shaders** | GLSL vertex/fragment | Complex patterns (helix, morphing) |

### Decision Matrix: Which Approach?

```
Need mathematical precision (helix, DNA)?  → Custom Shaders
Need fire/smoke/sparks quickly?            → three.quarks
Need particles on model surface?           → MeshSurfaceSampler + Shaders
Need shape-to-shape morphing?              → Multi-attribute shaders
Need simple ambient particles?             → drei <Sparkles>
Need scroll-driven scenes?                 → GSAP ScrollTrigger + useFrame
```

---

## 2. React Three Fiber Patterns

### Component Architecture

```jsx
// Standard particle component structure
import { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'

const ParticleSystem = forwardRef((props, ref) => {
  // 1. Refs for Three.js objects
  const mesh = useRef()
  const { viewport } = useThree()

  // 2. Memoized geometry data (runs once)
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    // ... heavy initialization
    return { positions }
  }, [])

  // 3. Uniforms as ref (mutate without re-render)
  const uniforms = useRef({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2() }
  }).current

  // 4. Animation loop (60fps)
  useFrame((state) => {
    mesh.current.material.uniforms.uTime.value = state.clock.elapsedTime
  })

  // 5. External integrations (GSAP, ScrollTrigger)
  useEffect(() => {
    const tl = gsap.timeline({ /* ScrollTrigger config */ })
    return () => tl.kill()
  }, [])

  // 6. Imperative API for parent components
  useImperativeHandle(ref, () => ({
    transitionToState: (stateName) => {
      // GSAP animations
    }
  }))

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" ... />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} ... />
    </points>
  )
})
```

### Performance Rules

```jsx
// ✅ DO: Use useMemo for geometry
const particles = useMemo(() => new Float32Array(count * 3), [])

// ✅ DO: Use useRef for uniforms
const uniforms = useRef({ uTime: { value: 0 } }).current

// ✅ DO: Mutate directly in useFrame
useFrame(() => {
  uniforms.uTime.value = clock.getElapsedTime()
})

// ❌ DON'T: Use useState for frame updates
const [time, setTime] = useState(0)
useFrame(() => setTime(t => t + 1)) // Re-renders every frame!

// ❌ DON'T: Allocate in useFrame
useFrame(() => {
  const vec = new THREE.Vector3() // Creates GC pressure
})
```

### Canvas Configuration

```jsx
<Canvas
  camera={{ position: [0, 0, 5], fov: 45 }}
  dpr={[1, 2]}  // Cap pixel ratio for performance
  gl={{
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  }}
>
  <Scene />
</Canvas>
```

---

## 3. Custom Shader Architecture

### Vertex Shader Template

```glsl
// Attributes - per particle data
attribute float aRandom;
attribute float aProgress;    // 0-1 position along path
attribute vec3 aStartPos;     // For morphing
attribute vec3 aEndPos;       // For morphing

// Uniforms - global controls
uniform float uTime;
uniform float uScroll;
uniform float uMorphProgress;
uniform vec2 uMouse;
uniform vec2 uViewport;

// Varyings - pass to fragment
varying vec3 vColor;
varying float vAlpha;

#define PI 3.14159265359

// Simplex noise function (include full implementation)
float snoise(vec3 v) { /* ... */ }

// Easing functions
float easeInOutCubic(float t) {
  return t < 0.5
    ? 4.0 * t * t * t
    : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
  // 1. Calculate base position
  vec3 pos = position;

  // 2. Apply morphing (if using)
  float easedProgress = easeInOutCubic(uMorphProgress);
  pos = mix(aStartPos, aEndPos, easedProgress);

  // 3. Add noise displacement
  float noiseVal = snoise(pos * 0.5 + uTime * 0.2);
  pos += vec3(noiseVal) * 0.3;

  // 4. Apply scroll effects
  float scrollTwist = uScroll * aProgress * PI;
  pos.x = pos.x * cos(scrollTwist) - pos.z * sin(scrollTwist);
  pos.z = pos.x * sin(scrollTwist) + pos.z * cos(scrollTwist);

  // 5. Mouse interaction
  vec2 mouseWorld = uMouse * uViewport * 0.5;
  float dist = distance(pos.xy, mouseWorld);
  float influence = smoothstep(8.0, 0.0, dist);
  vec3 dir = normalize(pos - vec3(mouseWorld, 0.0));
  pos += dir * influence * 1.0;

  // 6. Project to screen
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // 7. Point size with depth attenuation
  gl_PointSize = (10.0 * aRandom + 5.0) * (1.0 / -mvPosition.z);

  // 8. Set varyings
  vColor = vec3(0.8 + aProgress * 0.2);
  vAlpha = 1.0;
}
```

### Fragment Shader Template

```glsl
varying vec3 vColor;
varying float vAlpha;

uniform float uOpacity;

void main() {
  // Circular gradient (soft particles)
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // Soft circle with falloff
  float strength = 1.0 - smoothstep(0.0, 0.5, dist);
  strength = pow(strength, 2.5);

  // Discard transparent pixels
  if (strength < 0.01) discard;

  gl_FragColor = vec4(vColor, strength * vAlpha * uOpacity);
}
```

### ShaderMaterial Configuration

```jsx
<shaderMaterial
  vertexShader={vertexShader}
  fragmentShader={fragmentShader}
  uniforms={uniforms}
  transparent={true}
  depthWrite={false}
  depthTest={true}
  blending={THREE.AdditiveBlending}
/>
```

### Blending Modes Reference

| Mode | Effect | Use Case |
|------|--------|----------|
| `AdditiveBlending` | Colors add together, brightens | Glowing particles, fire |
| `NormalBlending` | Standard alpha | Solid particles |
| `MultiplyBlending` | Colors multiply, darkens | Shadows, dark effects |
| `SubtractiveBlending` | Colors subtract | Rare, special effects |

---

## 4. GLB Model Particle Morphing

### Extracting Vertices from GLB

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler'

async function extractVerticesFromGLB(path, particleCount) {
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(path)
  const vertices = []

  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.updateMatrixWorld(true)

      // Use MeshSurfaceSampler for uniform distribution
      const sampler = new MeshSurfaceSampler(child).build()
      const tempPos = new THREE.Vector3()

      for (let i = 0; i < particleCount; i++) {
        sampler.sample(tempPos)
        tempPos.applyMatrix4(child.matrixWorld)
        vertices.push(tempPos.clone())
      }
    }
  })

  return vertices
}
```

### Multi-Shape Morphing Setup

```javascript
function createMorphingGeometry(shapes, particleCount) {
  const geometry = new THREE.BufferGeometry()

  // Create attribute arrays for each shape
  const positions0 = new Float32Array(particleCount * 3)
  const positions1 = new Float32Array(particleCount * 3)
  const positions2 = new Float32Array(particleCount * 3)
  const randomSeeds = new Float32Array(particleCount)

  // Populate with shape data
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3

    // Shape 0
    if (shapes[0][i]) {
      positions0[i3] = shapes[0][i].x
      positions0[i3 + 1] = shapes[0][i].y
      positions0[i3 + 2] = shapes[0][i].z
    }

    // Shape 1
    if (shapes[1][i]) {
      positions1[i3] = shapes[1][i].x
      positions1[i3 + 1] = shapes[1][i].y
      positions1[i3 + 2] = shapes[1][i].z
    }

    randomSeeds[i] = Math.random()
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions0, 3))
  geometry.setAttribute('aPosition0', new THREE.BufferAttribute(positions0, 3))
  geometry.setAttribute('aPosition1', new THREE.BufferAttribute(positions1, 3))
  geometry.setAttribute('aPosition2', new THREE.BufferAttribute(positions2, 3))
  geometry.setAttribute('aRandomSeed', new THREE.BufferAttribute(randomSeeds, 1))

  return geometry
}
```

### Morphing Vertex Shader

```glsl
attribute vec3 aPosition0;
attribute vec3 aPosition1;
attribute vec3 aPosition2;
attribute float aRandomSeed;

uniform float uMorphProgress;
uniform int uShapeFrom;
uniform int uShapeTo;

void main() {
  // Select positions based on indices
  vec3 posFrom = uShapeFrom == 0 ? aPosition0 :
                 uShapeFrom == 1 ? aPosition1 : aPosition2;
  vec3 posTo = uShapeTo == 0 ? aPosition0 :
               uShapeTo == 1 ? aPosition1 : aPosition2;

  // Apply easing
  float easedProgress = easeInOutCubic(uMorphProgress);

  // Interpolate with noise during transition
  vec3 pos = mix(posFrom, posTo, easedProgress);

  // Add chaos during morph (peaks at 50%)
  float morphNoise = sin(easedProgress * PI) * 0.5;
  pos += vec3(snoise(pos + uTime)) * morphNoise;

  // ... rest of shader
}
```

### Triggering Morphs

```javascript
const morphTo = (shapeIndex, duration = 2.0) => {
  const currentFrom = uniforms.uShapeTo.value
  uniforms.uShapeFrom.value = currentFrom
  uniforms.uShapeTo.value = shapeIndex
  uniforms.uMorphProgress.value = 0

  gsap.to(uniforms.uMorphProgress, {
    value: 1.0,
    duration,
    ease: 'power2.inOut'
  })
}
```

---

## 5. Scroll-Based Animation Integration

### GSAP ScrollTrigger Setup

```javascript
useEffect(() => {
  // Continuous scroll progress (0 to 1)
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1, // 1 second smoothing
    }
  })

  tl.to(uniforms.uScroll, {
    value: 1,
    ease: "none"
  })

  return () => {
    if (tl.scrollTrigger) tl.scrollTrigger.kill()
    tl.kill()
  }
}, [])
```

### Section-Based State Transitions

```javascript
// In ContentSections.jsx
ScrollTrigger.create({
  trigger: `#section-${id}`,
  start: 'top center',
  end: 'bottom center',
  onEnter: () => {
    onSectionChange(id) // Triggers particle state change
  },
  onEnterBack: () => {
    onSectionChange(id)
  }
})

// In EtherealParticles.jsx
const particleStates = {
  hero: { tightness: 2.5, radius: 3.5, speed: 0.5, opacity: 0.9 },
  problem: { tightness: 3.5, radius: 3.0, speed: 0.35, opacity: 0.75 },
  // ... more states
}

useImperativeHandle(ref, () => ({
  transitionToState: (stateName) => {
    const state = particleStates[stateName]
    if (!state) return

    gsap.to(uniforms.uHelixTightness, { value: state.tightness, duration: 2 })
    gsap.to(uniforms.uHelixRadius, { value: state.radius, duration: 2 })
    gsap.to(uniforms.uFlowSpeed, { value: state.speed, duration: 2 })
    gsap.to(uniforms.uParticleOpacity, { value: state.opacity, duration: 2 })
  }
}))
```

### Lenis + GSAP Integration

```jsx
// App.jsx - Lenis wraps everything
import { ReactLenis } from 'lenis/react'

function App() {
  return (
    <ReactLenis root>
      <Experience />
      <ContentSections />
    </ReactLenis>
  )
}

// GSAP ScrollTrigger automatically works with Lenis
// No additional configuration needed
```

### drei ScrollControls Alternative

```jsx
import { ScrollControls, useScroll } from '@react-three/drei'

function App() {
  return (
    <Canvas>
      <ScrollControls pages={5} damping={0.1}>
        <Scene />
      </ScrollControls>
    </Canvas>
  )
}

function Scene() {
  const scroll = useScroll()

  useFrame(() => {
    const offset = scroll.offset // 0 to 1 (total progress)
    const range = scroll.range(0.2, 0.2) // Section-specific 0-1
    const curve = scroll.curve(0.2, 0.2) // 0-1-0 bell curve

    uniforms.uScroll.value = offset
  })
}
```

**When to use each:**
- **GSAP ScrollTrigger**: HTML-driven triggers, complex timelines, existing GSAP skills
- **drei ScrollControls**: Pure R3F, simpler setup, no HTML sync needed

---

## 6. useFrame Patterns

### The Callback Signature

```javascript
useFrame((state, delta, xrFrame) => {
  // state: Full R3F context
  // delta: Time since last frame (seconds)
  // xrFrame: For WebXR
})
```

### Accessing State

```javascript
useFrame((state) => {
  const {
    gl,           // WebGLRenderer
    scene,        // THREE.Scene
    camera,       // Active camera
    pointer,      // Normalized mouse (-1 to 1)
    clock,        // THREE.Clock
    viewport,     // { width, height, factor }
    size,         // Canvas pixel dimensions
  } = state

  // Elapsed time for continuous animations
  const elapsed = state.clock.getElapsedTime()

  // Frame-rate independent movement
  // delta is ~0.016 at 60fps
})
```

### Priority System

```javascript
// Higher priority runs first
useFrame(() => { /* Camera logic */ }, 2)
useFrame(() => { /* Physics */ }, 1)
useFrame(() => { /* Particles (default) */ }, 0)
useFrame(() => { /* Post-processing */ }, -1)
```

### Delta vs Elapsed Time

```javascript
// Delta: For velocity/physics (frame-rate independent)
useFrame((state, delta) => {
  position.x += velocity * delta
})

// Elapsed: For continuous functions
useFrame((state) => {
  const t = state.clock.getElapsedTime()
  position.y = Math.sin(t * 2) * amplitude
})

// Hybrid (common for particles)
useFrame((state) => {
  uniforms.uTime.value = state.clock.getElapsedTime() // Waves
  uniforms.uVelocity.value += delta * acceleration    // Physics
})
```

### Smooth Interpolation

```javascript
// Lerp for smooth following
useFrame((state) => {
  const target = state.pointer
  uniforms.uMouse.value.lerp(target, 0.1) // 0.1 = damping factor
})

// THREE.MathUtils.lerp for numbers
useFrame(() => {
  uniforms.uRadius.value = THREE.MathUtils.lerp(
    uniforms.uRadius.value,
    targetRadius,
    0.05
  )
})
```

---

## 7. Mouse & Interaction Effects

### Basic Mouse Tracking

```javascript
useFrame((state) => {
  // pointer is normalized -1 to 1
  uniforms.uMouse.value.lerp(state.pointer, 0.1)
  uniforms.uViewport.value.set(
    state.viewport.width,
    state.viewport.height
  )
})
```

### Shader Mouse Repulsion

```glsl
uniform vec2 uMouse;
uniform vec2 uViewport;

void main() {
  vec3 pos = position;

  // Convert mouse to world space
  vec2 mouseWorld = uMouse * uViewport * 0.5;

  // Calculate distance and influence
  float dist = distance(pos.xy, mouseWorld);
  float influence = smoothstep(8.0, 0.0, dist); // Falloff at 8 units

  // Repel particles
  vec3 dir = normalize(pos - vec3(mouseWorld, 0.0));
  pos += dir * influence * 1.5;

  // ... rest of shader
}
```

### Click Burst Effect

```javascript
const explosionCenter = useRef(new THREE.Vector2())
const explosionStrength = useRef({ value: 0 })

useEffect(() => {
  const handleClick = (e) => {
    // Normalize click position
    explosionCenter.current.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    )

    // Animate explosion
    gsap.fromTo(explosionStrength,
      { current: { value: 5 } },
      { current: { value: 0 }, duration: 1.5, ease: 'power3.out' }
    )
  }

  window.addEventListener('click', handleClick)
  return () => window.removeEventListener('click', handleClick)
}, [])

useFrame(() => {
  uniforms.uExplosionCenter.value.copy(explosionCenter.current)
  uniforms.uExplosionStrength.value = explosionStrength.current.value
})
```

### Shader Explosion

```glsl
uniform vec2 uExplosionCenter;
uniform float uExplosionStrength;

void main() {
  vec3 pos = position;

  // Calculate explosion force
  float distToExplosion = distance(pos.xy, uExplosionCenter);
  float explosionInfluence = smoothstep(5.0, 0.0, distToExplosion);
  vec2 explosionDir = normalize(pos.xy - uExplosionCenter);

  pos.xy += explosionDir * explosionInfluence * uExplosionStrength;

  // ... rest of shader
}
```

---

## 8. State Machine Pattern

### Discrete State Definitions

```javascript
const particleStates = {
  hero: {
    tightness: 2.5,
    radius: 3.5,
    speed: 0.5,
    opacity: 0.9,
    color: new THREE.Color(0x4488ff)
  },
  problem: {
    tightness: 3.5,
    radius: 3.0,
    speed: 0.35,
    opacity: 0.75,
    color: new THREE.Color(0xff6644)
  },
  team: {
    tightness: 4.0,
    radius: 2.8,
    speed: 0.4,
    opacity: 0.95,
    color: new THREE.Color(0x88ff44)
  },
  philosophy: {
    tightness: 2.0,
    radius: 4.5,
    speed: 0.6,
    opacity: 0.85,
    color: new THREE.Color(0xaa88ff)
  }
}
```

### State Transition Function

```javascript
useImperativeHandle(ref, () => ({
  transitionToState: (stateName, options = {}) => {
    const state = particleStates[stateName]
    if (!state) return

    const { duration = 2, ease = 'power2.out' } = options

    // Parallel GSAP tweens
    gsap.to(uniforms.uHelixTightness, {
      value: state.tightness,
      duration,
      ease
    })
    gsap.to(uniforms.uHelixRadius, {
      value: state.radius,
      duration,
      ease
    })
    gsap.to(uniforms.uFlowSpeed, {
      value: state.speed,
      duration,
      ease
    })
    gsap.to(uniforms.uParticleOpacity, {
      value: state.opacity,
      duration,
      ease
    })
  }
}))
```

### Imperative Handle Chain

```
App.jsx (experienceRef)
  ↓ transitionToState()
Experience.jsx (sceneRef)
  ↓ transitionToState()
EtherealParticles.jsx
  ↓ GSAP animates uniforms
```

```jsx
// App.jsx
const experienceRef = useRef()

const handleSectionChange = useCallback((sectionId) => {
  experienceRef.current?.transitionToState(sectionId)
}, [])

return (
  <>
    <Experience ref={experienceRef} />
    <ContentSections onSectionChange={handleSectionChange} />
  </>
)
```

### Continuous Interpolation Alternative

```javascript
// For smooth blend between any scroll position
const stateTimeline = [
  { position: 0.0, tightness: 2.5, radius: 3.5 },
  { position: 0.25, tightness: 3.5, radius: 3.0 },
  { position: 0.5, tightness: 4.0, radius: 2.8 },
  { position: 0.75, tightness: 2.0, radius: 4.5 },
  { position: 1.0, tightness: 2.5, radius: 3.5 }
]

useFrame(() => {
  const scrollProgress = scroll.offset

  // Find neighboring states
  let prev = stateTimeline[0]
  let next = stateTimeline[1]

  for (let i = 0; i < stateTimeline.length - 1; i++) {
    if (scrollProgress >= stateTimeline[i].position) {
      prev = stateTimeline[i]
      next = stateTimeline[i + 1]
    }
  }

  // Local progress between states
  const range = next.position - prev.position
  const localProgress = (scrollProgress - prev.position) / range

  // Interpolate
  uniforms.uTightness.value = THREE.MathUtils.lerp(
    prev.tightness, next.tightness, localProgress
  )
})
```

---

## 9. drei Helper Components

### shaderMaterial Helper

```jsx
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const ParticleMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uScroll: 0,
    uMouse: new THREE.Vector2(),
    uTightness: 2.5,
    uRadius: 3.5
  },
  // Vertex shader
  vertexShader,
  // Fragment shader
  fragmentShader
)

extend({ ParticleMaterial })

// Usage - cleaner uniform access
function Particles() {
  const materialRef = useRef()

  useFrame(({ clock }) => {
    materialRef.current.uTime = clock.elapsedTime // Direct access!
  })

  return (
    <points>
      <bufferGeometry />
      <particleMaterial ref={materialRef} transparent />
    </points>
  )
}
```

### Points and PointMaterial

```jsx
import { Points, PointMaterial } from '@react-three/drei'

function SimpleParticles() {
  const positions = useMemo(() => {
    const pos = new Float32Array(1000 * 3)
    for (let i = 0; i < 1000; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    return pos
  }, [])

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}
```

### Instances for 3D Mesh Particles

```jsx
import { Instances, Instance } from '@react-three/drei'

function InstancedParticles({ count = 1000 }) {
  return (
    <Instances limit={count}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial />

      {Array.from({ length: count }, (_, i) => (
        <Instance
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
          ]}
        />
      ))}
    </Instances>
  )
}
```

### useGLTF for Model Loading

```jsx
import { useGLTF } from '@react-three/drei'

function ModelParticles() {
  const { nodes } = useGLTF('/models/shape.glb')

  const positions = useMemo(() => {
    const geometry = nodes.Mesh.geometry
    return geometry.attributes.position.array
  }, [nodes])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} />
    </points>
  )
}

useGLTF.preload('/models/shape.glb')
```

### PerformanceMonitor for Adaptive Quality

```jsx
import { PerformanceMonitor } from '@react-three/drei'

function AdaptiveParticles() {
  const [particleCount, setParticleCount] = useState(10000)

  return (
    <PerformanceMonitor
      onIncline={() => setParticleCount(c => Math.min(c + 2000, 20000))}
      onDecline={() => setParticleCount(c => Math.max(c - 2000, 2000))}
    >
      <ParticleSystem count={particleCount} />
    </PerformanceMonitor>
  )
}
```

---

## 10. three.quarks Particle System

### When to Use three.quarks

| Use three.quarks | Use Custom Shaders |
|------------------|-------------------|
| Fire, smoke, sparks | Helix, DNA strands |
| Quick prototyping | Mathematical patterns |
| Multiple systems | Single complex system |
| Behavior-based animation | Shader-driven effects |
| Standard effects | Precise control needed |

### Basic Setup

```jsx
import {
  BatchedParticleRenderer,
  ParticleSystem,
  SphereEmitter,
  ConstantValue,
  ColorRange,
  SizeOverLife,
  PiecewiseBezier
} from 'three.quarks'

function QuarksParticles() {
  const batchRef = useRef()
  const systemRef = useRef()

  useEffect(() => {
    const system = new ParticleSystem({
      duration: Infinity,
      looping: true,
      startLife: new ConstantValue(3),
      startSpeed: new ConstantValue(2),
      startSize: new ConstantValue(0.5),
      startColor: new ColorRange(
        new THREE.Vector4(1, 0.5, 0, 1),
        new THREE.Vector4(1, 1, 0, 1)
      ),
      maxParticle: 10000,
      emissionOverTime: new ConstantValue(100),
      shape: new SphereEmitter({ radius: 3 }),
      material: new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        transparent: true
      })
    })

    // Add behaviors
    system.addBehavior(new SizeOverLife(
      new PiecewiseBezier([[new Bezier(1, 0.95, 0.5, 0), 0]])
    ))

    batchRef.current.addSystem(system)
    systemRef.current = system

    return () => batchRef.current.deleteSystem(system)
  }, [])

  useFrame((_, delta) => {
    batchRef.current?.update(delta)
  })

  return <primitive object={new BatchedParticleRenderer()} ref={batchRef} />
}
```

### Hybrid Approach: three.quarks + Custom Shaders

```javascript
// Use three.quarks for emission/lifecycle
// Use custom material for rendering
const system = new ParticleSystem({
  // ... config
  material: new THREE.ShaderMaterial({
    vertexShader: customVertexShader,
    fragmentShader: customFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 }
    }
  })
})

useFrame(({ clock }) => {
  system.material.uniforms.uTime.value = clock.elapsedTime
})
```

---

## 11. Performance Optimization

### Memory Management

```javascript
// ✅ Pre-allocate outside component
const tempVector = new THREE.Vector3()

function Particles() {
  useFrame(() => {
    tempVector.set(1, 2, 3) // Reuse
    mesh.current.position.copy(tempVector)
  })
}
```

### Avoid Allocations in useFrame

```javascript
// ❌ Bad: Creates garbage every frame
useFrame(() => {
  const vec = new THREE.Vector3(1, 2, 3)
  const arr = [1, 2, 3]
})

// ✅ Good: Reuse objects
const vec = useMemo(() => new THREE.Vector3(), [])
const arr = useMemo(() => new Float32Array(3), [])

useFrame(() => {
  vec.set(1, 2, 3)
  arr[0] = 1; arr[1] = 2; arr[2] = 3
})
```

### Frame Skipping

```javascript
const frameCounter = useRef(0)

useFrame(() => {
  frameCounter.current++

  // Heavy operation every 3 frames
  if (frameCounter.current % 3 === 0) {
    expensiveCalculation()
  }
})
```

### LOD (Level of Detail)

```javascript
const lods = [
  { distance: 0, particles: 15000 },
  { distance: 50, particles: 7500 },
  { distance: 100, particles: 3000 }
]

useFrame(({ camera }) => {
  const dist = camera.position.length()

  const lod = lods.find((l, i) =>
    dist >= l.distance &&
    (!lods[i+1] || dist < lods[i+1].distance)
  )

  setParticleCount(lod.particles)
})
```

### Cleanup

```javascript
useEffect(() => {
  return () => {
    // Dispose geometry
    mesh.current?.geometry.dispose()

    // Dispose material
    mesh.current?.material.dispose()

    // Kill GSAP
    ScrollTrigger.getAll().forEach(t => t.kill())
  }
}, [])
```

---

## 12. Complete Implementation Patterns

### Architecture Overview

```
src/
├── components/
│   ├── Canvas/
│   │   ├── Experience.jsx       # Canvas + Camera wrapper
│   │   ├── EtherealParticles.jsx # Main particle system
│   │   └── Scene.jsx            # Scene composition
│   └── UI/
│       └── ContentSections.jsx   # Scroll trigger zones
├── shaders/
│   ├── particle.vert            # Vertex shader
│   └── particle.frag            # Fragment shader
└── App.jsx                      # Root + Lenis wrapper
```

### Fixed Overlay Pattern

```jsx
// Canvas: Fixed background, z-index 1
<div style={{ position: 'fixed', inset: 0, zIndex: 1 }}>
  <Canvas>
    <Experience ref={experienceRef} />
  </Canvas>
</div>

// Content: Fixed overlays, z-index 10
<ContentSections onSectionChange={handleSectionChange} />

// Scroll drivers: In document flow
<div style={{ position: 'relative' }}>
  {sections.map(s => (
    <div key={s.id} id={`trigger-${s.id}`} style={{ height: '100vh' }} />
  ))}
</div>
```

### Complete Particle Component

```jsx
const EtherealParticles = forwardRef((props, ref) => {
  const mesh = useRef()
  const { viewport } = useThree()

  // Particle states
  const particleStates = {
    hero: { tightness: 2.5, radius: 3.5, speed: 0.5, opacity: 0.9 },
    // ... more states
  }

  // Geometry setup
  const { positions, randoms, progress } = useMemo(() => {
    const count = 15000
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    const progress = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0
      randoms[i] = Math.random()
      progress[i] = i / count
    }

    return { positions, randoms, progress, count }
  }, [])

  // Uniforms
  const uniforms = useRef({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uViewport: { value: new THREE.Vector2(viewport.width, viewport.height) },
    uHelixTightness: { value: particleStates.hero.tightness },
    uHelixRadius: { value: particleStates.hero.radius },
    uFlowSpeed: { value: particleStates.hero.speed },
    uParticleOpacity: { value: particleStates.hero.opacity }
  }).current

  // Animation loop
  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime()
    uniforms.uMouse.value.lerp(state.pointer, 0.1)
    uniforms.uViewport.value.set(state.viewport.width, state.viewport.height)
  })

  // Scroll integration
  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1
      }
    })

    tl.to(uniforms.uScroll, { value: 1, ease: "none" })

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill()
      tl.kill()
    }
  }, [])

  // Imperative API
  useImperativeHandle(ref, () => ({
    transitionToState: (stateName) => {
      const state = particleStates[stateName]
      if (!state) return

      gsap.to(uniforms.uHelixTightness, { value: state.tightness, duration: 2, ease: "power2.out" })
      gsap.to(uniforms.uHelixRadius, { value: state.radius, duration: 2, ease: "power2.out" })
      gsap.to(uniforms.uFlowSpeed, { value: state.speed, duration: 2, ease: "power2.out" })
      gsap.to(uniforms.uParticleOpacity, { value: state.opacity, duration: 2, ease: "power2.out" })
    }
  }))

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aProgress" count={count} array={progress} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})
```

---

## Quick Reference

### Common Easing Functions (GLSL)

```glsl
float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

float easeOutExpo(float t) {
  return t == 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t);
}

float easeOutElastic(float t) {
  float c4 = (2.0 * PI) / 3.0;
  return t == 0.0 ? 0.0 : t == 1.0 ? 1.0
    : pow(2.0, -10.0 * t) * sin((t * 10.0 - 0.75) * c4) + 1.0;
}
```

### Common Noise Pattern

```glsl
vec3 getNoiseDisplacement(vec3 pos, float time) {
  float n1 = snoise(pos * 0.5 + time * 0.2);
  float n2 = snoise(pos * 1.0 + time * 0.3);
  return vec3(n1, n2, n1 + n2) * 0.3;
}
```

### Particle Size with Depth

```glsl
vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
gl_PointSize = baseSize * (1.0 / -mvPosition.z);
```

### Soft Circle Fragment

```glsl
float dist = length(gl_PointCoord - vec2(0.5));
float strength = 1.0 - smoothstep(0.0, 0.5, dist);
strength = pow(strength, 2.5);
```

---

## Checklist: Building a New Particle Experience

- [ ] Define particle states (one per scroll section)
- [ ] Create BufferGeometry with custom attributes
- [ ] Write vertex shader (position, animation, mouse)
- [ ] Write fragment shader (color, alpha, shape)
- [ ] Set up uniforms with useRef
- [ ] Implement useFrame for continuous updates
- [ ] Add GSAP ScrollTrigger for scroll sync
- [ ] Create imperative handle for state transitions
- [ ] Wire up ContentSections to trigger transitions
- [ ] Add mouse interaction (repulsion/attraction)
- [ ] Test performance with PerformanceMonitor
- [ ] Clean up GSAP on unmount

---

*Last updated: Generated from comprehensive research on R3F, drei, three.quarks, GSAP, and shader techniques.*
