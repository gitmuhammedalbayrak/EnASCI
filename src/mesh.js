/**
 * ASCII 3D Game Engine - Mesh & Geometry
 */

import { Vec3, Vec2, Mat4 } from './math.js';

export class Vertex {
    constructor(pos, normal = new Vec3(0, 1, 0), uv = new Vec2(0, 0), color = { r: 255, g: 255, b: 255 }) {
        this.pos = pos;         // Vec3
        this.normal = normal;   // Vec3
        this.uv = uv;           // Vec2
        this.color = color;     // {r, g, b}
    }

    clone() {
        return new Vertex(
            this.pos.clone(),
            this.normal.clone(),
            this.uv.clone(),
            { ...this.color }
        );
    }
}

export class Triangle {
    constructor(v0, v1, v2) {
        this.v0 = v0; // Vertex
        this.v1 = v1;
        this.v2 = v2;
    }
}

export class Mesh {
    constructor(name = "Object") {
        this.name = name;
        this.triangles = []; // Array of Triangle
        this.position = new Vec3(0, 0, 0);
        this.rotation = new Vec3(0, 0, 0); // euler radians: rx, ry, rz
        this.scale = new Vec3(1, 1, 1);
        this.material = {
            charMap: "standard", // "standard", "dense", "blocks", "custom"
            texture: null,       // Procedural or pixel texture callback (u, v) => { char, r, g, b }
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
            // Front (Z+)
            { n: new Vec3(0, 0, 1), p: [new Vec3(-h,-h, h), new Vec3( h,-h, h), new Vec3( h, h, h), new Vec3(-h, h, h)] },
            // Back (Z-)
            { n: new Vec3(0, 0,-1), p: [new Vec3( h,-h,-h), new Vec3(-h,-h,-h), new Vec3(-h, h,-h), new Vec3( h, h,-h)] },
            // Top (Y+)
            { n: new Vec3(0, 1, 0), p: [new Vec3(-h, h, h), new Vec3( h, h, h), new Vec3( h, h,-h), new Vec3(-h, h,-h)] },
            // Bottom (Y-)
            { n: new Vec3(0,-1, 0), p: [new Vec3(-h,-h,-h), new Vec3( h,-h,-h), new Vec3( h,-h, h), new Vec3(-h,-h, h)] },
            // Right (X+)
            { n: new Vec3(1, 0, 0), p: [new Vec3( h,-h, h), new Vec3( h,-h,-h), new Vec3( h, h,-h), new Vec3( h, h, h)] },
            // Left (X-)
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

        // Calculate face normals for sides
        const addSide = (pA, pB, uvA, uvB) => {
            const edge1 = pB.sub(pA);
            const edge2 = top.sub(pA);
            const n = edge1.cross(edge2).normalize();
            const vA = new Vertex(pA, n, uvA, color);
            const vB = new Vertex(pB, n, uvB, color);
            const vTop = new Vertex(top, n, new Vec2(0.5, 1), color);
            mesh.triangles.push(new Triangle(vA, vB, vTop));
        };

        addSide(b0, b1, new Vec2(0, 0), new Vec2(1, 0));
        addSide(b1, b2, new Vec2(0, 0), new Vec2(1, 0));
        addSide(b2, b3, new Vec2(0, 0), new Vec2(1, 0));
        addSide(b3, b0, new Vec2(0, 0), new Vec2(1, 0));

        // Base
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

                const p00 = getPt(u0, v0);
                const p10 = getPt(u1, v0);
                const p11 = getPt(u1, v1);
                const p01 = getPt(u0, v1);

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

                const p00 = getPt(theta0, phi0);
                const p10 = getPt(theta0, phi1);
                const p11 = getPt(theta1, phi1);
                const p01 = getPt(theta1, phi0);

                if (r !== 0) {
                    mesh.triangles.push(new Triangle(p00, p10, p11));
                }
                if (r !== rings - 1) {
                    mesh.triangles.push(new Triangle(p00.clone(), p11.clone(), p01));
                }
            }
        }
        return mesh;
    }

    static parseOBJ(objText, color = { r: 220, g: 220, b: 220 }) {
        const mesh = new Mesh("ImportedOBJ");
        mesh.material.color = color;
        const positions = [];
        const normals = [];
        const uvs = [];

        const lines = objText.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const parts = trimmed.split(/\s+/);

            if (parts[0] === 'v') {
                positions.push(new Vec3(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])));
            } else if (parts[0] === 'vn') {
                normals.push(new Vec3(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])).normalize());
            } else if (parts[0] === 'vt') {
                uvs.push(new Vec2(parseFloat(parts[1]), parseFloat(parts[2])));
            } else if (parts[0] === 'f') {
                const parseVertex = (vertStr) => {
                    const sub = vertStr.split('/');
                    const pIdx = parseInt(sub[0], 10) - 1;
                    const uvIdx = sub[1] ? parseInt(sub[1], 10) - 1 : -1;
                    const nIdx = sub[2] ? parseInt(sub[2], 10) - 1 : -1;

                    const p = positions[pIdx] ? positions[pIdx].clone() : new Vec3(0, 0, 0);
                    const uv = (uvIdx >= 0 && uvs[uvIdx]) ? uvs[uvIdx].clone() : new Vec2(0, 0);
                    const n = (nIdx >= 0 && normals[nIdx]) ? normals[nIdx].clone() : new Vec3(0, 1, 0);

                    return new Vertex(p, n, uv, color);
                };

                const fVerts = [];
                for (let i = 1; i < parts.length; i++) {
                    fVerts.push(parseVertex(parts[i]));
                }

                // Triangle fan for polygons
                for (let i = 1; i < fVerts.length - 1; i++) {
                    mesh.triangles.push(new Triangle(fVerts[0].clone(), fVerts[i].clone(), fVerts[i + 1].clone()));
                }
            }
        }

        return mesh;
    }
}
