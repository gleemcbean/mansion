uniform float uTime;
uniform vec2 uResolution;

const float BIT = 255.0;
const float DIVIDER = 30.0;
const float NOISE = 0.1;
const float DITHER_INTENSITY = 8.0;

float bayer4(vec2 uv) {
  ivec2 i = ivec2(mod(floor(uv), 4.0));

  int index = i.y * 4 + i.x;

  float bayer[16] = float[16](
    0.0,  8.0,  2.0, 10.0,
    12.0, 4.0, 14.0,  6.0,
    3.0, 11.0, 1.0,  9.0,
    15.0, 7.0, 13.0,  5.0
  );

  return bayer[index] / 16.0;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 78.233);
  return fract(p.x * p.y);
}

void mainUv(inout vec2 uv) {}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = inputColor;

  float d = length(uv - 0.5);
  float v = smoothstep(0.9, 0.1, d);

  vec2 uvDither = uv;
  uvDither.x *= uResolution.x / uResolution.y;

  float n = hash(uv * 50.0 + uTime * 0.5);
  float bayer = bayer4(uvDither * 400.0);

  color.rgb *= mix(0.0, 1.0, v);

  vec3 dithered = color.rgb + (bayer - 0.5) * (DITHER_INTENSITY / BIT);

  dithered = floor(dithered * BIT / DIVIDER) / BIT * DIVIDER;
  dithered += (n - 0.5) * NOISE;

  outputColor = vec4(dithered, color.a);
}
