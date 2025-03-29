import {
  resizeAspectRatio,
  setupText,
  updateText,
  Axes,
} from "../util/util.js";
import { Shader, readShaderFile } from "../util/shader.js";

let isInitialized = false; 
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let startPoint = null;
let tempEndPoint = null;
let lines = [];
let textOverlay;
let textOverlay2;
let textOverlay3;
let axes = new Axes(gl, 0.85);
let circleCenter;
let circleRadius;
let mode = 0;

document.addEventListener("DOMContentLoaded", () => {
  if (isInitialized) {
    console.log("Already initialized");
    return;
  }

  main()
    .then((success) => {

      if (!success) {
        console.log("프로그램을 종료합니다.");
        return;
      }
      isInitialized = true;
    })
    .catch((error) => {
      console.error("프로그램 실행 중 오류 발생:", error);
    });
});

function initWebGL() {
  if (!gl) {
    console.error("WebGL 2 is not supported by your browser.");
    return false;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.7, 0.8, 0.9, 1.0);

  return true;
}

function setupCanvas() {
  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);
}

function setupBuffers(shader) {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
  return [(x / canvas.width) * 2 - 1, -((y / canvas.height) * 2 - 1)];
}

function setupMouseEvents() {
  function handleMouseDown(event) {
    event.preventDefault();
    event.stopPropagation(); 

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!isDrawing) {
      let [glX, glY] = convertToWebGLCoordinates(x, y);
      if (mode == 0) {
        circleCenter = [glX, glY];
        isDrawing = true;
      } else if (mode == 1) {
        startPoint = [glX, glY];
        isDrawing = true;
      }
    }
  }

  function handleMouseMove(event) {
    if (isDrawing) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let [glX, glY] = convertToWebGLCoordinates(x, y);
      if (mode == 0) {
        circleRadius = Math.sqrt(
          Math.pow(circleCenter[0] - glX, 2) +
            Math.pow(circleCenter[1] - glY, 2)
        );
      } else if (mode == 1) {
        tempEndPoint = [glX, glY];
      }
      render();
    }
  }

  function handleMouseUp() {
    if (isDrawing && (tempEndPoint || circleRadius)) {
      if (mode == 0) {
        for (let i = 0; i < 100; i++) {
          lines.push([
            circleCenter[0] +
              circleRadius * Math.sin(((2 * Math.PI) / 100) * i),
            circleCenter[1] +
              circleRadius * Math.cos(((2 * Math.PI) / 100) * i),
            circleCenter[0] +
              circleRadius * Math.sin(((2 * Math.PI) / 100) * (i + 1)),
            circleCenter[1] +
              circleRadius * Math.cos(((2 * Math.PI) / 100) * (i + 1)),
          ]);
        }
        mode = 1;

        updateText(
          textOverlay,
          "Circle: center (" +
            circleCenter[0].toFixed(2) +
            ", " +
            circleCenter[1].toFixed(2) +
            ") radius = " +
            circleRadius.toFixed(2)
        );
      } else if (mode == 1) {
        lines.push([...startPoint, ...tempEndPoint]);
        mode = 2;
        
        updateText(
          textOverlay2,
          "Line segment: (" +
            startPoint[0].toFixed(2) +
            ", " +
            startPoint[1].toFixed(2) +
            ") ~ (" +
            tempEndPoint[0].toFixed(2) +
            ", " +
            tempEndPoint[1].toFixed(2) +
            ")"
        );
      }

      isDrawing = false;
      startPoint = null;
      tempEndPoint = null;
      render();
    }
  }

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);
}

function findIntersections(cx, cy, r, x1, y1, x2, y2) {

  let dx = x2 - x1;
  let dy = y2 - y1;

  let fx = x1 - cx;
  let fy = y1 - cy;
  
  let a = dx * dx + dy * dy;
  let b = 2 * (fx * dx + fy * dy);
  let c = (fx * fx + fy * fy) - r * r;
  
  let discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) return []; 
  
  let t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
  let t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
  
  let intersections = [];
  
  if (t1 >= 0 && t1 <= 1) {
      intersections.push([
          x1 + t1 * dx,
          y1 + t1 * dy
      ]);
  }
  
  if (t2 >= 0 && t2 <= 1) {
      intersections.push([
          x1 + t2 * dx,
          y1 + t2 * dy
      ]);
  }
  
  return intersections;
}


function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.use();

  // 저장된 선들 그리기
  let num = 0;
  for (let line of lines) {
    if (num < 100) {
      shader.setVec4("u_color", [1.0, 0.0, 1.0, 1.0]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    } else {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    }
    num++;
  }

  // 임시 선 그리기
  if (isDrawing) {
    if (mode == 0 && circleCenter && circleRadius) {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]);
      const tmpCircle = [];
      for (let i = 0; i < 100; i++) {
        tmpCircle.push([
          circleCenter[0] + circleRadius * Math.sin(((2 * Math.PI) / 100) * i),
          circleCenter[1] + circleRadius * Math.cos(((2 * Math.PI) / 100) * i),
          circleCenter[0] +
            circleRadius * Math.sin(((2 * Math.PI) / 100) * (i + 1)),
          circleCenter[1] +
            circleRadius * Math.cos(((2 * Math.PI) / 100) * (i + 1)),
        ]);
      }
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(tmpCircle.flat()),
        gl.STATIC_DRAW
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 200);
    }
    if (mode == 1 && startPoint && tempEndPoint) {
      shader.setVec4("u_color", [0.5, 0.5, 0.5, 1.0]); 
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([...startPoint, ...tempEndPoint]),
        gl.STATIC_DRAW
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    }
  }

  // 교차점 계산 및 표시
  if (mode === 2) {
    let intersections = findIntersections(
        circleCenter[0], circleCenter[1], circleRadius,
        lines[100][0], lines[100][1], lines[100][2], lines[100][3]
    );

    if (intersections.length > 0) {
        shader.use();
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]); 
        let points = intersections.flat();
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, points.length / 2);

        updateText(
            textOverlay3,
            `Intersection Points: ${intersections.length} ` +
            intersections.map((p, i) => `Point ${i + 1}: (${p[0].toFixed(2)}, ${p[1].toFixed(2)})`).join(" ")
        );
    } else {
        updateText(textOverlay3, "No intersection");
    }
  }

  axes.draw(mat4.create(), mat4.create());
}

async function initShader() {
  const vertexShaderSource = await readShaderFile("shVert.glsl");
  const fragmentShaderSource = await readShaderFile("shFrag.glsl");
  return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error("WebGL 초기화 실패");
    }

    shader = await initShader();

    setupCanvas();
    setupBuffers(shader);
    shader.use();

    textOverlay = setupText(canvas, "", 1);  
    textOverlay2 = setupText(canvas, "", 2); 
    textOverlay3 = setupText(canvas, "", 3); 

    setupMouseEvents();

    render();

    return true;
  } catch (error) {
    console.error("Failed to initialize program:", error);
    alert("프로그램 초기화에 실패했습니다.");
    return false;
  }
}
