const chars = [".", ",", "-", "~", "*", "+", "%", "&", "#", "@"];
const numChars = chars.length;
const charSize = 64;

const tempCanvas = document.createElement("canvas");
tempCanvas.width = charSize * numChars;
tempCanvas.height = charSize;
const ctx = tempCanvas.getContext("2d");

ctx.fillStyle = "#000000";
ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
ctx.fillStyle = "#FFFFFF";
ctx.font = `${charSize * 0.8}px monospace`;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

for (let i = 0; i < numChars; i++) {
  ctx.fillText(chars[i], i * charSize + charSize / 2, charSize / 2);
}

const canvas = document.getElementById("glcanvas");
canvas.style.willChange = "transform";

const gl = canvas.getContext("webgl2", {
  alpha: false,
  depth: false,
  stencil: false,
  antialias: false,
  preserveDrawingBuffer: false,
});

const vsSource = `#version 300 es
out vec2 v_uv;
void main() {
    v_uv = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(v_uv * 2.0 - 1.0, 0.0, 1.0);
}
`;

const noiseFsSource = `#version 300 es
    precision mediump float;
    uniform highp float u_time;
    out vec4 fragColor;

    vec2 hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xx+p3.yz)*p3.zy) * 2.0 - 1.0;
    }

    float noise(vec2 p) {
        const float K1 = 0.366025404;
        const float K2 = 0.211324865;
        vec2 i = floor(p + (p.x + p.y) * K1);
        vec2 a = p - i + (i.x + i.y) * K2;
        float m = step(a.y, a.x);
        vec2 o = vec2(m, 1.0 - m);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0 * K2;
        vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
        vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
        return dot(n, vec3(70.0));
    }

    void main() {
        vec2 noiseUV = gl_FragCoord.xy * 0.03;
        float time = u_time * 0.04;

        float n = noise(noiseUV + time);
        n += 0.5 * noise(noiseUV * 2.0 - time * 1.5);

        n = n / 1.5;
        n = n * 0.5 + 0.5;
        n = smoothstep(0.08, 0.8, n);

        fragColor = vec4(clamp(n, 0.0, 1.0), 0.0, 0.0, 1.0);
    }
`;

const asciiFsSource = `#version 300 es
    precision mediump float;
    uniform sampler2D u_noiseTex;
    uniform sampler2D u_asciiTex;
    uniform float u_aspect;

    in vec2 v_uv;
    out vec4 fragColor;

    void main() {
        float n = texture(u_noiseTex, v_uv).r;

        vec2 cellUV = fract(v_uv * vec2(u_aspect * 70.0, 70.0));
        vec2 texUV = cellUV * 0.6 + 0.2;

        float charIndex = clamp(floor(n * 10.0), 0.0, 9.0);

        int px = clamp(int(charIndex * 64.0 + texUV.x * 64.0), 0, 639);
        int py = clamp(int((1.0 - texUV.y) * 64.0), 0, 63);

        float charAlpha = texelFetch(u_asciiTex, ivec2(px, py), 0).r;

        const vec3 bgColor = vec3(0.157, 0.157, 0.157);
        const vec3 baseText = vec3(0.922, 0.859, 0.698);
        const vec3 boldText = vec3(0.827, 0.525, 0.608);

        float intensity = smoothstep(0.1, 0.9, n);
        vec3 lowerGradient = mix(bgColor, baseText, intensity * 2.0);
        vec3 upperGradient = mix(baseText, boldText, (intensity - 0.5) * 2.0);
        vec3 currentTextColor = mix(lowerGradient, upperGradient, step(0.5, intensity));

        fragColor = vec4(mix(bgColor, currentTextColor, charAlpha), 1.0);
    }
`;

function compileShader(source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const noiseProgram = gl.createProgram();
gl.attachShader(noiseProgram, compileShader(vsSource, gl.VERTEX_SHADER));
gl.attachShader(noiseProgram, compileShader(noiseFsSource, gl.FRAGMENT_SHADER));
gl.linkProgram(noiseProgram);

const asciiProgram = gl.createProgram();
gl.attachShader(asciiProgram, compileShader(vsSource, gl.VERTEX_SHADER));
gl.attachShader(asciiProgram, compileShader(asciiFsSource, gl.FRAGMENT_SHADER));
gl.linkProgram(asciiProgram);

const asciiTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, asciiTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tempCanvas);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const fbo = gl.createFramebuffer();
const fboTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, fboTexture);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferTexture2D(
  gl.FRAMEBUFFER,
  gl.COLOR_ATTACHMENT0,
  gl.TEXTURE_2D,
  fboTexture,
  0,
);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

const noiseTimeLoc = gl.getUniformLocation(noiseProgram, "u_time");
const asciiAspectLoc = gl.getUniformLocation(asciiProgram, "u_aspect");
const asciiNoiseTexLoc = gl.getUniformLocation(asciiProgram, "u_noiseTex");
const asciiCharTexLoc = gl.getUniformLocation(asciiProgram, "u_asciiTex");

const RENDER_SCALE = 0.75;
const GRID_Y = 70;
let gridX = 70;
let resizeTimer;

function stretchCanvas() {
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
}

function reallocateVRAM() {
  canvas.width = Math.floor(window.innerWidth * RENDER_SCALE);
  canvas.height = Math.floor(window.innerHeight * RENDER_SCALE);

  const aspect = canvas.width / canvas.height;
  gridX = Math.ceil(GRID_Y * aspect);

  gl.bindTexture(gl.TEXTURE_2D, fboTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gridX,
    GRID_Y,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
}

window.addEventListener("resize", () => {
  stretchCanvas();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(reallocateVRAM, 200);
});

stretchCanvas();
reallocateVRAM();

let isVisible = true;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    isVisible = false;
  } else {
    isVisible = true;
    lastFrameTime = performance.now();
    requestAnimationFrame(render);
  }
});

const TARGET_FPS = 24;
const frameDelay = 1000 / TARGET_FPS;
let lastFrameTime = performance.now();

// Change the 0.001 below to adjust the overall speed of the noise animation
const NOISE_SPEED = 0.001;

function render(time) {
  requestAnimationFrame(render);
  if (!isVisible) return;

  const deltaTime = time - lastFrameTime;
  if (deltaTime < frameDelay) return;
  lastFrameTime = time - (deltaTime % frameDelay);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, gridX, GRID_Y);
  gl.useProgram(noiseProgram);
  gl.uniform1f(noiseTimeLoc, time * NOISE_SPEED);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(asciiProgram);
  gl.uniform1f(asciiAspectLoc, canvas.width / canvas.height);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, fboTexture);
  gl.uniform1i(asciiNoiseTexLoc, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, asciiTexture);
  gl.uniform1i(asciiCharTexLoc, 1);

  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

requestAnimationFrame(render);
