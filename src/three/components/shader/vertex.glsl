attribute vec4 tangent;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldTangent;
varying vec3 vWorldBitangent;
varying vec3 vDirWs;
varying vec3 vViewNormal;

void main() {
  vUv = uv;
  vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
  vec3 transTangent = (modelMatrix * vec4(tangent.xyz, 0.0)).xyz;
  vWorldTangent = normalize(transTangent);
  vWorldBitangent = normalize(cross(vWorldNormal, vWorldTangent) * tangent.w);
  vViewNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz;
  vec4 Ws = modelMatrix * vec4(position, 1.0);
  vDirWs = normalize(cameraPosition - Ws.xyz);
}