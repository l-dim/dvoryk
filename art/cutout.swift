// Вирізає персонажа з фону (Apple Vision), обрізає порожні краї й зменшує.
// Використання: cutout <вхідна> <вихідна.png> [макс_висота=560] [x y w h — клітинка, від верхнього лівого кута]
import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3 else { print("usage: cutout <in> <out> [maxH]"); exit(1) }
let inURL = URL(fileURLWithPath: args[1]), outURL = URL(fileURLWithPath: args[2])
let maxH = args.count > 3 ? CGFloat(Double(args[3]) ?? 560) : 560

guard var src = CIImage(contentsOf: inURL, options: [.applyOrientationProperty: true]) else { print("cannot read \(inURL.path)"); exit(1) }
if args.count >= 8, let cx = Double(args[4]), let cy = Double(args[5]), let cw = Double(args[6]), let chh = Double(args[7]) {
  // CoreImage рахує y знизу — перевертаємо
  let H = src.extent.height
  src = src.cropped(to: CGRect(x: cx, y: H - cy - chh, width: cw, height: chh))
  src = src.transformed(by: CGAffineTransform(translationX: -cx, y: -(H - cy - chh)))
}
let handler = VNImageRequestHandler(ciImage: src)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let obs = req.results?.first else { print("no subject found in \(inURL.lastPathComponent)"); exit(2) }
let maskPB = try obs.generateScaledMaskForImage(forInstances: obs.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: maskPB)

let blend = CIFilter.blendWithMask()
blend.inputImage = src
blend.backgroundImage = CIImage.empty().cropped(to: src.extent)
blend.maskImage = mask
var out = blend.outputImage!.cropped(to: src.extent)

let ctx = CIContext()
// межі непрозорої частини
guard let full = ctx.createCGImage(out, from: out.extent) else { exit(3) }
let w = full.width, h = full.height
var data = [UInt8](repeating: 0, count: w * h * 4)
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
let bctx = CGContext(data: &data, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs,
                     bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
bctx.draw(full, in: CGRect(x: 0, y: 0, width: w, height: h))
var minX = w, minY = h, maxX = 0, maxY = 0
for y in 0..<h { for x in 0..<w where data[(y * w + x) * 4 + 3] > 12 {
  minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y) } }
guard maxX > minX, maxY > minY else { print("empty mask"); exit(4) }
let pad = 6
let crop = CGRect(x: max(0, minX - pad), y: max(0, minY - pad),
                  width: min(w, maxX + pad) - max(0, minX - pad), height: min(h, maxY + pad) - max(0, minY - pad))
guard let cropped = full.cropping(to: crop) else { exit(5) }

let scale = min(1, maxH / CGFloat(cropped.height))
let nw = Int(CGFloat(cropped.width) * scale), nh = Int(CGFloat(cropped.height) * scale)
let rctx = CGContext(data: nil, width: nw, height: nh, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                     bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
rctx.interpolationQuality = .high
rctx.draw(cropped, in: CGRect(x: 0, y: 0, width: nw, height: nh))
let final = rctx.makeImage()!
let dest = CGImageDestinationCreateWithURL(outURL as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, final, nil)
CGImageDestinationFinalize(dest)
print("ok \(outURL.lastPathComponent) \(nw)x\(nh)")
