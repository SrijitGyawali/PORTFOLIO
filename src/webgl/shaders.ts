export const pointVertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aAccent;
  uniform float uTime;
  uniform float uDpr;
  uniform float uScale;
  uniform float uMotion;
  varying float vAccent;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vAccent = aAccent;
    vAlpha = .44 + aSeed * .56;
    float pulse = .88 + .12 * sin(uTime * 1.4 + aSeed * 22.0) * uMotion;
    gl_PointSize = clamp((1.05 + aAccent * 1.6) * uDpr * uScale * pulse * (9.0 / -mv.z), 1.0, 7.0 * uDpr);
    gl_Position = projectionMatrix * mv;
  }
`

export const pointFragmentShader = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  varying float vAccent;
  varying float vAlpha;
  void main() {
    vec2 pixel = gl_PointCoord - .5;
    float shape = 1.0 - smoothstep(.32, .5, max(abs(pixel.x), abs(pixel.y)));
    vec3 paper = vec3(.80, .83, .77);
    vec3 signal = vec3(.718, 1.0, .29);
    gl_FragColor = vec4(mix(paper, signal, vAccent), shape * vAlpha * uOpacity);
  }
`
