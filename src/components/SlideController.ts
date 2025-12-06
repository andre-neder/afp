import * as THREE from "three";
import { CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";

export class SlideController {
    private camera: THREE.OrthographicCamera;
    private container: HTMLDivElement;
    private gridHelper: THREE.GridHelper;
    private scene: THREE.Scene;

    // Interaction
    private pages: CSS3DObject[] = [];
    private draggedObject: CSS3DObject | null = null;
    private dragOffset = new THREE.Vector3();

    // State
    private isDragging = false;
    private lastX = 0;
    private lastY = 0;
    private mouseX = 0;
    private mouseY = 0;

    // Config
    private readonly gridSize = 5000;
    private readonly gridStep = 50;

    constructor(
        camera: THREE.OrthographicCamera,
        container: HTMLDivElement,
        gridHelper: THREE.GridHelper,
        scene: THREE.Scene
    ) {
        this.camera = camera;
        this.container = container;
        this.gridHelper = gridHelper;
        this.scene = scene;

        this.setupEventListeners();
    }

    public addPage(screenX: number, screenY: number) {
        const width = 794; // A4 width @ 96 DPI
        const height = 1123; // A4 height @ 96 DPI

        // Convert screen coordinates to world coordinates
        const worldPos = this.getWorldPoint(screenX, screenY);

        const div = document.createElement('div');
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        div.style.backgroundColor = 'white';
        // Tailwind shadow-lg equivalent approximately
        div.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
        div.style.pointerEvents = 'auto'; // Enable interactions
        div.style.userSelect = 'none'; // Prevent text selection while dragging

        // Create CSS3D Object
        const pageObject = new CSS3DObject(div);
        pageObject.position.set(worldPos.x, worldPos.y, 0);

        // Drag Logic
        div.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            e.stopPropagation(); // Prevent camera pan

            this.draggedObject = pageObject;

            // Calculate offset (project mouse to z=0 plane)
            const mouseWorld = this.getWorldPoint(e.clientX, e.clientY);
            this.dragOffset.copy(mouseWorld).sub(this.draggedObject.position);

            document.body.style.cursor = 'grabbing';
            div.style.cursor = 'grabbing';
        });

        div.addEventListener('mouseenter', () => {
            if (!this.draggedObject) {
                div.style.cursor = 'grab';
            }
        });

        this.scene.add(pageObject);
        this.pages.push(pageObject);
    }

    private getWorldPoint(screenX: number, screenY: number): THREE.Vector3 {
        // For Orthographic camera, unproject is straightforward but mapping screen pixels to world units
        // depends on how we set up the camera.
        // We set up camera left/right/top/bottom to match screen pixels width/height.
        // So 1 unit = 1 pixel at zoom=1.

        const rect = this.container.getBoundingClientRect();
        const relX = screenX - rect.left - rect.width / 2;
        const relY = screenY - rect.top - rect.height / 2;

        const worldX = this.camera.position.x + relX / this.camera.zoom;
        const worldY = this.camera.position.y - relY / this.camera.zoom;

        return new THREE.Vector3(worldX, worldY, 0);
    }

    private setupEventListeners() {
        this.container.addEventListener("mousedown", this.handleMouseDown);
        window.addEventListener("mouseup", this.handleMouseUp); // Window level for better drag handling
        window.addEventListener("mousemove", this.handleMouseMove);
        this.container.addEventListener("wheel", this.handleWheel, { passive: false });
        this.container.addEventListener("mousemove", this.updateMousePos);
    }

    public dispose() {
        this.container.removeEventListener("mousedown", this.handleMouseDown);
        window.removeEventListener("mouseup", this.handleMouseUp);
        window.removeEventListener("mousemove", this.handleMouseMove);
        this.container.removeEventListener("wheel", this.handleWheel);
        this.container.removeEventListener("mousemove", this.updateMousePos);
    }

    public update() {
        // Infinite Grid Logic
        const snapX = Math.floor(this.camera.position.x / this.gridStep) * this.gridStep;
        const snapY = Math.floor(this.camera.position.y / this.gridStep) * this.gridStep;

        this.gridHelper.position.x = snapX;
        this.gridHelper.position.y = snapY;
    }

    public handleResize(width: number, height: number) {
        if (width === 0 || height === 0) return;

        // Enforce min zoom on resize
        const minZoomX = width / (this.gridSize - this.gridStep * 2);
        const minZoomY = height / (this.gridSize - this.gridStep * 2);
        const minZoom = Math.max(minZoomX, minZoomY, 0.1);

        if (this.camera.zoom < minZoom) {
            this.camera.zoom = minZoom;
        }

        this.camera.left = width / -2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = height / -2;
        this.camera.updateProjectionMatrix();
    }

    private handleMouseDown = (e: MouseEvent) => {
        // Only handle left click
        if (e.button !== 0) return;

        // CSS3D objects also block events if configured right, but sometimes they pass through.
        // Assuming preventDefault/stopPropagation in div handler works.
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        document.body.style.cursor = "grabbing";
    };

    private handleMouseMove = (e: MouseEvent) => {
        const mouseWorld = this.getWorldPoint(e.clientX, e.clientY);

        if (this.draggedObject) {
            // Move object
            const newPos = new THREE.Vector3().copy(mouseWorld).sub(this.dragOffset);
            this.draggedObject.position.set(newPos.x, newPos.y, 0);
            return;
        }

        if (!this.isDragging) return;

        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;

        this.camera.position.x -= deltaX / this.camera.zoom;
        this.camera.position.y += deltaY / this.camera.zoom;
    };

    private handleMouseUp = () => {
        this.isDragging = false;
        this.draggedObject = null;
        document.body.style.cursor = "default";
    };

    private updateMousePos = (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    };

    private handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const zoomSpeed = 0.001;
        const oldZoom = this.camera.zoom;
        const rect = this.container.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const minZoomX = width / (this.gridSize - this.gridStep * 2);
        const minZoomY = height / (this.gridSize - this.gridStep * 2);
        const minZoom = Math.max(minZoomX, minZoomY, 0.1);

        const newZoom = Math.max(minZoom, Math.min(5, oldZoom - e.deltaY * zoomSpeed));

        if (oldZoom === newZoom) return;

        const relX = this.mouseX - rect.left - rect.width / 2;
        const relY = this.mouseY - rect.top - rect.height / 2;

        const worldX = this.camera.position.x + relX / oldZoom;
        const worldY = this.camera.position.y - relY / oldZoom;

        this.camera.zoom = newZoom;
        this.camera.updateProjectionMatrix();

        this.camera.position.x = worldX - relX / newZoom;
        this.camera.position.y = worldY + relY / newZoom;
    };
}
