import { useEffect, useRef, useState } from 'react';

// A plant that sways in a light breeze - the still picture, displaced by a wind wave on the GPU.
//
//  * The picture itself is never redrawn or recoloured: a grid of points is moved, so flowers, leaves, the pot and the
//    logo keep their exact pixels.
//  * Everything below `potTop` (the pot, the logo and the soil) has a weight of zero, so it stays perfectly still. The
//    weight then grows smoothly towards the top of the plant, so the trunk is steady and the flower heads move most.
//  * Four sine waves - each repeating a whole number of times per LOOP_SECONDS - give a whole-plant sway, branch
//    movement, flower heads that move on their own, and a faint leaf flutter. Because the waves are whole multiples of
//    the loop, the last frame flows straight into the first: a seamless loop.
//  * It only runs while it can be seen (on screen, tab visible, slide active) and never for visitors who asked for
//    reduced motion. Without WebGL the ordinary <img> stays as it is.
const LOOP_SECONDS = 7;
const GRID = 48;
const PAD = 12; // css px of room around the picture, so a swaying flower is never clipped at the edge

const VERTEX = `
attribute vec2 aUv;
uniform vec2 uHalf;      // half size of the picture in clip space
uniform float uPhase;    // 0..2pi over one loop
uniform float uPot;      // v (0 = top, 1 = bottom) where the fixed pot begins
varying vec2 vUv;
void main() {
  vec2 p = aUv;
  float h = clamp((uPot - p.y) / uPot, 0.0, 1.0);   // 0 at the pot, 1 at the top of the plant
  float w = h * h * (3.0 - 2.0 * h);                // smooth: the base is anchored
  float top = pow(h, 1.5);
  float f = uPhase;
  float dx = 0.0100 * w * sin(f - 1.6 * h)                            // whole plant, the top lags behind
           + 0.0050 * h * sin(2.0 * f + 5.0 * p.x + 3.0 * p.y)        // branches
           + 0.0040 * top * sin(3.0 * f + 11.0 * p.x - 7.0 * p.y)     // flower heads, each on its own rhythm
           + 0.0018 * top * sin(5.0 * f + 23.0 * p.x + 17.0 * p.y);   // leaf flutter
  float dy = 0.0030 * h * sin(2.0 * f + 4.0 * p.x + 1.0)
           + 0.0014 * top * sin(3.0 * f + 15.0 * p.x + 9.0 * p.y);
  vec2 q = p + vec2(dx, dy);
  vUv = p;
  gl_Position = vec4((q.x * 2.0 - 1.0) * uHalf.x, (1.0 - q.y * 2.0) * uHalf.y, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D uTex;
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uTex, vUv); }   // premultiplied alpha: transparent stays transparent
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export default function WindPlant({ paused = false, potTop = 0.735, className = '', imgProps }) {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const pausedRef = useRef(paused);
  const wakeRef = useRef(() => {});
  const [live, setLive] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current();
  }, [paused]);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return undefined;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return undefined;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return undefined;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    // a GRID x GRID mesh over the picture
    const uv = [];
    for (let y = 0; y <= GRID; y += 1) for (let x = 0; x <= GRID; x += 1) uv.push(x / GRID, y / GRID);
    const indices = [];
    for (let y = 0; y < GRID; y += 1)
      for (let x = 0; x < GRID; x += 1) {
        const a = y * (GRID + 1) + x;
        const b = a + 1;
        const c = a + GRID + 1;
        indices.push(a, b, c, b, c + 1, c);
      }
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(program, 'aUv');
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const uHalf = gl.getUniformLocation(program, 'uHalf');
    const uPhase = gl.getUniformLocation(program, 'uPhase');
    gl.uniform1f(gl.getUniformLocation(program, 'uPot'), potTop);
    const texture = gl.createTexture();
    gl.clearColor(0, 0, 0, 0);

    let ready = false;
    let visible = true;
    let alive = true;
    let raf = 0;
    let start = null;
    let phase = 0;

    const draw = () => {
      gl.uniform1f(uPhase, phase);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    };

    // Size the canvas to the picture's box (plus PAD all round) and fit the picture in it like object-fit: contain.
    const layout = () => {
      const bw = img.clientWidth;
      const bh = img.clientHeight;
      if (!bw || !bh || !img.naturalWidth) return;
      const cw = bw + 2 * PAD;
      const ch = bh + 2 * PAD;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const scale = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
      gl.uniform2f(uHalf, (img.naturalWidth * scale) / cw, (img.naturalHeight * scale) / ch);
      draw();
    };

    const upload = () => {
      if (!alive || !img.naturalWidth) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      ready = true;
      layout();
      setLive(true); // from now on the canvas is what you see; the <img> only holds the space and the alt text
      wake();
    };

    const running = () => ready && alive && visible && !document.hidden && !pausedRef.current;
    const frame = (now) => {
      raf = 0;
      if (!running()) return;
      if (start === null) start = now;
      phase = ((((now - start) / 1000) % LOOP_SECONDS) / LOOP_SECONDS) * Math.PI * 2;
      draw();
      raf = requestAnimationFrame(frame);
    };
    function wake() {
      if (!raf && running()) raf = requestAnimationFrame(frame);
    }
    wakeRef.current = wake;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(canvas.parentElement);
    const ro = new ResizeObserver(() => ready && layout());
    ro.observe(img);
    const onVisibility = () => wake();
    const onMotion = () => {
      if (reduce.matches) {
        alive = false;
        setLive(false);
      }
    };
    const onLost = (e) => {
      e.preventDefault();
      alive = false;
      setLive(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    reduce.addEventListener('change', onMotion);
    canvas.addEventListener('webglcontextlost', onLost);
    img.addEventListener('load', upload); // also fires when the browser switches to another srcset file
    if (img.complete) upload();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reduce.removeEventListener('change', onMotion);
      canvas.removeEventListener('webglcontextlost', onLost);
      img.removeEventListener('load', upload);
      wakeRef.current = () => {};
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [potTop]);

  return (
    <div className={`relative ${className}`} data-wind={live ? 'live' : 'static'}>
      <img ref={imgRef} {...imgProps} className={`size-full object-contain ${live ? 'opacity-0' : ''}`} />
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute" style={{ left: -PAD, top: -PAD }} />
    </div>
  );
}
