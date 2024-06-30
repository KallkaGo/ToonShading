varying vec2 vUv[5];
uniform sampler2D inputBuffer;
void main() {
  vec4 col = texture2D(inputBuffer, vUv[0]) * 4.;
  col += texture2D(inputBuffer, vUv[1]);
  col += texture2D(inputBuffer, vUv[2]);
  col += texture2D(inputBuffer, vUv[3]);
  col += texture2D(inputBuffer, vUv[4]);
  col *= .125;
  gl_FragColor = col;

}