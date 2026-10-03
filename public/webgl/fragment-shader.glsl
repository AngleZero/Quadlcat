#version 300 es

// Quadlcat
// fragment shader

precision highp float;

in vec4 fcolor;
in vec2 fuv;

out vec4 finalColor;

uniform mat4 mvp;
uniform sampler2D tex;

void main() {
    finalColor = fcolor * texture(tex, fuv);
}