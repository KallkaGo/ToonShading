varying vec2 vUv;
uniform vec3 uLightPosition;
uniform sampler2D uFaceLightMap;
uniform float uIsDay;
uniform sampler2D uRampMap;
uniform vec3 uForwardVec;
uniform vec3 uRightVec;
uniform vec2 uResolution;
uniform float uIntensity;

float RampRow = 5.;

void main() {
  /* 处理数据 */
  vec3 forwardVec = normalize(uForwardVec);
  vec3 rightVec = normalize(uRightVec);
  vec3 lightVec = normalize(uLightPosition);
  vec3 upVector = cross(forwardVec, rightVec);

  vec3 LpU = dot(lightVec, upVector) / pow(length(upVector), 2.) * upVector;
  vec3 LpHeadHorizon = normalize(lightVec - LpU);

  float value = acos(dot(LpHeadHorizon, rightVec)) / PI;

  // 0-0.5 expose left 0.5-1 expose right （base face）
  float exposeLeft = step(value, 0.5);

  float l = clamp(value, 0., 0.5);

  float r = clamp(value, 0.5, 1.0);

  // left: map 0-0.5 to 1-0, right: map 0.5-1 to 0-1
  float valueL = pow(1. - l * 2., uIntensity);
  float valueR = pow(r * 2. - 1., uIntensity);

  float mixValue = mix(valueR, valueL, exposeLeft);

  vec2 pixelSize = vec2(1. / uResolution.x, 1. / uResolution.y);

  vec2 offsets[4];
  offsets[0] = vec2(-pixelSize.x, pixelSize.y);//↖
  offsets[1] = vec2(pixelSize.x, pixelSize.y);//↗
  offsets[2] = vec2(-pixelSize.x, -pixelSize.y);//↙
  offsets[3] = vec2(pixelSize.x, -pixelSize.y);//↘

  float sdfRembrandLeft = 0.;
  float sdfRembrandRight = 0.;

  for(int i = 0; i < 4; i++) {
    vec2 offsetUv = vUv + offsets[i];
    float sdfSampleLeft = texture2D(uFaceLightMap, vec2(1. - offsetUv.x, offsetUv.y)).r;
    float sdfSampleRight = texture2D(uFaceLightMap, offsetUv).r;
    sdfRembrandLeft += sdfSampleLeft;
    sdfRembrandRight += sdfSampleRight;
  }

  sdfRembrandLeft /= 4.;
  sdfRembrandRight /= 4.;

  // 混合左右脸的sdf
  float mixSdf = mix(sdfRembrandLeft, sdfRembrandRight, exposeLeft);

  // 当value小于sdf的就是亮面 
  float sdf = step(mixValue, mixSdf);

  // 判断光照是否在后面
  sdf = mix(0., sdf, step(0., dot(LpHeadHorizon, forwardVec)));

  /* 计算rampV */
  float rampV = RampRow / 10. - .05;
  float rampClampMin = .5;

  vec2 rampDayUV = vec2(rampClampMin, 1. - rampV);
  vec2 rampNightUV = vec2(rampClampMin, 1. - rampV);


  float isDay = (uIsDay + 1.) * .5;

  vec3 rampColor = mix(texture2D(uRampMap, rampNightUV), texture2D(uRampMap, rampDayUV), isDay).rgb;

  vec3 col = csm_DiffuseColor.rgb;
  vec3 darkCol = col * rampColor;

  csm_Emissive = mix(darkCol, col, sdf);
  // csm_Emissive = vec3(sdf);

  csm_Roughness = 1.;
  csm_Metalness = 0.;
}