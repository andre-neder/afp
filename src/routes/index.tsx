import Divider from "~/components/Divider";
import Main from "~/components/Main";
import MenuBar from "~/components/MenuBar";
import SideBar from "~/components/SideBar";
import Resizable from '@corvu/resizable'

export default function Home() {
  return (
    <main class="flex flex-col bg-gray-200 w-full h-full p-2 gap-2">
      <MenuBar />
      <div class="flex gap-2 h-full">
        <Resizable class="size-full">
          <Resizable.Panel initialSize={0.2} minSize={0.1}>
            <SideBar />
          </Resizable.Panel>
          <Resizable.Handle>
            <Divider direction="col" />
          </Resizable.Handle>
          <Resizable.Panel initialSize={0.8} minSize={0.6}>
            <Main />
          </Resizable.Panel>
        </Resizable>
      </div>
    </main>
  );
}
