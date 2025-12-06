import { createSignal, Show } from "solid-js";

export default function MenuBar() {

  const [selected, setSelected] = createSignal(0);
  
  return <>

    <ul class="flex gap-2">
      <li class="text-gray-900"><button onClick={() => setSelected(0)} class="cursor-pointer p-2">Datei</button></li>
      <li class="text-gray-900"><button onClick={() => setSelected(1)} class="cursor-pointer p-2">Bearbeiten</button></li>
      <li class="text-gray-900"><button onClick={() => setSelected(2)} class="cursor-pointer p-2">Ansicht</button></li>
      <li class="text-gray-900"><button onClick={() => setSelected(3)} class="cursor-pointer p-2">Folie</button></li>
    </ul>
    <div class="bg-white w-full rounded-md shadow-md p-2">
      <Show when={selected() === 0}>
        <button class="cursor-pointer p-2 text-gray-900">Neu</button>
        <button class="cursor-pointer p-2 text-gray-900">Öffnen</button>
        <button class="cursor-pointer p-2 text-gray-900">Speichern</button>
      </Show>
      <Show when={selected() === 1}>
        <button class="cursor-pointer p-2 text-gray-900">Rückgängig</button>
        <button class="cursor-pointer p-2 text-gray-900">Wiederholen</button>
        <button class="cursor-pointer p-2 text-gray-900">Kopieren</button>
      </Show>
      <Show when={selected() === 2}>
        <button class="cursor-pointer p-2 text-gray-900">All</button>
        <button class="cursor-pointer p-2 text-gray-900">Focus</button>
      </Show>
      <Show when={selected() === 3}>
        <button class="cursor-pointer p-2 text-gray-900">Neu</button>
      </Show>
    </div>
  </>
}
