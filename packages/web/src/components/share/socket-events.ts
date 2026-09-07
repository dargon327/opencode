import type { MessageV2 } from "opencode/session/message-v2"

/*
    helpers taken from setupWebSocket in Share.tsx
    these don't depend on solidJS, so bun test will work with these
*/

export function buildShareSocketUrl(apiUrl: string, id: string): string {
  const wsBaseUrl = apiUrl.replace(/^https?:\/\//, "wss://")
  return `${wsBaseUrl}/share_poll?id=${id}`
}

export interface ParsedSessionEvent {
  type: string
  splits: string[]
  content: any
}

export function parseSessionMessage(raw: string): ParsedSessionEvent | undefined {
  const d = JSON.parse(raw)
  const [root, type, ...splits] = d.key.split("/")
  if (root !== "session") return undefined
  return { type, splits, content: d.content }
}

export function upsertPart(parts: MessageV2.Part[], part: MessageV2.Part): MessageV2.Part[] {
  const byID = new Map(parts.map((x) => [x.id, x]))
  byID.set(part.id, part)
  return [...byID.values()]
}