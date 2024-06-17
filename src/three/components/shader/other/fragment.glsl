uniform vec3 uLightPosition;
varying vec3 vWorldNormal;
uniform sampler2D uLightMap;
uniform sampler2D uRampMap;
uniform float uRampVmove;
varying vec2 vUv;

void main() {

  /* lightMap */
  vec4 lightMapTex = texture2D(uLightMap, vUv);
  lightMapTex.g = smoothstep(.2, .3, lightMapTex.g);

  vec3 nor = normalize(vWorldNormal);
  float NDotV = dot(nor, uLightPosition);
  // float halfLambert = (NDotV * 0.5 + 0.5) * lightMapTex.g;
  float halfLambert = smoothstep(0.0, 1.14, NDotV + .5) * lightMapTex.g;
  float brightMask = step(.99, halfLambert);
  float ramp1 = .45 + uRampVmove;
  float ramp2 = .35 + uRampVmove;
  float ramp3 = .25 + uRampVmove;
  float ramp4 = .15 + uRampVmove;
  float ramp5 = .05 + uRampVmove;

  float lightmapA2 = step(.25, lightMapTex.a);  //0.3
  float lightmapA3 = step(.45, lightMapTex.a);  //0.5
  float lightmapA4 = step(.65, lightMapTex.a);  //0.7
  float lightmapA5 = step(.95, lightMapTex.a);  //1.0

  float rampValue = ramp1;
  rampValue = mix(rampValue, ramp2, lightmapA2);
  rampValue = mix(rampValue, ramp3, lightmapA3);
  rampValue = mix(rampValue, ramp4, lightmapA4);
  rampValue = mix(rampValue, ramp5, lightmapA5);
 
  vec3 ramp = texture2D(uRampMap, vec2(halfLambert, lightMapTex.a)).rgb;
  vec3 baseColor = csm_DiffuseColor.rgb;
  csm_FragColor = vec4(mix(ramp, vec3(halfLambert), brightMask) * baseColor, csm_DiffuseColor.a);
  // csm_FragColor = vec4(vec3(lightMapTex.a), csm_DiffuseColor.a);

} 