/*!
 * OrbSphere — procedural voice-sphere (Aura / Sunset), transparent background.
 * Self-contained WebGL. No dependencies, no image assets. ~1 draw call/frame.
 *
 *   import { OrbSphere } from './orb-sphere.js';
 *   const orb = new OrbSphere(document.getElementById('orb'), { speed: 1 });
 *   // orb.setSpeed(1.5); orb.pause(); orb.play(); orb.destroy();
 *
 * Or as a custom element (auto-registered):
 *   <orb-sphere speed="1" style="width:320px;height:320px"></orb-sphere>
 *
 * The orb is drawn on a transparent canvas — it composites over whatever is
 * behind it. Frozen look: Aura scene, Sunset palette, passes shell+front+rear
 * +depth+cyan. Config is baked into the shader (see the constants block).
 */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uSpeed;

/* ---- baked config (Aura scene · Sunset palette · shell+front+rear+depth+cyan) ---- */
const vec3  INK_FRONT = vec3(0.90980, 0.56863, 0.16863);  // #E8912B warm amber (front face)
const vec3  INK_BACK  = vec3(0.65882, 0.12157, 0.25882);  // #A81F42 deep crimson (back face)
const float BEND_A = 0.3155, BEND_K = 0.8825;
const float TWIST  = -1.5973, TWIST_PH = 0.4132;
const float HALF_TH = 0.5576, WIDTH = 1.0282, DENS_SHARP = 0.9486, WIDTH_OFF = 0.0;
const float TH_PH  = 2.8613;
const float SIGMA  = 0.6524;   // extinction (Sunset light-boost baked in)

/* ---- Ashima simplex noise 3D ---- */
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 pp = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = pp - 49.0 * floor(pp * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m*m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes.xy) / uRes.y;
  float flow = uTime * 0.16 * uSpeed;
  float thb  = flow * 4.56;                      // rotation clock

  vec3 ro = vec3(0.0, 0.0, 5.4);
  vec3 rd = normalize(vec3(uv, -1.75));
  float R = 1.14;

  float b = dot(ro, rd);
  float c = dot(ro, ro) - R*R;
  float disc = b*b - c;

  // transparent silhouette (anti-aliased): alpha 1 inside the sphere, 0 outside
  float dca = length(ro - rd*dot(ro, rd));
  float alpha = smoothstep(R + 0.012, R - 0.012, dca);
  vec3 col = vec3(1.0);

  if(disc > 0.0){
    float dist  = -b - sqrt(disc);
    float dist2 = -b + sqrt(disc);
    vec3 p = ro + rd*dist;
    vec3 n = normalize(p);

    float th = -1.5708 + TH_PH + thb + 0.42*sin(thb);
    float cth = cos(th), sth = sin(th);
    float tl = -0.18, ctl = cos(tl), stl = sin(tl);

    vec3 Tr = vec3(1.0);
    vec3 Lo = vec3(0.0);
    float path = 0.0;
    const int STEPS = 32;
    float dstep = (dist2 - dist)/float(STEPS);
    for(int i=0;i<STEPS;i++){
      vec3 pw = ro + rd*(dist + (float(i)+0.5)*dstep);
      vec3 q1 = vec3(ctl*pw.x + stl*pw.y, -stl*pw.x + ctl*pw.y, pw.z);
      vec3 q  = vec3(q1.x, cth*q1.y + sth*q1.z, -sth*q1.y + cth*q1.z);
      float ph = TWIST*q.x + TWIST_PH + 0.06*sin(flow*0.23);
      float cp = cos(ph), spn = sin(ph);
      vec2 yz = vec2(cp*q.y + spn*q.z, -spn*q.y + cp*q.z);
      float ctr = BEND_A*sin(BEND_K*q.x) + 0.055*snoise(vec3(q.x*1.15, 2.0, 4.7));
      float mid = yz.y - ctr;
      float dens = smoothstep(HALF_TH, HALF_TH*DENS_SHARP, abs(mid));
      dens *= smoothstep(WIDTH, WIDTH*0.63, abs(yz.x - WIDTH_OFF));
      dens *= 1.0 + 0.18*snoise(vec3(q.x*0.8 - 0.7, yz.x*0.8 + 0.4, 1.3));
      if(dens > 0.002){
        vec3 nT = normalize(vec3(-BEND_A*BEND_K*cos(BEND_K*q.x), 0.0, 1.0));
        vec3 nO = vec3(nT.x, cp*nT.y - spn*nT.z, spn*nT.y + cp*nT.z);
        vec3 n1 = vec3(nO.x, cth*nO.y - sth*nO.z, sth*nO.y + cth*nO.z);
        vec3 nW = vec3(ctl*n1.x - stl*n1.y, stl*n1.x + ctl*n1.y, n1.z);
        float facing = dot(nW, -rd);
        float wF = smoothstep(-0.55, 0.50, facing);              // smooth face blend
        vec3 mat = INK_FRONT*wF + INK_BACK*(1.0 - wF);           // front+rear on
        vec3 kext = SIGMA*(1.06 - mat);                          // depth on (colored absorption)
        vec3 aS = 1.0 - exp(-dens*kext*dstep);
        Lo += Tr * aS * mat * 1.55 * (0.78 + 0.42*abs(facing));
        Tr *= 1.0 - aS;
        path += dens*dstep;
      }
    }

    // shell (frosted acrylic) — shadow & dissolve passes OFF in this config
    float rr = length(p.xy)/R;
    vec3 white = vec3(0.975, 0.983, 1.0);
    float diff = 0.5 + 0.5*dot(n, normalize(vec3(-0.25, 0.55, 0.8)));
    vec3 shell = white * mix(0.94, 1.02, diff);
    shell *= 1.0 + 0.012*snoise(vec3(p.xy*24.0, 3.0));
    shell *= 1.0 - 0.06*smoothstep(0.62, 1.0, rr);
    vec3 cc = Lo + Tr*shell;

    // cyan/blue reflection lower-right (pass ON) — tinted by the ink
    vec2 dirLR = normalize(vec2(0.62, -0.79));
    float reflW = 0.16*smoothstep(0.40, 0.98, rr)*max(dot(normalize(p.xy + vec2(1e-4)), dirLR), 0.0);
    cc = mix(cc, mix(vec3(1.0), INK_FRONT, 0.62), reflW);
    // rim frost
    cc = mix(cc, vec3(1.0), pow(1.0-max(dot(n,-rd),0.0), 2.6)*0.30);
    col = cc;
  }

  gl_FragColor = vec4(col*alpha, alpha);   // premultiplied alpha (transparent bg)
}
`;

export class OrbSphere {
  /**
   * @param {HTMLElement} container  element to fill with the orb canvas
   * @param {{speed?:number, dpr?:number, autoplay?:boolean}} [opts]
   */
  constructor(container, opts = {}) {
    this.container = container;
    this.speed = opts.speed ?? 1;
    this.dprCap = opts.dpr ?? 2;
    this._raf = 0;
    this._t0 = null;
    this._paused = !(opts.autoplay ?? true);

    const canvas = (this.canvas = document.createElement("canvas"));
    canvas.style.cssText = "display:block;width:100%;height:100%;background:transparent";
    container.appendChild(canvas);

    const gl = (this.gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    }));
    if (!gl) { console.error("OrbSphere: WebGL unavailable"); return; }

    const prog = (this.prog = this._program(VERT, FRAG));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.U = {
      uRes: gl.getUniformLocation(prog, "uRes"),
      uTime: gl.getUniformLocation(prog, "uTime"),
      uSpeed: gl.getUniformLocation(prog, "uSpeed"),
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied compositing

    this._reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this._onResize = () => this._resize();
    addEventListener("resize", this._onResize);
    this._ro = new ResizeObserver(this._onResize);
    this._ro.observe(container);
    // pause when scrolled out of view
    this._io = new IntersectionObserver((e) => { this._visible = e[0].isIntersecting; });
    this._io.observe(container);
    this._visible = true;

    this._resize();
    this._frame = this._frame.bind(this);
    this._raf = requestAnimationFrame(this._frame);
  }

  _program(vs, fs) {
    const gl = this.gl;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    return p;
  }

  _resize() {
    const gl = this.gl; if (!gl) return;
    const dpr = Math.min(devicePixelRatio || 1, this.dprCap);
    const w = this.container.clientWidth || 256;
    const h = this.container.clientHeight || 256;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  _frame(now) {
    this._raf = requestAnimationFrame(this._frame);
    const gl = this.gl; if (!gl) return;
    if (this._t0 == null) this._t0 = now;
    if (this._paused || !this._visible) { this._t0 = now - (this._tLast || 0) * 1000; return; }
    const t = (this._tLast = (now - this._t0) / 1000) * (this._reduced ? 0.25 : 1);
    gl.uniform2f(this.U.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.U.uTime, t);
    gl.uniform1f(this.U.uSpeed, this.speed);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  setSpeed(v) { this.speed = v; }
  play() { this._paused = false; }
  pause() { this._paused = true; }
  destroy() {
    cancelAnimationFrame(this._raf);
    removeEventListener("resize", this._onResize);
    this._ro?.disconnect();
    this._io?.disconnect();
    const gl = this.gl;
    if (gl) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    this.canvas?.remove();
  }
}

/* Optional custom element: <orb-sphere speed="1"></orb-sphere> */
if (typeof customElements !== "undefined" && !customElements.get("orb-sphere")) {
  class OrbSphereElement extends HTMLElement {
    connectedCallback() {
      this.style.display ||= "inline-block";
      this._orb = new OrbSphere(this, { speed: parseFloat(this.getAttribute("speed") || "1") });
    }
    disconnectedCallback() { this._orb?.destroy(); }
    static get observedAttributes() { return ["speed"]; }
    attributeChangedCallback(name, _o, v) {
      if (name === "speed" && this._orb) this._orb.setSpeed(parseFloat(v || "1"));
    }
  }
  customElements.define("orb-sphere", OrbSphereElement);
}

export default OrbSphere;
