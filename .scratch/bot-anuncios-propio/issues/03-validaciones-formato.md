# 03: Validaciones y errores claros + formato actual

**What to build:** Los comandos publican los 3 tipos actuales (título grande, secciones, negritas, listas, mención de canal, comando `/link`). Entradas inválidas devuelven errores claros que el staff entiende.

**Blocked by:** 02 (/editar por enlace + registro simple).

**Status:** resolved

- [x] Publica los formatos actuales de how-it-works, rules y faq
- [x] Error claro en canal inválido o sin permisos
- [x] Error claro en texto que supera límites
- [x] Sin menciones masivas por defecto
- [ ] Verificado en PC y móvil

## Comments

- Nuevo: límite de título 256 y total 6000 en `/anunciar` y `/editar`, con errores que muestran el límite. Tests 20/20.
- PC/móvil queda manual: depende del cliente Discord, no del código.
- Verificación 2026-10-08: tests 26/26 (11 anunciar + 15 editar), typecheck y build verdes. Nuevo: test de total 6000 y test passthrough de formato actual (título grande, negritas, listas, mención #canal, /link tal cual) en ambas suites. Code review doble eje: Standards pass, Spec pass.
