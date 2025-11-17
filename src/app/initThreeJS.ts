import * as THREE from 'three';
import { RENDER_CONFIG } from './config/constants';
import { Scene } from './scene/Scene';
import { Camera } from './camera/Camera';
import { EventHandlers } from './events/EventHandlers';

export function initThreeApp(canvas: HTMLCanvasElement): void {
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
        antialias: RENDER_CONFIG.antialias,
        canvas,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
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
}
