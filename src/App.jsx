import React, { useState, useRef, useCallback } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Experience from './components/Canvas/Experience'
import EnterScreen from './components/UI/EnterScreen'
import ContentSections from './components/UI/ContentSections'
import { useAudio } from './hooks/useAudio'

gsap.registerPlugin(ScrollTrigger)

// Bridge component to connect Lenis scroll to GSAP ScrollTrigger
function LenisScrollTriggerBridge() {
  useLenis(() => {
    // Update ScrollTrigger on every Lenis scroll frame
    ScrollTrigger.update()
  })
  return null
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
    <ReactLenis root>
      <LenisScrollTriggerBridge />
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
    </ReactLenis>
  )
}

export default App
