// Quadlcat
// Main C++ source file

#include <emscripten/emscripten.h>
#include <raylib.h>
#include <emscripten.h>
#include <emscripten/bind.h>

void mainloop();
int main(int argc, char** argv) {
    SetConfigFlags(FLAG_WINDOW_RESIZABLE);
    InitWindow(800, 800, "Quadlcat");
    emscripten_set_main_loop(mainloop, 60, false);
}

void mainloop() {
    BeginDrawing();
        ClearBackground(BLACK);
    EndDrawing();
}