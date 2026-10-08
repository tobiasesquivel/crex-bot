import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { runAnnounce } from "./announce.js";
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
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setDMPermission(false);

export async function startBot(): Promise<void> {
  const config = loadConfig();
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "anunciar") return;
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({ content: "Usa /anunciar dentro del servidor.", ephemeral: true });
      return;
    }

    const channel = interaction.options.getChannel("canal", true);
    const title = interaction.options.getString("titulo", true);
    const text = interaction.options.getString("texto", true);

    const staffRole = guild.roles.cache.find((r) => r.name === config.staffRoleName);
    if (!staffRole) {
      await interaction.reply({
        content: `No encuentro el rol ${config.staffRoleName}. Pide ayuda técnica.`,
        ephemeral: true,
      });
      return;
    }

    const memberRoles = interaction.member?.roles;
    const memberRoleIds =
      memberRoles && "cache" in memberRoles ? [...memberRoles.cache.keys()] : [];

    await interaction.deferReply({ ephemeral: true });
    const result = await runAnnounce({
      memberRoleIds,
      staffRoleId: staffRole.id,
      authorId: interaction.user.id,
      input: { title, text },
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
  });

  client.on(Events.ClientReady, () => {
    console.log(`crex listo como ${client.user?.tag}`);
  });

  await client.login(config.token);
}
