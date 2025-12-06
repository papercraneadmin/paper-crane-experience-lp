import React from 'react'
import { gsap } from 'gsap'

export default function EnterScreen({ onEnter }) {
    const containerRef = React.useRef(null)

    const handleEnter = () => {
        gsap.to(containerRef.current, {
            opacity: 0,
            duration: 1.5,
            ease: 'power2.inOut',
            onComplete: onEnter
        })
    }

    return (
        <div ref={containerRef} className="enter-screen" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif'
        }} onClick={handleEnter}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '0.2em', marginBottom: '1rem' }}>PAPER CRANE</h1>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, letterSpacing: '0.1em', marginBottom: '1.5rem' }}>[ CLICK TO ENTER ]</p>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#fff'
            }}>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                <span>Sound recommended</span>
            </div>
        </div>
    )
}
