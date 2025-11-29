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
            <p style={{ fontSize: '0.8rem', opacity: 0.6, letterSpacing: '0.1em' }}>[ CLICK TO ENTER ]</p>
        </div>
    )
}
