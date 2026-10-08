# Bot crex: hosting en Railway + monitoreo

Fecha: 2026-10-08. Servicio continuo con `/anunciar` y `/editar`. Solo rol Crex Staff.

## Qué pone Railway

- Reinicio automático con política `Always` en el plan pago.
- Disco para `announcements.log` (ruta `ANNOUNCE_LOG_PATH`).
- Chequeo de salud: `GET /` responde `200 ok` solo cuando el cliente de Discord está listo. Mientras conecta o pierde la conexión, responde `503 unavailable`. No guarda respuestas en caché.
- Versiones fijas: Node `22.20.0` (`.nvmrc`, `engines` e imagen `node:22.20.0-bookworm-slim`), `discord.js` `14.27.0` (`package-lock.json`). `@types/node` `22.20.5` contiene tipos para TypeScript, no es la versión de Node.

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
5. En los ajustes del servicio, selecciona política de reinicio `Always` y desactiva `Serverless`. Usa una sola réplica para este bot.
6. Configura el chequeo de salud con ruta `/`. Despliega. Railway detecta el `Dockerfile`.
7. Genera el dominio público del servicio. Abre su URL: debe responder `200` con texto `ok` cuando Discord esté conectado.
8. En un entorno autorizado corre `npm run register` una vez con las variables del servidor de prueba para ver `/anunciar` y `/editar`.
9. Prueba `/anunciar` y `/editar` como Crex Staff. Confirma que el registro se escribe en `/data/announcements.log` y permanece después de un redespliegue.

## Monitoreo externo

Usa UptimeRobot, Better Stack o el que uses. Vigila `GET https://<tu-servicio>/` cada 5 minutos. Espera `200` con texto `ok`. Si cae, avisa al técnico.

El chequeo de Railway controla el arranque del despliegue; no sustituye al monitor externo. Si falla el login, el proceso sale con código `1` para permitir el reinicio. Un token inválido necesita intervención: reiniciar no lo corrige. El monitor debe alertar por errores HTTP, tiempo agotado o un cuerpo distinto de `ok`.

Configura un destinatario y envía una alerta de prueba desde el monitor. Después, detén el servicio desde Railway en una ventana acordada, confirma la alerta real y vuelve a desplegar. No marques el despliegue como completo hasta comprobar reinicio, persistencia y recepción de la alerta.

Referencias: [política de reinicio](https://docs.railway.com/deployments/restart-policy), [Serverless](https://docs.railway.com/deployments/serverless).
