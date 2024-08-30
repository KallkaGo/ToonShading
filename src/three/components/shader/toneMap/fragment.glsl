uniform float uMaxLuminanice;
uniform float uContrast;
uniform float uLinearSectionStart;
uniform float uLinearSectionLength;
uniform float uBlackTightnessC;
uniform float uBlackTightnessB;
uniform float uEnabled;

const float e = 2.71828;

float W_f(float x, float e0, float e1) {
  if(x <= e0)
    return 0.;
  if(x >= e1)
    return 1.;
  float a = (x - e0) / (e1 - e0);
  return a * a * (3. - 2. * a);
}
float H_f(float x, float e0, float e1) {
  if(x <= e0)
    return 0.;
  if(x >= e1)
    return 1.;
  return (x - e0) / (e1 - e0);
}

float GranTurismoTonemapper(float x) {
  float P = uMaxLuminanice;
  float a = uContrast;
  float m = uLinearSectionStart;
  float l = uLinearSectionLength;
  float c = uBlackTightnessC;
  float b = uBlackTightnessB;
  float l0 = (P - m) * l / a;
  float L0 = m - m / a;
  float L1 = m + (1. - m) / a;
  float L_x = m + a * (x - m);
  float T_x = m * pow(x / m, c) + b;
  float S0 = m + l0;
  float S1 = m + a * l0;
  float C2 = a * P / (P - S1);
  // float S_x = P - (P - S1) * pow(e, -(C2 * (x - S0) / P));
  float S_x = P - (P - S1) * exp(-(C2 * (x - S0) / P));

  float w0_x = 1. - W_f(x, 0., m);
  float w2_x = H_f(x, m + l0, m + l0);

  float w1_x = 1. - w0_x - w2_x;
  float f_x = T_x * w0_x + L_x * w1_x + S_x * w2_x;
  return f_x;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float r = GranTurismoTonemapper(inputColor.r);
  float g = GranTurismoTonemapper(inputColor.g);
  float b = GranTurismoTonemapper(inputColor.b);
  vec3 col = vec3(0.);
  col += mix(vec3(inputColor.r, inputColor.g, inputColor.b), vec3(r, g, b), uEnabled);
  outputColor = vec4(col, inputColor.a);
}