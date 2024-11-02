attribute vec4 tangent;
attribute vec3 _uv7;
uniform float uOutLineWidth;
uniform vec2 uResolution;
varying vec3 vNor;
varying vec2 vUv;
varying float uOpacity;

void main() {
  vec3 tansTangent = normalize(tangent.xyz);
  vec3 bitangent = normalize(cross(normal, tansTangent) * tangent.w);
  mat3 tbn = mat3(tansTangent, bitangent, normal);
  vec3 aveNormal = normalize(tbn * _uv7);
  vec3 trans = position;
  vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(trans, 1.0);
  vec3 viewNormal = normalize(normalMatrix * aveNormal);
  vec4 clipNormal = projectionMatrix * vec4(viewNormal, 0.0);
  vec3 ndcNormal = clipNormal.xyz;
  float aspect = abs(uResolution.y / uResolution.x);
  clipNormal.x *= aspect;
  /* in Opengl clip space w = -zView  */
  float ctrlCSw = clamp(clipPosition.w, .5, 3.);
  clipPosition.xy += 0.01 * uOutLineWidth * ndcNormal.xy * color.a * ctrlCSw;
  // clipPosition.z += 0.0001 * ndcNormal.z;
  uOpacity = step(.001, uOutLineWidth);
  csm_PositionRaw = clipPosition;
  vNor = aveNormal;
  vUv = uv;
}