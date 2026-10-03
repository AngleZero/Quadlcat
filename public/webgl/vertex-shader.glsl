#version 300 es

// Quadlcat
// Vertex shader

precision highp float;

layout(location = 0) in vec2 pos;
layout(location = 1) in vec4 color;
layout(location = 2) in vec2 uv;

out vec4 fcolor;
out vec2 fuv;

uniform mat4 mvp;
uniform sampler2D tex;

void main() {
    fcolor = color;
    fuv = uv;
    gl_Position = mvp * vec4(pos, 0., 1.);
}