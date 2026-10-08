import { REST, Routes } from "discord.js";
import { loadConfig } from "./config.js";
import { announceCommand } from "./index.js";

async function register(): Promise<void> {
  const config = loadConfig();
  const rest = new REST({ version: "10" }).setToken(config.token);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: [announceCommand.toJSON()],
  });
  console.log("Comando /anunciar registrado en el servidor de prueba.");
}

await register();
