import * as THREE from 'three';
import { RENDER_CONFIG, GRID_CONFIG } from '../config/constants';

export class Scene {
    private scene: THREE.Scene;
    private grid!: THREE.Group;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(RENDER_CONFIG.backgroundColor);
        this.createGrid();
    }

    private createGrid(): void {
        this.grid = new THREE.Group();

        const material = new THREE.LineBasicMaterial({
            color: GRID_CONFIG.color,
            transparent: true,
            opacity: GRID_CONFIG.opacity,
        });

        const halfSize = GRID_CONFIG.size * GRID_CONFIG.spacing;

        // Create vertical lines
        for (let i = -GRID_CONFIG.size; i <= GRID_CONFIG.size; i++) {
            const x = i * GRID_CONFIG.spacing;
            const points = [
                new THREE.Vector3(x, -halfSize, -0.1),
                new THREE.Vector3(x, halfSize, -0.1),
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.grid.add(line);
        }

        // Create horizontal lines
        for (let i = -GRID_CONFIG.size; i <= GRID_CONFIG.size; i++) {
            const y = i * GRID_CONFIG.spacing;
            const points = [
                new THREE.Vector3(-halfSize, y, -0.1),
                new THREE.Vector3(halfSize, y, -0.1),
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.grid.add(line);
        }

        this.scene.add(this.grid);
    }

    public getThreeScene(): THREE.Scene {
        return this.scene;
    }
}