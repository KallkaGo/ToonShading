varying vec2 vUv[5];
uniform float u_blurRange;
uniform vec2 uSize;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv[0] = uv;
  vUv[1] = uv + vec2(-1.0, -1.0) * (1.0 + u_blurRange) * uSize * 0.5; // ↖
  vUv[2] = uv + vec2(-1.0, 1.0) * (1.0 + u_blurRange) * uSize * 0.5; // ↙
  vUv[3] = uv + vec2(1.0, -1.0) * (1.0 + u_blurRange) * uSize * 0.5; // ↗
  vUv[4] = uv + vec2(1.0, 1.0) * (1.0 + u_blurRange) * uSize * 0.5; // ↘
}