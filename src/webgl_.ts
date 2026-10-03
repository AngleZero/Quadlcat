// Quadlcat
// WebGL2 canvas setup & batched immediate-mode drawing
// The functions here allow basic drawing; they are used by drawing.ts to draw more complex shapes

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const gl = canvas.getContext("webgl2")!
if (!gl) {
    throw new Error("Não foi possível iniciar o WebGL2 para renderização...")
}

// vao & vbo setup

// vertex data:
// 2 float for position
// 4 float for color
// 2 float for uv
// total: 8 floats per vertex

// immeadiate-mode drawing:
// vertices drawn get added to batchVertexes
// when a draw call is needed, batchVertexes is copied to the vbo at vboCursor
// vboCursor increases to prepare for the next batch or returns to the start

const FLOATS_PER_VERTEX = 8
const VERTEXES_IN_VBO = 16384
let vboCursor = 0 // cursor in the vbo in floats

const batchVertexes = new Float32Array(1024 * FLOATS_PER_VERTEX)
let batchVertexesCursor = 0 // cursor in batchVertexes in floats (not vertexes or bytes)

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)
const vbo = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
gl.bufferData(gl.ARRAY_BUFFER, VERTEXES_IN_VBO * FLOATS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT, gl.STREAM_DRAW)

gl.enableVertexAttribArray(0)
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 0)
gl.enableVertexAttribArray(1)
gl.vertexAttribPointer(1, 4, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 2 * 4)
gl.enableVertexAttribArray(2)
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, FLOATS_PER_VERTEX * 4, 6 * 4)

// default shader

const vertShader = gl.createShader(gl.VERTEX_SHADER)!
gl.shaderSource(vertShader, await fetch("/webgl/vertex-shader.glsl").then(res => res.text()))
gl.compileShader(vertShader)

const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
gl.shaderSource(fragShader, await fetch("/webgl/fragment-shader.glsl").then(res => res.text()))
gl.compileShader(fragShader)

const program = gl.createProgram()
gl.attachShader(program, vertShader)
gl.attachShader(program, fragShader)
gl.linkProgram(program)
gl.useProgram(program)

// default texture

// fetch webgl/default-texture.png
const defaultTextureImg = new Image()
defaultTextureImg.src = "/webgl/default-texture.png"
await new Promise((resolve) => {
    defaultTextureImg.onload = resolve
})

// create texture
const defaultTexture = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, defaultTexture)
gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    defaultTextureImg
)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

// rendering functions

export type vertex = [number, number, number, number, number, number, number, number] // position, color, uv, 8 floats

export function pushTriangle(v0: vertex, v1: vertex, v2: vertex) {
    v0.forEach((value, index) => {
        batchVertexes[batchVertexesCursor++] = value
    })
    v1.forEach((value, index) => {
        batchVertexes[batchVertexesCursor++] = value
    })
    v2.forEach((value, index) => {
        batchVertexes[batchVertexesCursor++] = value
    })
}

export function drawBatch() {
    // put data from batchVertexes in vbo and draw
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferSubData(gl.ARRAY_BUFFER, vboCursor * Float32Array.BYTES_PER_ELEMENT, batchVertexes, 0, batchVertexesCursor)
    gl.drawArrays(gl.TRIANGLES, vboCursor / FLOATS_PER_VERTEX, batchVertexesCursor / FLOATS_PER_VERTEX)
    // adjust vboCursor and start new batch
    vboCursor += batchVertexesCursor
    batchVertexesCursor = 0
}

// EXTRA: canvas resize

export function resizeCanvas() {
    if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        gl.viewport(0, 0, canvas.width, canvas.height)
    }
}