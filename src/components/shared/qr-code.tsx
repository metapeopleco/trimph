"use client"

import * as React from "react"
import QRCode from "qrcode"

interface QrCodeSvgProps {
  value: string
  size?: number
  className?: string
  /** id needed for SVG export to PDF */
  id?: string
}

/**
 * Renders a high-resolution SVG QR code (crisp at any size, default 1000px exportable).
 * The SVG is generated server-side via the qrcode lib and injected as raw markup.
 */
export function QrCodeSvg({ value, size = 200, className, id }: QrCodeSvgProps) {
  const [svg, setSvg] = React.useState<string>("")

  React.useEffect(() => {
    let active = true
    // Generate at high resolution (1000px) for crisp print, then scale via viewBox.
    QRCode.toString(value, {
      errorCorrectionLevel: "M",
      type: "svg",
      margin: 1,
      width: 1000,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((s) => {
        if (active) setSvg(s)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [value])

  if (!svg) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, background: "var(--muted)" }}
      />
    )
  }

  return (
    <div
      id={id}
      className={className}
      style={{ width: size, height: size, lineHeight: 0 }}
      // The inner svg scales to fill the container; the source is 1000px so it's print-ready.
      dangerouslySetInnerHTML={{ __html: svg.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"') }}
    />
  )
}

/** Export a collection of QR codes to a multi-page PDF with embedded SVG. */
export async function exportQrPdf(
  items: { title: string; subtitle?: string; url: string; code?: string }[]
) {
  const { jsPDF } = await import("jspdf")
  const QRCodeMod = await import("qrcode")

  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (i > 0) doc.addPage()

    // Title
    doc.setFont("times", "bold")
    doc.setFontSize(22)
    doc.setTextColor(20, 20, 20)
    doc.text(item.title, pageW / 2, 72, { align: "center" })

    if (item.subtitle) {
      doc.setFont("times", "normal")
      doc.setFontSize(12)
      doc.setTextColor(90, 90, 90)
      doc.text(item.subtitle, pageW / 2, 92, { align: "center" })
    }

    // Generate SVG string at 1000px
    const svgString = await QRCodeMod.toString(item.url || item.code || "", {
      errorCorrectionLevel: "M",
      type: "svg",
      margin: 1,
      width: 1000,
      color: { dark: "#000000", light: "#ffffff" },
    })

    // Draw white background box
    const boxSize = 280
    const boxX = (pageW - boxSize) / 2
    const boxY = 130
    doc.setFillColor(255, 255, 255)
    doc.rect(boxX - 10, boxY - 10, boxSize + 20, boxSize + 20, "F")
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.rect(boxX - 10, boxY - 10, boxSize + 20, boxSize + 20, "S")

    // Embed SVG via svg2pdf.3rdParty if available, otherwise use image fallback.
    try {
      // jsPDF v3+ ships with .svg() helper using svg2pdf
      // Convert svg string to a DOM element
      const parser = new DOMParser()
      const docEl = parser.parseFromString(svgString, "image/svg+xml")
      const svgEl = docEl.documentElement
      // @ts-ignore — svg method exists on jspdf with svg2pdf plugin in v3+
      await doc.svg(svgEl, {
        x: boxX,
        y: boxY,
        width: boxSize,
        height: boxSize,
      })
    } catch {
      // Fallback: rasterize to PNG via canvas
      const dataUrl = await QRCodeMod.toDataURL(item.url || item.code || "", {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 1000,
        color: { dark: "#000000", light: "#ffffff" },
      })
      doc.addImage(dataUrl, "PNG", boxX, boxY, boxSize, boxSize)
    }

    // Code / url text
    doc.setFont("courier", "normal")
    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    const label = item.code || item.url
    doc.text(label, pageW / 2, boxY + boxSize + 36, { align: "center" })

    // Footer brand
    doc.setFont("times", "italic")
    doc.setFontSize(10)
    doc.setTextColor(140, 140, 140)
    doc.text("Trim.ph", pageW / 2, pageH - 36, { align: "center" })
  }

  doc.save("trimph-qr-codes.pdf")
}
