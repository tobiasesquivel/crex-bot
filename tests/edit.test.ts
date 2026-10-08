import { describe, expect, it, vi } from "vitest";
import { TEXT_LIMIT, TITLE_LIMIT } from "../src/announce.js";
import { parseMessageLink, runEdit, validateEdit } from "../src/edit.js";
import type { EditDeps } from "../src/edit.js";

const STAFF = "role-crex-staff";
const BOT = "bot-crex";
const LINK = "https://discord.com/channels/111/222/333";

function deps(overrides: Pick<Partial<EditDeps>, "memberRoleIds" | "input"> = {}) {
  const fetchMessage = vi.fn<EditDeps["fetchMessage"]>(async () => ({ authorId: BOT }));
  const applyEdit = vi.fn<EditDeps["applyEdit"]>(async () => {});
  const record = vi.fn<EditDeps["record"]>(async () => {});
  return {
    memberRoleIds: [STAFF],
    staffRoleId: STAFF,
    authorId: "author-1",
    botId: BOT,
    input: { messageLink: LINK, title: "Aviso", text: "Hola" },
    fetchMessage,
    applyEdit,
    record,
    ...overrides,
  };
}

describe("puerta de rol", () => {
  it("bloquea sin el rol Crex Staff y no toca el mensaje", async () => {
    const d = deps({ memberRoleIds: ["otro-rol"] });
    const result = await runEdit(d);
    expect(result).toEqual({ ok: false, error: "Sin permiso. Necesitas el rol Crex Staff." });
    expect(d.fetchMessage).not.toHaveBeenCalled();
    expect(d.applyEdit).not.toHaveBeenCalled();
  });
});

describe("enlace del mensaje", () => {
  it("extrae canal y mensaje del enlace", () => {
    expect(parseMessageLink(LINK)).toEqual({ channelId: "222", messageId: "333" });
  });

  it("rechaza enlace inválido sin buscar el mensaje", async () => {
    const d = deps({ input: { messageLink: "no-es-enlace", title: "Aviso", text: "Hola" } });
    const result = await runEdit(d);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Enlace inválido");
    expect(d.fetchMessage).not.toHaveBeenCalled();
    expect(d.applyEdit).not.toHaveBeenCalled();
  });

  it("rechaza mensaje que no existe con error claro", async () => {
    const d = deps();
    d.fetchMessage.mockResolvedValueOnce(null);
    const result = await runEdit(d);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("No encontré ese mensaje");
    expect(d.applyEdit).not.toHaveBeenCalled();
  });

  it("rechaza mensaje ajeno al bot sin editarlo", async () => {
    const d = deps();
    d.fetchMessage.mockResolvedValueOnce({ authorId: "otra-persona" });
    const result = await runEdit(d);
    expect(result).toEqual({
      ok: false,
      error: "Ese mensaje no es del bot. Solo puedo editar mensajes publicados por crex.",
    });
    expect(d.applyEdit).not.toHaveBeenCalled();
  });
});

describe("validación de /editar", () => {
  it("acepta título y texto válidos", () => {
    expect(validateEdit({ messageLink: LINK, title: "Aviso", text: "Hola" })).toEqual([]);
  });

  it("rechaza título vacío sin tocar el mensaje", async () => {
    const d = deps({ input: { messageLink: LINK, title: "  ", text: "Hola" } });
    const result = await runEdit(d);
    expect(result.ok).toBe(false);
    expect(d.applyEdit).not.toHaveBeenCalled();
  });

  it("rechaza texto de más de 2000 caracteres con el límite en el error", async () => {
    const d = deps({ input: { messageLink: LINK, title: "Aviso", text: "x".repeat(TEXT_LIMIT + 1) } });
    const result = await runEdit(d);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(String(TEXT_LIMIT));
    expect(d.applyEdit).not.toHaveBeenCalled();
  });

  it("rechaza título de más de 256 caracteres con el límite en el error", async () => {
    const d = deps({ input: { messageLink: LINK, title: "x".repeat(TITLE_LIMIT + 1), text: "Hola" } });
    const result = await runEdit(d);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(String(TITLE_LIMIT));
    expect(d.applyEdit).not.toHaveBeenCalled();
  });
});

describe("edición", () => {
  it("actualiza el mensaje existente sin duplicar y registra canal, mensaje y autor", async () => {
    const d = deps({ input: { messageLink: LINK, title: "Aviso", text: "Hola #general" } });
    const result = await runEdit(d);
    expect(result).toEqual({ ok: true, channelId: "222", messageId: "333" });
    expect(d.applyEdit).toHaveBeenCalledOnce();
    expect(d.applyEdit).toHaveBeenCalledWith("222", "333", {
      embeds: [{ title: "Aviso", description: "Hola #general" }],
      allowedMentions: { parse: [] },
    });
    expect(d.record).toHaveBeenCalledOnce();
    const entry = d.record.mock.calls[0]?.[0];
    expect(entry?.channelId).toBe("222");
    expect(entry?.messageId).toBe("333");
    expect(entry?.authorId).toBe("author-1");
    expect(typeof entry?.date).toBe("string");
  });

  it("devuelve error claro si editar falla y no registra", async () => {
    const d = deps();
    d.applyEdit.mockRejectedValueOnce(new Error("Missing Access"));
    const result = await runEdit(d);
    expect(result).toEqual({
      ok: false,
      error: "No pude editar ese mensaje. Revisa que el bot pueda ver el canal.",
    });
    expect(d.record).not.toHaveBeenCalled();
  });

  it("confirma la edición aunque falle el registro", async () => {
    const d = deps();
    d.record.mockRejectedValueOnce(new Error("disco lleno"));
    const result = await runEdit(d);
    expect(result).toEqual({ ok: true, channelId: "222", messageId: "333" });
  });
});
