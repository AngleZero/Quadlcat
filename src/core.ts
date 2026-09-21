// Quadlcat
// Core functions of the engine
// specific areas like webgl handling are in other files

import { canvasStartDrawing, canvasEndDrawing, canvasClear, canvasPushVertex } from "./canvas.ts";

// put actors

export function mainloop() {
    canvasStartDrawing()
    canvasClear([0.5, 0.1, 1, 1])

    canvasPushVertex([0, 0, 1, 0, 0, 1, 0, 0])
    canvasPushVertex([100, 0, 1, 0, 0, 1, 0, 0])
    canvasPushVertex([0, 100, 1, 0, 0, 1, 0, 0])

    canvasEndDrawing()
    requestAnimationFrame(mainloop)
}