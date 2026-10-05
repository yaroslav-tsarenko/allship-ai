import { curveFn, fovFor, sceneConfig, type Pose, type RouteFieldVariant } from "./config";
import { buildField, buildLanes, citiesForLanes, cityPoints, EXTENT, laneHead, pointOnLane } from "./geo";
import { basis, lerp, lerp3, lookAt, multiply, parseColor, perspective, type Vec3 } from "./math";
import { laneFragment, laneVertex, pointFragment, pointVertex, terrainFragment, terrainVertex } from "./shaders";

export type MountOptions = {
  variant: RouteFieldVariant;
  intensity: number;
  frozenAt: number | null;
  force: boolean;
  signal: AbortSignal;
  onReady: () => void;
  onHalt: () => void;
};

export type SceneHandle = { dispose: () => void; setPaused: (paused: boolean) => void };

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i;

type GL = WebGL2RenderingContext;

function compile(gl: GL, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) throw new Error("shader");
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(log ?? "compile");
  }
  return s;
}

function program(gl: GL, vs: string, fs: string) {
  const p = gl.createProgram();
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return p;
}

function uniforms<K extends string>(gl: GL, p: WebGLProgram, names: readonly K[]) {
  return Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, `u_${n}`)])) as Record<K, WebGLUniformLocation | null>;
}

function grid(n: number) {
  const verts = new Float32Array((n + 1) * (n + 1) * 2);
  let k = 0;
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      verts[k++] = EXTENT.x0 + ((EXTENT.x1 - EXTENT.x0) * i) / n;
      verts[k++] = EXTENT.z0 + ((EXTENT.z1 - EXTENT.z0) * j) / n;
    }
  }
  const idx = new Uint32Array(n * n * 6);
  k = 0;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i;
      const c = a + n + 1;
      idx.set([a, c, a + 1, a + 1, c, c + 1], k);
      k += 6;
    }
  }
  return { verts, idx };
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export async function mountScene(canvas: HTMLCanvasElement, host: HTMLElement, opts: MountOptions): Promise<SceneHandle | null> {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: opts.frozenAt !== null });
  if (!gl) return null;
  const release = () => gl.getExtension("WEBGL_lose_context")?.loseContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  if (!opts.force && SOFTWARE.test(renderer)) {
    release();
    return null;
  }
  const alive = () => !opts.signal.aborted;
  const field = await buildField(alive);
  if (!field || !alive() || gl.isContextLost()) {
    release();
    return null;
  }

  const cfg = sceneConfig(opts.variant, opts.intensity);
  const small = window.innerWidth < 768;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const frozen = opts.frozenAt;
  const defines = small ? "" : "#define FRAG_HEIGHT";
  const curve = curveFn(cfg.curve);

  let terrainP: WebGLProgram;
  let laneP: WebGLProgram;
  let pointP: WebGLProgram;
  try {
    terrainP = program(gl, terrainVertex(defines), terrainFragment(defines));
    laneP = program(gl, laneVertex, laneFragment);
    pointP = program(gl, pointVertex, pointFragment);
  } catch (e) {
    console.error("[route-field]", e);
    release();
    return null;
  }

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, field.w, field.h, 0, gl.RG, gl.UNSIGNED_BYTE, field.data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const buffers: WebGLBuffer[] = [];
  const vaos: WebGLVertexArrayObject[] = [];
  const buffer = (target: number, data: BufferSource, usage: number = gl.STATIC_DRAW) => {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, usage);
    buffers.push(b);
    return b;
  };
  const attrib = (p: WebGLProgram, name: string, size: number, stride: number, offset: number) => {
    const loc = gl.getAttribLocation(p, name);
    if (loc < 0) return;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, offset * 4);
  };

  const g = grid(small ? 150 : 230);
  const terrainVao = gl.createVertexArray();
  vaos.push(terrainVao);
  gl.bindVertexArray(terrainVao);
  buffer(gl.ARRAY_BUFFER, g.verts);
  attrib(terrainP, "a_pos", 2, 2, 0);
  buffer(gl.ELEMENT_ARRAY_BUFFER, g.idx);
  gl.bindVertexArray(null);

  const lanes = cfg.lanes > 0 ? buildLanes(field, cfg.lanes, cfg.amp, curve) : [];
  const laneStride = 11;
  const perLane = lanes[0]?.points.length ?? 0;
  const laneData = new Float32Array(lanes.length * perLane * 2 * laneStride);
  const laneIdx = new Uint16Array(lanes.length * (perLane - 1) * 6);
  let lk = 0;
  let ik = 0;
  lanes.forEach((lane, li) => {
    const base = li * perLane * 2;
    lane.points.forEach((p, i) => {
      const tan = lane.tangents[i]!;
      for (const side of [-1, 1]) {
        laneData.set([p[0], p[1], p[2], tan[0], tan[1], tan[2], side, i / (perLane - 1), lane.speed * cfg.speed, lane.phase, lane.length], lk);
        lk += laneStride;
      }
      if (i < perLane - 1) {
        const a = base + i * 2;
        laneIdx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], ik);
        ik += 6;
      }
    });
  });
  const laneVao = gl.createVertexArray();
  vaos.push(laneVao);
  if (lanes.length) {
    gl.bindVertexArray(laneVao);
    buffer(gl.ARRAY_BUFFER, laneData);
    attrib(laneP, "a_pos", 3, laneStride, 0);
    attrib(laneP, "a_tan", 3, laneStride, 3);
    attrib(laneP, "a_side", 1, laneStride, 6);
    attrib(laneP, "a_t", 1, laneStride, 7);
    attrib(laneP, "a_meta", 3, laneStride, 8);
    buffer(gl.ELEMENT_ARRAY_BUFFER, laneIdx);
    gl.bindVertexArray(null);
  }

  const used = lanes.length ? citiesForLanes(cfg.lanes) : [];
  const cityPos = cityPoints(field, cfg.amp, curve, used);
  const shipCount = lanes.length * 2;
  const pointData = new Float32Array((cityPos.length + shipCount) * 4);
  cityPos.forEach((p, i) => pointData.set([p[0], p[1], p[2], 0], i * 4));
  const pointVao = gl.createVertexArray();
  vaos.push(pointVao);
  let pointBuf: WebGLBuffer | null = null;
  if (lanes.length) {
    gl.bindVertexArray(pointVao);
    pointBuf = buffer(gl.ARRAY_BUFFER, pointData, gl.DYNAMIC_DRAW);
    attrib(pointP, "a_pos", 3, 4, 0);
    attrib(pointP, "a_kind", 1, 4, 3);
    gl.bindVertexArray(null);
  }

  const T = uniforms(gl, terrainP, ["viewProj", "time", "probe", "probeAmt", "amp", "cam", "reveal", "levels", "contrast", "fog", "bg", "line", "major", "accent", "field", "extent", "curve"] as const);
  const L = uniforms(gl, laneP, ["viewProj", "res", "width", "time", "reveal", "alpha", "fog", "lane", "ship"] as const);
  const P = uniforms(gl, pointP, ["viewProj", "size", "time", "lane", "ship", "alpha", "fog"] as const);

  gl.useProgram(terrainP);
  gl.uniform1i(T.field, 0);
  gl.uniform4f(T.extent, EXTENT.x0, EXTENT.z0, EXTENT.x1, EXTENT.z1);
  gl.uniform1f(T.amp, cfg.amp);
  gl.uniform1f(T.levels, small ? cfg.levels * 0.85 : cfg.levels);
  gl.uniform3fv(T.curve, cfg.curve);
  gl.uniform2fv(T.fog, cfg.fog);
  gl.useProgram(laneP);
  gl.uniform2fv(L.fog, cfg.fog);
  gl.useProgram(pointP);
  gl.uniform2fv(P.fog, cfg.fog);

  const applyPalette = () => {
    const s = getComputedStyle(document.documentElement);
    const dark = document.documentElement.dataset.theme === "dark";
    const c = (name: string, fb: Vec3) => parseColor(s.getPropertyValue(name), fb);
    const bg = parseColor(getComputedStyle(host).backgroundColor, c("--md-surface", [0.976, 0.976, 1]));
    const primary = c("--md-primary", [0, 0.36, 0.7]);
    const mix3 = (x: Vec3, y: Vec3, t: number): Vec3 => [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t];
    const line = mix3(c("--md-outline-variant", [0.76, 0.78, 0.84]), primary, dark ? 0.3 : 0.22);
    const major = mix3(c("--md-outline", [0.45, 0.47, 0.52]), primary, dark ? 0.5 : 0.42);
    const ship = c(dark ? "--md-tertiary" : "--md-tertiary-container", [0.69, 0.38, 0]);
    gl.useProgram(terrainP);
    gl.uniform3fv(T.bg, bg);
    gl.uniform3fv(T.line, line);
    gl.uniform3fv(T.major, major);
    gl.uniform3fv(T.accent, primary);
    gl.uniform1f(T.contrast, cfg.contrast * (dark ? 1.15 : 0.8));
    gl.useProgram(laneP);
    gl.uniform3fv(L.lane, primary);
    gl.uniform3fv(L.ship, ship);
    gl.uniform1f(L.alpha, cfg.laneAlpha * (dark ? 1 : 0.9));
    gl.useProgram(pointP);
    gl.uniform3fv(P.lane, primary);
    gl.uniform3fv(P.ship, ship);
    gl.uniform1f(P.alpha, cfg.laneAlpha);
    gl.clearColor(bg[0], bg[1], bg[2], 1);
  };
  applyPalette();

  gl.enable(gl.DEPTH_TEST);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
  let width = 1;
  let height = 1;
  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();

  const state = {
    pointer: { x: 0, y: 0, inside: false },
    par: [0, 0] as [number, number],
    probe: [0, -1.2] as [number, number],
    probeTarget: [0, -1.2] as [number, number],
    probeAmt: 0,
    progress: 0,
    reveal: frozen !== null ? 1 : 0,
    revealStart: 0,
    visible: true,
    raf: 0,
    start: performance.now(),
    last: performance.now(),
    frames: 0,
    slow: 0,
    shown: false,
    halted: false,
    paused: false,
    time: frozen ?? 0,
  };

  const pose = (): Pose => {
    const tall = width / height < 0.9;
    const hero = tall ? cfg.tall : cfg.wide;
    const k = cfg.scroll === "past" ? easeOut(state.progress) : state.progress;
    const p = lerp(cfg.range[0], cfg.range[1], k);
    let eye = lerp3(hero.eye, cfg.plan.eye, p);
    const target = lerp3(hero.target, cfg.plan.target, p);
    const { right, up } = basis(eye, target);
    const px = state.par[0] * 0.3;
    const py = state.par[1] * 0.14;
    eye = [eye[0] + right[0] * px + up[0] * py, eye[1] + right[1] * px + up[1] * py, eye[2] + right[2] * px + up[2] * py];
    return { eye, target };
  };

  const updateProbeTarget = (eye: Vec3, target: Vec3) => {
    if (!state.pointer.inside) return;
    const { forward, right, up } = basis(eye, target);
    const aspect = width / height;
    const ndcX = (state.pointer.x / width) * 2 - 1;
    const ndcY = 1 - (state.pointer.y / height) * 2;
    const t = Math.tan(fovFor(aspect) / 2);
    const dir: Vec3 = [
      forward[0] + ndcX * t * aspect * right[0] + ndcY * t * up[0],
      forward[1] + ndcX * t * aspect * right[1] + ndcY * t * up[1],
      forward[2] + ndcX * t * aspect * right[2] + ndcY * t * up[2],
    ];
    if (dir[1] >= -1e-3) return;
    const k = -(eye[1] - 0.05) / dir[1];
    state.probeTarget = [Math.max(EXTENT.x0, Math.min(EXTENT.x1, eye[0] + dir[0] * k)), Math.max(EXTENT.z0, Math.min(EXTENT.z1, eye[2] + dir[2] * k))];
  };

  const readProgress = () => {
    const rect = host.getBoundingClientRect();
    const raw = cfg.scroll === "past" ? -rect.top / Math.max(1, rect.height) : (window.innerHeight - rect.top) / Math.max(1, window.innerHeight + rect.height);
    state.progress = Math.min(1, Math.max(0, raw));
  };

  const draw = () => {
    const time = state.time;
    const { eye, target } = pose();
    const aspect = width / height;
    const vp = multiply(perspective(fovFor(aspect), aspect, 0.05, 30), lookAt(eye, target));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.useProgram(terrainP);
    gl.uniformMatrix4fv(T.viewProj, false, vp);
    gl.uniform3fv(T.cam, eye);
    gl.uniform1f(T.time, time);
    gl.uniform2fv(T.probe, state.probe);
    gl.uniform1f(T.probeAmt, state.probeAmt * cfg.probe);
    gl.uniform1f(T.reveal, state.reveal);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(terrainVao);
    gl.drawElements(gl.TRIANGLES, g.idx.length, gl.UNSIGNED_INT, 0);

    if (lanes.length && pointBuf) {
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(laneP);
      gl.uniformMatrix4fv(L.viewProj, false, vp);
      gl.uniform2f(L.res, canvas.width / 2, canvas.height / 2);
      gl.uniform1f(L.width, 6 * dpr);
      gl.uniform1f(L.time, time);
      gl.uniform1f(L.reveal, state.reveal);
      gl.bindVertexArray(laneVao);
      gl.drawElements(gl.TRIANGLES, laneIdx.length, gl.UNSIGNED_SHORT, 0);

      const shipVisible = Math.min(1, Math.max(0, (state.reveal - 0.6) / 0.4));
      lanes.forEach((lane, li) => {
        for (let k = 0; k < 2; k++) {
          const head = laneHead(lane, time, k, cfg.speed);
          const p = pointOnLane(lane, head);
          pointData.set([p[0], shipVisible > 0 ? p[1] : -50, p[2], 1], (cityPos.length + li * 2 + k) * 4);
        }
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, cityPos.length * 16, pointData, cityPos.length * 4);
      gl.useProgram(pointP);
      gl.uniformMatrix4fv(P.viewProj, false, vp);
      gl.uniform1f(P.size, 9 * dpr);
      gl.uniform1f(P.time, time);
      gl.bindVertexArray(pointVao);
      gl.drawArrays(gl.POINTS, 0, cityPos.length + shipCount);
      gl.enable(gl.DEPTH_TEST);
    }
    gl.bindVertexArray(null);

    if (!state.shown) {
      state.shown = true;
      state.revealStart = performance.now();
      canvas.dataset.ready = "true";
      opts.onReady();
    }
  };

  const tick = (now: number) => {
    state.raf = 0;
    const dt = Math.min(0.05, (now - state.last) / 1000);
    state.last = now;
    state.time = (now - state.start) / 1000;
    if (state.reveal < 1 && state.shown) state.reveal = Math.min(1, easeOut(Math.min(1, (now - state.revealStart) / 2400)));

    const parTarget: [number, number] = state.pointer.inside && !coarse ? [(state.pointer.x / width) * 2 - 1, (state.pointer.y / height) * 2 - 1] : [0, 0];
    const pd = 1 - Math.exp(-dt * 2.5);
    state.par[0] += (parTarget[0] - state.par[0]) * pd;
    state.par[1] += (parTarget[1] - state.par[1]) * pd;

    if (coarse) {
      state.probeTarget = [Math.sin(state.time * 0.23) * 1.6, -1.3 + Math.sin(state.time * 0.31) * 0.6];
    } else {
      const { eye, target } = pose();
      updateProbeTarget(eye, target);
    }
    const want = coarse ? 0.45 : state.pointer.inside ? 1 : 0;
    const damp = 1 - Math.exp(-dt * 6);
    state.probe[0] += (state.probeTarget[0] - state.probe[0]) * damp;
    state.probe[1] += (state.probeTarget[1] - state.probe[1]) * damp;
    state.probeAmt += (want - state.probeAmt) * (1 - Math.exp(-dt * 3));

    readProgress();
    draw();

    if (dt > 0.024) state.slow++;
    state.frames++;
    if (state.frames % 90 === 0) {
      if (state.slow > 45 && dpr > 1) {
        dpr = Math.max(1, dpr * 0.75);
        resize();
      } else if (state.slow > 70 && dpr <= 1) {
        state.halted = true;
        opts.onHalt();
        return;
      }
      state.slow = 0;
    }
    if (state.visible && !document.hidden) state.raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (state.raf || state.halted || state.paused || frozen !== null) return;
    state.last = performance.now();
    state.raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
  };
  const still = () => {
    readProgress();
    draw();
  };

  const ro = new ResizeObserver(() => {
    resize();
    if (!state.raf) still();
  });
  ro.observe(host);

  const io = new IntersectionObserver(([entry]) => {
    state.visible = Boolean(entry?.isIntersecting);
    if (state.visible) start();
    else stop();
  });
  io.observe(host);

  const mo = new MutationObserver(() => {
    applyPalette();
    if (!state.raf) still();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const onPointer = (e: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    state.pointer = { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
  };
  const onLeave = () => {
    state.pointer.inside = false;
  };
  const onVisibility = () => (document.hidden ? stop() : start());
  const onLost = (e: Event) => {
    e.preventDefault();
    stop();
    state.halted = true;
    canvas.dataset.ready = "false";
    opts.onHalt();
  };

  canvas.addEventListener("webglcontextlost", onLost);
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  document.addEventListener("visibilitychange", onVisibility);

  if (frozen !== null) still();
  else start();

  const setPaused = (paused: boolean) => {
    state.paused = paused;
    if (paused) stop();
    else start();
  };

  const dispose = () => {
    stop();
    io.disconnect();
    ro.disconnect();
    mo.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    window.removeEventListener("pointermove", onPointer);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    buffers.forEach((b) => gl.deleteBuffer(b));
    vaos.forEach((v) => gl.deleteVertexArray(v));
    gl.deleteTexture(tex);
    [terrainP, laneP, pointP].forEach((p) => gl.deleteProgram(p));
    release();
  };

  return { dispose, setPaused };
}
