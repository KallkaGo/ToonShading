varying float uOpacity;

void main() {
  vec4 baseColor = csm_DiffuseColor;
  if(baseColor.a < 0.5)
    discard;
  csm_FragColor = vec4(baseColor.rgb * .15, uOpacity);
}