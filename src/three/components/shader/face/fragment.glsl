varying vec2 vUv;
uniform vec3 uLightPosition;
uniform vec3 uWorldDir;
uniform sampler2D uFaceLightMap;
uniform sampler2D uLightMap;

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
  /* lightMap */
  vec4 lightMapTex = texture2D(uLightMap, vUv);
  lightMapTex.g = smoothstep(.2, .3, lightMapTex.g);

  float isShadow = 0.;
  vec3 faceDir = vec3(0., 0., 1.);
  vec3 up = vec3(0., 1., 0.);
  vec3 faceLeft = cross(up, faceDir);
  vec3 lightDirH = normalize(vec3(uLightPosition.x, 0., uLightPosition.z));
  vec3 forwardVec = normalize(vec3(faceDir.x, 0., faceDir.z));
  float ctrl = 1. - (dot(forwardVec, lightDirH) * 0.5 + 0.5);
  float flag = step(0., dot(lightDirH, faceLeft)) * 2. - 1.;
  vec4 shadowTex = texture2D(uFaceLightMap, vec2(vUv.x * flag, vUv.y));
  float shadow = shadowTex.r;
  float t = dot(forwardVec, lightDirH);
  isShadow = step(shadow, ctrl);
  if(t < -0.9) {
    isShadow = 1.;
  };
  vec3 col = csm_DiffuseColor.rgb;
  vec3 darkCol = col * 0.8;
  csm_DiffuseColor = vec4(mix(col, darkCol, isShadow), 1.0);
}