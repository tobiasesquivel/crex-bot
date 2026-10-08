import { REST, Routes } from "discord.js";
import { loadConfig } from "./config.js";
import { announceCommand } from "./index.js";

async function register(): Promise<void> {
  const config = loadConfig();
  const rest = new REST({ version: "10" }).setToken(config.token);
  const registered = (await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: [announceCommand.toJSON()] },
  )) as Array<{ id: string; name: string }>;
  const command = registered.find((c) => c.name === "anunciar");
  if (!command) throw new Error("No se registró /anunciar.");
  const staffRoleResponse = (await rest.get(Routes.guildRoles(config.guildId))) as Array<{
    id: string;
    name: string;
  }>;
  const staffRole = staffRoleResponse.find((r) => r.name === config.staffRoleName);
  if (!staffRole) throw new Error(`No encuentro el rol ${config.staffRoleName}.`);
  await rest.put(
    Routes.applicationCommandPermissions(config.clientId, config.guildId, command.id),
    { body: { permissions: [{ id: staffRole.id, type: 1, permission: true }] } },
  );
  console.log(`Comando /anunciar registrado y limitado al rol ${config.staffRoleName}.`);
}

await register();
