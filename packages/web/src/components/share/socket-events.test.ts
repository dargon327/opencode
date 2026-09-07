import { describe, expect, test } from "bun:test"
import { buildShareSocketUrl, parseSessionMessage, upsertPart } from "./socket-events"
import type { MessageV2 } from "opencode/session/message-v2"

describe("buildShareSocketUrl", () => {
  test("upgrades an http API origin to wss", () => {
    expect(buildShareSocketUrl("http://api.opencode.ai", "ses_123")).toBe(
      "wss://api.opencode.ai/share_poll?id=ses_123",
    )
  })

  test("upgrades an https API origin to wss (always secure)", () => {
    expect(buildShareSocketUrl("https://api.opencode.ai", "ses_123")).toBe(
      "wss://api.opencode.ai/share_poll?id=ses_123",
    )
  })

  test("preserves host and port for local development URLs", () => {
    expect(buildShareSocketUrl("http://127.0.0.1:4096", "ses_abc")).toBe(
      "wss://127.0.0.1:4096/share_poll?id=ses_abc",
    )
  })

  test("leaves a scheme-less base untouched aside from appending the path", () => {
    // Guards the exact regex used in production: only a leading http(s):// is rewritten.
    expect(buildShareSocketUrl("api.opencode.ai", "ses_123")).toBe("api.opencode.ai/share_poll?id=ses_123")
  })
})

describe("parseSessionMessage", () => {
  test("parses a session/info event", () => {
    const raw = JSON.stringify({ key: "session/info", content: { title: "hello" } })
    expect(parseSessionMessage(raw)).toEqual({ type: "info", splits: [], content: { title: "hello" } })
  })

  test("parses a session/message event and captures the id in splits", () => {
    const raw = JSON.stringify({ key: "session/message/msg_1", content: { id: "msg_1" } })
    expect(parseSessionMessage(raw)).toEqual({ type: "message", splits: ["msg_1"], content: { id: "msg_1" } })
  })

  test("parses a session/part event", () => {
    const raw = JSON.stringify({ key: "session/part", content: { id: "part_1", messageID: "msg_1" } })
    expect(parseSessionMessage(raw)).toEqual({
      type: "part",
      splits: [],
      content: { id: "part_1", messageID: "msg_1" },
    })
  })

  test("ignores events outside the session/ namespace", () => {
    const raw = JSON.stringify({ key: "other/thing", content: {} })
    expect(parseSessionMessage(raw)).toBeUndefined()
  })

  test("throws on malformed JSON so the caller's try/catch can log it", () => {
    expect(() => parseSessionMessage("not json")).toThrow()
  })

  test("throws when the payload has no key to split", () => {
    expect(() => parseSessionMessage(JSON.stringify({ content: {} }))).toThrow()
  })
})

describe("upsertPart", () => {
  const part = (id: string, text: string) => ({ id, type: "text", text }) as unknown as MessageV2.Part

  test("appends a part that is not already present", () => {
    const result = upsertPart([part("a", "first")], part("b", "second"))
    expect(result.map((p: any) => p.id)).toEqual(["a", "b"])
  })

  test("replaces an existing part's content in place, without moving its position", () => {
    const initial = [part("a", "first"), part("b", "second"), part("c", "third")]
    const result = upsertPart(initial, part("b", "second-updated"))

    expect(result.map((p: any) => p.id)).toEqual(["a", "b", "c"])
    expect((result[1] as any).text).toBe("second-updated")
  })

  test("does not mutate the input array", () => {
    const initial = [part("a", "first")]
    const result = upsertPart(initial, part("b", "second"))

    expect(initial).toHaveLength(1)
    expect(result).toHaveLength(2)
  })

  test("starting from an empty list just adds the part", () => {
    expect(upsertPart([], part("a", "only"))).toEqual([part("a", "only")])
  })
})