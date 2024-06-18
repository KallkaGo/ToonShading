varying vec2 vUv;
varying vec3 vWorldNormal;
uniform vec3 uLightPosition;
uniform sampler2D uLightMap;
uniform sampler2D uRampMap;
uniform float uIsDay;
uniform bool uHair;

float RampMapRow0 = 1.;
float RampMapRow1 = 4.;
float RampMapRow2 = 3.;
float RampMapRow3 = 5.;
float RampMapRow4 = 2.;

void main() {

  /* lightMap */
  vec4 lightMapTex = texture2D(uLightMap, vUv);
  lightMapTex.g = smoothstep(.2, .3, lightMapTex.g);
  vec3 nor = normalize(vWorldNormal);
  vec3 dirL = normalize(uLightPosition);
  float NDotV = dot(nor, dirL);
  float halfLambert = pow(NDotV * .5 + .5, 2.)* lightMapTex.g;

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

  float uIsDay = (uIsDay + 1.) * .5;
  vec3 col = mix(texture2D(uRampMap, nightUV).rgb, texture2D(uRampMap, dayUV).rgb, uIsDay);
  vec4 baseColor = csm_DiffuseColor;
  csm_DiffuseColor = vec4(vec3(col * baseColor.rgb), baseColor.a);
} 