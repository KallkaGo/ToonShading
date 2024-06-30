varying vec2 vUv[8];
uniform sampler2D inputBuffer;
void main() {
  vec4 col = texture2D(inputBuffer, vUv[0]) * 2.;
  col += texture2D(inputBuffer, vUv[1]) * 2.;
  col += texture2D(inputBuffer, vUv[2]) * 2.;
  col += texture2D(inputBuffer, vUv[3]) * 2.;
  col += texture2D(inputBuffer, vUv[4]);
  col += texture2D(inputBuffer, vUv[5]);
  col += texture2D(inputBuffer, vUv[6]);
  col += texture2D(inputBuffer, vUv[7]);
  col *= 0.0833;
  gl_FragColor = col;
}