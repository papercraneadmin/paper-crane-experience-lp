import React, { useEffect, useState } from 'react'

export default function ScrollIndicator() {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const handleScroll = () => {
            // Hide after scrolling past 100px
            setVisible(window.scrollY < 100)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '3rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.6s ease',
                pointerEvents: 'none',
                zIndex: 20
            }}
        >
            {/* Text label */}
            <span style={{
                fontSize: '0.65rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                opacity: 0.5,
                fontWeight: 400
            }}>
                Scroll
            </span>

            {/* Animated line with traveling dot */}
            <div style={{
                position: 'relative',
                width: '1px',
                height: '48px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.05))',
                overflow: 'hidden'
            }}>
                {/* Traveling dot */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '3px',
                        height: '3px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        animation: 'scrollDot 2s ease-in-out infinite',
                        boxShadow: '0 0 6px rgba(255,255,255,0.5)'
                    }}
                />
            </div>

            {/* CSS Keyframes */}
            <style>{`
                @keyframes scrollDot {
                    0% {
                        top: -4px;
                        opacity: 0;
                    }
                    20% {
                        opacity: 1;
                    }
                    80% {
                        opacity: 1;
                    }
                    100% {
                        top: 44px;
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}
