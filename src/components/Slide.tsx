
import { Component, createSignal, onCleanup, onMount, Show } from "solid-js";
import * as THREE from "three";
import { SlideController } from "./SlideController";
import ContextMenu, { ContextMenuAction } from "./ContextMenu";

const Slide: Component = () => {
    let containerRef: HTMLDivElement | undefined;
    let renderer: THREE.WebGLRenderer;
    let camera: THREE.OrthographicCamera;
    let scene: THREE.Scene;
    let gridHelper: THREE.GridHelper;
    let controller: SlideController;

    const gridSize = 5000;
    const gridStep = 50;

    onMount(() => {
        if (!containerRef) return;

        scene = new THREE.Scene();

        const width = containerRef.clientWidth;
        const height = containerRef.clientHeight;

        camera = new THREE.OrthographicCamera(
            width / -2,
            width / 2,
            height / 2,
            height / -2,
            1,
            2000
        );
        camera.position.z = 1000;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0); // Transparent background
        containerRef.appendChild(renderer.domElement);

        gridHelper = new THREE.GridHelper(gridSize, gridSize / gridStep, 0xeeeeee, 0xeeeeee);
        gridHelper.rotation.x = Math.PI / 2;
        scene.add(gridHelper);

        // Initialize Controller
        controller = new SlideController(camera, containerRef, gridHelper);

        // Animation Loop
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controller.update();
            renderer.render(scene, camera);
        };
        animate();

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                if (width === 0 || height === 0) return;

                controller.handleResize(width, height);
                renderer.setSize(width, height);
            }
        });
        resizeObserver.observe(containerRef);

        onCleanup(() => {
            cancelAnimationFrame(animationId);
            resizeObserver.disconnect();
            controller.dispose();
            containerRef?.removeChild(renderer.domElement);
            renderer.dispose();
        });
    });

    const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number } | null>(null);

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const closeContextMenu = () => setContextMenu(null);

    const menuActions: ContextMenuAction[] = [
        { label: "Add page", onClick: () => { } },
    ];

    return (
        <div class="flex-1 relative overflow-hidden bg-white shadow-inner rounded-md" onContextMenu={handleContextMenu}>
            <div class="absolute left-0 top-0 w-full h-full" ref={containerRef}>
                {/* Canvas will be appended here */}
            </div>
            <Show when={contextMenu()}>
                <ContextMenu
                    x={contextMenu()!.x}
                    y={contextMenu()!.y}
                    onClose={closeContextMenu}
                    actions={menuActions}
                />
            </Show>
        </div>
    );
};

export default Slide;
