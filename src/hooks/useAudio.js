import { useState, useEffect, useRef } from 'react'

export const useAudio = (url) => {
    const audioRef = useRef(null)
    const [playing, setPlaying] = useState(false)

    // Initialize audio ref once
    if (audioRef.current === null) {
        const audio = new Audio(url)
        audio.loop = true
        audioRef.current = audio
    }

    const toggle = () => setPlaying(!playing)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        playing ? audio.play().catch(e => console.error("Audio play failed", e)) : audio.pause()
    }, [playing])

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleEnded = () => setPlaying(false)
        audio.addEventListener('ended', handleEnded)
        return () => {
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    return [playing, toggle]
}
