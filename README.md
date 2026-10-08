# Bot crex (ticket 1)

Servicio continuo con `/anunciar`. Solo rol Crex Staff. Token solo por entorno.

## Requisitos

- Node 22+
- Servidor de prueba: `GUILD_ID`, aplicación con `DISCORD_CLIENT_ID`
- Rol `Crex Staff` en el servidor (o `STAFF_ROLE_NAME`)
- Permisos del bot en canales de anuncio: ver, enviar, enlaces embebidos

## Configurar

Copia `.env.example` a `.env`. Nunca subas el token al repo.

```powershell
Copy-Item .env.example .env
```

Completa `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` y `GUILD_ID`.

## Registrar el comando (servidor de prueba)

```powershell
npm run register
```

## Correr

```powershell
npm run dev
```

## Usar

En Discord, como Crex Staff:

```text
/anunciar canal:#anuncios titulo:Novedad texto:Hola
```

Responde en privado si se publicó. Publica con identidad `crex`. Sin permiso, no ve ni ejecuta el comando. Si el canal falla, dice que revises permisos del bot. Texto máximo 2000 caracteres. Sin menciones masivas.

## Límites del ticket 1

- El registro limita la visibilidad al rol Crex Staff. Sin permiso, no se ve ni se ejecuta.
- Si falla el registro en disco, igual confirma la publicación y avisa en consola.
- Falta la verificación real en servidor de prueba: publicar con identidad `crex` y medir menos de 3 segundos (ticket 3 y prueba manual pendiente).
- Falta `/editar` (ticket 2).
- Falta verificar formatos actuales y PC/móvil (ticket 3).
- Falta hosting pago y monitoreo (ticket 4).
- Verificado hasta acá: tests, typecheck, build y arranque sin token.
