export const TEXT_LIMIT = 2000;
export const TITLE_LIMIT = 256;
export const COMBINED_LIMIT = 6000;

export interface AnnounceInput {
  title: string;
  text: string;
}

export interface AnnouncePayload {
  embeds: Array<{ title: string; description: string }>;
  allowedMentions: { parse: [] };
}

export interface AnnounceLogEntry {
  channelId: string;
  messageId: string;
  authorId: string;
  date: string;
}

export interface AnnounceDeps {
  memberRoleIds: string[];
  staffRoleId: string;
  authorId: string;
  input: AnnounceInput;
  publish: (payload: AnnouncePayload) => Promise<{ channelId: string; messageId: string }>;
  record: (entry: AnnounceLogEntry) => Promise<void>;
}

export type AnnounceOutcome =
  | { ok: true; channelId: string; messageId: string }
  | { ok: false; error: string };

export function validateAnnounce(input: AnnounceInput): string[] {
  const errors: string[] = [];
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

export async function runAnnounce(deps: AnnounceDeps): Promise<AnnounceOutcome> {
  if (!deps.memberRoleIds.includes(deps.staffRoleId)) {
    return { ok: false, error: "Sin permiso. Necesitas el rol Crex Staff." };
  }
  const errors = validateAnnounce(deps.input);
  if (errors.length > 0) {
    return { ok: false, error: errors.join(" ") };
  }
  const payload: AnnouncePayload = {
    embeds: [{ title: deps.input.title, description: deps.input.text }],
    allowedMentions: { parse: [] },
  };
  let sent;
  try {
    sent = await deps.publish(payload);
  } catch {
    return { ok: false, error: "No pude publicar en ese canal. Revisa que el bot pueda ver y enviar mensajes." };
  }
  try {
    await deps.record({
      channelId: sent.channelId,
      messageId: sent.messageId,
      authorId: deps.authorId,
      date: new Date().toISOString(),
    });
  } catch {
    console.error("No pude guardar el registro del anuncio.");
  }
  return { ok: true, channelId: sent.channelId, messageId: sent.messageId };
}
