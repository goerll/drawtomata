import * as THREE from 'three';
import { RENDER_CONFIG } from '../config/constants';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { EventHandlers } from './EventHandlers';

// Global camera instance that can be accessed by the app
let globalCamera: Camera | null = null;

export function getCamera(): Camera | null {
    return globalCamera;
}

export function initThreeApp(canvas: HTMLCanvasElement): void {
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
        antialias: RENDER_CONFIG.ANTIALIAS,
        canvas,
        alpha: false, // Ensure opaque background
    });

    // Set clear color to match scene background
    renderer.setClearColor(RENDER_CONFIG.backgroundColor, 1);

    // Limit pixel ratio to prevent performance issues on high DPI displays
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Scene setup
    const scene = new Scene();

    // Camera setup
    const camera = new Camera();

    // Event handlers setup
    const eventHandlers = new EventHandlers(camera);
    eventHandlers.setupWheelHandler();
    eventHandlers.setupResizeHandler(renderer);
    eventHandlers.setupPanHandlers();

    // Render loop
    const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene.getThreeScene(), camera.getThreeCamera());
    };

    animate();

    globalCamera = camera;
}
