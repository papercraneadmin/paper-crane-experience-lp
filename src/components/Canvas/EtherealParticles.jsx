import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Particle state definitions
const particleStates = {
    hero: { tightness: 2.5, radius: 3.5, speed: 0.5, opacity: 0.9 },
    problem: { tightness: 3.5, radius: 3.0, speed: 0.35, opacity: 0.75 },  // Tighter, slower, more subdued
    team: { tightness: 4.0, radius: 2.8, speed: 0.4, opacity: 0.95 },
    philosophy: { tightness: 2.0, radius: 4.5, speed: 0.6, opacity: 0.85 }, // Open, flowing, contemplative
    services: { tightness: 2.0, radius: 5.0, speed: 0.8, opacity: 1.0 },
    process: { tightness: 3.0, radius: 3.8, speed: 0.5, opacity: 0.9 },    // Balanced, methodical
    quote: { tightness: 1.5, radius: 4.0, speed: 0.3, opacity: 0.7 },
    cta: { tightness: 2.5, radius: 3.5, speed: 0.5, opacity: 0.9 }
}

const vertexShader = `
attribute float aRandom;
attribute float aStrand;
attribute float aProgress; // 0 to 1 along the strand
varying vec3 vColor;
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform vec2 uViewport;
uniform float uRotation;

// State uniforms for transitions
uniform float uHelixTightness;
uniform float uHelixRadius;
uniform float uFlowSpeed;
uniform float uParticleOpacity;

#define PI 3.14159265359

void main() {
  // Helical path parameters
  float strandCount = 5.0;
  float helixRadius = uHelixRadius + aStrand * 0.5; // Vary radius per strand
  float helixTightness = uHelixTightness; // Number of full rotations
  float verticalRange = 20.0;
  
  // Base position along helix
  float y = (aProgress - 0.5) * verticalRange;
  float angle = aProgress * helixTightness * 2.0 * PI + (aStrand / strandCount) * 2.0 * PI;
  
  // Apply global rotation - much slower
  angle += uRotation + uTime * 0.03;
  
  float x = helixRadius * cos(angle);
  float z = helixRadius * sin(angle);
  
  // Add some thickness to the ribbon (perpendicular to the strand)
  // Modulate thickness along the strand for skinny/wide variance
  float thicknessModulation = sin(aProgress * 8.0 + uTime * 0.3) * 0.5 + 1.0; // 0.5 to 1.5
  float thickness = (aRandom - 0.5) * 0.3 * thicknessModulation;
  x += cos(angle + PI * 0.5) * thickness;
  z += sin(angle + PI * 0.5) * thickness;
  
  vec3 pos = vec3(x, y, z);
  
  // Add twist rotation along the strand for more dynamic movement
  float twist = aProgress * 4.0 + uTime * 0.2;
  float twistRadius = 0.2 * thicknessModulation; // Twist varies with width
  float twistX = cos(twist) * twistRadius * aRandom;
  float twistZ = sin(twist) * twistRadius * aRandom;
  
  // Apply twist perpendicular to the helix direction
  vec3 twistDir = normalize(vec3(-sin(angle), 0.0, cos(angle)));
  pos += twistDir * (twistX + twistZ);
  
  // Flow animation along the strand
  // Create "streams within streams" using velocity layers - INCREASED VARIANCE
  float velocityLayer = aRandom; // Each particle has its own speed
  float wave1 = sin(aProgress * 3.0 - uTime * uFlowSpeed * (0.2 + velocityLayer * 0.8)) * 0.4;
  float wave2 = sin(aProgress * 5.0 - uTime * uFlowSpeed * (0.4 + velocityLayer * 0.6)) * 0.2;
  float combinedWave = wave1 + wave2;
  
  pos += vec3(cos(angle), 0.0, sin(angle)) * combinedWave;
  
  // Radial pulsing for more organic undulation
  float radialPulse = sin(aProgress * 2.0 + uTime * 0.4) * 0.3;
  pos.x += cos(angle) * radialPulse;
  pos.z += sin(angle) * radialPulse;
  
  // Scroll influence - compress/twist the helix (slower)
  pos.y += sin(aProgress * 3.0 + uTime * 0.3) * uScroll * 2.0;
  float scrollTwist = uScroll * aProgress * PI;
  float newX = pos.x * cos(scrollTwist) - pos.z * sin(scrollTwist);
  float newZ = pos.x * sin(scrollTwist) + pos.z * cos(scrollTwist);
  pos.x = newX;
  pos.z = newZ;
  
  // Mouse interaction - repel (toned down)
  vec2 mouseWorld = uMouse * uViewport * 0.5;
  float dist = distance(pos.xy, mouseWorld);
  float influence = smoothstep(8.0, 0.0, dist); // Increased from 5.0 for wider, gentler falloff
  vec3 dir = normalize(pos - vec3(mouseWorld, 0.0));
  pos += dir * influence * 1.0; // Reduced from 2.5 for subtler effect

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  // Larger particles
  gl_PointSize = (10.0 * aRandom + 5.0) * (1.0 / -mvPosition.z);
  
  // Color with slight variation along strand
  float brightness = (0.8 + aProgress * 0.2) * uParticleOpacity;
  vColor = vec3(brightness);
}
`

const fragmentShader = `
varying vec3 vColor;

void main() {
  // Circular particle
  float strength = distance(gl_PointCoord, vec2(0.5));
  strength = 1.0 - strength;
  strength = pow(strength, 2.0);
  
  gl_FragColor = vec4(vColor, strength * 0.9);
}
`

const EtherealParticles = forwardRef((props, ref) => {
    const mesh = useRef()
    const { viewport } = useThree()

    const strandCount = 5
    const particlesPerStrand = 3000
    const count = strandCount * particlesPerStrand

    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const randoms = new Float32Array(count)
        const strands = new Float32Array(count)
        const progress = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            const strandId = Math.floor(i / particlesPerStrand)
            const particleId = i % particlesPerStrand

            // Initial positions (will be recalculated in shader)
            positions[i * 3] = 0
            positions[i * 3 + 1] = 0
            positions[i * 3 + 2] = 0

            randoms[i] = Math.random()
            strands[i] = strandId
            progress[i] = particleId / particlesPerStrand
        }

        return { positions, randoms, strands, progress }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const uniforms = useRef({
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uViewport: { value: new THREE.Vector2(viewport.width, viewport.height) },
        uRotation: { value: 0 },
        // State uniforms - initialize with hero state
        uHelixTightness: { value: particleStates.hero.tightness },
        uHelixRadius: { value: particleStates.hero.radius },
        uFlowSpeed: { value: particleStates.hero.speed },
        uParticleOpacity: { value: particleStates.hero.opacity }
    }).current

    useFrame((state) => {
        const { clock, pointer } = state
        mesh.current.material.uniforms.uTime.value = clock.getElapsedTime()

        // Smooth mouse lerp
        mesh.current.material.uniforms.uMouse.value.lerp(pointer, 0.1)

        // Update viewport
        mesh.current.material.uniforms.uViewport.value.set(state.viewport.width, state.viewport.height)

        // Very slow global rotation for smooth organic movement
        mesh.current.material.uniforms.uRotation.value = clock.getElapsedTime() * 0.02
    })

    useEffect(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            }
        })

        tl.to(uniforms.uScroll, {
            value: 1,
            ease: "none"
        })

        return () => {
            if (tl.scrollTrigger) tl.scrollTrigger.kill();
            tl.kill();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Expose transition method via ref
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
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aRandom"
                    count={count}
                    array={particles.randoms}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aStrand"
                    count={count}
                    array={particles.strands}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aProgress"
                    count={count}
                    array={particles.progress}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    )
})

EtherealParticles.displayName = 'EtherealParticles'

export default EtherealParticles
