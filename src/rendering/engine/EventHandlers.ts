import * as THREE from 'three';
import { Camera } from './Camera';
import { PAN_CONFIG } from '../config/constants';

export type ClickCallback = (worldPosition: THREE.Vector2) => void;
export type MouseCallback = (worldPosition: THREE.Vector2, event: MouseEvent) => void;

export class EventHandlers {
    private camera: Camera;
    private isPanning: boolean;
    private lastMousePosition: THREE.Vector2;
    private clickCallbacks: ClickCallback[];
    private mouseDownCallbacks: MouseCallback[];
    private mouseMoveCallbacks: MouseCallback[];
    private mouseUpCallbacks: MouseCallback[];
    private canvas: HTMLCanvasElement | null;

    constructor(camera: Camera, canvas?: HTMLCanvasElement) {
        this.camera = camera;
        this.isPanning = false;
        this.lastMousePosition = new THREE.Vector2();
        this.clickCallbacks = [];
        this.mouseDownCallbacks = [];
        this.mouseMoveCallbacks = [];
        this.mouseUpCallbacks = [];
        this.canvas = canvas || null;
    }

    /**
     * Register a callback for click events
     */
    public onCanvasClick(callback: ClickCallback): () => void {
        this.clickCallbacks.push(callback);
        return () => {
            const index = this.clickCallbacks.indexOf(callback);
            if (index > -1) {
                this.clickCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Register a callback for mouse down events
     */
    public onMouseDown(callback: MouseCallback): () => void {
        this.mouseDownCallbacks.push(callback);
        return () => {
            const index = this.mouseDownCallbacks.indexOf(callback);
            if (index > -1) {
                this.mouseDownCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Register a callback for mouse move events
     */
    public onMouseMove(callback: MouseCallback): () => void {
        this.mouseMoveCallbacks.push(callback);
        return () => {
            const index = this.mouseMoveCallbacks.indexOf(callback);
            if (index > -1) {
                this.mouseMoveCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Register a callback for mouse up events
     */
    public onMouseUp(callback: MouseCallback): () => void {
        this.mouseUpCallbacks.push(callback);
        return () => {
            const index = this.mouseUpCallbacks.indexOf(callback);
            if (index > -1) {
                this.mouseUpCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Converts screen coordinates to world coordinates
     */
    private screenToWorld(screenX: number, screenY: number): THREE.Vector2 {
        if (!this.canvas) {
            return new THREE.Vector2(0, 0);
        }

        const rect = this.canvas.getBoundingClientRect();

        // Normalize to [-1, 1] range
        const x = ((screenX - rect.left) / rect.width) * 2 - 1;
        const y = -((screenY - rect.top) / rect.height) * 2 + 1;

        // Get camera properties
        const threeCamera = this.camera.getThreeCamera();
        const zoom = this.camera.getCurrentZoom();
        const position = this.camera.getPosition();

        // Calculate world coordinates for orthographic camera
        const worldX = (x * (threeCamera.right - threeCamera.left) / 2 / zoom) + position.x;
        const worldY = (y * (threeCamera.top - threeCamera.bottom) / 2 / zoom) + position.y;

        return new THREE.Vector2(worldX, worldY);
    }

    /**
     * Setup click handlers
     */
    public setupClickHandler(): void {
        if (!this.canvas) return;

        this.canvas.addEventListener('click', (event: MouseEvent) => {
            // Don't trigger on right click or during pan
            if (event.button !== 0 || this.isPanning) return;

            // Only process clicks directly on the canvas (not on UI overlays)
            if (event.target !== this.canvas) return;

            const worldPos = this.screenToWorld(event.clientX, event.clientY);
            this.clickCallbacks.forEach(callback => callback(worldPos));
        });
    }

    /**
     * Setup mouse down, move, and up handlers
     */
    public setupMouseHandlers(): void {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', (event: MouseEvent) => {
            if (event.button !== 0 || event.target !== this.canvas) return;

            const worldPos = this.screenToWorld(event.clientX, event.clientY);
            this.mouseDownCallbacks.forEach(callback => callback(worldPos, event));
        });

        window.addEventListener('mousemove', (event: MouseEvent) => {
            const worldPos = this.screenToWorld(event.clientX, event.clientY);
            this.mouseMoveCallbacks.forEach(callback => callback(worldPos, event));
        });

        window.addEventListener('mouseup', (event: MouseEvent) => {
            if (event.button !== 0) return;

            const worldPos = this.screenToWorld(event.clientX, event.clientY);
            this.mouseUpCallbacks.forEach(callback => callback(worldPos, event));
        });
    }

    public setupWheelHandler(): void {
        window.addEventListener(
            'wheel',
            (event: WheelEvent) => {
                event.preventDefault();

                if (event.deltaY < 0) {
                    this.camera.zoomIn();
                } else if (event.deltaY > 0) {
                    this.camera.zoomOut();
                }
            },
            { passive: false }
        );
    }

    public setupResizeHandler(renderer: THREE.WebGLRenderer): void {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            renderer.setSize(width, height);
            this.camera.updateAspect(width, height);
        });
    }

    public setupPanHandlers(): void {
        window.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
        });

        window.addEventListener('mousedown', (event: MouseEvent) => {
            if (event.button === 2) { // Right mouse button
                this.isPanning = true;
                this.lastMousePosition.set(event.clientX, event.clientY);
            }
        });

        window.addEventListener('mousemove', (event: MouseEvent) => {
            if (this.isPanning) {
                const deltaX = (event.clientX - this.lastMousePosition.x) * PAN_CONFIG.speed;
                const deltaY = (event.clientY - this.lastMousePosition.y) * PAN_CONFIG.speed;

                // Scale pan movement by current zoom level for precision
                const scaledDeltaX = deltaX / this.camera.getCurrentZoom();
                const scaledDeltaY = deltaY / this.camera.getCurrentZoom();

                this.camera.pan(-scaledDeltaX, scaledDeltaY);
                this.lastMousePosition.set(event.clientX, event.clientY);
            }
        });

        window.addEventListener('mouseup', (event: MouseEvent) => {
            if (event.button === 2) { // Right mouse button
                this.isPanning = false;
            }
        });

        window.addEventListener('mouseleave', () => {
            this.isPanning = false;
        });
    }

    public setupKeyboardHandlers(): void {
        window.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.camera.resetCamera();
            }
        });
    }
}
