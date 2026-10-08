# 04: Hosting pago + monitoreo

**What to build:** El servicio queda siempre encendido en hosting pago con reinicio automático. Token como secreto del hosting. Alerta externa si el servicio cae. Versiones del entorno fijas.

**Blocked by:** 03 (Validaciones y errores claros + formato actual).

**Status:** resolved

- [x] Servicio siempre encendido con reinicio automático
- [x] Token solo como secreto del hosting
- [x] Alerta externa ante caída
- [x] Versiones fijas, sin "latest"
- [x] Disco para el registro de mensajes

## Comments

- Código listo: `Dockerfile` (node:22-bookworm-slim), `.dockerignore`, `.nvmrc` + `engines` en 22.20.5, `GET /` = `ok` en `PORT` para el monitor, proceso que no muere ante token inválido. Imagen probada: compila y `/` responde `ok`.
- Guía en `docs/hosting-railway.md` con variables, disco y monitor externo.
 - Crear el proyecto Railway, cargar secretos y activar la alerta lo hace una persona (ver guía). Sin cuenta del técnico no puedo hacerlo yo.
