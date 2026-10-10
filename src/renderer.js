/**
 * ASCII 3D Game Engine - Software Rasterizer & ASCII Shading Pipeline
 * Pure CPU software 3D pipeline with Barycentric rasterization,
 * perspective-correct interpolation, Z-buffering, and multi-mode ASCII shading.
 */

import { Vec3, Vec2, Mat4 } from './math.js';

export const ASCII_RAMPS = {
    standard: " .:-=+*#%@",
    detailed: " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    blocks:   " ░▒▓█",
    matrix:   " .0123456789ABCDEF",
    simple:   " .:+*#"
};

export class FrameBuffer {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.size = width * height;

        // Character code for each cell
        this.chars = new Array(this.size);
        // Colors: packed [r, g, b] per cell
        this.colors = new Uint8ClampedArray(this.size * 3);
        // Z-Buffer (depth values, lower is closer)
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
            this.colors[idx]     = bgR;
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
            this.colors[cIdx]     = r;
            this.colors[cIdx + 1] = g;
            this.colors[cIdx + 2] = b;
            return true;
        }
        return false;
    }
}

export class AsciiRenderer {
    constructor(width = 120, height = 45) {
        this.width = width;
        this.height = height;
        this.buffer = new FrameBuffer(width, height);

        // Render configuration
        this.config = {
            renderMode: "shaded", // "shaded", "color", "wireframe", "normals", "depth", "textured"
            rampName: "standard",
            wireframeOnly: false,
            backfaceCulling: true,
            dithering: true,
            asciiAspectCorrection: 0.55 // Monospace fonts are typically taller than wide (width / height ~ 0.55)
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
        const v0 = tri.v0;
        const v1 = tri.v1;
        const v2 = tri.v2;

        // Transform vertices to World Space
        const wPos0 = v0.pos.transformMat4(modelMatrix.elements);
        const wPos1 = v1.pos.transformMat4(modelMatrix.elements);
        const wPos2 = v2.pos.transformMat4(modelMatrix.elements);

        // Transform Normals to World Space
        const wNorm0 = v0.normal.transformDirection(modelMatrix.elements);
        const wNorm1 = v1.normal.transformDirection(modelMatrix.elements);
        const wNorm2 = v2.normal.transformDirection(modelMatrix.elements);

        // World-space Face Normal for Backface Culling
        const edge1 = wPos1.sub(wPos0);
        const edge2 = wPos2.sub(wPos0);
        const faceNormal = edge1.cross(edge2).normalize();

        const viewDir = camera.position.sub(wPos0).normalize();
        if (this.config.backfaceCulling && faceNormal.dot(viewDir) <= 0) {
            return; // Cull back-facing triangle
        }

        // Project vertices to Screen Clip Space
        const p0 = this.projectVertex(v0.pos, mvp);
        const p1 = this.projectVertex(v1.pos, mvp);
        const p2 = this.projectVertex(v2.pos, mvp);

        // Guard against triangles entirely behind camera (near plane clip)
        if (p0.w <= 0.05 || p1.w <= 0.05 || p2.w <= 0.05) return;

        // Screen space coordinates (scaled to buffer width & height)
        const s0 = this.toScreen(p0);
        const s1 = this.toScreen(p1);
        const s2 = this.toScreen(p2);

        if (this.config.wireframeOnly || mesh.material.wireframe || this.config.renderMode === "wireframe") {
            this.drawWireframeTriangle(s0, s1, s2, mesh.material.color);
            return;
        }

        // Barycentric Rasterization
        let minX = Math.max(0, Math.floor(Math.min(s0.x, s1.x, s2.x)));
        let maxX = Math.min(this.width - 1, Math.ceil(Math.max(s0.x, s1.x, s2.x)));
        let minY = Math.max(0, Math.floor(Math.min(s0.y, s1.y, s2.y)));
        let maxY = Math.min(this.height - 1, Math.ceil(Math.max(s0.y, s1.y, s2.y)));

        if (minX > maxX || minY > maxY) return;

        // 2D Area of triangle
        const denom = (s1.y - s2.y) * (s0.x - s2.x) + (s2.x - s1.x) * (s0.y - s2.y);
        if (Math.abs(denom) < 0.0001) return; // Degenerate triangle

        const invDenom = 1.0 / denom;

        // Precompute reciprocal W for perspective correction
        const invW0 = 1.0 / p0.w;
        const invW1 = 1.0 / p1.w;
        const invW2 = 1.0 / p2.w;

        const mainLight = scene.lights[0];
        const lightDir = mainLight ? mainLight.direction : new Vec3(0, 1, 0);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const px = x + 0.5;
                const py = y + 0.5;

                // Barycentric weights
                const w0 = ((s1.y - s2.y) * (px - s2.x) + (s2.x - s1.x) * (py - s2.y)) * invDenom;
                const w1 = ((s2.y - s0.y) * (px - s2.x) + (s0.x - s2.x) * (py - s2.y)) * invDenom;
                const w2 = 1.0 - w0 - w1;

                if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                    // Perspective-correct interpolation of 1/Z
                    const interpolatedInvW = w0 * invW0 + w1 * invW1 + w2 * invW2;
                    const z = 1.0 / interpolatedInvW;

                    const idx = y * this.width + x;
                    if (z >= this.buffer.depth[idx]) continue; // Depth test failed

                    // Correct weights for perspective interpolation of attributes
                    const pw0 = (w0 * invW0) * z;
                    const pw1 = (w1 * invW1) * z;
                    const pw2 = (w2 * invW2) * z;

                    // Interpolated Normal
                    const nx = pw0 * wNorm0.x + pw1 * wNorm1.x + pw2 * wNorm2.x;
                    const ny = pw0 * wNorm0.y + pw1 * wNorm1.y + pw2 * wNorm2.y;
                    const nz = pw0 * wNorm0.z + pw1 * wNorm1.z + pw2 * wNorm2.z;
                    const normLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                    const norm = new Vec3(nx / normLen, ny / normLen, nz / normLen);

                    // Interpolated UV
                    const u = pw0 * v0.uv.x + pw1 * v1.uv.x + pw2 * v2.uv.x;
                    const v = pw0 * v0.uv.y + pw1 * v1.uv.y + pw2 * v2.uv.y;

                    // Light calculation: Lambertian Diffuse + Ambient
                    const nDotL = Math.max(0, norm.dot(lightDir));
                    const ambient = 0.22;
                    let intensity = ambient + (1.0 - ambient) * nDotL;

                    // Simple Specular highlight
                    const halfVector = lightDir.add(viewDir).normalize();
                    const nDotH = Math.max(0, norm.dot(halfVector));
                    if (nDotL > 0) {
                        intensity += Math.pow(nDotH, mesh.material.shininess || 16) * 0.45;
                    }
                    intensity = Math.min(1.0, Math.max(0.0, intensity));

                    // Dithering option to make ASCII transitions smoother
                    let shadeVal = intensity;
                    if (this.config.dithering) {
                        const ditherPattern = ((x & 1) ^ (y & 1)) ? 0.03 : -0.03;
                        shadeVal = Math.min(1.0, Math.max(0.0, intensity + ditherPattern));
                    }

                    // Compute Char and Color based on renderMode
                    let char = ' ';
                    let r = mesh.material.color.r;
                    let g = mesh.material.color.g;
                    let b = mesh.material.color.b;

                    switch (this.config.renderMode) {
                        case "normals": {
                            // Map normal (-1..1) to RGB (0..255)
                            r = Math.floor((norm.x * 0.5 + 0.5) * 255);
                            g = Math.floor((norm.y * 0.5 + 0.5) * 255);
                            b = Math.floor((norm.z * 0.5 + 0.5) * 255);
                            // Choose character by normal direction
                            if (Math.abs(norm.y) > 0.7) char = norm.y > 0 ? '^' : 'v';
                            else if (Math.abs(norm.x) > 0.7) char = norm.x > 0 ? '>' : '<';
                            else char = norm.z > 0 ? 'O' : '.';
                            break;
                        }
                        case "depth": {
                            // Near/far depth visualization
                            const depthNorm = Math.min(1.0, Math.max(0.0, (z - 1.0) / 6.0));
                            const rampIdx = Math.floor((1.0 - depthNorm) * (rampLen - 1));
                            char = ramp[rampIdx];
                            const cVal = Math.floor((1.0 - depthNorm) * 255);
                            r = cVal; g = cVal; b = cVal;
                            break;
                        }
                        case "textured": {
                            // Procedural checkerboard / ASCII texture
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
                            // Colored ASCII with ramp
                            const rampIdx = Math.min(rampLen - 1, Math.floor(shadeVal * rampLen));
                            char = ramp[rampIdx];
                            r = Math.floor(r * intensity);
                            g = Math.floor(g * intensity);
                            b = Math.floor(b * intensity);
                            break;
                        }
                        case "shaded":
                        default: {
                            // Standard monochrome shaded ASCII
                            const rampIdx = Math.min(rampLen - 1, Math.floor(shadeVal * rampLen));
                            char = ramp[rampIdx];
                            const brightness = Math.floor(intensity * 255);
                            r = brightness;
                            g = brightness;
                            b = brightness;
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
        // NDC coordinates (-1..1) to Screen Space (0..width, 0..height)
        const invW = 1.0 / p.w;
        const ndcX = p.x * invW;
        const ndcY = p.y * invW;

        // Apply aspect ratio correction for monospace font character height vs width
        return {
            x: ((ndcX + 1.0) * 0.5) * this.width,
            y: ((1.0 - ndcY) * 0.5) * this.height,
            z: p.w
        };
    }

    drawWireframeTriangle(s0, s1, s2, color) {
        const char = '+';
        this.drawLine(s0.x, s0.y, s0.z, s1.x, s1.y, s1.z, '-', color);
        this.drawLine(s1.x, s1.y, s1.z, s2.x, s2.y, s2.z, '/', color);
        this.drawLine(s2.x, s2.y, s2.z, s0.x, s0.y, s0.z, '\\', color);
    }

    drawLine(x0, y0, z0, x1, y1, z1, defaultChar, color) {
        x0 = Math.round(x0); y0 = Math.round(y0);
        x1 = Math.round(x1); y1 = Math.round(y1);

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
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
