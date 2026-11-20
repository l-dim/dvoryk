// Малює іконку гри: небо, пагорб, мальований будиночок і бабуся Галя.
// Використання: swift art/icon.swift <вихідна.png> <розмір>
import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
let out = URL(fileURLWithPath: args[1])
let S = CGFloat(Double(args[2]) ?? 1024)
let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()

func load(_ rel: String) -> CGImage {
  let src = CGImageSourceCreateWithURL(root.appendingPathComponent(rel) as CFURL, nil)!
  return CGImageSourceCreateImageAtIndex(src, 0, nil)!
}
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: Int(S), height: Int(S), bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.interpolationQuality = .high
func c(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1) -> CGColor { CGColor(colorSpace: cs, components: [r/255, g/255, b/255, a])! }

// небо (y знизу)
let sky = CGGradient(colorsSpace: cs, colors: [c(255, 236, 196), c(168, 222, 255), c(110, 190, 245)] as CFArray, locations: [0, 0.45, 1])!
ctx.drawLinearGradient(sky, start: CGPoint(x: 0, y: S * 0.3), end: CGPoint(x: 0, y: S), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
// сонячне світіння
let glow = CGGradient(colorsSpace: cs, colors: [c(255, 248, 210, 0.95), c(255, 248, 210, 0)] as CFArray, locations: [0, 1])!
ctx.drawRadialGradient(glow, startCenter: CGPoint(x: S * 0.78, y: S * 0.8), startRadius: 0, endCenter: CGPoint(x: S * 0.78, y: S * 0.8), endRadius: S * 0.45, options: [])
// хмаринки
ctx.setFillColor(c(255, 255, 255, 0.95))
for (x, y, r) in [(0.16, 0.86, 0.07), (0.24, 0.88, 0.09), (0.32, 0.86, 0.065), (0.62, 0.92, 0.05), (0.69, 0.935, 0.065), (0.76, 0.92, 0.05)] {
  ctx.fillEllipse(in: CGRect(x: S * (x - r), y: S * (y - r * 0.75), width: S * r * 2, height: S * r * 1.5))
}
// будиночок на задньому плані
let house = load("e3d/1f3e1.webp")
let hw = S * 0.46
ctx.draw(house, in: CGRect(x: S * 0.52, y: S * 0.38, width: hw, height: hw * CGFloat(house.height) / CGFloat(house.width)))
// пагорб
let hill = CGMutablePath()
hill.move(to: CGPoint(x: 0, y: S * 0.36))
hill.addQuadCurve(to: CGPoint(x: S, y: S * 0.40), control: CGPoint(x: S * 0.5, y: S * 0.52))
hill.addLine(to: CGPoint(x: S, y: 0)); hill.addLine(to: CGPoint(x: 0, y: 0)); hill.closeSubpath()
ctx.addPath(hill); ctx.clip()
let grass = CGGradient(colorsSpace: cs, colors: [c(70, 150, 40), c(130, 200, 70)] as CFArray, locations: [0, 1])!
ctx.drawLinearGradient(grass, start: CGPoint(x: 0, y: 0), end: CGPoint(x: 0, y: S * 0.48), options: [])
ctx.resetClip()
// квіточки на траві
for (x, y, col) in [(0.08, 0.30, c(255, 255, 255)), (0.92, 0.33, c(255, 210, 60)), (0.86, 0.22, c(255, 140, 180)), (0.12, 0.18, c(255, 210, 60))] {
  ctx.setFillColor(col); ctx.fillEllipse(in: CGRect(x: S * x - S * 0.018, y: S * y - S * 0.018, width: S * 0.036, height: S * 0.036))
}
// бабуся Галя попереду, з м'якою тінню
let halya = load("portraits/halya.webp")
let gh = S * 0.80, gw = gh * CGFloat(halya.width) / CGFloat(halya.height)
ctx.setShadow(offset: CGSize(width: 0, height: -S * 0.01), blur: S * 0.03, color: c(40, 60, 20, 0.45))
ctx.draw(halya, in: CGRect(x: S * 0.40 - gw / 2, y: -S * 0.02, width: gw, height: gh))

let img = ctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(out as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, nil)
CGImageDestinationFinalize(dest)
print("ok \(out.lastPathComponent)")
