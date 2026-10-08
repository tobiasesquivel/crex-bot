# 04: Hosting pago + monitoreo

**What to build:** El servicio queda siempre encendido en hosting pago con reinicio automático. Token como secreto del hosting. Alerta externa si el servicio cae. Versiones del entorno fijas.

**Blocked by:** 03 (Validaciones y errores claros + formato actual).

**Status:** blocked

- [ ] Servicio siempre encendido con reinicio automático
- [ ] Token solo como secreto del hosting
- [ ] Alerta externa ante caída
- [x] Versiones fijas, sin "latest"
- [ ] Disco para el registro de mensajes

## Comments

- La marca anterior de resuelto solo cubría archivos locales, no un despliegue comprobado. Se corrige el estado: falta acceso a Railway y a un monitor externo.
- Node queda fijado en `22.20.0` en Docker, `.nvmrc` y `engines`. `22.20.5` corresponde a `@types/node`, no al runtime.
- `GET /` devuelve `200 ok` solo con Discord listo, o `503 unavailable` sin conexión. El fallo de login sale con código `1`, sin imprimir el token.
- Guía actualizada en `docs/hosting-railway.md`: plan pago, reinicio `Always`, sin suspensión, disco persistente, secretos, chequeo y prueba de alerta.
- Para cerrar este ticket se necesita un proyecto Railway autorizado y acceso al monitor. Hay que comprobar comandos reales, reinicio, persistencia del registro y recepción de la alerta.
- Verificación local: `npm run typecheck`, compilación, archivo de edición (15 tests) y suite completa (26 tests) pasan. La imagen Docker compila y ejecuta Node `22.20.0`.
- Prueba HTTP dentro de la imagen con el estado del SDK de Discord controlado: sin conexión `503 unavailable`, listo `200 ok`, desconectado otra vez `503 unavailable`. No prueba una conexión real a Discord.
- Arranque real de la imagen con token de prueba inválido: salida `1`, mensaje de error sin token. Railway no se pudo comprobar: no hay credenciales `RAILWAY` en el entorno y el CLI instalado por npm no encuentra su binario.
