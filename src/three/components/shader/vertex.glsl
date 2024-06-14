varying vec2 vUv;
varying vec3 vWorldNormal;
void main() {
  vUv = uv;
  vWorldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
}