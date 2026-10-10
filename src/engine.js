/**
 * ASCII 3D Game Engine - Main Engine Core
 * Coordinates Scene, Camera, Software Renderer, Input, and Game Loop.
 */

import { Scene, Camera } from './scene.js';
import { AsciiRenderer } from './renderer.js';
import { AsciiDisplay } from './display.js';
import { Vec3 } from './math.js';

export class AsciiEngine {
    constructor(canvas, config = {}) {
        this.width = config.width || 100;
        this.height = config.height || 42;

        this.scene = new Scene();
        this.camera = new Camera(55, (this.width / this.height) * 0.55, 0.1, 100);
        this.renderer = new AsciiRenderer(this.width, this.height);
        this.display = new AsciiDisplay(canvas, {
            fontSize: config.fontSize || 13,
            theme: config.theme || "fullcolor"
        });

        this.display.resizeToBuffer(this.width, this.height);

        // State & Timing
        this.isRunning = false;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;

        // Custom update callbacks
        this.updateHooks = [];

        // Input state
        this.input = {
            keys: {},
            mouse: { x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 }
        };

        this.setupInput(canvas);
    }

    onUpdate(callback) {
        this.updateHooks.push(callback);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    stop() {
        this.isRunning = false;
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // FPS counter
        this.frameCount++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= 0.5) {
            this.fps = Math.round((this.frameCount / this.fpsTimer));
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        // Handle camera navigation via keyboard
        this.handleKeyboard(deltaTime);

        // Run user scripts / animations
        for (const hook of this.updateHooks) {
            hook(deltaTime, this);
        }

        // Render & Present
        this.renderer.render(this.scene, this.camera);
        this.display.render(this.renderer.buffer);

        requestAnimationFrame(this.loop);
    }

    handleKeyboard(dt) {
        const moveSpeed = 4.0 * dt;
        const forward = this.camera.target.sub(this.camera.position).normalize();
        const right = forward.cross(this.camera.up).normalize();

        if (this.input.keys['KeyW']) {
            this.camera.position = this.camera.position.add(forward.mulScalar(moveSpeed));
            this.camera.target = this.camera.target.add(forward.mulScalar(moveSpeed));
        }
        if (this.input.keys['KeyS']) {
            this.camera.position = this.camera.position.sub(forward.mulScalar(moveSpeed));
            this.camera.target = this.camera.target.sub(forward.mulScalar(moveSpeed));
        }
        if (this.input.keys['KeyA']) {
            this.camera.position = this.camera.position.sub(right.mulScalar(moveSpeed));
            this.camera.target = this.camera.target.sub(right.mulScalar(moveSpeed));
        }
        if (this.input.keys['KeyD']) {
            this.camera.position = this.camera.position.add(right.mulScalar(moveSpeed));
            this.camera.target = this.camera.target.add(right.mulScalar(moveSpeed));
        }
        if (this.input.keys['KeyQ']) {
            this.camera.position.y += moveSpeed;
            this.camera.target.y += moveSpeed;
        }
        if (this.input.keys['KeyE']) {
            this.camera.position.y -= moveSpeed;
            this.camera.target.y -= moveSpeed;
        }
    }

    setupInput(canvas) {
        window.addEventListener('keydown', (e) => {
            this.input.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.input.keys[e.code] = false;
        });

        canvas.addEventListener('mousedown', (e) => {
            this.input.mouse.isDown = true;
            this.input.mouse.lastX = e.clientX;
            this.input.mouse.lastY = e.clientY;
        });

        window.addEventListener('mouseup', () => {
            this.input.mouse.isDown = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.input.mouse.isDown) return;
            const dx = (e.clientX - this.input.mouse.lastX) * 0.008;
            const dy = (e.clientY - this.input.mouse.lastY) * 0.008;

            this.camera.orbit(-dx, dy);

            this.input.mouse.lastX = e.clientX;
            this.input.mouse.lastY = e.clientY;
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.004;
            const dir = this.camera.position.sub(this.camera.target);
            const dist = dir.length();
            const newDist = Math.max(0.5, Math.min(25.0, dist + zoomDelta));
            this.camera.position = this.camera.target.add(dir.normalize().mulScalar(newDist));
        }, { passive: false });
    }
}
