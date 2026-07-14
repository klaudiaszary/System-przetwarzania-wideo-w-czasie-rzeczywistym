export function luma(r: i32, g: i32, b: i32): i32 {
  return (r * 77 + g * 150 + b * 29) >> 8;
}

export function adjustLuma(r: i32, g: i32, b: i32, brightness: i32, contrast: i32): i32 {
  const y = luma(r, g, b);
  return clamp(((y - 128) * contrast) / 100 + 128 + brightness);
}

export function edgeMagnitude(left: i32, right: i32, top: i32, bottom: i32): i32 {
  return clamp(abs(right - left) + abs(bottom - top));
}

export function blendThresholdEdge(lum: i32, edge: i32, threshold: i32, edgeMixPermille: i32): i32 {
  const thresholded = lum >= threshold ? 255 : 0;
  const baseWeight = 1000 - edgeMixPermille;
  return clamp((thresholded * baseWeight + edge * edgeMixPermille) / 1000);
}

export function sepiaR(r: i32, g: i32, b: i32): i32 {
  return clamp((r * 100 + g * 197 + b * 48) >> 8);
}

export function sepiaG(r: i32, g: i32, b: i32): i32 {
  return clamp((r * 89 + g * 176 + b * 43) >> 8);
}

export function sepiaB(r: i32, g: i32, b: i32): i32 {
  return clamp((r * 70 + g * 137 + b * 34) >> 8);
}

export function posterizeChannel(val: i32, levels: i32): i32 {
  if (levels < 2) return clamp(val);
  const step = 256 / levels;
  const quantized = (val / step) * step;
  return clamp(quantized + (step >> 1));
}

export function solarize(r: i32, g: i32, b: i32, threshold: i32): i32 {
  const y = luma(r, g, b);
  if (y > threshold) {
    return clamp(255 - y);
  }
  return y;
}

export function duotoneChannel(lum: i32, darkColor: i32, lightColor: i32): i32 {
  return clamp(((255 - lum) * darkColor + lum * lightColor) / 255);
}

function clamp(v: i32): i32 {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
