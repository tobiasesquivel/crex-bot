import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { Guild, GuildMemberRoleManager, Message } from "discord.js";
import { createServer } from "node:http";
import { runAnnounce } from "./announce.js";
import type { AnnouncePayload } from "./announce.js";
import { runEdit } from "./edit.js";
import { loadConfig } from "./config.js";
import { logAnnounce } from "./log.js";

export const announceCommand = new SlashCommandBuilder()
  .setName("anunciar")
  .setDescription("Publica un anuncio con identidad crex (solo Crex Staff)")
  .addChannelOption((option) =>
    option
      .setName("canal")
      .setDescription("Canal destino del anuncio")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("titulo").setDescription("Título del anuncio").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("texto").setDescription("Texto del anuncio (hasta 2000 caracteres)").setRequired(true),
  )
  .addBooleanOption((option) =>
    option.setName("todos").setDescription("Avisa a todo el servidor (@everyone)").setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setDMPermission(false);

export const editCommand = new SlashCommandBuilder()
  .setName("editar")
  .setDescription("Corrige un mensaje del bot con su enlace (solo Crex Staff)")
  .addStringOption((option) =>
    option.setName("enlace").setDescription("Enlace del mensaje a corregir").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("titulo").setDescription("Título nuevo").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("texto").setDescription("Texto nuevo (hasta 2000 caracteres)").setRequired(true),
  )
  .addBooleanOption((option) =>
    option.setName("todos").setDescription("Avisa a todo el servidor (@everyone)").setRequired(false),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setDMPermission(false);

type StaffCheck =
  | { ok: true; staffRoleId: string; memberRoleIds: string[] }
  | { ok: false; error: string };

function staffCheck(guild: Guild, roles: unknown, staffRoleName: string): StaffCheck {
  const staffRole = guild.roles.cache.find((r) => r.name === staffRoleName);
  if (!staffRole) {
    return { ok: false, error: `No encuentro el rol ${staffRoleName}. Pide ayuda técnica.` };
  }
  const cache = (roles as GuildMemberRoleManager | undefined)?.cache;
  return { ok: true, staffRoleId: staffRole.id, memberRoleIds: cache ? [...cache.keys()] : [] };
}

async function fetchTargetMessage(
  guild: Guild,
  channelId: string,
  messageId: string,
): Promise<Message | null> {
  const targetChannel = await guild.channels.fetch(channelId);
  if (!targetChannel || !("messages" in targetChannel)) return null;
  try {
    return await targetChannel.messages.fetch(messageId);
  } catch {
    return null;
  }
}

async function editPayload(
  guild: Guild,
  channelId: string,
  messageId: string,
  payload: AnnouncePayload,
): Promise<void> {
  const target = await fetchTargetMessage(guild, channelId, messageId);
  if (!target) throw new Error("Mensaje no encontrado.");
  await target.edit(payload);
}

export async function startBot(): Promise<void> {
  const config = loadConfig();
  const port = Number(process.env["PORT"] ?? "3000");

  createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
  }).listen(port);

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const guild = interaction.guild;
    if (!guild) {
      const msg =
        interaction.commandName === "editar"
          ? "Usa /editar dentro del servidor."
          : "Usa /anunciar dentro del servidor.";
      await interaction.reply({ content: msg, ephemeral: true });
      return;
    }

    if (interaction.commandName === "anunciar") {
      const channel = interaction.options.getChannel("canal", true);
      const title = interaction.options.getString("titulo", true);
      const text = interaction.options.getString("texto", true);
      const mentionEveryone = interaction.options.getBoolean("todos") ?? false;

      const check = staffCheck(guild, interaction.member?.roles, config.staffRoleName);
      if (!check.ok) {
        await interaction.reply({ content: check.error, ephemeral: true });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const result = await runAnnounce({
        memberRoleIds: check.memberRoleIds,
        staffRoleId: check.staffRoleId,
        authorId: interaction.user.id,
        input: { title, text, mentionEveryone },
        publish: async (payload) => {
          if (!("send" in channel) || typeof channel.send !== "function") {
            throw new Error("Canal inválido. Elige un canal de texto del servidor.");
          }
          const sent = await channel.send(payload);
          return { channelId: sent.channelId, messageId: sent.id };
        },
        record: async (entry) => {
          await logAnnounce(config.logPath, entry);
        },
      });

      if (!result.ok) {
        await interaction.editReply(result.error);
        return;
      }
      await interaction.editReply(`Publicado en <#${result.channelId}> (mensaje ${result.messageId}).`);
      return;
    }

    if (interaction.commandName === "editar") {
      const messageLink = interaction.options.getString("enlace", true);
      const title = interaction.options.getString("titulo", true);
      const text = interaction.options.getString("texto", true);
      const mentionEveryone = interaction.options.getBoolean("todos") ?? false;

      const check = staffCheck(guild, interaction.member?.roles, config.staffRoleName);
      if (!check.ok) {
        await interaction.reply({ content: check.error, ephemeral: true });
        return;
      }

      const botId = client.user?.id;
      if (!botId) {
        await interaction.reply({
          content: "El bot aún no está listo. Intenta de nuevo en unos segundos.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const result = await runEdit({
        memberRoleIds: check.memberRoleIds,
        staffRoleId: check.staffRoleId,
        authorId: interaction.user.id,
        botId,
        input: { messageLink, title, text, mentionEveryone },
        fetchMessage: async (channelId, messageId) => {
          const target = await fetchTargetMessage(guild, channelId, messageId);
          return target ? { authorId: target.author.id } : null;
        },
        applyEdit: async (channelId, messageId, payload) => {
          await editPayload(guild, channelId, messageId, payload);
        },
        record: async (entry) => {
          await logAnnounce(config.logPath, entry);
        },
      });

      if (!result.ok) {
        await interaction.editReply(result.error);
        return;
      }
      await interaction.editReply(`Corregido en <#${result.channelId}> (mensaje ${result.messageId}).`);
    }
  });

  client.on(Events.ClientReady, () => {
    console.log(`crex listo como ${client.user?.tag}`);
  });

  try {
    await client.login(config.token);
  } catch (error) {
    console.error("No pude conectar con Discord. Revisa el token.", error);
  }
  setInterval(() => {}, 60_000);
}
