uniform float uTime;

const float BIT = 255.0;
const float DIVIDER = 25.0;
const float NOISE = 0.12;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 78.233);
  return fract(p.x * p.y);
}

void mainUv(inout vec2 uv) {
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = inputColor;

  float d = length(uv - 0.5);
  float v = smoothstep(0.7, 0.3, d);
  float n = hash(uv * 50.0 + uTime * 0.5);
  
  color.rgb *= mix(0.0, 1.0, v);
  color.rgb = floor(color.rgb * BIT / DIVIDER) / BIT * DIVIDER;
  color.rgb += (n - 0.5) * NOISE;
  
  outputColor = color;
}