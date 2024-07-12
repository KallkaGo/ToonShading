attribute vec4 tangent;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldTangent;
varying vec3 vWorldBitangent;
varying vec3 vDirWs;
varying vec4 vScreenPos;
varying mat4 vViewMatrix;

vec4 ComputeScreenPos(vec4 pos) {
  vec4 o = pos * 0.5;
  o.xy = vec2(o.x, o.y) + o.w;
  o.zw = pos.zw;
  return o;
}

void main() {
  vUv = uv;
  vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
  vec3 transTangent = (modelMatrix * vec4(tangent.xyz, 0.0)).xyz;
  vWorldTangent = normalize(transTangent);
  vWorldBitangent = normalize(cross(vWorldNormal, vWorldTangent) * tangent.w);
  vec4 Ws = modelMatrix * vec4(position, 1.0);
  vDirWs = normalize(cameraPosition - Ws.xyz);
  vec4 clipPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vScreenPos = ComputeScreenPos(clipPos);
  vViewMatrix = viewMatrix;
}