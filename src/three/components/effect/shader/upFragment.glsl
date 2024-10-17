varying vec2 vUv[8];
varying vec2 vOriUV;
uniform sampler2D inputBuffer;
uniform sampler2D uCurDownSample;


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
  vec3 curDownSample = texture2D(uCurDownSample, vOriUV).rgb;
  gl_FragColor = vec4(col.rgb + curDownSample, 1.);
}