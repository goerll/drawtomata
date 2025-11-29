import * as THREE from 'three';
import { CAMERA_CONFIG, ZOOM_CONFIG } from '../config/constants';
import { markSceneDirty } from './initThreeJS';

export class Camera {
    private camera: THREE.OrthographicCamera;
    private currentZoom: number;
    private zoomCallbacks: ((zoom: number) => void)[];

    constructor() {
        const aspect = window.innerWidth / window.innerHeight;
        const viewHeight = CAMERA_CONFIG.viewSize;
        const viewWidth = viewHeight * aspect;

        this.camera = new THREE.OrthographicCamera(
            -viewWidth / 2,
            viewWidth / 2,
            viewHeight / 2,
            -viewHeight / 2,
            CAMERA_CONFIG.near,
            CAMERA_CONFIG.far
        );

        this.camera.position.set(0, 0, CAMERA_CONFIG.position.z);
        this.currentZoom = ZOOM_CONFIG.initial;
        this.camera.zoom = this.currentZoom;
        this.camera.updateProjectionMatrix();
        this.zoomCallbacks = [];
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
        this.notifyZoomChanged();
        markSceneDirty();
    }

    public updateAspect(width: number, height: number): void {
        const aspect = width / height;
        const viewHeight = CAMERA_CONFIG.viewSize;
        const viewWidth = viewHeight * aspect;

        this.camera.left = -viewWidth / 2;
        this.camera.right = viewWidth / 2;
        this.camera.top = viewHeight / 2;
        this.camera.bottom = -viewHeight / 2;
        this.camera.updateProjectionMatrix();
        markSceneDirty();
    }

    public zoomIn(): void {
        this.applyZoom(this.currentZoom * ZOOM_CONFIG.factor);
    }

    public zoomOut(): void {
        this.applyZoom(this.currentZoom / ZOOM_CONFIG.factor);
    }

    public pan(deltaX: number, deltaY: number): void {
        this.camera.position.x += deltaX;
        this.camera.position.y += deltaY;
        // No need to call updateProjectionMatrix for position changes
        markSceneDirty();
    }

    public getPosition(): THREE.Vector3 {
        return this.camera.position.clone(); // Return a clone to prevent direct modification
    }

    public setPosition(x: number, y: number): void {
        this.camera.position.setX(x);
        this.camera.position.setY(y);
        markSceneDirty();
    }

    public resetCamera() {
        this.applyZoom(ZOOM_CONFIG.initial);
        this.setPosition(0, 0);
    }

    public onZoomChanged(callback: (zoom: number) => void): () => void {
        this.zoomCallbacks.push(callback);
        return () => {
            const index = this.zoomCallbacks.indexOf(callback);
            if (index > -1) {
                this.zoomCallbacks.splice(index, 1);
            }
        };
    }

    private notifyZoomChanged(): void {
        this.zoomCallbacks.forEach(callback => callback(this.currentZoom));
    }

}
