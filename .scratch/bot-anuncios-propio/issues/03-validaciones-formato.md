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

- Los formatos actuales son markdown del propio texto (título grande, secciones, negritas, listas, mención `#canal`, comando `/link`). El bot ya pasa título y descripción tal cual en un embed, y `allowedMentions.parse` vacío bloquea `@everyone`/`@here`. Sin cambio de código por esto: la persona escribe el formato en el texto.
- Nuevo: límite de título 256 y total 6000 en `/anunciar` y `/editar`, con errores que muestran el límite. Tests 20/20.
- PC/móvil queda manual: depende del cliente Discord, no del código.
