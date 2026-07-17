"use client"

import * as React from "react"

/**
 * Subtle interactive confetti that follows the mouse cursor on the landing page.
 * Lightweight canvas implementation — spawns a few monochrome particles per move.
 */
export function ConfettiCursor() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const particles = React.useRef<
    { x: number; y: number; vx: number; vy: number; life: number; size: number; rot: number; vr: number }[]
  >([])
  const raf = React.useRef<number>(0)
  const lastSpawn = React.useRef(0)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastSpawn.current < 28) return
      lastSpawn.current = now
      // Spawn 2-3 subtle particles
      const count = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) {
        particles.current.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -Math.random() * 1.4 - 0.4,
          life: 1,
          size: 3 + Math.random() * 3,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.2,
        })
      }
      // cap
      if (particles.current.length > 180) {
        particles.current.splice(0, particles.current.length - 180)
      }
    }
    window.addEventListener("mousemove", onMove)

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const arr = particles.current
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.03 // gravity
        p.rot += p.vr
        p.life -= 0.018
        if (p.life <= 0) {
          arr.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life) * 0.55
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        // monochrome confetti rectangles
        const shade = 30 + Math.floor((1 - p.life) * 40)
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ mixBlendMode: "multiply" }}
    />
  )
}
