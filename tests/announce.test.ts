import { describe, expect, it, vi } from "vitest";
import { TEXT_LIMIT, runAnnounce, validateAnnounce } from "../src/announce.js";
import type { AnnounceDeps, AnnounceLogEntry } from "../src/announce.js";

const STAFF = "role-crex-staff";

function deps(
  overrides: Pick<Partial<AnnounceDeps>, "memberRoleIds" | "input"> = {},
) {
  const publish = vi.fn<AnnounceDeps["publish"]>(async () => ({ channelId: "chan-1", messageId: "msg-1" }));
  const record = vi.fn<AnnounceDeps["record"]>(async () => {});
  return { memberRoleIds: [STAFF], staffRoleId: STAFF, authorId: "author-1", input: { title: "Novedad", text: "Hola" }, publish, record, ...overrides };
}

describe("puerta de rol", () => {
  it("bloquea sin el rol Crex Staff y no publica", async () => {
    const d = deps({ memberRoleIds: ["otro-rol"] });
    const result = await runAnnounce(d);
    expect(result).toEqual({ ok: false, error: "Sin permiso. Necesitas el rol Crex Staff." });
    expect(d.publish).not.toHaveBeenCalled();
  });
});

describe("validación de /anunciar", () => {
  it("acepta título y texto válidos", () => {
    expect(validateAnnounce({ title: "Novedad", text: "Hola" })).toEqual([]);
  });

  it("rechaza título vacío", async () => {
    const d = deps({ input: { title: "  ", text: "Hola" } });
    const result = await runAnnounce(d);
    expect(result.ok).toBe(false);
    expect(d.publish).not.toHaveBeenCalled();
  });

  it("rechaza texto de más de 2000 caracteres con el límite en el error", async () => {
    const d = deps({ input: { title: "Novedad", text: "x".repeat(TEXT_LIMIT + 1) } });
    const result = await runAnnounce(d);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(String(TEXT_LIMIT));
    expect(d.publish).not.toHaveBeenCalled();
  });
});

describe("canal inválido", () => {
  it("devuelve error claro si publicar falla y no registra", async () => {
    const d = deps();
    d.publish.mockRejectedValueOnce(new Error("Missing Access"));
    const result = await runAnnounce(d);
    expect(result).toEqual({
      ok: false,
      error: "No pude publicar en ese canal. Revisa que el bot pueda ver y enviar mensajes.",
    });
    expect(d.record).not.toHaveBeenCalled();
  });
});

describe("registro", () => {
  it("confirma la publicación aunque falle el registro", async () => {
    const d = deps();
    d.record.mockRejectedValueOnce(new Error("disco lleno"));
    const result = await runAnnounce(d);
    expect(result).toEqual({ ok: true, channelId: "chan-1", messageId: "msg-1" });
  });
});

describe("publicación", () => {
  it("publica título y texto sin menciones masivas y registra canal, mensaje y autor", async () => {
    const d = deps({ input: { title: "Novedad", text: "Hola #general" } });
    const result = await runAnnounce(d);
    expect(result).toEqual({ ok: true, channelId: "chan-1", messageId: "msg-1" });
    expect(d.publish).toHaveBeenCalledWith({
      embeds: [{ title: "Novedad", description: "Hola #general" }],
      allowedMentions: { parse: [] },
    });
    expect(d.record).toHaveBeenCalledOnce();
    const entry: AnnounceLogEntry | undefined = d.record.mock.calls[0]?.[0];
    expect(entry?.channelId).toBe("chan-1");
    expect(entry?.messageId).toBe("msg-1");
    expect(entry?.authorId).toBe("author-1");
    expect(typeof entry?.date).toBe("string");
  });
});
