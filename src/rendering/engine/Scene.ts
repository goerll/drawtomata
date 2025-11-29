import * as THREE from 'three';
import { RENDER_CONFIG, GRID_CONFIG } from '../config/constants';

export class Scene {
    private scene: THREE.Scene;
    private grid!: THREE.Mesh;
    private gridMaterial!: THREE.ShaderMaterial;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(RENDER_CONFIG.backgroundColor);
        this.createGrid();
    }

    private createGrid(): void {
        // Create a large plane for the "infinite" grid
        // Since we're in 2D, a large enough plane covers the viewable area
        // We can update position if camera moves too far, but 2000x2000 is huge for this app
        const geometry = new THREE.PlaneGeometry(2000, 2000);

        // Custom shader for anti-aliased grid lines with constant screen-space width
        this.gridMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uSpacing: { value: GRID_CONFIG.spacing },
                uColor: { value: new THREE.Color(GRID_CONFIG.color) },
                uOpacity: { value: GRID_CONFIG.opacity },
                uLineWidth: { value: GRID_CONFIG.lineWidth }
            },
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uSpacing;
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform float uLineWidth;
                varying vec3 vPos;

                void main() {
                    // Calculate grid lines based on world position
                    // Use fwidth to get the rate of change of the position in screen space
                    // This allows us to draw lines with constant screen-space width
                    
                    // Divide position by spacing to get grid coordinates
                    vec2 grid = abs(fract(vPos.xy / uSpacing - 0.5) - 0.5) / fwidth(vPos.xy / uSpacing);
                    
                    // Calculate line intensity based on distance to nearest grid line
                    // uLineWidth is in pixels
                    float line = min(grid.x, grid.y);
                    
                    // Anti-aliasing: smoothstep for soft edges
                    float alpha = 1.0 - min(line, 1.0);
                    
                    // Apply line width (approximate)
                    // For thicker lines, we check if we are within N pixels of the line center
                    // The 'grid' value is essentially "pixels from center"
                    
                    // Improved line drawing logic:
                    // 1. Calculate distance to nearest line in pixels
                    float dist = min(grid.x, grid.y);
                    
                    // 2. Determine alpha based on line width
                    // We want 1.0 when dist < width/2, and fade out after
                    float halfWidth = uLineWidth * 0.5;
                    float pixelAlpha = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, dist);

                    gl_FragColor = vec4(uColor, pixelAlpha * uOpacity);
                    
                    // Discard fully transparent pixels to prevent depth issues if needed
                    if (gl_FragColor.a <= 0.0) discard;
                }
            `,
            transparent: true,
            depthWrite: false, // Don't write to depth buffer to avoid occlusion issues with transparent parts
        });

        this.grid = new THREE.Mesh(geometry, this.gridMaterial);
        // Push grid slightly back to ensure it's behind everything else
        this.grid.position.z = -0.1;

        this.scene.add(this.grid);
    }

    public dispose(): void {
        // Proper cleanup to prevent memory leaks
        if (this.grid) {
            this.grid.geometry.dispose();
            this.gridMaterial.dispose();
            this.scene.remove(this.grid);
        }
    }

    public getThreeScene(): THREE.Scene {
        return this.scene;
    }
}