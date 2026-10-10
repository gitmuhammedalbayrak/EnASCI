/**
 * ASCII 3D Game Engine - Math Library
 * Standalone, zero-dependency 3D vector and matrix math.
 */

export class Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }
}

export class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    clone() {
        return new Vec3(this.x, this.y, this.z);
    }

    add(v) {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    sub(v) {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    mulScalar(s) {
        return new Vec3(this.x * s, this.y * s, this.z * s);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        if (len > 0.00001) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    normalized() {
        return this.clone().normalize();
    }

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

export class Mat4 {
    constructor() {
        // 4x4 matrix column-major float array
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
        const ae = a.elements;
        const be = b.elements;
        const te = out.elements;

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
        m.elements[12] = x;
        m.elements[13] = y;
        m.elements[14] = z;
        return m;
    }

    static rotationX(rad) {
        const m = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        m.elements[5] = c;
        m.elements[6] = s;
        m.elements[9] = -s;
        m.elements[10] = c;
        return m;
    }

    static rotationY(rad) {
        const m = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        m.elements[0] = c;
        m.elements[2] = -s;
        m.elements[8] = s;
        m.elements[10] = c;
        return m;
    }

    static rotationZ(rad) {
        const m = new Mat4();
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        m.elements[0] = c;
        m.elements[1] = s;
        m.elements[4] = -s;
        m.elements[5] = c;
        return m;
    }

    static scale(x, y, z) {
        const m = new Mat4();
        m.elements[0] = x;
        m.elements[5] = y;
        m.elements[10] = z;
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
