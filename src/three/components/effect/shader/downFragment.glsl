varying vec2 vUv[5];
uniform sampler2D inputBuffer;
uniform bool uFirst;
uniform float uLuminanceThreshold;

float luminance(vec3 color) {
  return 0.2125 * color.r + 0.7154 * color.g + 0.0721 * color.b;
}

vec3 applyThreshold(vec3 color, out float luma) {
  luma = luminance(color);
  return color * max(0., luma - uLuminanceThreshold);
}

float getLumaWeight(float luma) {
  return 1. / (1. + luma);
}

void main() {
  // https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/ PPT page 164
  if(uFirst) {
    float lumac, lumatl, lumatr, lumabl, lumabr;
    vec3 c = applyThreshold(texture2D(inputBuffer, vUv[0]).rgb, lumac);
    vec3 tl = applyThreshold(texture2D(inputBuffer, vUv[1]).rgb, lumatl);
    vec3 tr = applyThreshold(texture2D(inputBuffer, vUv[2]).rgb, lumatr);
    vec3 bl = applyThreshold(texture2D(inputBuffer, vUv[3]).rgb, lumabl);
    vec3 br = applyThreshold(texture2D(inputBuffer, vUv[4]).rgb, lumabr);

    float wc = getLumaWeight(lumac);
    float wtl = getLumaWeight(lumatl);
    float wtr = getLumaWeight(lumatr);
    float wbl = getLumaWeight(lumabl);
    float wbr = getLumaWeight(lumabr);

    vec3 colorSum = tl * wtl + tr * wtr + bl * wbl + br * wbr + c * wc * 4.;
    float weightSum = wtl + wtr + wbl + wbr + wc * 4.;

    vec3 color = colorSum / weightSum;

    gl_FragColor = vec4(color, 1.0);

  } else {
    vec4 col = texture2D(inputBuffer, vUv[0]) * 4.;
    col += texture2D(inputBuffer, vUv[1]);
    col += texture2D(inputBuffer, vUv[2]);
    col += texture2D(inputBuffer, vUv[3]);
    col += texture2D(inputBuffer, vUv[4]);
    col *= .125;
    gl_FragColor = vec4(col.rgb, 1.);
  }

}