import * as THREE from 'three';
import { Camera } from './Camera';
import { markSceneDirty } from './initThreeJS';

export type ClickCallback = (worldPosition: THREE.Vector2) => void;
export type MouseCallback = (worldPosition: THREE.Vector2, event: MouseEvent) => void;
export type KeyboardCallback = (event: KeyboardEvent) => void;

export class EventHandlers {
    private camera: Camera;
    private clickCallbacks: ClickCallback[];
    private mouseDownCallbacks: MouseCallback[];
    private mouseMoveCallbacks: MouseCallback[];
    private mouseUpCallbacks: MouseCallback[];
    private keydownCallbacks: KeyboardCallback[];
    private canvas: HTMLCanvasElement | null;

    constructor(camera: Camera, canvas?: HTMLCanvasElement) {
        this.camera = camera;
        this.clickCallbacks = [];
        this.mouseDownCallbacks = [];
        this.mouseMoveCallbacks = [];
        this.mouseUpCallbacks = [];
        this.keydownCallbacks = [];
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

        // IMPORTANT: Update camera matrices before reading position/zoom
        // OrbitControls modifies the camera directly, so we need to ensure
        // the world matrix is up-to-date for accurate coordinate transformation
        threeCamera.updateMatrixWorld();

        // Read zoom directly from the THREE.js camera object, not our cached value
        // OrbitControls may have modified camera.zoom directly
        const zoom = threeCamera.zoom;
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
            // Don't trigger on right click
            if (event.button !== 0) return;

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

    public setupResizeHandler(renderer: THREE.WebGLRenderer): void {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Update camera aspect ratio
            this.camera.updateAspect(width, height);

            // Update renderer size
            renderer.setSize(width, height);

            // Mark scene as dirty to trigger re-render
            markSceneDirty();
        };

        window.addEventListener('resize', handleResize);
    }

    /**
     * Register a callback for keydown events
     */
    public onKeyDown(callback: KeyboardCallback): () => void {
        this.keydownCallbacks.push(callback);
        return () => {
            const index = this.keydownCallbacks.indexOf(callback);
            if (index > -1) {
                this.keydownCallbacks.splice(index, 1);
            }
        };
    }

    public setupKeyboardHandlers(): void {
        window.addEventListener('keydown', (event: KeyboardEvent) => {
            // Trigger all registered callbacks first
            this.keydownCallbacks.forEach(callback => callback(event));

            // Built-in camera reset with Space
            if (event.code === 'Space') {
                event.preventDefault();
                this.camera.resetCamera();
            }
        });
    }
}
