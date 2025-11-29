import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const SplitText = ({ children, className, style }) => {
    if (typeof children !== 'string') return <span>{children}</span>

    return (
        <span className={className} style={{ display: 'inline-block', ...style }}>
            {children.split('').map((char, i) => (
                <span key={i} className="char" style={{ display: 'inline-block', minWidth: char === ' ' ? '0.3em' : 'auto' }}>
                    {char}
                </span>
            ))}
        </span>
    )
}

const Section = ({ title, children, align = 'left' }) => {
    const sectionRef = useRef(null)
    const titleRef = useRef(null)
    const textRef = useRef(null)

    useEffect(() => {
        // Use vanilla selector to be safe
        const chars = sectionRef.current.querySelectorAll(".char")

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 75%", // Adjusted to be safe
                end: "bottom 25%",
                toggleActions: "play reverse play reverse",
            }
        })

        if (chars.length > 0) {
            tl.fromTo(chars,
                { opacity: 0, y: 50, rotateX: -90 },
                { opacity: 1, y: 0, rotateX: 0, duration: 1, stagger: 0.05, ease: "back.out(1.7)" }
            )
        } else {
            tl.fromTo(titleRef.current,
                { opacity: 0, y: 50 },
                { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
            )
        }

        tl.fromTo(textRef.current,
            { opacity: 0, y: 30 },
            { opacity: 0.8, y: 0, duration: 1, ease: "power3.out" },
            "-=0.5"
        )

        return () => {
            if (tl.scrollTrigger) tl.scrollTrigger.kill()
            tl.kill()
        }
    }, [])

    return (
        <div ref={sectionRef} className={`section ${align}`} style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 10vw',
            color: 'white',
            pointerEvents: 'none',
            textAlign: align
        }}>
            <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
                <h2 ref={titleRef} style={{ fontSize: '4rem', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 100, overflow: 'hidden' }}>
                    <SplitText>{title}</SplitText>
                </h2>
                <div ref={textRef} style={{ fontSize: '1.2rem', maxWidth: '500px', lineHeight: 1.6, opacity: 0.8 }}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default function Overlay() {
    return (
        <div style={{ position: 'relative', width: '100%', zIndex: 10 }}>
            <Section title="Paper Crane">
                We craft digital experiences that transcend the ordinary.
            </Section>
            <Section title="Ethereal" align="right">
                Not just websites. Worlds. We build immersive environments that tell your story.
            </Section>
            <Section title="Interactive">
                Touch, scroll, explore. Every interaction is a conversation.
            </Section>
            <Section title="Minimalist" align="right">
                Stripping away the noise to reveal the essence.
            </Section>
            <Section title="Technology">
                Powered by the latest in WebGL and creative coding.
            </Section>
            <Section title="Emotion" align="right">
                Design that makes you feel.
            </Section>
            <Section title="Contact">
                Ready to fly? <br />
                <a href="mailto:hello@papercrane.agency" style={{ color: 'white', textDecoration: 'underline' }}>hello@papercrane.agency</a>
            </Section>
        </div>
    )
}
