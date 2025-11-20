import * as THREE from 'three';
import { RENDER_CONFIG, CIRCLE_CONFIG } from '../config/constants';

export class Scene {
    private scene: THREE.Scene;
    private circleOutline!: THREE.LineLoop;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(RENDER_CONFIG.backgroundColor);
        this.createCircleOutline();
    }

    private createCircleOutline(): void {
        const curve = new THREE.EllipseCurve(
            0,
            0, // center
            CIRCLE_CONFIG.radius,
            CIRCLE_CONFIG.radius, // radiusX, radiusY
            0,
            2 * Math.PI,
            false,
            0
        );

        const points2D = curve.getPoints(CIRCLE_CONFIG.segments);
        // Convert 2D points to 3D vectors (z = 0 for 2D plane)
        const points3D = points2D.map(point => new THREE.Vector3(point.x, point.y, 0));
        const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
        const material = new THREE.LineBasicMaterial({ color: CIRCLE_CONFIG.color });

        this.circleOutline = new THREE.LineLoop(geometry, material);
        this.scene.add(this.circleOutline);
    }

    public getThreeScene(): THREE.Scene {
        return this.scene;
    }
}