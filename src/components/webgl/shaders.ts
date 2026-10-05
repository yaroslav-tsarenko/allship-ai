const noise = `
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.02;
    a *= 0.5;
  }
  return v;
}
uniform sampler2D u_field;
uniform vec4 u_extent;
vec2 field(vec2 xz) {
  vec2 uv = (xz - u_extent.xy) / (u_extent.zw - u_extent.xy);
  return texture(u_field, uv).rg;
}
float heightAt(vec2 xz, float t) {
  vec2 f = field(xz);
  float n = fbm(vec2(xz.x * 0.9, xz.y * 0.9 + t * 0.02));
  float rough = fbm(xz * 2.07 + 7.1);
  return f.x * (0.1 + f.y * (0.55 + 0.45 * rough) + n * 0.16) + (1.0 - f.x) * (n * 0.05 - 0.02);
}
`;

export const terrainVertex = (defines: string) => `#version 300 es
${defines}
precision highp float;
in vec2 a_pos;
uniform mat4 u_viewProj;
uniform float u_time;
uniform vec2 u_probe;
uniform float u_probeAmt;
uniform float u_amp;
uniform vec3 u_curve;
out float v_h;
out float v_land;
out vec3 v_world;
out float v_probe;
${noise}
void main() {
  float h = heightAt(a_pos, u_time);
  float d = distance(a_pos, u_probe);
  float bump = exp(-d * d * 7.0) * u_probeAmt;
  vec2 c = a_pos - u_curve.yz;
  float y = (h - 0.2) * u_amp + bump * 0.16 - u_curve.x * dot(c, c);
  v_h = h + bump * 0.22;
  v_land = field(a_pos).x;
  v_world = vec3(a_pos.x, y, a_pos.y);
  v_probe = d;
  gl_Position = u_viewProj * vec4(v_world, 1.0);
}
`;

export const terrainFragment = (defines: string) => `#version 300 es
${defines}
precision highp float;
in float v_h;
in float v_land;
in vec3 v_world;
in float v_probe;
uniform vec3 u_cam;
uniform vec2 u_probe;
uniform float u_reveal;
uniform float u_time;
uniform float u_probeAmt;
uniform float u_levels;
uniform float u_contrast;
uniform vec2 u_fog;
uniform vec3 u_bg;
uniform vec3 u_line;
uniform vec3 u_major;
uniform vec3 u_accent;
out vec4 outColor;
#ifdef FRAG_HEIGHT
${noise}
#endif
float rnd(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
float isoLine(float v, float width) {
  float d = 0.5 - abs(fract(v) - 0.5);
  float fw = max(fwidth(v), 1e-4);
  return 1.0 - smoothstep(0.0, fw * width, d);
}
void main() {
#ifdef FRAG_HEIGHT
  float pd = distance(v_world.xz, u_probe);
  float fh = heightAt(v_world.xz, u_time) + exp(-pd * pd * 7.0) * u_probeAmt * 0.22;
  float land = field(v_world.xz).x;
#else
  float fh = v_h;
  float land = v_land;
#endif
  float v = fh * u_levels;
  float minor = isoLine(v, 1.0);
  float major = isoLine(v / 5.0, 1.4);
  float coast = isoLine(land - 0.5, 1.6) * step(abs(land - 0.5), 0.5);
  float onLand = smoothstep(0.35, 0.65, land);
  float lines = max(minor * 0.55, major) * mix(0.28, 1.0, onLand);

  float camD = distance(u_cam, v_world);
  float fog = 1.0 - smoothstep(u_fog.x, u_fog.y, camD);

  float front = mix(2.2, -5.0, u_reveal);
  float sweep = exp(-abs(v_world.z - front) * 14.0) * (1.0 - smoothstep(0.96, 1.0, u_reveal));
  float shown = smoothstep(front - 0.02, front + 0.35, v_world.z) * (1.0 - u_reveal) + u_reveal;

  float probe = (1.0 - smoothstep(0.16, 0.4, v_probe)) * u_probeAmt;
  float fwp = max(fwidth(v_probe), 1e-4);
  float r1 = fract(u_time * 0.35) * 0.55;
  float ring = (1.0 - smoothstep(0.0, fwp * 1.4, abs(v_probe - r1))) * (1.0 - r1 / 0.55) * u_probeAmt;
  float dot0 = (1.0 - smoothstep(0.0, fwp * 1.2, abs(v_probe - 0.06))) * u_probeAmt;

  vec3 lineCol = mix(u_line, u_major, step(minor * 0.55, major));
  float a = lines * u_contrast * fog * shown;
  vec3 color = mix(u_bg, u_accent, onLand * 0.035 * fog);
  color = mix(color, lineCol, clamp(a, 0.0, 1.0));
  color = mix(color, u_accent, clamp(coast * 0.75 * fog * shown * u_contrast, 0.0, 1.0));
  color = mix(color, u_accent, clamp(probe * lines * 0.9 + max(ring * 0.8, dot0), 0.0, 1.0) * fog);
  color = mix(color, u_accent, clamp(sweep * (lines + coast) * 1.2, 0.0, 1.0));
  color += (rnd(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(color, 1.0);
}
`;

export const laneVertex = `#version 300 es
precision highp float;
in vec3 a_pos;
in vec3 a_tan;
in float a_side;
in float a_t;
in vec3 a_meta;
uniform mat4 u_viewProj;
uniform vec2 u_res;
uniform float u_width;
out float v_side;
out float v_t;
out vec3 v_meta;
out float v_depth;
void main() {
  vec4 c0 = u_viewProj * vec4(a_pos, 1.0);
  vec4 c1 = u_viewProj * vec4(a_pos + normalize(a_tan) * 0.02, 1.0);
  vec2 s0 = c0.xy / c0.w * u_res;
  vec2 s1 = c1.xy / c1.w * u_res;
  vec2 dir = normalize(s1 - s0 + vec2(1e-6));
  vec2 n = vec2(-dir.y, dir.x);
  c0.xy += n * a_side * u_width / u_res * c0.w;
  v_side = a_side;
  v_t = a_t;
  v_meta = a_meta;
  v_depth = c0.w;
  gl_Position = c0;
}
`;

export const laneFragment = `#version 300 es
precision highp float;
in float v_side;
in float v_t;
in vec3 v_meta;
in float v_depth;
uniform float u_time;
uniform float u_reveal;
uniform float u_alpha;
uniform vec2 u_fog;
uniform vec3 u_lane;
uniform vec3 u_ship;
out vec4 outColor;
void main() {
  float x = v_side;
  float core = exp(-x * x * 26.0);
  float halo = exp(-x * x * 4.0);
  float flow = 0.55 + 0.45 * smoothstep(0.35, 0.5, abs(fract(v_t * v_meta.z * 7.0 - u_time * 0.6) - 0.5));
  float trail = 0.0;
  for (int k = 0; k < 2; k++) {
    float head = fract(u_time * v_meta.x + v_meta.y + float(k) * 0.5);
    float d = head - v_t;
    trail += step(0.0, d) * step(d, 0.22) * exp(-d * 16.0);
  }
  float grow = smoothstep(0.0, 0.15, u_reveal * 1.15 - v_t * 0.85);
  float fog = 1.0 - smoothstep(u_fog.x, u_fog.y, v_depth);
  float base = (core * 0.7 * flow + halo * 0.12) * grow;
  float hot = trail * (core + halo * 0.35);
  vec3 col = mix(u_lane, u_ship, clamp(hot * 1.4, 0.0, 1.0));
  float alpha = clamp((base + hot) * u_alpha * fog, 0.0, 1.0);
  outColor = vec4(col * alpha, alpha);
}
`;

export const pointVertex = `#version 300 es
precision highp float;
in vec3 a_pos;
in float a_kind;
uniform mat4 u_viewProj;
uniform float u_size;
uniform float u_time;
out float v_kind;
out float v_depth;
out float v_pulse;
void main() {
  vec4 c = u_viewProj * vec4(a_pos, 1.0);
  v_kind = a_kind;
  v_depth = c.w;
  v_pulse = fract(u_time * 0.4 + a_pos.x * 0.37);
  float s = a_kind > 0.5 ? 1.0 : 1.9;
  gl_PointSize = u_size * s * clamp(3.2 / c.w, 0.55, 1.4);
  gl_Position = c;
}
`;

export const pointFragment = `#version 300 es
precision highp float;
in float v_kind;
in float v_depth;
in float v_pulse;
uniform vec3 u_lane;
uniform vec3 u_ship;
uniform float u_alpha;
uniform vec2 u_fog;
out vec4 outColor;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r = length(p);
  float fog = 1.0 - smoothstep(u_fog.x, u_fog.y, v_depth);
  float aa = fwidth(r) * 1.5;
  vec3 col;
  float alpha;
  if (v_kind > 0.5) {
    float disc = 1.0 - smoothstep(0.62 - aa, 0.62 + aa, r);
    float rim = 1.0 - smoothstep(0.0, aa * 1.6, abs(r - 0.82));
    col = u_ship;
    alpha = max(disc, rim * 0.55);
  } else {
    float disc = 1.0 - smoothstep(0.2 - aa, 0.2 + aa, r);
    float ring = (1.0 - smoothstep(0.0, aa * 1.8, abs(r - (0.25 + v_pulse * 0.7)))) * (1.0 - v_pulse);
    float halo = (1.0 - smoothstep(0.2, 0.42, r)) * 0.35;
    col = u_lane;
    alpha = max(max(disc, ring * 0.7), halo);
  }
  alpha *= u_alpha * fog;
  if (alpha < 0.003) discard;
  outColor = vec4(col * alpha, alpha);
}
`;
