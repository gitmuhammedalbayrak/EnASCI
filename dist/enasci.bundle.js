/**
 * EnASCI - 3D ASCII Game Engine (Standalone UMD / Bundle with Audio, Dialogue & World)
 * Zero dependencies. Runs directly in browser or embedded webviews.
 */

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        factory(exports);
    } else {
        global.EnASCI = {};
        factory(global.EnASCI);
    }
}(this, (function (exports) {
    'use strict';

    /* ==========================================================================
       MATH LIBRARY
       ========================================================================== */

    class Vec2 {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        set(x, y) { this.x = x; this.y = y; return this; }
        clone() { return new Vec2(this.x, this.y); }
    }

    class Vec3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
        clone() { return new Vec3(this.x, this.y, this.z); }
        add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
        sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
        mulScalar(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
        dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
        cross(v) {
            return new Vec3(
                this.y * v.z - this.z * v.y,
                this.z * v.x - this.x * v.z,
                this.x * v.y - this.y * v.x
            );
        }
        length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
        normalize() {
            const len = this.length();
            if (len > 0.00001) { this.x /= len; this.y /= len; this.z /= len; }
            return this;
        }
        normalized() { return this.clone().normalize(); }
        transformMat4(m) {
            const x = this.x, y = this.y, z = this.z;
            const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1.0;
            return new Vec3(
                (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
                (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
                (m[2] * x + m[6] * y + m[10] * z + m[14]) / w
            );
        }
        transformDirection(m) {
            return new Vec3(
                m[0] * this.x + m[4] * this.y + m[8] * this.z,
                m[1] * this.x + m[5] * this.y + m[9] * this.z,
                m[2] * this.x + m[6] * this.y + m[10] * this.z
            ).normalize();
        }
    }

    class Mat4 {
        constructor() {
            this.elements = new Float32Array(16);
            this.identity();
        }
        identity() {
            const e = this.elements;
            e.fill(0);
            e[0] = 1; e[5] = 1; e[10] = 1; e[15] = 1;
            return this;
        }
        static multiply(a, b) {
            const out = new Mat4();
            const ae = a.elements, be = b.elements, te = out.elements;
            for (let i = 0; i < 4; i++) {
                const ai0 = ae[i], ai1 = ae[i + 4], ai2 = ae[i + 8], ai3 = ae[i + 12];
                te[i]      = ai0 * be[0]  + ai1 * be[1]  + ai2 * be[2]  + ai3 * be[3];
                te[i + 4]  = ai0 * be[4]  + ai1 * be[5]  + ai2 * be[6]  + ai3 * be[7];
                te[i + 8]  = ai0 * be[8]  + ai1 * be[9]  + ai2 * be[10] + ai3 * be[11];
                te[i + 12] = ai0 * be[12] + ai1 * be[13] + ai2 * be[14] + ai3 * be[15];
            }
            return out;
        }
        static translation(x, y, z) {
            const m = new Mat4();
            m.elements[12] = x; m.elements[13] = y; m.elements[14] = z;
            return m;
        }
        static rotationX(rad) {
            const m = new Mat4();
            const c = Math.cos(rad), s = Math.sin(rad);
            m.elements[5] = c; m.elements[6] = s; m.elements[9] = -s; m.elements[10] = c;
            return m;
        }
        static rotationY(rad) {
            const m = new Mat4();
            const c = Math.cos(rad), s = Math.sin(rad);
            m.elements[0] = c; m.elements[2] = -s; m.elements[8] = s; m.elements[10] = c;
            return m;
        }
        static rotationZ(rad) {
            const m = new Mat4();
            const c = Math.cos(rad), s = Math.sin(rad);
            m.elements[0] = c; m.elements[1] = s; m.elements[4] = -s; m.elements[5] = c;
            return m;
        }
        static scale(x, y, z) {
            const m = new Mat4();
            m.elements[0] = x; m.elements[5] = y; m.elements[10] = z;
            return m;
        }
        static perspective(fovRad, aspect, near, far) {
            const m = new Mat4();
            const f = 1.0 / Math.tan(fovRad / 2);
            const nf = 1.0 / (near - far);
            const e = m.elements;
            e[0] = f / aspect;
            e[5] = f;
            e[10] = (far + near) * nf;
            e[11] = -1;
            e[14] = 2 * far * near * nf;
            e[15] = 0;
            return m;
        }
        static lookAt(eye, target, up) {
            const zAxis = eye.sub(target).normalize();
            const xAxis = up.cross(zAxis).normalize();
            const yAxis = zAxis.cross(xAxis).normalize();
            const m = new Mat4();
            const e = m.elements;
            e[0] = xAxis.x; e[4] = xAxis.y; e[8] = xAxis.z;
            e[1] = yAxis.x; e[5] = yAxis.y; e[9] = yAxis.z;
            e[2] = zAxis.x; e[6] = zAxis.y; e[10] = zAxis.z;
            e[12] = -xAxis.dot(eye);
            e[13] = -yAxis.dot(eye);
            e[14] = -zAxis.dot(eye);
            e[15] = 1;
            return m;
        }
    }

    /* ==========================================================================
       MESH & GEOMETRY
       ========================================================================== */

    class Vertex {
        constructor(pos, normal = new Vec3(0, 1, 0), uv = new Vec2(0, 0), color = { r: 255, g: 255, b: 255 }) {
            this.pos = pos;
            this.normal = normal;
            this.uv = uv;
            this.color = color;
        }
        clone() {
            return new Vertex(this.pos.clone(), this.normal.clone(), this.uv.clone(), { ...this.color });
        }
    }

    class Triangle {
        constructor(v0, v1, v2) {
            this.v0 = v0;
            this.v1 = v1;
            this.v2 = v2;
        }
    }

    class Mesh {
        constructor(name = "Object") {
            this.name = name;
            this.triangles = [];
            this.position = new Vec3(0, 0, 0);
            this.rotation = new Vec3(0, 0, 0);
            this.scale = new Vec3(1, 1, 1);
            this.material = {
                charMap: "standard",
                texture: null,
                color: { r: 200, g: 220, b: 255 },
                wireframe: false,
                shininess: 16
            };
        }
        getModelMatrix() {
            const t = Mat4.translation(this.position.x, this.position.y, this.position.z);
            const rx = Mat4.rotationX(this.rotation.x);
            const ry = Mat4.rotationY(this.rotation.y);
            const rz = Mat4.rotationZ(this.rotation.z);
            const s = Mat4.scale(this.scale.x, this.scale.y, this.scale.z);
            const r = Mat4.multiply(rz, Mat4.multiply(ry, rx));
            return Mat4.multiply(t, Mat4.multiply(r, s));
        }
        static createCube(size = 1, color = { r: 180, g: 200, b: 250 }) {
            const mesh = new Mesh("Cube");
            mesh.material.color = color;
            const h = size / 2;
            const faces = [
                { n: new Vec3(0, 0, 1), p: [new Vec3(-h,-h, h), new Vec3( h,-h, h), new Vec3( h, h, h), new Vec3(-h, h, h)] },
                { n: new Vec3(0, 0,-1), p: [new Vec3( h,-h,-h), new Vec3(-h,-h,-h), new Vec3(-h, h,-h), new Vec3( h, h,-h)] },
                { n: new Vec3(0, 1, 0), p: [new Vec3(-h, h, h), new Vec3( h, h, h), new Vec3( h, h,-h), new Vec3(-h, h,-h)] },
                { n: new Vec3(0,-1, 0), p: [new Vec3(-h,-h,-h), new Vec3( h,-h,-h), new Vec3( h,-h, h), new Vec3(-h,-h, h)] },
                { n: new Vec3(1, 0, 0), p: [new Vec3( h,-h, h), new Vec3( h,-h,-h), new Vec3( h, h,-h), new Vec3( h, h, h)] },
                { n: new Vec3(-1,0, 0), p: [new Vec3(-h,-h,-h), new Vec3(-h,-h, h), new Vec3(-h, h, h), new Vec3(-h, h,-h)] },
            ];
            for (const f of faces) {
                const v0 = new Vertex(f.p[0], f.n, new Vec2(0, 0), color);
                const v1 = new Vertex(f.p[1], f.n, new Vec2(1, 0), color);
                const v2 = new Vertex(f.p[2], f.n, new Vec2(1, 1), color);
                const v3 = new Vertex(f.p[3], f.n, new Vec2(0, 1), color);
                mesh.triangles.push(new Triangle(v0, v1, v2));
                mesh.triangles.push(new Triangle(v0.clone(), v2.clone(), v3));
            }
            return mesh;
        }
        static createPyramid(baseSize = 1.2, height = 1.2, color = { r: 250, g: 190, b: 100 }) {
            const mesh = new Mesh("Pyramid");
            mesh.material.color = color;
            const h = baseSize / 2;
            const top = new Vec3(0, height / 2, 0);
            const b0 = new Vec3(-h, -height / 2, -h);
            const b1 = new Vec3( h, -height / 2, -h);
            const b2 = new Vec3( h, -height / 2,  h);
            const b3 = new Vec3(-h, -height / 2,  h);

            const addSide = (pA, pB, uvA, uvB) => {
                const edge1 = pB.sub(pA);
                const edge2 = top.sub(pA);
                const n = edge1.cross(edge2).normalize();
                mesh.triangles.push(new Triangle(
                    new Vertex(pA, n, uvA, color),
                    new Vertex(pB, n, uvB, color),
                    new Vertex(top, n, new Vec2(0.5, 1), color)
                ));
            };
            addSide(b0, b1, new Vec2(0, 0), new Vec2(1, 0));
            addSide(b1, b2, new Vec2(0, 0), new Vec2(1, 0));
            addSide(b2, b3, new Vec2(0, 0), new Vec2(1, 0));
            addSide(b3, b0, new Vec2(0, 0), new Vec2(1, 0));

            const down = new Vec3(0, -1, 0);
            mesh.triangles.push(new Triangle(
                new Vertex(b0, down, new Vec2(0, 0), color),
                new Vertex(b2, down, new Vec2(1, 1), color),
                new Vertex(b1, down, new Vec2(1, 0), color)
            ));
            mesh.triangles.push(new Triangle(
                new Vertex(b0.clone(), down, new Vec2(0, 0), color),
                new Vertex(b3, down, new Vec2(0, 1), color),
                new Vertex(b2.clone(), down, new Vec2(1, 1), color)
            ));
            return mesh;
        }
        static createTorus(R = 1.0, r = 0.35, segR = 16, segr = 10, color = { r: 120, g: 255, b: 180 }) {
            const mesh = new Mesh("Torus");
            mesh.material.color = color;
            for (let i = 0; i < segR; i++) {
                const u0 = (i / segR) * Math.PI * 2;
                const u1 = ((i + 1) / segR) * Math.PI * 2;
                for (let j = 0; j < segr; j++) {
                    const v0 = (j / segr) * Math.PI * 2;
                    const v1 = ((j + 1) / segr) * Math.PI * 2;
                    const getPt = (u, v) => {
                        const cx = Math.cos(u), sx = Math.sin(u);
                        const cy = Math.cos(v), sy = Math.sin(v);
                        const pos = new Vec3((R + r * cy) * cx, r * sy, (R + r * cy) * sx);
                        const norm = new Vec3(cy * cx, sy, cy * sx).normalize();
                        const uv = new Vec2(u / (Math.PI * 2), v / (Math.PI * 2));
                        return new Vertex(pos, norm, uv, color);
                    };
                    const p00 = getPt(u0, v0), p10 = getPt(u1, v0);
                    const p11 = getPt(u1, v1), p01 = getPt(u0, v1);
                    mesh.triangles.push(new Triangle(p00, p10, p11));
                    mesh.triangles.push(new Triangle(p00.clone(), p11.clone(), p01));
                }
            }
            return mesh;
        }
        static createSphere(radius = 0.9, rings = 12, sectors = 16, color = { r: 255, g: 130, b: 200 }) {
            const mesh = new Mesh("Sphere");
            mesh.material.color = color;
            for (let r = 0; r < rings; r++) {
                const theta0 = (r / rings) * Math.PI;
                const theta1 = ((r + 1) / rings) * Math.PI;
                for (let s = 0; s < sectors; s++) {
                    const phi0 = (s / sectors) * Math.PI * 2;
                    const phi1 = ((s + 1) / sectors) * Math.PI * 2;
                    const getPt = (theta, phi) => {
                        const st = Math.sin(theta), ct = Math.cos(theta);
                        const sp = Math.sin(phi), cp = Math.cos(phi);
                        const norm = new Vec3(st * cp, ct, st * sp).normalize();
                        const pos = norm.mulScalar(radius);
                        const uv = new Vec2(phi / (Math.PI * 2), theta / Math.PI);
                        return new Vertex(pos, norm, uv, color);
                    };
                    const p00 = getPt(theta0, phi0), p10 = getPt(theta0, phi1);
                    const p11 = getPt(theta1, phi1), p01 = getPt(theta1, phi0);
                    if (r !== 0) mesh.triangles.push(new Triangle(p00, p10, p11));
                    if (r !== rings - 1) mesh.triangles.push(new Triangle(p00.clone(), p11.clone(), p01));
                }
            }
            return mesh;
        }
    }

    /* ==========================================================================
       SCENE & CAMERA
       ========================================================================== */

    class Camera {
        constructor(fov = 60, aspect = 1.0, near = 0.1, far = 100.0) {
            this.position = new Vec3(0, 0, 3.5);
            this.target = new Vec3(0, 0, 0);
            this.up = new Vec3(0, 1, 0);
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
        }
        getViewMatrix() { return Mat4.lookAt(this.position, this.target, this.up); }
        getProjectionMatrix() {
            const fovRad = (this.fov * Math.PI) / 180.0;
            return Mat4.perspective(fovRad, this.aspect, this.near, this.far);
        }
        getViewProjectionMatrix() {
            return Mat4.multiply(this.getProjectionMatrix(), this.getViewMatrix());
        }
        orbit(yawDelta, pitchDelta, radius) {
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

    class DirectionalLight {
        constructor(direction = new Vec3(0.577, 0.577, 0.577), color = { r: 255, g: 255, b: 255 }, intensity = 1.0) {
            this.direction = direction.normalized();
            this.color = color;
            this.intensity = intensity;
        }
    }

    class Scene {
        constructor() {
            this.meshes = [];
            this.lights = [new DirectionalLight()];
            this.ambientLight = { r: 40, g: 45, b: 60 };
        }
        add(mesh) { this.meshes.push(mesh); }
        remove(mesh) {
            const idx = this.meshes.indexOf(mesh);
            if (idx !== -1) this.meshes.splice(idx, 1);
        }
    }

    /* ==========================================================================
       ASCII RASTERIZER & RENDERER
       ========================================================================== */

    const ASCII_RAMPS = {
        standard: " .:-=+*#%@",
        detailed: " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
        blocks:   " ░▒▓█",
        matrix:   " .0123456789ABCDEF",
        simple:   " .:+*#"
    };

    class FrameBuffer {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.size = width * height;
            this.chars = new Array(this.size);
            this.colors = new Uint8ClampedArray(this.size * 3);
            this.depth = new Float32Array(this.size);
            this.clear();
        }
        resize(width, height) {
            this.width = width;
            this.height = height;
            this.size = width * height;
            this.chars = new Array(this.size);
            this.colors = new Uint8ClampedArray(this.size * 3);
            this.depth = new Float32Array(this.size);
            this.clear();
        }
        clear(bgChar = ' ', bgR = 10, bgG = 12, bgB = 16) {
            this.chars.fill(bgChar);
            this.depth.fill(Infinity);
            for (let i = 0; i < this.size; i++) {
                const idx = i * 3;
                this.colors[idx] = bgR;
                this.colors[idx + 1] = bgG;
                this.colors[idx + 2] = bgB;
            }
        }
        setPixel(x, y, z, char, r, g, b) {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;
            const idx = y * this.width + x;
            if (z < this.depth[idx]) {
                this.depth[idx] = z;
                this.chars[idx] = char;
                const cIdx = idx * 3;
                this.colors[cIdx] = r;
                this.colors[cIdx + 1] = g;
                this.colors[cIdx + 2] = b;
                return true;
            }
            return false;
        }
    }

    class AsciiRenderer {
        constructor(width = 110, height = 45) {
            this.width = width;
            this.height = height;
            this.buffer = new FrameBuffer(width, height);
            this.config = {
                renderMode: "color",
                rampName: "standard",
                wireframeOnly: false,
                backfaceCulling: true,
                dithering: true
            };
        }
        setSize(width, height) {
            this.width = width;
            this.height = height;
            this.buffer.resize(width, height);
        }
        render(scene, camera) {
            this.buffer.clear();
            const vpMatrix = camera.getViewProjectionMatrix();
            const ramp = ASCII_RAMPS[this.config.rampName] || ASCII_RAMPS.standard;
            const rampLen = ramp.length;

            for (const mesh of scene.meshes) {
                const modelMatrix = mesh.getModelMatrix();
                const mvp = Mat4.multiply(vpMatrix, modelMatrix);
                for (const tri of mesh.triangles) {
                    this.renderTriangle(tri, mesh, modelMatrix, mvp, scene, camera, ramp, rampLen);
                }
            }
        }
        renderTriangle(tri, mesh, modelMatrix, mvp, scene, camera, ramp, rampLen) {
            const v0 = tri.v0, v1 = tri.v1, v2 = tri.v2;
            const mElem = modelMatrix.elements;
            const wPos0 = v0.pos.transformMat4(mElem);
            const wPos1 = v1.pos.transformMat4(mElem);
            const wPos2 = v2.pos.transformMat4(mElem);
            const wNorm0 = v0.normal.transformDirection(mElem);
            const wNorm1 = v1.normal.transformDirection(mElem);
            const wNorm2 = v2.normal.transformDirection(mElem);

            const edge1 = wPos1.sub(wPos0);
            const edge2 = wPos2.sub(wPos0);
            const faceNormal = edge1.cross(edge2).normalize();
            const viewDir = camera.position.sub(wPos0).normalize();
            if (this.config.backfaceCulling && faceNormal.dot(viewDir) <= 0) return;

            const p0 = this.projectVertex(v0.pos, mvp);
            const p1 = this.projectVertex(v1.pos, mvp);
            const p2 = this.projectVertex(v2.pos, mvp);
            if (p0.w <= 0.05 || p1.w <= 0.05 || p2.w <= 0.05) return;

            const s0 = this.toScreen(p0);
            const s1 = this.toScreen(p1);
            const s2 = this.toScreen(p2);

            if (this.config.wireframeOnly || mesh.material.wireframe || this.config.renderMode === "wireframe") {
                this.drawWireframeTriangle(s0, s1, s2, mesh.material.color);
                return;
            }

            const minX = Math.max(0, Math.floor(Math.min(s0.x, s1.x, s2.x)));
            const maxX = Math.min(this.width - 1, Math.ceil(Math.max(s0.x, s1.x, s2.x)));
            const minY = Math.max(0, Math.floor(Math.min(s0.y, s1.y, s2.y)));
            const maxY = Math.min(this.height - 1, Math.ceil(Math.max(s0.y, s1.y, s2.y)));
            if (minX > maxX || minY > maxY) return;

            const denom = (s1.y - s2.y) * (s0.x - s2.x) + (s2.x - s1.x) * (s0.y - s2.y);
            if (Math.abs(denom) < 0.0001) return;
            const invDenom = 1.0 / denom;

            const invW0 = 1.0 / p0.w, invW1 = 1.0 / p1.w, invW2 = 1.0 / p2.w;
            const mainLight = scene.lights[0];
            const lightDir = mainLight ? mainLight.direction : new Vec3(0, 1, 0);

            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const px = x + 0.5, py = y + 0.5;
                    const w0 = ((s1.y - s2.y) * (px - s2.x) + (s2.x - s1.x) * (py - s2.y)) * invDenom;
                    const w1 = ((s2.y - s0.y) * (px - s2.x) + (s0.x - s2.x) * (py - s2.y)) * invDenom;
                    const w2 = 1.0 - w0 - w1;

                    if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                        const interpolatedInvW = w0 * invW0 + w1 * invW1 + w2 * invW2;
                        const z = 1.0 / interpolatedInvW;
                        const idx = y * this.width + x;
                        if (z >= this.buffer.depth[idx]) continue;

                        const pw0 = (w0 * invW0) * z;
                        const pw1 = (w1 * invW1) * z;
                        const pw2 = (w2 * invW2) * z;

                        const nx = pw0 * wNorm0.x + pw1 * wNorm1.x + pw2 * wNorm2.x;
                        const ny = pw0 * wNorm0.y + pw1 * wNorm1.y + pw2 * wNorm2.y;
                        const nz = pw0 * wNorm0.z + pw1 * wNorm1.z + pw2 * wNorm2.z;
                        const normLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                        const norm = new Vec3(nx / normLen, ny / normLen, nz / normLen);

                        const u = pw0 * v0.uv.x + pw1 * v1.uv.x + pw2 * v2.uv.x;
                        const v = pw0 * v0.uv.y + pw1 * v1.uv.y + pw2 * v2.uv.y;

                        const nDotL = Math.max(0, norm.dot(lightDir));
                        const ambient = 0.25;
                        let intensity = ambient + (1.0 - ambient) * nDotL;

                        const halfVector = lightDir.add(viewDir).normalize();
                        const nDotH = Math.max(0, norm.dot(halfVector));
                        if (nDotL > 0) {
                            intensity += Math.pow(nDotH, mesh.material.shininess || 16) * 0.45;
                        }
                        intensity = Math.min(1.0, Math.max(0.0, intensity));

                        let shadeVal = intensity;
                        if (this.config.dithering) {
                            const ditherPattern = ((x & 1) ^ (y & 1)) ? 0.03 : -0.03;
                            shadeVal = Math.min(1.0, Math.max(0.0, intensity + ditherPattern));
                        }

                        let char = ' ';
                        let r = mesh.material.color.r;
                        let g = mesh.material.color.g;
                        let b = mesh.material.color.b;

                        switch (this.config.renderMode) {
                            case "normals": {
                                r = Math.floor((norm.x * 0.5 + 0.5) * 255);
                                g = Math.floor((norm.y * 0.5 + 0.5) * 255);
                                b = Math.floor((norm.z * 0.5 + 0.5) * 255);
                                if (Math.abs(norm.y) > 0.7) char = norm.y > 0 ? '^' : 'v';
                                else if (Math.abs(norm.x) > 0.7) char = norm.x > 0 ? '>' : '<';
                                else char = norm.z > 0 ? 'O' : '.';
                                break;
                            }
                            case "depth": {
                                const depthNorm = Math.min(1.0, Math.max(0.0, (z - 1.0) / 10.0));
                                const rampIdx = Math.floor((1.0 - depthNorm) * (rampLen - 1));
                                char = ramp[rampIdx];
                                const cVal = Math.floor((1.0 - depthNorm) * 255);
                                r = cVal; g = cVal; b = cVal;
                                break;
                            }
                            case "textured": {
                                const tx = Math.floor(u * 8) & 1;
                                const ty = Math.floor(v * 8) & 1;
                                const isPattern = tx ^ ty;
                                char = isPattern ? '#' : '.';
                                const factor = isPattern ? 1.0 : 0.6;
                                r = Math.floor(r * intensity * factor);
                                g = Math.floor(g * intensity * factor);
                                b = Math.floor(b * intensity * factor);
                                break;
                            }
                            case "color": {
                                const rampIdx = Math.min(rampLen - 1, Math.floor(shadeVal * rampLen));
                                char = ramp[rampIdx];
                                r = Math.floor(r * intensity);
                                g = Math.floor(g * intensity);
                                b = Math.floor(b * intensity);
                                break;
                            }
                            case "shaded":
                            default: {
                                const rampIdx = Math.min(rampLen - 1, Math.floor(shadeVal * rampLen));
                                char = ramp[rampIdx];
                                const brightness = Math.floor(intensity * 255);
                                r = brightness; g = brightness; b = brightness;
                                break;
                            }
                        }

                        this.buffer.setPixel(x, y, z, char, r, g, b);
                    }
                }
            }
        }
        projectVertex(v, mvp) {
            const m = mvp.elements;
            const x = v.x, y = v.y, z = v.z;
            const w = m[3] * x + m[7] * y + m[11] * z + m[15];
            return {
                x: m[0] * x + m[4] * y + m[8] * z + m[12],
                y: m[1] * x + m[5] * y + m[9] * z + m[13],
                z: m[2] * x + m[6] * y + m[10] * z + m[14],
                w: w
            };
        }
        toScreen(p) {
            const invW = 1.0 / p.w;
            return {
                x: ((p.x * invW + 1.0) * 0.5) * this.width,
                y: ((1.0 - p.y * invW) * 0.5) * this.height,
                z: p.w
            };
        }
        drawWireframeTriangle(s0, s1, s2, color) {
            this.drawLine(s0.x, s0.y, s0.z, s1.x, s1.y, s1.z, '-', color);
            this.drawLine(s1.x, s1.y, s1.z, s2.x, s2.y, s2.z, '/', color);
            this.drawLine(s2.x, s2.y, s2.z, s0.x, s0.y, s0.z, '\\', color);
        }
        drawLine(x0, y0, z0, x1, y1, z1, defaultChar, color) {
            x0 = Math.round(x0); y0 = Math.round(y0);
            x1 = Math.round(x1); y1 = Math.round(y1);
            const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
            const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
            let err = dx - dy;
            let curX = x0, curY = y0;
            const totalDist = Math.max(dx, dy) || 1;
            let step = 0;
            while (true) {
                const t = step / totalDist;
                const z = z0 + (z1 - z0) * t;
                let char = defaultChar;
                if (dx > dy * 2) char = '-';
                else if (dy > dx * 2) char = '|';
                else if ((sx > 0 && sy > 0) || (sx < 0 && sy < 0)) char = '\\';
                else char = '/';
                this.buffer.setPixel(curX, curY, z, char, color.r, color.g, color.b);
                if (curX === x1 && curY === y1) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; curX += sx; }
                if (e2 < dx)  { err += dx; curY += sy; }
                step++;
            }
        }
    }

    /* ==========================================================================
       DISPLAY & ENGINE CORE
       ========================================================================== */

    class AsciiDisplay {
        constructor(canvas, options = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: false });
            this.fontSize = options.fontSize || 13;
            this.fontFamily = options.fontFamily || '"Courier New", Courier, monospace';
            this.charWidth = 0;
            this.charHeight = 0;
            this.theme = options.theme || "fullcolor";
            this.initFontMetrics();
        }
        initFontMetrics() {
            this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            const metrics = this.ctx.measureText('M');
            this.charWidth = metrics.width;
            this.charHeight = Math.round(this.fontSize * 1.15);
        }
        resizeToBuffer(bufferWidth, bufferHeight) {
            this.canvas.width = Math.ceil(bufferWidth * this.charWidth);
            this.canvas.height = Math.ceil(bufferHeight * this.charHeight);
            this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            this.ctx.textBaseline = 'top';
        }
        render(buffer) {
            const { width, height, chars, colors } = buffer;
            const cw = this.charWidth, ch = this.charHeight;
            const ctx = this.ctx;
            ctx.fillStyle = '#0a0d12';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.font = `${this.fontSize}px ${this.fontFamily}`;
            ctx.textBaseline = 'top';

            for (let y = 0; y < height; y++) {
                const rowOffset = y * width;
                const posY = y * ch;
                for (let x = 0; x < width; x++) {
                    const idx = rowOffset + x;
                    const char = chars[idx];
                    if (!char || char === ' ') continue;

                    const cIdx = idx * 3;
                    let r = colors[cIdx], g = colors[cIdx + 1], b = colors[cIdx + 2];

                    if (this.theme === "matrix") {
                        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                        r = Math.floor(lum * 40); g = Math.floor(lum * 255); b = Math.floor(lum * 70);
                    } else if (this.theme === "amber") {
                        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
                        r = Math.floor(lum * 255); g = Math.floor(lum * 170); b = Math.floor(lum * 20);
                    } else if (this.theme === "monochrome") {
                        const lum = Math.floor(r * 0.299 + g * 0.587 + b * 0.114);
                        r = g = b = lum;
                    } else if (this.theme === "cyberpunk") {
                        r = Math.floor(r * 0.9 + 50); g = Math.floor(g * 0.3); b = Math.floor(b * 1.1 + 40);
                    }

                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillText(char, x * cw, posY);
                }
            }
        }
        getPlainText(buffer) {
            let text = '';
            for (let y = 0; y < buffer.height; y++) {
                const rowStart = y * buffer.width;
                for (let x = 0; x < buffer.width; x++) {
                    text += buffer.chars[rowStart + x] || ' ';
                }
                text += '\n';
            }
            return text;
        }
    }

    class AsciiEngine {
        constructor(canvas, config = {}) {
            this.width = config.width || 110;
            this.height = config.height || 45;
            this.scene = new Scene();
            this.camera = new Camera(50, (this.width / this.height) * 0.55, 0.1, 100);
            this.renderer = new AsciiRenderer(this.width, this.height);
            this.display = new AsciiDisplay(canvas, {
                fontSize: config.fontSize || 13,
                theme: config.theme || "fullcolor"
            });
            this.display.resizeToBuffer(this.width, this.height);

            this.isRunning = false;
            this.lastTime = 0;
            this.fps = 0;
            this.frameCount = 0;
            this.fpsTimer = 0;
            this.updateHooks = [];
            this.input = {
                keys: {},
                mouse: { x: 0, y: 0, isDown: false, lastX: 0, lastY: 0 }
            };
            this.setupInput(canvas);
        }
        onUpdate(callback) { this.updateHooks.push(callback); }
        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastTime = performance.now();
            this.loop = this.loop.bind(this);
            requestAnimationFrame(this.loop);
        }
        stop() { this.isRunning = false; }
        loop(currentTime) {
            if (!this.isRunning) return;
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;
            this.frameCount++;
            this.fpsTimer += deltaTime;
            if (this.fpsTimer >= 0.5) {
                this.fps = Math.round((this.frameCount / this.fpsTimer));
                this.frameCount = 0;
                this.fpsTimer = 0;
            }
            for (const hook of this.updateHooks) hook(deltaTime, this);
            this.renderer.render(this.scene, this.camera);
            this.display.render(this.renderer.buffer);
            requestAnimationFrame(this.loop);
        }
        setupInput(canvas) {
            window.addEventListener('keydown', (e) => { this.input.keys[e.code] = true; });
            window.addEventListener('keyup', (e) => { this.input.keys[e.code] = false; });
            canvas.addEventListener('mousedown', (e) => {
                this.input.mouse.isDown = true;
                this.input.mouse.lastX = e.clientX;
                this.input.mouse.lastY = e.clientY;
            });
            window.addEventListener('mouseup', () => { this.input.mouse.isDown = false; });
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

    /* ==========================================================================
       8-BIT AUDIO SYNTHESIZER
       ========================================================================== */

    class RetroAudio {
        constructor() {
            this.ctx = null;
            this.isPlaying = false;
            this.isMuted = false;
            this.currentStep = 0;
            this.timerId = null;
            this.tempo = 126;
            this.masterVolume = 0.22;

            const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
            const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880.00;
            const C3 = 130.81, G3 = 196.00, A3 = 220.00, F3 = 174.61, E3 = 164.81;

            this.melody = [
                E4, G4, A4, B4, C5, B4, A4, G4,
                E4, D4, E4, G4, A4, 0,  G4, E4,
                F4, A4, C5, D5, E5, D5, C5, A4,
                G4, B4, D5, B4, G4, E4, D4, 0
            ];

            this.bassLine = [
                C3, C3, G3, G3, A3, A3, F3, F3,
                C3, C3, G3, G3, A3, A3, E3, E3,
                F3, F3, A3, A3, D4, D4, F3, F3,
                G3, G3, 246.94, 246.94, G3, G3, C3, C3
            ];
        }

        initContext() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioContext();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        startMusic() {
            if (this.isPlaying) return;
            this.initContext();
            this.isPlaying = true;
            const stepDuration = (60 / this.tempo) * 0.5 * 1000;
            this.timerId = setInterval(() => {
                if (!this.isMuted) this.tick();
            }, stepDuration);
        }

        stopMusic() {
            this.isPlaying = false;
            if (this.timerId) {
                clearInterval(this.timerId);
                this.timerId = null;
            }
        }

        toggleMute() {
            this.isMuted = !this.isMuted;
            if (!this.isPlaying && !this.isMuted) {
                this.startMusic();
            }
            return this.isMuted;
        }

        tick() {
            if (!this.ctx) return;
            const step = this.currentStep % this.melody.length;
            const now = this.ctx.currentTime;
            const note = this.melody[step];
            if (note > 0) this.playTone(note, 'square', 0.15, 0.16, now);

            const bass = this.bassLine[step];
            if (bass > 0) this.playTone(bass, 'triangle', 0.22, 0.24, now);

            if (step % 2 === 0) this.playHiHat(now);
            if (step % 4 === 2) this.playSnare(now);
            this.currentStep++;
        }

        playTone(freq, type, duration, vol, time) {
            if (!this.ctx || this.isMuted) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(vol * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + duration);
        }

        playHiHat(time) {
            if (!this.ctx || this.isMuted) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1800, time);
            osc.frequency.exponentialRampToValueAtTime(800, time + 0.04);
            gain.gain.setValueAtTime(0.06 * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.04);
        }

        playSnare(time) {
            if (!this.ctx || this.isMuted) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, time);
            osc.frequency.exponentialRampToValueAtTime(60, time + 0.08);
            gain.gain.setValueAtTime(0.12 * this.masterVolume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.08);
        }

        playDialogueBlip(pitch = 480) {
            if (!this.ctx || this.isMuted) return;
            this.initContext();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const randomizedPitch = pitch + (Math.random() * 40 - 20);
            osc.frequency.setValueAtTime(randomizedPitch, now);
            gain.gain.setValueAtTime(0.08 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        }

        playMenuBeep(confirm = false) {
            if (!this.ctx || this.isMuted) return;
            this.initContext();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            const freq = confirm ? 720 : 380;
            osc.frequency.setValueAtTime(freq, now);
            if (confirm) osc.frequency.exponentialRampToValueAtTime(960, now + 0.12);
            gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    }

    /* ==========================================================================
       DIALOGUE SYSTEM
       ========================================================================== */

    class DialogueSystem {
        constructor(audio) {
            this.audio = audio;
            this.isActive = false;
            this.messages = [];
            this.currentIndex = 0;
            this.speaker = "";
            this.displayedText = "";
            this.fullText = "";
            this.charIndex = 0;
            this.isTyping = false;
            this.typeSpeed = 26;
            this.typeTimer = null;
            this.onCompleteCallback = null;
        }

        start(dialogueData, onComplete = null) {
            this.isActive = true;
            this.speaker = dialogueData.speaker || "NPC";
            this.messages = dialogueData.messages || [];
            this.currentIndex = 0;
            this.onCompleteCallback = onComplete;
            this.showNextMessage();
        }

        showNextMessage() {
            if (this.currentIndex >= this.messages.length) {
                this.close();
                return;
            }
            this.fullText = this.messages[this.currentIndex];
            this.displayedText = "";
            this.charIndex = 0;
            this.isTyping = true;
            if (this.typeTimer) clearInterval(this.typeTimer);

            this.typeTimer = setInterval(() => {
                if (this.charIndex < this.fullText.length) {
                    const char = this.fullText[this.charIndex];
                    this.displayedText += char;
                    this.charIndex++;
                    if (char !== ' ' && this.audio) {
                        this.audio.playDialogueBlip(520);
                    }
                } else {
                    this.isTyping = false;
                    clearInterval(this.typeTimer);
                    this.typeTimer = null;
                }
            }, this.typeSpeed);
        }

        advance() {
            if (!this.isActive) return;
            if (this.isTyping) {
                clearInterval(this.typeTimer);
                this.typeTimer = null;
                this.displayedText = this.fullText;
                this.isTyping = false;
            } else {
                this.currentIndex++;
                this.showNextMessage();
            }
        }

        close() {
            this.isActive = false;
            if (this.typeTimer) clearInterval(this.typeTimer);
            this.typeTimer = null;
            if (this.onCompleteCallback) this.onCompleteCallback();
        }
    }

    /* ==========================================================================
       GAME WORLD & ISOMETRIC ENTITIES
       ========================================================================== */

    class GameWorld {
        constructor(scene, camera) {
            this.scene = scene;
            this.camera = camera;
            this.player = null;
            this.npc = null;
            this.grassPatches = [];
            this.trees = [];
            this.worldBounds = 8.5;

            // Isometric camera angles
            this.camOffset = new Vec3(4.8, 7.2, 5.2);
            this.time = 0;
            this.canTalkToNPC = false;

            this.initWorld();
        }

        initWorld() {
            // Ground Plane
            const ground = Mesh.createCube(18, { r: 40, g: 85, b: 45 });
            ground.position = new Vec3(0, -9.05, 0);
            this.scene.add(ground);

            // Player
            this.player = {
                pos: new Vec3(0, 0, 2),
                rotY: 0,
                targetRotY: 0,
                speed: 4.2,
                isMoving: false,
                stepCycle: 0,
                bodyMesh: Mesh.createCube(0.65, { r: 50, g: 130, b: 240 }),
                headMesh: Mesh.createSphere(0.32, 8, 10, { r: 245, g: 200, b: 160 }),
                hatMesh: Mesh.createPyramid(0.55, 0.55, { r: 230, g: 50, b: 50 })
            };
            this.scene.add(this.player.bodyMesh);
            this.scene.add(this.player.headMesh);
            this.scene.add(this.player.hatMesh);

            // NPC (Merlin)
            this.npc = {
                pos: new Vec3(2.5, 0, -2.0),
                bodyMesh: Mesh.createCube(0.65, { r: 140, g: 50, b: 180 }),
                headMesh: Mesh.createSphere(0.32, 8, 10, { r: 235, g: 190, b: 155 }),
                hatMesh: Mesh.createPyramid(0.6, 0.95, { r: 255, g: 215, b: 0 })
            };
            this.npc.bodyMesh.position.set(this.npc.pos.x, 0.32, this.npc.pos.z);
            this.npc.headMesh.position.set(this.npc.pos.x, 0.82, this.npc.pos.z);
            this.npc.hatMesh.position.set(this.npc.pos.x, 1.28, this.npc.pos.z);
            this.scene.add(this.npc.bodyMesh);
            this.scene.add(this.npc.headMesh);
            this.scene.add(this.npc.hatMesh);

            // Trees
            const treeCoords = [
                [-5, -4], [-3, -6], [5, -5], [6, 2], [-6, 3],
                [-4, 6], [4, 6], [1, -6], [-7, -1], [7, -1]
            ];
            for (const [tx, tz] of treeCoords) {
                this.createTree(tx, tz);
            }

            // Waving Grass
            this.createGrassField(48);

            // Position initial isometric camera
            this.camera.position = this.player.pos.add(this.camOffset);
            this.camera.target = this.player.pos.clone();
        }

        createTree(x, z) {
            const trunk = Mesh.createCube(0.4, { r: 110, g: 70, b: 40 });
            trunk.scale = new Vec3(1, 2.5, 1);
            trunk.position = new Vec3(x, 0.5, z);
            this.scene.add(trunk);

            const fol1 = Mesh.createPyramid(1.6, 1.4, { r: 35, g: 145, b: 55 });
            fol1.position = new Vec3(x, 1.4, z);
            this.scene.add(fol1);

            const fol2 = Mesh.createPyramid(1.1, 1.2, { r: 55, g: 180, b: 70 });
            fol2.position = new Vec3(x, 2.1, z);
            this.scene.add(fol2);

            this.trees.push({ trunk, fol1, fol2 });
        }

        createGrassField(count) {
            for (let i = 0; i < count; i++) {
                let gx = (Math.random() - 0.5) * 15;
                let gz = (Math.random() - 0.5) * 15;
                const height = 0.38 + Math.random() * 0.28;
                const width = 0.26 + Math.random() * 0.14;
                const colorG = 130 + Math.floor(Math.random() * 80);
                const grassMesh = Mesh.createPyramid(width, height, { r: 45, g: colorG, b: 45 });

                grassMesh.position = new Vec3(gx, height * 0.45, gz);
                grassMesh.basePos = grassMesh.position.clone();
                grassMesh.swayPhase = Math.random() * Math.PI * 2;
                this.scene.add(grassMesh);
                this.grassPatches.push(grassMesh);
            }
        }

        update(dt, input) {
            this.time += dt;
            let moveX = 0;
            let moveZ = 0;

            if (input.keys['KeyW'] || input.keys['ArrowUp']) { moveX -= 1; moveZ -= 1; }
            if (input.keys['KeyS'] || input.keys['ArrowDown']) { moveX += 1; moveZ += 1; }
            if (input.keys['KeyA'] || input.keys['ArrowLeft']) { moveX -= 1; moveZ += 1; }
            if (input.keys['KeyD'] || input.keys['ArrowRight']) { moveX += 1; moveZ -= 1; }

            const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
            if (len > 0.001) {
                moveX /= len;
                moveZ /= len;
                this.player.isMoving = true;
                this.player.stepCycle += dt * 12;
                this.player.pos.x += moveX * this.player.speed * dt;
                this.player.pos.z += moveZ * this.player.speed * dt;
                this.player.pos.x = Math.max(-this.worldBounds, Math.min(this.worldBounds, this.player.pos.x));
                this.player.pos.z = Math.max(-this.worldBounds, Math.min(this.worldBounds, this.player.pos.z));
                this.player.targetRotY = Math.atan2(moveX, moveZ);
            } else {
                this.player.isMoving = false;
            }

            let diff = this.player.targetRotY - this.player.rotY;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.player.rotY += diff * Math.min(1.0, dt * 14);

            const bob = this.player.isMoving ? Math.abs(Math.sin(this.player.stepCycle)) * 0.12 : 0;
            const p = this.player.pos;
            this.player.bodyMesh.position.set(p.x, 0.32 + bob, p.z);
            this.player.bodyMesh.rotation.y = this.player.rotY;
            this.player.headMesh.position.set(p.x, 0.78 + bob, p.z);
            this.player.headMesh.rotation.y = this.player.rotY;
            this.player.hatMesh.position.set(p.x, 1.15 + bob, p.z);
            this.player.hatMesh.rotation.y = this.player.rotY;

            // Swaying Grass
            const windWave = this.time * 3.4;
            for (const grass of this.grassPatches) {
                const wind = Math.sin(windWave + grass.basePos.x * 0.6 + grass.basePos.z * 0.6 + grass.swayPhase);
                grass.rotation.z = wind * 0.32;
                grass.rotation.x = Math.cos(windWave + grass.swayPhase) * 0.16;
            }

            // NPC animation and distance check
            this.npc.bodyMesh.rotation.y = Math.sin(this.time * 1.5) * 0.15 + 0.6;
            const npcBob = Math.sin(this.time * 2.5) * 0.04;
            this.npc.headMesh.position.y = 0.82 + npcBob;
            this.npc.hatMesh.position.y = 1.28 + npcBob;

            const distToNPC = this.player.pos.sub(this.npc.pos).length();
            this.canTalkToNPC = (distToNPC < 2.3);

            // Smooth Isometric Camera Follow
            const targetCamPos = this.player.pos.add(this.camOffset);
            const lerpFactor = Math.min(1.0, dt * 7.0);
            this.camera.position.x += (targetCamPos.x - this.camera.position.x) * lerpFactor;
            this.camera.position.y += (targetCamPos.y - this.camera.position.y) * lerpFactor;
            this.camera.position.z += (targetCamPos.z - this.camera.position.z) * lerpFactor;

            this.camera.target.x += (this.player.pos.x - this.camera.target.x) * lerpFactor;
            this.camera.target.y += (this.player.pos.y + 0.4 - this.camera.target.y) * lerpFactor;
            this.camera.target.z += (this.player.pos.z - this.camera.target.z) * lerpFactor;
        }
    }

    // Export public API
    exports.Vec2 = Vec2;
    exports.Vec3 = Vec3;
    exports.Mat4 = Mat4;
    exports.Vertex = Vertex;
    exports.Triangle = Triangle;
    exports.Mesh = Mesh;
    exports.Camera = Camera;
    exports.DirectionalLight = DirectionalLight;
    exports.Scene = Scene;
    exports.FrameBuffer = FrameBuffer;
    exports.AsciiRenderer = AsciiRenderer;
    exports.ASCII_RAMPS = ASCII_RAMPS;
    exports.AsciiDisplay = AsciiDisplay;
    exports.AsciiEngine = AsciiEngine;
    exports.RetroAudio = RetroAudio;
    exports.DialogueSystem = DialogueSystem;
    exports.GameWorld = GameWorld;

})));
