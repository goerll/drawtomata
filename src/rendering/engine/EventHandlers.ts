import * as THREE from 'three';
import { Camera } from './Camera';
import { PAN_CONFIG } from '../config/constants';

export class EventHandlers {
    private camera: Camera;
    private isPanning: boolean;
    private lastMousePosition: THREE.Vector2;

    constructor(camera: Camera) {
        this.camera = camera;
        this.isPanning = false;
        this.lastMousePosition = new THREE.Vector2();
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
