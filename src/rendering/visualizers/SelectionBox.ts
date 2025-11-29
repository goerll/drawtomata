import * as THREE from 'three';

/**
 * Visual selection box for box selection mode
 */
export class SelectionBox {
    private scene: THREE.Scene;
    private box: THREE.Line | null;
    private fill: THREE.Mesh | null;
    private isVisible: boolean;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.box = null;
        this.fill = null;
        this.isVisible = false;
    }

    /**
     * Start selection box at a position
     */
    public start(): void {
        this.clear();
        this.isVisible = true;
    }

    /**
     * Update selection box to current position
     */
    public update(start: THREE.Vector2, end: THREE.Vector2): void {
        // Remove old box and fill
        if (this.box) {
            this.scene.remove(this.box);
        }
        if (this.fill) {
            this.scene.remove(this.fill);
        }

        // Create rectangle outline
        const points = [
            new THREE.Vector3(start.x, start.y, 0.1),
            new THREE.Vector3(end.x, start.y, 0.1),
            new THREE.Vector3(end.x, end.y, 0.1),
            new THREE.Vector3(start.x, end.y, 0.1),
            new THREE.Vector3(start.x, start.y, 0.1), // Close the loop
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x3A3A34, // 20% brighter than sidebar border
            transparent: false,
            opacity: 1,
            linewidth: 2,
        });

        this.box = new THREE.Line(geometry, material);
        this.scene.add(this.box);

        // Create semi-transparent fill
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;

        const fillGeometry = new THREE.PlaneGeometry(width, height);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: 0x888888, // Gray color
            transparent: true,
            opacity: 0.15, // Semi-transparent
            side: THREE.DoubleSide,
        });

        this.fill = new THREE.Mesh(fillGeometry, fillMaterial);
        this.fill.position.set(centerX, centerY, 0.05); // Slightly behind the outline
        this.scene.add(this.fill);
    }

    /**
     * Clear and hide selection box
     */
    public clear(): void {
        if (this.box) {
            this.scene.remove(this.box);
            this.box = null;
        }
        if (this.fill) {
            this.scene.remove(this.fill);
            this.fill = null;
        }
        this.isVisible = false;
    }

    /**
     * Check if selection box is currently visible
     */
    public getIsVisible(): boolean {
        return this.isVisible;
    }
}
