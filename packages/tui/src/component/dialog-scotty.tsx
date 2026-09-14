import { TextAttributes } from "@opentui/core"
import { For } from "solid-js"
import { useTheme } from "../context/theme"
import { useDialog } from "../ui/dialog"
import { useBindings } from "../keymap"

const SCOTTY_ART = [
  "        /\\_/\\",
  "       ( ^   ^ )",
  "        \\  Y  /",
  "       __\\___/__",
  "      /  =====  \\",
  "     |  Scotty!  |",
  "      \\_________/",
  "        |     |",
  "       (_)   (_)",
]

export function DialogScotty() {
  const dialog = useDialog()
  const { theme } = useTheme()

  dialog.setSize("large")

  useBindings(() => ({
    bindings: [
      { key: "return", desc: "Close", group: "Dialog", cmd: () => dialog.clear() },
      { key: "escape", desc: "Close", group: "Dialog", cmd: () => dialog.clear() },
    ],
  }))

  return (
    <box paddingLeft={2} paddingRight={2} gap={1} paddingBottom={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={theme.text} attributes={TextAttributes.BOLD}>Scotty</text>
        <text fg={theme.textMuted} onMouseUp={() => dialog.clear()}>esc</text>
      </box>
      <box>
        <For each={SCOTTY_ART}>{(line) => <text fg={theme.text}>{line}</text>}</For>
      </box>
      <text fg={theme.textMuted}>Go Tartans!</text>
    </box>
  )
}