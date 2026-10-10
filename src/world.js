/**
 * EnASCI - 3D Adventure World & Entities
 * Generates isometric RPG scene: Player, NPC, Trees, Waving Grass, and Floor.
 */

import { Vec3, Vec2 } from './math.js';
import { Mesh, Vertex, Triangle } from './mesh.js';

export class GameWorld {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.player = null;
        this.npc = null;
        this.grassPatches = [];
        this.trees = [];
        this.worldBounds = 9.0;

        // Isometric camera configuration
        this.camOffset = new Vec3(4.5, 6.8, 5.2); // Top-down isometric angle
        this.camTargetPos = new Vec3(0, 0, 0);

        this.time = 0;
        this.canTalkToNPC = false;

        this.initWorld();
    }

    initWorld() {
        // 1. Ground Plane (large flat green/earth surface)
        const ground = Mesh.createCube(18, { r: 40, g: 85, b: 45 });
        ground.position = new Vec3(0, -9.05, 0);
        ground.material.wireframe = false;
        this.scene.add(ground);

        // 2. Player Entity (composed of body and head)
        this.player = {
            pos: new Vec3(0, 0, 2),
            vel: new Vec3(0, 0, 0),
            rotY: 0,
            targetRotY: 0,
            speed: 3.8,
            isMoving: false,
            stepCycle: 0,
            bodyMesh: Mesh.createCube(0.65, { r: 60, g: 140, b: 240 }), // Blue tunic
            headMesh: Mesh.createSphere(0.32, 8, 10, { r: 245, g: 200, b: 160 }), // Skin head
            hatMesh: Mesh.createPyramid(0.55, 0.55, { r: 220, g: 60, b: 60 }) // Red adventurer cap
        };

        this.scene.add(this.player.bodyMesh);
        this.scene.add(this.player.headMesh);
        this.scene.add(this.player.hatMesh);

        // 3. NPC Entity (Elder Mage Merlin)
        this.npc = {
            pos: new Vec3(2.5, 0, -2.0),
            bodyMesh: Mesh.createCube(0.65, { r: 140, g: 60, b: 180 }), // Purple robe
            headMesh: Mesh.createSphere(0.32, 8, 10, { r: 235, g: 190, b: 155 }),
            hatMesh: Mesh.createPyramid(0.6, 0.9, { r: 255, g: 215, b: 0 }) // Golden wizard hat
        };

        this.npc.bodyMesh.position.set(this.npc.pos.x, 0.32, this.npc.pos.z);
        this.npc.headMesh.position.set(this.npc.pos.x, 0.82, this.npc.pos.z);
        this.npc.hatMesh.position.set(this.npc.pos.x, 1.25, this.npc.pos.z);

        this.scene.add(this.npc.bodyMesh);
        this.scene.add(this.npc.headMesh);
        this.scene.add(this.npc.hatMesh);

        // 4. Procedural Trees
        const treeCoords = [
            [-5, -4], [-3, -6], [5, -5], [6, 2], [-6, 3],
            [-4, 6], [4, 6], [1, -6], [-7, -1], [7, -1]
        ];

        for (const [tx, tz] of treeCoords) {
            this.createTree(tx, tz);
        }

        // 5. Waving Grass Blades (Grass patches that sway with wind)
        this.createGrassField(45);

        // Setup initial camera view
        this.camera.position = this.player.pos.add(this.camOffset);
        this.camera.target = this.player.pos.clone();
    }

    createTree(x, z) {
        // Trunk (Brown box)
        const trunk = Mesh.createCube(0.4, { r: 110, g: 70, b: 40 });
        trunk.scale = new Vec3(1, 2.5, 1);
        trunk.position = new Vec3(x, 0.5, z);
        this.scene.add(trunk);

        // Foliage 1 (Bottom green pyramid)
        const fol1 = Mesh.createPyramid(1.6, 1.4, { r: 40, g: 150, b: 60 });
        fol1.position = new Vec3(x, 1.4, z);
        this.scene.add(fol1);

        // Foliage 2 (Top smaller green pyramid)
        const fol2 = Mesh.createPyramid(1.1, 1.2, { r: 60, g: 185, b: 75 });
        fol2.position = new Vec3(x, 2.1, z);
        this.scene.add(fol2);

        this.trees.push({ trunk, fol1, fol2 });
    }

    createGrassField(count) {
        for (let i = 0; i < count; i++) {
            // Random distribution on ground (avoiding center spawn)
            let gx = (Math.random() - 0.5) * 15;
            let gz = (Math.random() - 0.5) * 15;

            // Simple pyramid blade as grass tuft
            const height = 0.35 + Math.random() * 0.3;
            const width = 0.25 + Math.random() * 0.15;
            const colorG = 130 + Math.floor(Math.random() * 80);
            const grassMesh = Mesh.createPyramid(width, height, { r: 50, g: colorG, b: 50 });

            grassMesh.position = new Vec3(gx, height * 0.45, gz);
            grassMesh.basePos = grassMesh.position.clone();
            grassMesh.swayPhase = Math.random() * Math.PI * 2;
            grassMesh.swaySpeed = 3.5 + Math.random() * 1.5;

            this.scene.add(grassMesh);
            this.grassPatches.push(grassMesh);
        }
    }

    update(dt, input) {
        this.time += dt;

        // 1. Handle Player Input & Movement
        let moveX = 0;
        let moveZ = 0;

        // Isometric movement mapping:
        // W = North-West, S = South-East, A = South-West, D = North-East
        if (input.keys['KeyW'] || input.keys['ArrowUp']) {
            moveX -= 1;
            moveZ -= 1;
        }
        if (input.keys['KeyS'] || input.keys['ArrowDown']) {
            moveX += 1;
            moveZ += 1;
        }
        if (input.keys['KeyA'] || input.keys['ArrowLeft']) {
            moveX -= 1;
            moveZ += 1;
        }
        if (input.keys['KeyD'] || input.keys['ArrowRight']) {
            moveX += 1;
            moveZ -= 1;
        }

        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (len > 0.001) {
            moveX /= len;
            moveZ /= len;
            this.player.isMoving = true;
            this.player.stepCycle += dt * 11;

            this.player.pos.x += moveX * this.player.speed * dt;
            this.player.pos.z += moveZ * this.player.speed * dt;

            // Clamping to world bounds
            this.player.pos.x = Math.max(-this.worldBounds, Math.min(this.worldBounds, this.player.pos.x));
            this.player.pos.z = Math.max(-this.worldBounds, Math.min(this.worldBounds, this.player.pos.z));

            // Face direction of movement
            this.player.targetRotY = Math.atan2(moveX, moveZ);
        } else {
            this.player.isMoving = false;
        }

        // Smooth rotation
        let diff = this.player.targetRotY - this.player.rotY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.player.rotY += diff * Math.min(1.0, dt * 14);

        // Player walking bobbing animation
        const bob = this.player.isMoving ? Math.abs(Math.sin(this.player.stepCycle)) * 0.12 : 0;
        const p = this.player.pos;

        this.player.bodyMesh.position.set(p.x, 0.32 + bob, p.z);
        this.player.bodyMesh.rotation.y = this.player.rotY;

        this.player.headMesh.position.set(p.x, 0.78 + bob, p.z);
        this.player.headMesh.rotation.y = this.player.rotY;

        this.player.hatMesh.position.set(p.x, 1.15 + bob, p.z);
        this.player.hatMesh.rotation.y = this.player.rotY;

        // 2. Animate Waving Grass with Wind Wave
        const windWave = this.time * 3.2;
        for (const grass of this.grassPatches) {
            const wind = Math.sin(windWave + grass.basePos.x * 0.6 + grass.basePos.z * 0.6 + grass.swayPhase);
            grass.rotation.z = wind * 0.28;
            grass.rotation.x = Math.cos(windWave + grass.swayPhase) * 0.14;
        }

        // 3. NPC idle animation and distance check
        this.npc.bodyMesh.rotation.y = Math.sin(this.time * 1.5) * 0.15 + 0.6;
        const npcBob = Math.sin(this.time * 2.5) * 0.04;
        this.npc.headMesh.position.y = 0.82 + npcBob;
        this.npc.hatMesh.position.y = 1.25 + npcBob;

        const distToNPC = this.player.pos.sub(this.npc.pos).length();
        this.canTalkToNPC = (distToNPC < 2.3);

        // 4. Smooth Isometric Camera Follow
        const targetCamPos = this.player.pos.add(this.camOffset);
        // Lerp camera
        const lerpFactor = Math.min(1.0, dt * 6.5);
        this.camera.position.x += (targetCamPos.x - this.camera.position.x) * lerpFactor;
        this.camera.position.y += (targetCamPos.y - this.camera.position.y) * lerpFactor;
        this.camera.position.z += (targetCamPos.z - this.camera.position.z) * lerpFactor;

        this.camera.target.x += (this.player.pos.x - this.camera.target.x) * lerpFactor;
        this.camera.target.y += (this.player.pos.y + 0.4 - this.camera.target.y) * lerpFactor;
        this.camera.target.z += (this.player.pos.z - this.camera.target.z) * lerpFactor;
    }
}
