# 02: /editar por enlace + registro simple

**What to build:** Crex Staff corrige un mensaje del bot con `/editar` y su enlace. El mensaje se actualiza sin duplicar. Cada anuncio guarda canal, mensaje, autor y fecha. Rechaza enlaces de mensajes ajenos al bot.

**Blocked by:** 01 (Servicio mínimo + /anunciar con puerta de rol).
**Status:** resolved

- [x] `/editar` actualiza el mensaje existente sin crear copia
- [x] Rechaza enlaces que no son del bot con error claro
- [x] Registro guarda canal, ID de mensaje, autor y fecha
- [x] Solo Crex Staff puede editar

## Comments

- Tests 18/18, typecheck y build verdes. Spec review: cubierto, sin creep. Standards: sin infracciones duras (solo duplicación leve anunciar/editar, aceptable).
- Pendiente: registrar `/editar` en servidor de prueba (`npm run register`) y probar edición real sobre un mensaje del bot (requiere token y GUILD_ID del técnico).
