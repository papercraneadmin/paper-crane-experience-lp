import React, { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const Section = ({ children, id, onEnter, index, triggerId }) => {
    const contentRef = useRef()
    const isFirstSection = index === 0
    const [isActive, setIsActive] = useState(isFirstSection)

    const animateIn = useCallback((content) => {
        // Get all text elements
        const elements = content.querySelectorAll('h1, h2, h3, h4, p, a, div')

        // Animate container
        gsap.to(content, {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out'
        })

        // Animate each element with stagger
        elements.forEach((el, i) => {
            // Skip if it's a wrapper div
            if (el.tagName === 'DIV' && el.children.length > 0) return

            gsap.fromTo(el,
                { opacity: 0, y: 4 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    delay: 0.1 + i * 0.08,
                    ease: 'power2.out'
                }
            )
        })
    }, [])

    const animateOut = useCallback((content) => {
        gsap.to(content, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in'
        })
    }, [])

    useEffect(() => {
        const content = contentRef.current
        if (!content) return

        const trigger = ScrollTrigger.create({
            trigger: `#${triggerId}`,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => {
                setIsActive(true)
                onEnter(id)
                animateIn(content)
            },
            onLeave: () => {
                setIsActive(false)
                animateOut(content)
            },
            onEnterBack: () => {
                setIsActive(true)
                onEnter(id)
                animateIn(content)
            },
            onLeaveBack: () => {
                setIsActive(false)
                animateOut(content)
            },
        })

        // Show first section immediately
        if (isFirstSection) {
            animateIn(content)
        }

        return () => trigger.kill()
    }, [id, isFirstSection, triggerId, onEnter, animateIn, animateOut])

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                pointerEvents: 'none',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.3s ease',
                zIndex: isActive ? 2 : 1,
            }}
        >
            <div
                ref={contentRef}
                style={{
                    fontFamily: 'Montserrat, sans-serif',
                    color: 'white',
                    textAlign: 'center',
                    maxWidth: '900px',
                    opacity: 0
                }}
            >
                {children}
            </div>
        </div>
    )
}

export default function ContentSections({ onSectionChange }) {
    const sections = [
        { id: 'hero', triggerId: 'trigger-hero' },
        { id: 'problem', triggerId: 'trigger-problem' },
        { id: 'team', triggerId: 'trigger-team' },
        { id: 'philosophy', triggerId: 'trigger-philosophy' },
        { id: 'services', triggerId: 'trigger-services' },
        { id: 'process', triggerId: 'trigger-process' },
        { id: 'quote', triggerId: 'trigger-quote' },
        { id: 'cta', triggerId: 'trigger-cta' }
    ]

    return (
        <>
            {/* Fixed overlay sections */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                zIndex: 10,
                pointerEvents: 'none'
            }}>
                {/* Hero Section */}
                <Section id="hero" onEnter={onSectionChange} index={0} triggerId="trigger-hero">
                    <h1 style={{
                        fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
                        fontWeight: 700,
                        marginBottom: '2rem',
                        letterSpacing: '-0.03em',
                        lineHeight: 0.95
                    }}>
                        Above The Fold
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                        fontWeight: 300,
                        maxWidth: '700px',
                        lineHeight: 1.6,
                        letterSpacing: '0.01em'
                    }}>
                        Where vision meets craft.<br/>
                        We build brands that soar.
                    </p>
                </Section>

                {/* Problem Section */}
                <Section id="problem" onEnter={onSectionChange} index={1} triggerId="trigger-problem">
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 3.75vw, 2.625rem)',
                        fontWeight: 700,
                        marginBottom: '2.5rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}>
                        The gap between where you are and where you could be.
                    </h2>
                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                        fontWeight: 300,
                        lineHeight: 1.8,
                        maxWidth: '650px',
                        margin: '0 auto'
                    }}>
                        Most businesses are stuck - talented teams stretched thin,
                        marketing disconnected from strategy, potential left unrealized.
                    </p>
                </Section>

                {/* Team Section */}
                <Section id="team" onEnter={onSectionChange} index={2} triggerId="trigger-team">
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 3.75vw, 2.625rem)',
                        fontWeight: 700,
                        marginBottom: '2.5rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}>
                        More eyes.<br/>
                        Clearer vision.
                    </h2>
                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                        fontWeight: 300,
                        lineHeight: 1.8,
                        maxWidth: '650px',
                        margin: '0 auto'
                    }}>
                        We become an extension of your team - thinking beyond marketing,
                        focusing on the business, fostering what comes next.
                    </p>
                </Section>

                {/* Philosophy Section */}
                <Section id="philosophy" onEnter={onSectionChange} index={3} triggerId="trigger-philosophy">
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 3.75vw, 2.625rem)',
                        fontWeight: 700,
                        marginBottom: '2.5rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}>
                        We build for tomorrow.
                    </h2>
                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                        fontWeight: 300,
                        lineHeight: 1.8,
                        maxWidth: '650px',
                        margin: '0 auto'
                    }}>
                        Strategy and execution aren't separate - they're woven together.
                        Every pixel, every line of code, every word serves the bigger picture.
                    </p>
                </Section>

                {/* Services Section */}
                <Section id="services" onEnter={onSectionChange} index={4} triggerId="trigger-services">
                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{
                            fontSize: 'clamp(1rem, 1.5vw, 1.2rem)',
                            fontWeight: 700,
                            opacity: 0.5,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            marginBottom: '1rem'
                        }}>
                            What We Do
                        </h3>
                        <h2 style={{
                            fontSize: 'clamp(1.5rem, 3.75vw, 2.625rem)',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            marginBottom: '1rem',
                            lineHeight: 1.2
                        }}>
                            Infrastructure meets identity
                        </h2>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '3rem',
                        maxWidth: '800px',
                        margin: '0 auto'
                    }}>
                        <div>
                            <h4 style={{
                                fontSize: 'clamp(1.3rem, 2vw, 1.6rem)',
                                fontWeight: 700,
                                marginBottom: '0.75rem'
                            }}>
                                Digital Backbone
                            </h4>
                            <p style={{
                                fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                                lineHeight: 1.7,
                                fontWeight: 300
                            }}>
                                Database engineering, automation, and AI that keeps your business humming.
                            </p>
                        </div>
                        <div>
                            <h4 style={{
                                fontSize: 'clamp(1.3rem, 2vw, 1.6rem)',
                                fontWeight: 700,
                                marginBottom: '0.75rem'
                            }}>
                                Creative Soul
                            </h4>
                            <p style={{
                                fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                                lineHeight: 1.7,
                                fontWeight: 300
                            }}>
                                Content, design, and brand identity that makes your mark unmistakable.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* Process Section */}
                <Section id="process" onEnter={onSectionChange} index={5} triggerId="trigger-process">
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 3.75vw, 2.625rem)',
                        fontWeight: 700,
                        marginBottom: '2.5rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}>
                        Transparent.<br/>
                        Collaborative.
                    </h2>
                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
                        fontWeight: 300,
                        lineHeight: 1.8,
                        maxWidth: '650px',
                        margin: '0 auto'
                    }}>
                        No black box. No surprises. We work alongside you - iterating,
                        refining, building together. You're in the room where it happens.
                    </p>
                </Section>

                {/* Quote Section */}
                <Section id="quote" onEnter={onSectionChange} index={6} triggerId="trigger-quote">
                    <div style={{ maxWidth: '750px' }}>
                        <p style={{
                            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                            fontStyle: 'italic',
                            marginBottom: '2.5rem',
                            lineHeight: 1.7,
                            fontWeight: 300
                        }}>
                            "They listened, created, and guided us to a website we're genuinely proud of.
                            Modern, intuitive, and already driving results."
                        </p>
                        <div>
                            <p style={{
                                fontSize: 'clamp(1rem, 1.8vw, 1.3rem)',
                                fontWeight: 700,
                                marginBottom: '0.25rem'
                            }}>
                                Christopher McGhee
                            </p>
                            <p style={{
                                fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
                                opacity: 0.6,
                                fontWeight: 400
                            }}>
                                Fratello Coffee Roasters
                            </p>
                        </div>
                    </div>
                </Section>

                {/* CTA Section */}
                <Section id="cta" onEnter={onSectionChange} index={7} triggerId="trigger-cta">
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 3.75vw, 2.625rem)',
                        fontWeight: 700,
                        marginBottom: '3rem',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                    }}>
                        Let's build what's next.
                    </h2>
                    <a
                        href="https://www.papercrane.ca/contact"
                        style={{
                            display: 'inline-block',
                            padding: '0.75rem 2rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            fontFamily: 'Montserrat, sans-serif',
                            background: 'transparent',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '1px',
                            transition: 'all 0.3s ease',
                            letterSpacing: '0.05em',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            pointerEvents: 'auto',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 1)'
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                            e.target.style.backgroundColor = 'transparent'
                        }}
                    >
                        Start a Conversation
                    </a>
                </Section>
            </div>

            {/* Scroll trigger divs */}
            <div style={{ position: 'relative' }}>
                {sections.map((section) => (
                    <div
                        key={section.triggerId}
                        id={section.triggerId}
                        style={{
                            height: '100vh',
                            pointerEvents: 'none'
                        }}
                    />
                ))}
            </div>
        </>
    )
}
