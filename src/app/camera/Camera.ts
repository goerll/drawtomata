import * as THREE from 'three';
import { CAMERA_CONFIG, ZOOM_CONFIG } from '../config/constants';

export class Camera {
    private camera: THREE.OrthographicCamera;
    private currentZoom: number;
    private position: THREE.Vector2;

    constructor() {
        this.currentZoom = ZOOM_CONFIG.initial;
        this.position = new THREE.Vector2(0, 0);
        this.setupCamera();
    }

    private setupCamera(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const aspect = width / height;

        this.camera = new THREE.OrthographicCamera(
            -aspect * CAMERA_CONFIG.viewSize, // left
            aspect * CAMERA_CONFIG.viewSize, // right
            CAMERA_CONFIG.viewSize, // top
            -CAMERA_CONFIG.viewSize, // bottom
            CAMERA_CONFIG.near, // near
            CAMERA_CONFIG.far // far
        );

        this.camera.position.z = CAMERA_CONFIG.position.z;
        this.updatePosition();
    }

    public getThreeCamera(): THREE.OrthographicCamera {
        return this.camera;
    }

    public getCurrentZoom(): number {
        return this.currentZoom;
    }

    public applyZoom(newZoom: number): void {
        this.currentZoom = THREE.MathUtils.clamp(newZoom, ZOOM_CONFIG.min, ZOOM_CONFIG.max);
        this.camera.zoom = this.currentZoom;
        this.camera.updateProjectionMatrix();
    }

    public updateAspect(width: number, height: number): void {
        const aspect = width / height;
        this.camera.left = -aspect * CAMERA_CONFIG.viewSize;
        this.camera.right = aspect * CAMERA_CONFIG.viewSize;
        this.camera.top = CAMERA_CONFIG.viewSize;
        this.camera.bottom = -CAMERA_CONFIG.viewSize;
        this.camera.updateProjectionMatrix();
    }

    public zoomIn(): void {
        this.applyZoom(this.currentZoom * ZOOM_CONFIG.factor);
    }

    public zoomOut(): void {
        this.applyZoom(this.currentZoom / ZOOM_CONFIG.factor);
    }

    public pan(deltaX: number, deltaY: number): void {
        this.position.x += deltaX;
        this.position.y += deltaY;
        this.updatePosition();
    }

    private updatePosition(): void {
        this.camera.position.x = this.position.x;
        this.camera.position.y = this.position.y;
    }

    public getPosition(): THREE.Vector2 {
        return this.position.clone();
    }

    public setPosition(x: number, y: number): void {
        this.position.set(x, y);
        this.updatePosition();
    }

    public resetCamera() {
        this.applyZoom(ZOOM_CONFIG.initial);
        this.setPosition(0, 0);
    }

}
