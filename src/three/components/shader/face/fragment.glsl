varying vec2 vUv;
uniform vec3 uLightPosition;
uniform sampler2D uFaceLightMap;
uniform sampler2D uLightMap;
uniform float uIsDay;
uniform sampler2D uRampMap;
uniform vec3 uForwardVec;
uniform vec3 uLeftVec;

float RampRow = 5.;

vec3 multiplySampler(sampler2D tex, vec2 texCoord) {
  vec3 texColor1 = texture2D(tex, texCoord).rgb;
  vec3 texColor2 = texture2D(tex, texCoord + vec2(0.005, 0.0)).rgb;
  vec3 texColor3 = texture2D(tex, texCoord + vec2(-0.005, 0.0)).rgb;
  vec3 texColor4 = texture2D(tex, texCoord + vec2(0.0, 0.005)).rgb;
  vec3 texColor5 = texture2D(tex, texCoord + vec2(0.0, -0.005)).rgb;
  vec3 faceShadowTex = (texColor1 + texColor2 + texColor3 + texColor4 + texColor5) / 5.0;
  return faceShadowTex;
}

void main() {
  /* 处理数据 */
  vec3 forwardVec = normalize(uForwardVec);
  vec3 leftVec = normalize(uLeftVec);
  vec3 lightVec = normalize(uLightPosition);
  vec3 upVector = cross(forwardVec, leftVec);

  vec3 LpU = dot(lightVec, upVector) / pow(length(upVector), 2.) * upVector;
  vec3 LpHeadHorizon = normalize(lightVec - LpU);

  float value = acos(dot(LpHeadHorizon, leftVec)) / PI;

  // 0-0.5 expose left 0.5-1 expose right
  float exposeLeft = step(value, 0.5);

  // left: map 0-0.5 to 1-0, right: map 0.5-1 to 0-1
  float valueL = pow(1. - value * 2., 3.);
  float valueR = pow(value * 2. - 1., 3.);

  float mixValue = mix(valueR, valueL, exposeLeft);

  float sdfRembrandLeft = texture2D(uFaceLightMap, vec2(1. - vUv.x, vUv.y)).r;
  float sdfRembrandRight = texture2D(uFaceLightMap, vUv).r;
  // 混合左右脸的sdf
  float mixSdf = mix(sdfRembrandLeft, sdfRembrandRight, exposeLeft);
  // 当value小于sdf的就是亮面 
  float sdf = step(mixValue, mixSdf);
  // 判断光照是否在后面
  sdf = mix(0., sdf, step(0., dot(LpHeadHorizon, forwardVec)));

  /* 计算rampV */
  float rampV = RampRow / 10. - .05;
  float rampClampMin = .003;

  vec2 rampDayUV = vec2(rampClampMin, 1. - rampV);
  vec2 rampNightUV = vec2(rampClampMin, 1. - (rampV + .5));

  float isDay = (uIsDay + 1.) * .5;

  vec3 rampColor = mix(texture2D(uRampMap, rampNightUV), texture2D(uRampMap, rampDayUV), isDay).rgb;

  vec3 col = csm_DiffuseColor.rgb;
  vec3 darkCol = col * rampColor;

  csm_Emissive = mix(darkCol, col, sdf);
  // csm_Emissive = vec3(sdf);
  csm_Roughness = 1.;
  csm_Metalness = 0.;
}