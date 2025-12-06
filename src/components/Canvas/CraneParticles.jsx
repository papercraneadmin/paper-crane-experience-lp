import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

// Crane state definitions for each section
// hero & cta have low dispersion to show crane shape, middle sections are clouds
// scale = crane shape size, particleSize handled separately in shader
const craneStates = {
    hero: { visible: true, animationSpeed: 0.6, scale: 40.8, opacity: 0.85, dispersion: 0.05, noiseIntensity: 0.02, position: [0, 0.2, -2], rotation: [0.3, -0.5, 0.2] },
    problem: { visible: true, animationSpeed: 0.7, scale: 29.4, opacity: 0.55, dispersion: 0.4, noiseIntensity: 0.1, position: [-0.5, 0, -2.5], rotation: [0.2, -0.3, 0.1] },
    team: { visible: true, animationSpeed: 1.0, scale: 32.6, opacity: 0.7, dispersion: 0.3, noiseIntensity: 0.08, position: [0, 0.2, -2], rotation: [0.25, -0.4, 0.15] },
    philosophy: { visible: true, animationSpeed: 0.5, scale: 35.9, opacity: 0.6, dispersion: 0.55, noiseIntensity: 0.18, position: [0.3, 0.5, -2.5], rotation: [0.35, -0.6, 0.25] },
    services: { visible: true, animationSpeed: 0.6, scale: 29.4, opacity: 0.5, dispersion: 0.45, noiseIntensity: 0.14, position: [0, 0.2, -2.5], rotation: [0.2, -0.4, 0.1] },
    process: { visible: true, animationSpeed: 0.8, scale: 29.4, opacity: 0.6, dispersion: 0.35, noiseIntensity: 0.1, position: [0.5, 0.3, -2], rotation: [0.25, -0.35, 0.15] },
    quote: { visible: true, animationSpeed: 0.4, scale: 32.6, opacity: 0.5, dispersion: 0.65, noiseIntensity: 0.22, position: [0, 0.6, -3], rotation: [0.3, -0.5, 0.2] },
    cta: { visible: true, animationSpeed: 0.8, scale: 45.7, opacity: 0.9, dispersion: 0.05, noiseIntensity: 0.02, position: [0, 0.1, -1.5], rotation: [0.3, -0.5, 0.2] }
}

// Number of keyframes to sample from the animation
const KEYFRAME_COUNT = 30
// Maximum particles to use (performance consideration)
const MAX_PARTICLES = 45630

const vertexShader = `
attribute vec3 aPosition0;
attribute vec3 aPosition1;
attribute vec3 aNormal;
attribute float aRandom;

uniform float uTime;
uniform float uAnimationProgress;
uniform float uScale;
uniform float uOpacity;
uniform float uDispersion;
uniform float uNoiseIntensity;
uniform float uRevealProgress;
uniform vec2 uMouse;
uniform vec2 uViewport;
uniform vec3 uTargetPosition;
uniform vec3 uRotation;

varying float vOpacity;
varying float vRandom;

#define PI 3.14159265359

// Rotation matrices
mat3 rotateX(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

mat3 rotateY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

mat3 rotateZ(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

// Simplex noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Easing function for smooth interpolation
float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
}

void main() {
    // Interpolate between keyframe positions
    float easedProgress = easeInOutCubic(uAnimationProgress);
    vec3 animatedPos = mix(aPosition0, aPosition1, easedProgress);

    // Apply rotation (facing up-left)
    mat3 rotation = rotateZ(uRotation.z) * rotateY(uRotation.y) * rotateX(uRotation.x);
    vec3 rotatedPos = rotation * animatedPos;

    // Scale the position
    vec3 pos = rotatedPos * uScale;

    // Apply dispersion along normals
    vec3 normal = normalize(aNormal);
    float dispersionAmount = uDispersion * (0.5 + aRandom * 0.5);
    pos += normal * dispersionAmount * 2.0;

    // Add noise displacement
    float noiseTime = uTime * 0.5;
    vec3 noisePos = pos * 3.0 + vec3(noiseTime);
    float noiseX = snoise(noisePos) * uNoiseIntensity;
    float noiseY = snoise(noisePos + vec3(100.0)) * uNoiseIntensity;
    float noiseZ = snoise(noisePos + vec3(200.0)) * uNoiseIntensity;
    pos += vec3(noiseX, noiseY, noiseZ);

    // Initial reveal effect - particles start dispersed and converge
    float revealDispersion = (1.0 - uRevealProgress) * 3.0;
    vec3 scatterDir = normalize(vec3(
        snoise(vec3(aRandom * 10.0, 0.0, 0.0)),
        snoise(vec3(0.0, aRandom * 10.0, 0.0)),
        snoise(vec3(0.0, 0.0, aRandom * 10.0))
    ));
    pos += scatterDir * revealDispersion * (0.5 + aRandom);

    // Add target position offset
    pos += uTargetPosition;

    // Mouse repulsion
    vec2 mouseWorld = uMouse * uViewport * 0.5;
    float dist = distance(pos.xy, mouseWorld);
    float influence = smoothstep(4.0, 0.0, dist);
    vec3 dir = normalize(pos - vec3(mouseWorld, pos.z));
    pos += dir * influence * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size with depth attenuation (independent of crane scale)
    float size = 18.0 + aRandom * 12.0;
    gl_PointSize = size * (1.0 / -mvPosition.z);

    // Glittering effect - individual particles fluctuate in opacity
    float glitterPhase = aRandom * 6.28318; // Random phase offset per particle
    float glitterSpeed = 2.0 + aRandom * 3.0; // Varying speeds
    float glitter = 0.5 + 0.5 * sin(uTime * glitterSpeed + glitterPhase);
    float glitterAmount = 0.3; // How much the opacity varies (0-1)
    float glitterOpacity = mix(1.0, glitter, glitterAmount);

    // Pass opacity to fragment shader
    vOpacity = uOpacity * uRevealProgress * glitterOpacity;
    vRandom = aRandom;
}
`

const fragmentShader = `
varying float vOpacity;
varying float vRandom;

void main() {
    // Soft circular gradient
    float dist = length(gl_PointCoord - vec2(0.5));
    float strength = 1.0 - smoothstep(0.0, 0.5, dist);

    // Discard transparent pixels for performance
    if (strength < 0.01) discard;

    // Slight color variation based on random
    vec3 color = vec3(0.9 + vRandom * 0.1);

    gl_FragColor = vec4(color, strength * vOpacity);
}
`

// Helper to sample skinned mesh at a specific animation time
function sampleSkinnedMesh(skinnedMesh, skeleton, clip, time, targetPositions, targetNormals) {
    const mixer = new THREE.AnimationMixer(skinnedMesh)
    const action = mixer.clipAction(clip)
    action.play()
    mixer.setTime(time)

    // Update skeleton
    skeleton.update()

    // Get the baked positions
    const geometry = skinnedMesh.geometry
    const positionAttr = geometry.attributes.position
    const normalAttr = geometry.attributes.normal
    const skinIndexAttr = geometry.attributes.skinIndex
    const skinWeightAttr = geometry.attributes.skinWeight

    const vertex = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const skinned = new THREE.Vector3()
    const skinnedNormal = new THREE.Vector3()
    const boneMatrix = new THREE.Matrix4()
    const normalMatrix = new THREE.Matrix3()

    const boneMatrices = skeleton.boneMatrices

    for (let i = 0; i < positionAttr.count; i++) {
        vertex.fromBufferAttribute(positionAttr, i)
        normal.fromBufferAttribute(normalAttr, i)

        skinned.set(0, 0, 0)
        skinnedNormal.set(0, 0, 0)

        // Apply bone transformations
        for (let j = 0; j < 4; j++) {
            const boneIndex = skinIndexAttr.getComponent(i, j)
            const weight = skinWeightAttr.getComponent(i, j)

            if (weight > 0) {
                boneMatrix.fromArray(boneMatrices, boneIndex * 16)

                // Position
                const temp = vertex.clone()
                temp.applyMatrix4(boneMatrix)
                temp.multiplyScalar(weight)
                skinned.add(temp)

                // Normal
                normalMatrix.setFromMatrix4(boneMatrix)
                const tempNormal = normal.clone()
                tempNormal.applyMatrix3(normalMatrix)
                tempNormal.multiplyScalar(weight)
                skinnedNormal.add(tempNormal)
            }
        }

        // Apply mesh world transform
        skinned.applyMatrix4(skinnedMesh.matrixWorld)

        targetPositions[i * 3] = skinned.x
        targetPositions[i * 3 + 1] = skinned.y
        targetPositions[i * 3 + 2] = skinned.z

        skinnedNormal.normalize()
        targetNormals[i * 3] = skinnedNormal.x
        targetNormals[i * 3 + 1] = skinnedNormal.y
        targetNormals[i * 3 + 2] = skinnedNormal.z
    }

    mixer.stopAllAction()
}

// Simple seeded random for deterministic particle values
function seededRandom(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

const CraneParticles = forwardRef((props, ref) => {
    const meshRef = useRef(null)
    const { viewport } = useThree()

    // Load the GLB model
    const gltf = useLoader(GLTFLoader, '/models/crane-flying/gisheregrus_nigricollis.glb')

    // Pre-allocate vectors for useFrame (no allocations during render)
    const targetPosVec = useMemo(() => new THREE.Vector3(), [])

    // Process the model and sample keyframes
    const { particleData, keyframePositions } = useMemo(() => {
        const scene = gltf.scene.clone()
        scene.updateMatrixWorld(true)

        // Find the skinned mesh
        let skinnedMesh = null
        let skeleton = null

        scene.traverse((child) => {
            if (child.isSkinnedMesh && !skinnedMesh) {
                skinnedMesh = child
                skeleton = child.skeleton
            }
        })

        if (!skinnedMesh || !skeleton) {
            console.warn('No skinned mesh found in crane model')
            return { particleData: null, keyframePositions: [] }
        }

        // Get animation clip
        const clip = gltf.animations[0]
        if (!clip) {
            console.warn('No animation found in crane model')
            return { particleData: null, keyframePositions: [] }
        }

        const geometry = skinnedMesh.geometry
        const vertexCount = geometry.attributes.position.count

        // Limit particle count for performance
        const particleCount = Math.min(vertexCount, MAX_PARTICLES)
        const stride = Math.ceil(vertexCount / particleCount)

        // Sample keyframes from the animation
        const duration = clip.duration
        const keyframes = []

        for (let k = 0; k < KEYFRAME_COUNT; k++) {
            const time = (k / (KEYFRAME_COUNT - 1)) * duration
            const positions = new Float32Array(particleCount * 3)
            const normals = new Float32Array(particleCount * 3)

            // Create a fresh clone for each keyframe to avoid state issues
            const sampleScene = gltf.scene.clone()
            sampleScene.updateMatrixWorld(true)

            let sampleMesh = null
            let sampleSkeleton = null

            sampleScene.traverse((child) => {
                if (child.isSkinnedMesh && !sampleMesh) {
                    sampleMesh = child
                    sampleSkeleton = child.skeleton
                }
            })

            if (sampleMesh && sampleSkeleton) {
                // Sample full vertex data
                const fullPositions = new Float32Array(vertexCount * 3)
                const fullNormals = new Float32Array(vertexCount * 3)
                sampleSkinnedMesh(sampleMesh, sampleSkeleton, clip, time, fullPositions, fullNormals)

                // Subsample for particle count
                for (let i = 0; i < particleCount; i++) {
                    const srcIdx = Math.min(i * stride, vertexCount - 1)
                    positions[i * 3] = fullPositions[srcIdx * 3]
                    positions[i * 3 + 1] = fullPositions[srcIdx * 3 + 1]
                    positions[i * 3 + 2] = fullPositions[srcIdx * 3 + 2]
                    normals[i * 3] = fullNormals[srcIdx * 3]
                    normals[i * 3 + 1] = fullNormals[srcIdx * 3 + 1]
                    normals[i * 3 + 2] = fullNormals[srcIdx * 3 + 2]
                }
            }

            keyframes.push({ positions, normals })
        }

        // Create particle data with deterministic random values
        const randoms = new Float32Array(particleCount)
        for (let i = 0; i < particleCount; i++) {
            randoms[i] = seededRandom(i + 1)
        }

        // Use first keyframe normals for dispersion direction
        const baseNormals = keyframes[0]?.normals || new Float32Array(particleCount * 3)

        return {
            particleData: {
                count: particleCount,
                randoms,
                normals: baseNormals
            },
            keyframePositions: keyframes.map(k => k.positions)
        }
    }, [gltf])

    // Create uniforms with useMemo (stable reference)
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAnimationProgress: { value: 0 },
        uScale: { value: craneStates.hero.scale },
        uOpacity: { value: craneStates.hero.opacity },
        uDispersion: { value: craneStates.hero.dispersion },
        uNoiseIntensity: { value: craneStates.hero.noiseIntensity },
        uRevealProgress: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uViewport: { value: new THREE.Vector2(viewport.width, viewport.height) },
        uTargetPosition: { value: new THREE.Vector3(...craneStates.hero.position) },
        uRotation: { value: new THREE.Vector3(...craneStates.hero.rotation) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])

    // Current animation state
    const animationState = useRef({
        currentKeyframe: 0,
        animationSpeed: craneStates.hero.animationSpeed,
        frameAccumulator: 0
    })

    // Run initial reveal animation
    useEffect(() => {
        if (!particleData) return

        // Animate reveal progress from 0 to 1 over 3 seconds
        gsap.to(uniforms.uRevealProgress, {
            value: 1,
            duration: 3,
            ease: 'power2.out'
        })
    }, [particleData, uniforms])

    // Update keyframe attributes when animation progresses
    const updateKeyframeAttributes = useMemo(() => {
        return (geometry, currentFrame, nextFrame) => {
            if (!keyframePositions.length || !geometry) return

            const pos0 = keyframePositions[currentFrame]
            const pos1 = keyframePositions[nextFrame]

            if (pos0 && pos1) {
                const attr0 = geometry.attributes.aPosition0
                const attr1 = geometry.attributes.aPosition1

                if (attr0 && attr1) {
                    attr0.array.set(pos0)
                    attr1.array.set(pos1)
                    attr0.needsUpdate = true
                    attr1.needsUpdate = true
                }
            }
        }
    }, [keyframePositions])

    useFrame((state) => {
        if (!meshRef.current || !particleData) return

        const { clock, pointer } = state
        const material = meshRef.current.material
        const geometry = meshRef.current.geometry

        // Update time
        material.uniforms.uTime.value = clock.getElapsedTime()

        // Smooth mouse lerp
        material.uniforms.uMouse.value.lerp(pointer, 0.1)

        // Update viewport
        material.uniforms.uViewport.value.set(state.viewport.width, state.viewport.height)

        // Animate through keyframes based on animation speed
        const anim = animationState.current
        anim.frameAccumulator += clock.getDelta() * anim.animationSpeed * 30 // 30fps base rate

        if (anim.frameAccumulator >= 1) {
            anim.frameAccumulator = 0
            anim.currentKeyframe = (anim.currentKeyframe + 1) % KEYFRAME_COUNT
            const nextFrame = (anim.currentKeyframe + 1) % KEYFRAME_COUNT

            // Update buffer attributes with new keyframes
            updateKeyframeAttributes(geometry, anim.currentKeyframe, nextFrame)
        }

        // Interpolation progress within current keyframe pair
        material.uniforms.uAnimationProgress.value = anim.frameAccumulator
    })

    // Expose transition method via ref
    useImperativeHandle(ref, () => ({
        transitionToState: (stateName) => {
            const state = craneStates[stateName]
            if (!state) return

            // Update animation speed immediately
            animationState.current.animationSpeed = state.animationSpeed

            // Animate other properties
            gsap.to(uniforms.uScale, { value: state.scale, duration: 2, ease: 'power2.out' })
            gsap.to(uniforms.uOpacity, { value: state.opacity, duration: 2, ease: 'power2.out' })
            gsap.to(uniforms.uDispersion, { value: state.dispersion, duration: 2, ease: 'power2.out' })
            gsap.to(uniforms.uNoiseIntensity, { value: state.noiseIntensity, duration: 2, ease: 'power2.out' })

            // Animate position
            if (state.position) {
                targetPosVec.set(...state.position)
                gsap.to(uniforms.uTargetPosition.value, {
                    x: targetPosVec.x,
                    y: targetPosVec.y,
                    z: targetPosVec.z,
                    duration: 2,
                    ease: 'power2.out'
                })
            }

            // Animate rotation
            if (state.rotation) {
                gsap.to(uniforms.uRotation.value, {
                    x: state.rotation[0],
                    y: state.rotation[1],
                    z: state.rotation[2],
                    duration: 2,
                    ease: 'power2.out'
                })
            }
        }
    }))

    if (!particleData || !keyframePositions.length) {
        return null
    }

    // Get initial keyframe positions
    const initialPositions0 = keyframePositions[0]
    const initialPositions1 = keyframePositions[1] || keyframePositions[0]

    return (
        <points ref={meshRef} renderOrder={1}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleData.count}
                    array={new Float32Array(particleData.count * 3)}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aPosition0"
                    count={particleData.count}
                    array={initialPositions0}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aPosition1"
                    count={particleData.count}
                    array={initialPositions1}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aNormal"
                    count={particleData.count}
                    array={particleData.normals}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aRandom"
                    count={particleData.count}
                    array={particleData.randoms}
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

CraneParticles.displayName = 'CraneParticles'

export default CraneParticles
