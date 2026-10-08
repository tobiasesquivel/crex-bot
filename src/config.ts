export interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  staffRoleName: string;
  logPath: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  return value;
}

export function loadConfig(): BotConfig {
  return {
    token: required("DISCORD_TOKEN"),
    clientId: required("DISCORD_CLIENT_ID"),
    guildId: required("GUILD_ID"),
    staffRoleName: process.env["STAFF_ROLE_NAME"]?.trim() || "Crex Staff",
    logPath: process.env["ANNOUNCE_LOG_PATH"]?.trim() || "announcements.log",
  };
}
