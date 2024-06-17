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
  float halfLambert = NDotV * 0.5 + 0.5;

  float ramp1 = .45 + uRampVmove;
  float ramp2 = .15 + uRampVmove;
  float ramp3 = .25 + uRampVmove;
  float ramp5 = .05 + uRampVmove;
  float ramp4 = .35 + uRampVmove;

  float lightmapA2 = step(.25, lightMapTex.a);  //0.3
  float lightmapA3 = step(.45, lightMapTex.a);  //0.5
  float lightmapA4 = step(.65, lightMapTex.a);  //0.7
  float lightmapA5 = step(.95, lightMapTex.a);  //1.0

  float rampValue = ramp1;
  rampValue = mix(rampValue, ramp2, lightmapA2);
  // rampValue = mix(rampValue, ramp3, lightmapA3);
  // rampValue = mix(rampValue, ramp4, lightmapA4);
  // rampValue = mix(rampValue, ramp5, lightmapA5);

  vec3 ramp = texture2D(uRampMap, vec2(halfLambert, rampValue)).rgb;

  // vec4 ShadowRamp1 = texture2D(uRampMap, vec2(halfLambert, 0.45 + uRampVmove));
  // vec4 ShadowRamp2 = texture2D(uRampMap, vec2(halfLambert, 0.35 + uRampVmove));
  // vec4 ShadowRamp3 = texture2D(uRampMap, vec2(halfLambert, 0.25 + uRampVmove));
  // vec4 ShadowRamp4 = texture2D(uRampMap, vec2(halfLambert, 0.15 + uRampVmove));
  // vec4 ShadowRamp5 = texture2D(uRampMap, vec2(halfLambert, 0.05 + uRampVmove));

  // vec3 skinRamp = step(abs(lightMapTex.a - 1.), .05) * ShadowRamp1.rgb;
  // vec3 tightsRamp = step(abs(lightMapTex.a - .7), .05) * ShadowRamp2.rgb;
  // vec3 softCommonRamp = step(abs(lightMapTex.a - .5), .05) * ShadowRamp3.rgb;
  // vec3 hardSilkRamp = step(abs(lightMapTex.a - .3), .05) * ShadowRamp4.rgb;
  // vec3 metalRamp = step(abs(lightMapTex.a - .0), .05) * ShadowRamp5.rgb;

  // vec3 finalRamp = skinRamp + tightsRamp + softCommonRamp + hardSilkRamp + metalRamp;

  float factor = step(0.0, NDotV);
  vec3 baseColor = csm_DiffuseColor.rgb;
  // vec3 darkColor = baseColor * ramp;
  vec3 darkColor = baseColor * 0.8;
  csm_FragColor = vec4(mix(darkColor, baseColor, factor), csm_DiffuseColor.a);
  // csm_FragColor = vec4(vec3(lightMapTex.a), 1.);

}