import * as THREE from 'three';
import { Camera } from './Camera';

export type ClickCallback = (worldPosition: THREE.Vector2) => void;
export type MouseCallback = (worldPosition: THREE.Vector2, event: MouseEvent) => void;
export type KeyboardCallback = (event: KeyboardEvent) => void;

export class EventHandlers {
    private camera: Camera;
    private isPanning: boolean;
    private lastMousePosition: THREE.Vector2;
    private clickCallbacks: ClickCallback[];
    private mouseDownCallbacks: MouseCallback[];
    private mouseMoveCallbacks: MouseCallback[];
    private mouseUpCallbacks: MouseCallback[];
    private keydownCallbacks: KeyboardCallback[];
    private canvas: HTMLCanvasElement | null;

    constructor(camera: Camera, canvas?: HTMLCanvasElement) {
        this.camera = camera;
        this.isPanning = false;
        this.lastMousePosition = new THREE.Vector2();
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
                // Calculate screen space delta in pixels
                const screenDeltaX = event.clientX - this.lastMousePosition.x;
                const screenDeltaY = event.clientY - this.lastMousePosition.y;

                // Convert screen delta to world space
                // For orthographic camera, we need to account for:
                // 1. The camera's view size (how much of world space is visible)
                // 2. The current zoom level (camera.zoom)
                // 3. The screen dimensions
                const threeCamera = this.camera.getThreeCamera();
                const zoom = this.camera.getCurrentZoom();

                // Calculate world space per pixel
                // Orthographic view width = (right - left) / zoom
                const worldWidth = (threeCamera.right - threeCamera.left) / zoom;
                const worldHeight = (threeCamera.top - threeCamera.bottom) / zoom;

                const worldDeltaX = (screenDeltaX / window.innerWidth) * worldWidth;
                const worldDeltaY = (screenDeltaY / window.innerHeight) * worldHeight;

                // Pan camera (negative X because moving right should pan left, positive Y because screen Y is inverted)
                this.camera.pan(-worldDeltaX, worldDeltaY);
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
