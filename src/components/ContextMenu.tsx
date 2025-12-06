import { For, Show, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

export interface ContextMenuAction {
    label: string;
    onClick: () => void;
}

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    actions: ContextMenuAction[];
}

export default function ContextMenu(props: ContextMenuProps) {
    let menuRef: HTMLDivElement | undefined;

    const handleClickOutside = (e: MouseEvent) => {
        if (menuRef && !menuRef.contains(e.target as Node)) {
            props.onClose();
        }
    };

    onMount(() => {
        document.addEventListener("mousedown", handleClickOutside);
        onCleanup(() => {
            document.removeEventListener("mousedown", handleClickOutside);
        });
    });

    return (
        <Portal>
            <div
                ref={menuRef}
                class="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[150px]"
                style={{
                    top: `${props.y}px`,
                    left: `${props.x}px`,
                }}
            >
                <For each={props.actions}>
                    {(action) => (
                        <button
                            class="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                            onClick={() => {
                                action.onClick();
                                props.onClose();
                            }}
                        >
                            {action.label}
                        </button>
                    )}
                </For>
            </div>
        </Portal>
    );
}
