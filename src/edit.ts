import { COMBINED_LIMIT, TEXT_LIMIT, TITLE_LIMIT, type AnnounceLogEntry, type AnnouncePayload } from "./announce.js";

export interface EditInput {
  messageLink: string;
  title: string;
  text: string;
}

export interface EditDeps {
  memberRoleIds: string[];
  staffRoleId: string;
  authorId: string;
  botId: string;
  input: EditInput;
  fetchMessage: (channelId: string, messageId: string) => Promise<{ authorId: string } | null>;
  applyEdit: (channelId: string, messageId: string, payload: AnnouncePayload) => Promise<void>;
  record: (entry: AnnounceLogEntry) => Promise<void>;
}

export type EditOutcome =
  | { ok: true; channelId: string; messageId: string }
  | { ok: false; error: string };

const LINK_PATTERN = /discord(?:app)?\.com\/channels\/(?:\d+|@me)\/(\d+)\/(\d+)/;

export function parseMessageLink(link: string): { channelId: string; messageId: string } | null {
  const match = LINK_PATTERN.exec(link.trim());
  if (!match?.[1] || !match?.[2]) return null;
  return { channelId: match[1], messageId: match[2] };
}

export function validateEdit(input: EditInput): string[] {
  const errors: string[] = [];
  if (!parseMessageLink(input.messageLink)) {
    errors.push(
      "Enlace inválido. Copia el enlace del mensaje con clic derecho > Copiar enlace del mensaje.",
    );
  }
  if (input.title.trim().length === 0) {
    errors.push("Falta el título. Escribe un título corto.");
  }
  if (input.title.length > TITLE_LIMIT) {
    errors.push(
      `Título muy largo (${input.title.length}/${TITLE_LIMIT} caracteres). Acórtalo antes de enviar.`,
    );
  }
  if (input.text.trim().length === 0) {
    errors.push("Falta el texto. Escribe el anuncio.");
  }
  if (input.text.length > TEXT_LIMIT) {
    errors.push(
      `Texto muy largo (${input.text.length}/${TEXT_LIMIT} caracteres). Acórtalo antes de enviar.`,
    );
  }
  if (input.title.length + input.text.length > COMBINED_LIMIT) {
    errors.push(
      `Anuncio muy largo en total (${input.title.length + input.text.length}/${COMBINED_LIMIT} caracteres). Acórtalo antes de enviar.`,
    );
  }
  return errors;
}

export async function runEdit(deps: EditDeps): Promise<EditOutcome> {
  if (!deps.memberRoleIds.includes(deps.staffRoleId)) {
    return { ok: false, error: "Sin permiso. Necesitas el rol Crex Staff." };
  }
  const errors = validateEdit(deps.input);
  if (errors.length > 0) {
    return { ok: false, error: errors.join(" ") };
  }
  const ids = parseMessageLink(deps.input.messageLink);
  if (!ids) {
    return {
      ok: false,
      error: "Enlace inválido. Copia el enlace del mensaje con clic derecho > Copiar enlace del mensaje.",
    };
  }
  let target;
  try {
    target = await deps.fetchMessage(ids.channelId, ids.messageId);
  } catch {
    target = null;
  }
  if (!target) {
    return {
      ok: false,
      error: "No encontré ese mensaje. Revisa el enlace y que el bot pueda ver el canal.",
    };
  }
  if (target.authorId !== deps.botId) {
    return {
      ok: false,
      error: "Ese mensaje no es del bot. Solo puedo editar mensajes publicados por crex.",
    };
  }
  const payload: AnnouncePayload = {
    embeds: [{ title: deps.input.title, description: deps.input.text }],
    allowedMentions: { parse: [] },
  };
  try {
    await deps.applyEdit(ids.channelId, ids.messageId, payload);
  } catch {
    return { ok: false, error: "No pude editar ese mensaje. Revisa que el bot pueda ver el canal." };
  }
  try {
    await deps.record({
      channelId: ids.channelId,
      messageId: ids.messageId,
      authorId: deps.authorId,
      date: new Date().toISOString(),
    });
  } catch {
    console.error("No pude guardar el registro de la edición.");
  }
  return { ok: true, channelId: ids.channelId, messageId: ids.messageId };
}
