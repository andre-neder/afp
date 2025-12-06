import * as THREE from "three";

export class SlideController {
    private camera: THREE.OrthographicCamera;
    private container: HTMLDivElement;
    private gridHelper: THREE.GridHelper;
    private scene: THREE.Scene;

    // Interaction
    private pages: THREE.Group[] = [];
    private raycaster = new THREE.Raycaster();
    private draggedObject: THREE.Group | null = null;
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
    private shadowTexture: THREE.CanvasTexture;

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

        this.shadowTexture = this.createShadowTexture();
        this.setupEventListeners();
    }

    private createShadowTexture(): THREE.CanvasTexture {
        const canvas = document.createElement("canvas");
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;

        // Clear
        ctx.clearRect(0, 0, size, size);

        // Draw shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = "black";
        // Draw rect smaller than canvas to allow blur to spread
        const margin = 20;
        ctx.fillRect(margin, margin, size - margin * 2, size - margin * 2);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    public addPage(screenX: number, screenY: number) {
        const width = 794; // A4 width @ 96 DPI
        const height = 1123; // A4 height @ 96 DPI

        // Convert screen coordinates to world coordinates
        const worldPos = this.getWorldPoint(screenX, screenY);

        const pageGroup = new THREE.Group();
        pageGroup.position.set(worldPos.x, worldPos.y, 0);

        // Page Mesh
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pageMesh = new THREE.Mesh(geometry, material);

        // Shadow Mesh
        // Make shadow slightly larger to account for soft edges
        const shadowScale = 1.05;
        const shadowGeometry = new THREE.PlaneGeometry(width * shadowScale, height * shadowScale);
        shadowGeometry.translate(15, -15, -1); // Behind page and offset
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            map: this.shadowTexture,
            transparent: true,
            opacity: 0.6,
            depthWrite: false, // Prevent shadow from occluding things properly if Z-fighting
        });
        const shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);

        pageGroup.add(shadowMesh);
        pageGroup.add(pageMesh);

        this.scene.add(pageGroup);
        this.pages.push(pageGroup);
    }

    private getWorldPoint(screenX: number, screenY: number): THREE.Vector3 {
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

        if (this.shadowTexture) {
            this.shadowTexture.dispose();
        }
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

        const rect = this.container.getBoundingClientRect();
        // Check if mouse is within container bounds (it should be since event listener is on container, but good to be safe)
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

        // Normalized Device Coordinates (NDC) for Raycaster
        const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

        // Raycast against all page groups
        const intersects = this.raycaster.intersectObjects(this.pages, true);

        if (intersects.length > 0) {
            // Find the parent Group implementation
            let targetGroup: THREE.Group | null = null;
            let current: THREE.Object3D | null = intersects[0].object;

            while (current) {
                if (current instanceof THREE.Group && this.pages.includes(current as THREE.Group)) {
                    targetGroup = current as THREE.Group;
                    break;
                }
                current = current.parent;
            }

            if (targetGroup) {
                this.draggedObject = targetGroup;
                const mouseWorld = this.getWorldPoint(e.clientX, e.clientY);
                this.dragOffset.copy(mouseWorld).sub(this.draggedObject.position);

                document.body.style.cursor = "grabbing";
                return;
            }
        }

        // Fallback to camera drag
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
