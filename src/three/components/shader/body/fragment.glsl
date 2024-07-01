varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldTangent;
varying vec3 vWorldBitangent;
varying vec3 vDirWs;
varying vec3 vViewNormal;
uniform vec3 uLightPosition;
uniform sampler2D uLightMap;
uniform sampler2D uRampMap;
uniform sampler2D uMetalMap;
uniform sampler2D uNormalMap;
uniform sampler2D uEmissiveMap;
uniform float uIsDay;
uniform vec3 uShadowColor;
uniform float uNoMetallic;
uniform float uMetallic;
uniform float uTime;

float RampMapRow0 = 1.;
float RampMapRow1 = 4.;
float RampMapRow2 = 3.;
float RampMapRow3 = 5.;
float RampMapRow4 = 2.;

void main() {
  /* 处理需要的数据 */

  /* normalMap */
  vec4 normalTex = texture2D(uNormalMap, vUv);
  vec3 normalTs = vec3(normalTex.rg * 2. - 1., 0.);
  normalTs.z = sqrt(1. - dot(normalTs.xy, normalTs.xy));

  mat3 tbn = mat3(normalize(vWorldTangent), normalize(vWorldBitangent), normalize(vWorldNormal));

  vec3 worldNormal = normalize(tbn * normalTs);

  vec3 dirL = normalize(uLightPosition);
  vec3 hDirWS = normalize(vDirWs + dirL);

  vec2 matcapUV = (normalize(vViewNormal.xy) + 1.) * .5;

  float NDotL = dot(worldNormal, dirL); //lambert

  NDotL = max(NDotL, 0.);

  float NDotH = dot(worldNormal, hDirWS); //Blinn-Phong

  float NdotV = dot(worldNormal, vDirWs); //fresnel

  /* lightMap */
  vec4 lightMapTex = texture2D(uLightMap, vUv);

  float halfLambert = pow(NDotL * .5 + .5, 2.);
  float lamberStep = smoothstep(.42, .45, halfLambert);

  /* 枚举样条阈值 */
  float matEnum0 = .0;
  float matEnum1 = .3;
  float matEnum2 = .5;
  float matEnum3 = .7;
  float matEnum4 = 1.;

  /* 计算每一行样条的中心点 */
  float ramp0 = RampMapRow0 / 10. - .05;
  float ramp1 = RampMapRow1 / 10. - .05;
  float ramp2 = RampMapRow2 / 10. - .05;
  float ramp3 = RampMapRow3 / 10. - .05;
  float ramp4 = RampMapRow4 / 10. - .05;

  /* 根据魔法图alpha通道的阈值 计算rampV */
  float dayRampV = mix(ramp4, ramp3, step(lightMapTex.a, (matEnum4 + matEnum3) * .5));
  dayRampV = mix(dayRampV, ramp2, step(lightMapTex.a, (matEnum3 + matEnum2) * .5));
  dayRampV = mix(dayRampV, ramp1, step(lightMapTex.a, (matEnum2 + matEnum1) * .5));
  dayRampV = mix(dayRampV, ramp0, step(lightMapTex.a, (matEnum1 + matEnum0) * .5));

  float nightRampV = dayRampV + .5;

  float rampClampMin = .003;
  float rampClampMax = .997;

  /* 防止取到边界 */
  float rampU = clamp(smoothstep(.2, .4, halfLambert), rampClampMin, rampClampMax);
  vec2 dayUV = vec2(rampU, 1. - dayRampV);
  vec2 nightUV = vec2(rampU, 1. - nightRampV);

  vec2 darkDayUV = vec2(rampClampMin, 1. - dayRampV);
  vec2 darkNightUV = vec2(rampClampMin, 1. - nightRampV);

  float uIsDay = (uIsDay + 1.) * .5;
  vec3 rampGreyColor = mix(texture2D(uRampMap, nightUV).rgb, texture2D(uRampMap, dayUV).rgb, uIsDay);
  vec3 rampDarkColor = mix(texture2D(uRampMap, darkNightUV).rgb, texture2D(uRampMap, darkDayUV).rgb, uIsDay);

  vec4 baseColor = csm_DiffuseColor;

  vec3 grayShadowColor = baseColor.rgb * rampGreyColor * uShadowColor;
  vec3 darkShadowColor = baseColor.rgb * rampDarkColor * uShadowColor;

  /* light.g > 0.5的部分受光照影响 */
  vec3 diffuse = vec3(0.);
  diffuse = mix(grayShadowColor, baseColor.rgb, lamberStep);
  diffuse = mix(darkShadowColor, diffuse, clamp(lightMapTex.g * 2., 0., 1.));
  diffuse = mix(diffuse, baseColor.rgb, clamp((lightMapTex.g - .5), 0., 1.) * 2.);

  float blinPhong = step(0., NDotL) * pow(max(NDotH, 0.), 10.);
  /* 避免漏光 */
  vec3 noMetalicSpec = vec3(step(1.04 - blinPhong, lightMapTex.b) * lightMapTex.r) * uNoMetallic;

  /*根据光的方向有一个衰减 这里设置的下限是0.2 ，光滑的非金属表面是不吸收颜色的，但是金属会吸收 所以需要乘以baseColor */
  vec3 metalicSpec = vec3(blinPhong * lightMapTex.b * (lamberStep * .8 + .2) * baseColor.rgb) * uMetallic;

  /* 根据魔法图r通道提取金属区域 */
  float isMetal = step(.95, lightMapTex.r);

  vec3 finalSpec = mix(noMetalicSpec, metalicSpec, isMetal);

  vec3 metallic = mix(vec3(0.), texture2D(uMetalMap, matcapUV).rgb * baseColor.rgb, isMetal);

  float fresnel = clamp(pow(1. - NdotV, 7.), 0., .5);

  /* 边缘光 */
  vec3 rimLight = baseColor.rgb * fresnel;
  /* 自发光 */
  vec4 emissiveTex = texture2D(uEmissiveMap, vUv);
  emissiveTex.a = smoothstep(0., 1., emissiveTex.a);

  vec3 glow = mix(vec3(0.), emissiveTex.rgb * abs(sin(uTime)) * .15, emissiveTex.a);

  vec3 albedo = diffuse + finalSpec + metallic + glow;

  if(baseColor.a < .5) {
    discard;
  }

  csm_Emissive = albedo;
  csm_Roughness = 1.;
  csm_Metalness = 0.;
}