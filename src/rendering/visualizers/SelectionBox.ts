import * as THREE from 'three';

/**
 * Visual selection box for box selection mode
 */
export class SelectionBox {
    private scene: THREE.Scene;
    private box: THREE.Line | null;
    private isVisible: boolean;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.box = null;
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
        // Remove old box
        if (this.box) {
            this.scene.remove(this.box);
        }

        // Create rectangle geometry
        const points = [
            new THREE.Vector3(start.x, start.y, 0.1),
            new THREE.Vector3(end.x, start.y, 0.1),
            new THREE.Vector3(end.x, end.y, 0.1),
            new THREE.Vector3(start.x, end.y, 0.1),
            new THREE.Vector3(start.x, start.y, 0.1), // Close the loop
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x35362E, // Blue color
            transparent: false,
            opacity: 1,
            linewidth: 2,
        });

        this.box = new THREE.Line(geometry, material);
        this.scene.add(this.box);
    }

    /**
     * Clear and hide selection box
     */
    public clear(): void {
        if (this.box) {
            this.scene.remove(this.box);
            this.box = null;
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
