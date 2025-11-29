import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const vertexShader = `
varying vec2 vUv;
varying float vElevation;
uniform float uTime;
uniform float uScroll;

void main() {
  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  
  // Base undulation
  float elevation = sin(modelPosition.x * 2.0 + uTime) * 0.2;
  elevation += sin(modelPosition.y * 1.5 + uTime * 0.5) * 0.2;
  
  // Scroll influence - more chaotic/intense as you scroll
  float scrollInfluence = sin(modelPosition.x * 5.0 + uTime * 2.0) * uScroll * 0.5;
  elevation += scrollInfluence;
  
  modelPosition.z += elevation;
  
  // Rotate/Twist based on scroll
  float angle = uScroll * 3.14;
  float s = sin(angle);
  float c = cos(angle);
  
  modelPosition.y += sin(uTime * 0.2) * 0.5; // Float up and down

  vElevation = elevation;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;
}
`

const fragmentShader = `
varying vec2 vUv;
varying float vElevation;

void main() {
  float alpha = 0.8 + vElevation * 0.5;
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
}
`

export default function EtherealPaper() {
    const mesh = useRef()

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uScroll: { value: 0 },
        }),
        []
    )

    useFrame((state) => {
        const { clock } = state
        mesh.current.material.uniforms.uTime.value = clock.getElapsedTime()
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
            if (tl.scrollTrigger) tl.scrollTrigger.kill()
            tl.kill()
        }
    }, [uniforms])

    return (
        <mesh ref={mesh} position={[0, 0, 0]} rotation={[-Math.PI / 4, 0, 0]}>
            <planeGeometry args={[6, 6, 128, 128]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
                side={THREE.DoubleSide}
                wireframe={false}
            />
        </mesh>
    )
}
