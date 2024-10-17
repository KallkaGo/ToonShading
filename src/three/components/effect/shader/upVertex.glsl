varying vec2 vUv[8];
varying vec2 vOriUV;
uniform float u_blurRange;
uniform vec2 uSize;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv[0] = uv + vec2(-1., -1.) * (1. + u_blurRange) * uSize.xy;
  vUv[1] = uv + vec2(-1., 1.) * (1. + u_blurRange) * uSize.xy;
  vUv[2] = uv + vec2(1., -1.) * (1. + u_blurRange) * uSize.xy;
  vUv[3] = uv + vec2(1., 1.) * (1. + u_blurRange) * uSize.xy;
  vUv[4] = uv + vec2(-2., 0.) * (1. + u_blurRange) * uSize.xy;
  vUv[5] = uv + vec2(0., -2.) * (1. + u_blurRange) * uSize.xy;
  vUv[6] = uv + vec2(2., 0.) * (1. + u_blurRange) * uSize.xy;
  vUv[7] = uv + vec2(0., 2.) * (1. + u_blurRange) * uSize.xy;
  vOriUV = uv;
}