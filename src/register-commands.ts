import { REST, Routes } from "discord.js";
import { loadConfig } from "./config.js";
import { announceCommand, editCommand } from "./index.js";

async function register(): Promise<void> {
  const config = loadConfig();
  const rest = new REST({ version: "10" }).setToken(config.token);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: [announceCommand.toJSON(), editCommand.toJSON()],
  });
  console.log("Comandos /anunciar y /editar registrados en el servidor de prueba.");
}

await register();
