import React, { useEffect, useRef, forwardRef, useImperativeHandle, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import EtherealParticles from './EtherealParticles'
import CraneParticles from './CraneParticles'

gsap.registerPlugin(ScrollTrigger)

function CameraController() {
    const { camera } = useThree()

    useEffect(() => {
        gsap.to(camera.position, {
            scrollTrigger: {
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            },
            z: 3,
            x: 1.5,
            y: 2,
            ease: "none"
        })

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill())
        }
    }, [camera])

    return null
}

// Scene component that holds particles and exposes control
const Scene = forwardRef((props, ref) => {
    const particlesRef = useRef(null)
    const craneRef = useRef(null)

    useImperativeHandle(ref, () => ({
        transitionToState: (stateName) => {
            if (particlesRef.current) {
                particlesRef.current.transitionToState(stateName)
            }
            if (craneRef.current) {
                craneRef.current.transitionToState(stateName)
            }
        }
    }))

    return (
        <>
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <EtherealParticles ref={particlesRef} />

            <Suspense fallback={null}>
                <CraneParticles ref={craneRef} />
            </Suspense>

            <CameraController />
        </>
    )
})

Scene.displayName = 'Scene'

const Experience = forwardRef((props, ref) => {
    const sceneRef = useRef()

    useImperativeHandle(ref, () => ({
        transitionToState: (stateName) => {
            if (sceneRef.current) {
                sceneRef.current.transitionToState(stateName)
            }
        }
    }))

    return (
        <Canvas
            camera={{ position: [0, 0, 5], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
        >
            <Scene ref={sceneRef} />
        </Canvas>
    )
})

Experience.displayName = 'Experience'

export default Experience
