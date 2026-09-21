// Quadlcat
// WebGL canvas setup with dynamic rendering

import { mat3, mat4, vec3 } from "gl-matrix";

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const gl = canvas.getContext("webgl2", { antialias: false })!
if (!gl) {
    alert("Erro fatal catastrófico! Não há WebGL2 neste navegador");
    throw new Error("Erro fatal catastrófico! Não há WebGL2 neste navegador");
}

// vao, vbos & ebo

// allocate large fixed-size Float32Array and Uint16Array and use as if they were dynamic-size (track size with vars)

// when pushing vertices to draw, they are out in vertexes array
// when some state changes (a draw call is needed), everything in vertexes is copied to vbo at vertexesBatchStart and drawn,
// then vertexes is cleared and vertexesBatchStart is set to another region of the vbo to prepare for a new batch
let vertexesBatchStart = 0
let vertexesSize = 0
let vertexes = new Float32Array(1024 * 8)

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, Float32Array.BYTES_PER_ELEMENT * 4096 * 8, gl.STREAM_DRAW)

// setup vao attributes
gl.enableVertexAttribArray(0) // pos
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 8, 0)
gl.enableVertexAttribArray(1) // color
gl.vertexAttribPointer(1, 4, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 8, Float32Array.BYTES_PER_ELEMENT * 2)
gl.enableVertexAttribArray(2) // uv
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 8, Float32Array.BYTES_PER_ELEMENT * 6)

// default shader & locs

const vertShader = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vertShader,
`#version 300 es
precision highp float;

layout(location = 0) in vec2 pos;
layout(location = 1) in vec4 color;
layout(location = 2) in vec2 uv;

out vec4 fragColor;
out vec2 fragUv;

uniform mat4 mvp;

void main() {
    fragColor = color;
    fragUv = uv;
    gl_Position = mvp * vec4(pos, 0., 1.);
}`)
gl.compileShader(vertShader)
if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    throw new Error("Não foi possível compilar o vertex shader: " + gl.getShaderInfoLog(vertShader))
}

const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fragShader,
`#version 300 es
precision highp float;

in vec4 fragColor;
in vec2 fragUv;

out vec4 outColor;

uniform sampler2D tex;

void main() {
    outColor = fragColor * texture(tex, fragUv);
}`)
gl.compileShader(fragShader)
if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw new Error("Não foi possível compilar o fragment shader: " + gl.getShaderInfoLog(fragShader))
}

const shaderProg = gl.createProgram()
gl.attachShader(shaderProg, vertShader)
gl.attachShader(shaderProg, fragShader)
gl.linkProgram(shaderProg)
if (!gl.getProgramParameter(shaderProg, gl.LINK_STATUS)) {
    throw new Error("Não foi possível linkar o shader program: " + gl.getProgramInfoLog(shaderProg))
}

// locs
const mvpLoc = gl.getUniformLocation(shaderProg, "mvp")!
const texLoc = gl.getUniformLocation(shaderProg, "tex")!

// default texture (1x1 white pixel)

const defaultTexture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, defaultTexture)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]))
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

// camera

var cameraMat = mat4.create()
mat4.ortho(cameraMat, 0, canvas.width, 0, canvas.height, -1, 1)

// Rendering pipeline (every frame)

export function canvasStartDrawing() {
    // calculate canvas scale (scale to fit)
    const scale = Math.min(innerWidth / canvas.width, innerHeight / canvas.height)
    canvas.style.width = canvas.width * scale + "px"
    canvas.style.height = canvas.height * scale + "px"

    // reset vertexes
    vertexesBatchStart = 0
    vertexesSize = 0

    // setup graphics state
    gl.bindVertexArray(vao)

    gl.useProgram(shaderProg)
    gl.uniformMatrix4fv(mvpLoc, false, cameraMat)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, defaultTexture)
    gl.uniform1i(texLoc, 0)
}

export function canvasEndDrawing() {
    canvasDrawBatch()
}

export function canvasResize(width:number, height: number) {
    canvas.width = width;
    canvas.height = height;
    mat4.ortho(cameraMat, 0, canvas.width, 0, canvas.height, -1, 1);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

// rendering functions

export function canvasClear(color: Array<number>) {
    gl.clearColor(color[0], color[1], color[2], color[3])
    gl.clear(gl.COLOR_BUFFER_BIT)
}

export function canvasPushVertex(vertex: Array<number>) {
    // push to the batch
    for (let i = 0; i < vertex.length; i++) {
        vertexes[vertexesSize++] = vertex[i]
    }
}

// triggered when state changes (texture, shader, change from TRIANGLES to LINES, etc.) and a draw call is needed
export function canvasDrawBatch() {
    // upload batch
    gl.bufferSubData(
        gl.ARRAY_BUFFER,
        vertexesBatchStart * Float32Array.BYTES_PER_ELEMENT,
        vertexes,
        0,
        vertexesSize
    )
    // draw vertexes of the current batch
    gl.drawArrays(gl.TRIANGLES, vertexesBatchStart / 8, vertexesSize / 8) // 8 floats per vertex
    // start new batch
    vertexesBatchStart += vertexesSize
    vertexesSize = 0
}