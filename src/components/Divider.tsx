
interface DividerProps{
  direction: "col" | "row"
}

export default function Divider(props: DividerProps) {
  
  return <div class={`p-2 ${props.direction == "col" ? "h-full": "w-full"}`}>
    <div class={`bg-gray-300 ${props.direction == "col" ? "w-px h-full": "h-px w-full"}`}></div>
  </div>
}
