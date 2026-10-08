# Bot crex: hosting en Railway + monitoreo

Fecha: 2026-10-08. Servicio continuo con `/anunciar` y `/editar`. Solo rol Crex Staff.

## Qué pone Railway

- Reinicio solo si el proceso falla o sale con error.
- Disco para `announcements.log` (ruta `ANNOUNCE_LOG_PATH`).
- Chequeo de salud: `GET /` responde `ok` en puerto `PORT`.
- Versiones fijas: Node `22.20.5` (`.nvmrc`, `engines`), `discord.js` `14.27.0` (`package-lock.json`), imagen `node:22-bookworm-slim` (`Dockerfile`).

## Variables (todas en Railway, nunca en el repo)

| Variable | Qué es |
|---|---|
| `DISCORD_TOKEN` | Token del bot (secreto). |
| `DISCORD_CLIENT_ID` | ID de la aplicación. |
| `GUILD_ID` | Servidor de prueba primero, real después. |
| `STAFF_ROLE_NAME` | `Crex Staff` (opcional, ya es el valor por defecto). |
| `ANNOUNCE_LOG_PATH` | Ruta dentro del disco, p. ej. `/data/announcements.log`. |
| `PORT` | Lo pone Railway solo. No tocar. |

## Pasos

1. Sube este repo a GitHub (sin `.env`; ya está ignorado).
2. En Railway crea un proyecto desde ese repo.
3. Agrega un disco y móntalo en `/data`. Pon `ANNOUNCE_LOG_PATH=/data/announcements.log`.
4. Carga las variables de la tabla. El token va como secreto.
5. Despliega. Railway usa el `Dockerfile` solo.
6. Abre la URL pública del servicio: debe decir `ok`.
7. En el servidor de prueba corre `npm run register` una vez (o pide al técnico que lo corra) para ver `/anunciar` y `/editar`.
8. Prueba `/anunciar` y `/editar` como Crex Staff.

## Monitoreo externo

Usa UptimeRobot, Better Stack o el que uses. Vigila `GET https://<tu-servicio>/` cada 5 minutos. Espera `200` con texto `ok`. Si cae, avisa al técnico.

Sin esta alerta nadie sabe si el bot se cae. El plan pago reinicia solo ante fallos del proceso, pero no ante token inválido o baneo: el health sigue en `ok` y el registro muestra el error en consola.
