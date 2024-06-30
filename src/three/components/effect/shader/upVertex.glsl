varying vec2 vUv[8];
uniform float u_blurRange;
uniform vec2 uSize;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv[0] = uv + vec2(-1., -1.) * (1. + u_blurRange) * uSize.xy * 0.5;
  vUv[1] = uv + vec2(-1., 1.) * (1. + u_blurRange) * uSize.xy * 0.5;
  vUv[2] = uv + vec2(1., -1.) * (1. + u_blurRange) * uSize.xy * 0.5;
  vUv[3] = uv + vec2(1., 1.) * (1. + u_blurRange) * uSize.xy * 0.5;
  vUv[4] = uv + vec2(-2., 0.) * (1. + u_blurRange) * uSize.xy * 0.5;
  vUv[5] = uv + vec2(0., -2.) * (1. + u_blurRange) * uSize.xy * 0.5;
  vUv[6] = uv + vec2(2., 0.) * (1. + u_blurRange) * uSize.xy * 0.5;
  vUv[7] = uv + vec2(0., 2.) * (1. + u_blurRange) * uSize.xy * 0.5;

}