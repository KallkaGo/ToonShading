varying vec2 vUv;
uniform vec3 uOutLineColor;
uniform sampler2D uDiffuse;
void main() {
  vec4 baseColor = csm_DiffuseColor;
  if(baseColor.a < 0.5)
    discard;
  csm_FragColor = vec4(baseColor.rgb * .15, 1.);
}