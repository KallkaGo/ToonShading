attribute vec4 tangent;
attribute vec3 _uv7;
attribute vec4 color;
uniform float uOutLineWidth;
uniform vec2 uResolution;
varying vec3 vNor;
varying vec2 vUv;
void main() {
  vec3 tansTangent = normalize(tangent).xyz;
  vec3 bitangent = normalize(cross(normal, tansTangent) * tangent.w);
  mat3 tbn = mat3(tansTangent, bitangent, normal);
  vec3 aveNormal = normalize(tbn * _uv7);
  vec3 transformed = position;
  vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  vec3 viewNormal = normalize(normalMatrix * aveNormal);
  vec4 clipNormal = projectionMatrix * vec4(viewNormal, 0.0);
  vec3 ndcNormal = clipNormal.xyz * clipPosition.w;
  float aspect = abs(uResolution.y / uResolution.x);
  clipNormal.x *= aspect;
  clipPosition.xy += 0.01 * uOutLineWidth * ndcNormal.xy * color.a;
  clipPosition.z += 0.0001 * ndcNormal.z;
  gl_Position = clipPosition;
  vNor = aveNormal;
  vUv = uv;
}