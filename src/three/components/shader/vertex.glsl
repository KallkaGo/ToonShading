varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vDirWs;
varying vec3 vViewNormal;
void main() {
  vUv = uv;
  vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
  vViewNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz ;
  vec4 Ws = modelMatrix * vec4(position, 1.0);
  vDirWs = normalize(cameraPosition - Ws.xyz);
}