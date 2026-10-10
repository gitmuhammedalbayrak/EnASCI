/**
 * ASCII 3D Game Engine - Camera & Scene
 */

import { Vec3, Mat4 } from './math.js';

export class Camera {
    constructor(fov = 60, aspect = 1.0, near = 0.1, far = 100.0) {
        this.position = new Vec3(0, 0, 3.5);
        this.target = new Vec3(0, 0, 0);
        this.up = new Vec3(0, 1, 0);

        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;
    }

    getViewMatrix() {
        return Mat4.lookAt(this.position, this.target, this.up);
    }

    getProjectionMatrix() {
        const fovRad = (this.fov * Math.PI) / 180.0;
        return Mat4.perspective(fovRad, this.aspect, this.near, this.far);
    }

    getViewProjectionMatrix() {
        return Mat4.multiply(this.getProjectionMatrix(), this.getViewMatrix());
    }

    orbit(yawDelta, pitchDelta, radius) {
        // Orbit around target
        // yaw, pitch based spherical positioning
        const offset = this.position.sub(this.target);
        let currentRadius = radius || offset.length();
        if (currentRadius < 0.2) currentRadius = 0.2;

        let yaw = Math.atan2(offset.x, offset.z) + yawDelta;
        let pitch = Math.asin(Math.max(-0.99, Math.min(0.99, offset.y / currentRadius))) + pitchDelta;
        const maxPitch = (Math.PI / 2) - 0.05;
        pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

        this.position.x = this.target.x + currentRadius * Math.cos(pitch) * Math.sin(yaw);
        this.position.y = this.target.y + currentRadius * Math.sin(pitch);
        this.position.z = this.target.z + currentRadius * Math.cos(pitch) * Math.cos(yaw);
    }
}

export class DirectionalLight {
    constructor(direction = new Vec3(0.5, 1.0, 0.7), color = { r: 255, g: 255, b: 255 }, intensity = 1.0) {
        this.direction = direction.normalized();
        this.color = color;
        this.intensity = intensity;
    }
}

export class Scene {
    constructor() {
        this.meshes = [];
        this.lights = [
            new DirectionalLight(new Vec3(0.577, 0.577, 0.577), { r: 255, g: 255, b: 255 }, 1.0)
        ];
        this.ambientLight = { r: 40, g: 45, b: 60 }; // Base ambient color
    }

    add(mesh) {
        this.meshes.push(mesh);
    }

    remove(mesh) {
        const idx = this.meshes.indexOf(mesh);
        if (idx !== -1) this.meshes.splice(idx, 1);
    }
}
