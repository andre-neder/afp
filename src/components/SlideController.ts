import * as THREE from "three";

export class SlideController {
    private camera: THREE.OrthographicCamera;
    private container: HTMLDivElement;
    private gridHelper: THREE.GridHelper;

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
        gridHelper: THREE.GridHelper
    ) {
        this.camera = camera;
        this.container = container;
        this.gridHelper = gridHelper;

        this.setupEventListeners();
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

        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        document.body.style.cursor = "grabbing";
    };

    private handleMouseMove = (e: MouseEvent) => {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;

        this.camera.position.x -= deltaX / this.camera.zoom;
        this.camera.position.y += deltaY / this.camera.zoom;
    };

    private handleMouseUp = () => {
        if (this.isDragging) {
            this.isDragging = false;
            document.body.style.cursor = "default";
        }
    };

    private updateMousePos = (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    };

    private handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const zoomSpeed = 0.001;
        const oldZoom = this.camera.zoom;

        // Calculate limits
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        const minZoomX = width / (this.gridSize - this.gridStep * 2);
        const minZoomY = height / (this.gridSize - this.gridStep * 2);
        const minZoom = Math.max(minZoomX, minZoomY, 0.1);

        // Limit zoom
        const newZoom = Math.max(minZoom, Math.min(5, oldZoom - e.deltaY * zoomSpeed));

        if (oldZoom === newZoom) return;

        // Zoom to cursor logic
        const rect = this.container.getBoundingClientRect();
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
