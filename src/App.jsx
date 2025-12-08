import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Experience from './components/Canvas/Experience'
import EnterScreen from './components/UI/EnterScreen'
import ContentSections from './components/UI/ContentSections'
import { useAudio } from './hooks/useAudio'

gsap.registerPlugin(ScrollTrigger)

// Detect browsers with Lenis issues
const isProblematicBrowser = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  const isFirefox = ua.toLowerCase().includes('firefox')
  return isSafari || isFirefox
}

// Bridge component to connect Lenis scroll to GSAP ScrollTrigger
function LenisScrollTriggerBridge() {
  useLenis(() => {
    ScrollTrigger.update()
  })
  return null
}

// Wrapper that uses native scroll for problematic browsers
function ScrollWrapper({ children }) {
  const useNativeScroll = isProblematicBrowser()

  useEffect(() => {
    if (useNativeScroll) {
      // For native scroll, just refresh ScrollTrigger periodically
      const handleScroll = () => ScrollTrigger.update()
      window.addEventListener('scroll', handleScroll, { passive: true })
      return () => window.removeEventListener('scroll', handleScroll)
    }
  }, [useNativeScroll])

  if (useNativeScroll) {
    return <>{children}</>
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: true,
        touchMultiplier: 2,
      }}
    >
      <LenisScrollTriggerBridge />
      {children}
    </ReactLenis>
  )
}

// Placeholder audio - replace with actual file path
const AUDIO_URL = '/audio/background_music.mp3'

function App() {
  const [entered, setEntered] = useState(false)
  const [, toggle] = useAudio(AUDIO_URL)
  const experienceRef = useRef()

  const handleEnter = () => {
    setEntered(true)
    toggle()
    // Refresh ScrollTrigger after content appears (Safari needs this)
    setTimeout(() => ScrollTrigger.refresh(), 100)
  }

  const handleSectionChange = useCallback((sectionId) => {
    if (experienceRef.current) {
      experienceRef.current.transitionToState(sectionId)
    }
  }, [])

  return (
    <ScrollWrapper>
      {!entered && <EnterScreen onEnter={handleEnter} />}

      {/* Pure Canvas - Full Screen Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        opacity: entered ? 1 : 0,
        transition: 'opacity 2s ease-in-out',
        zIndex: 1
      }}>
        <Experience ref={experienceRef} />
      </div>

      {/* Content Sections Overlay with scroll driver */}
      {entered && <ContentSections onSectionChange={handleSectionChange} />}
    </ScrollWrapper>
  )
}

export default App
