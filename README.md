# Bot crex

Servicio continuo con `/anunciar` y `/editar`. Solo rol Crex Staff. Token solo por entorno.

## Requisitos

- Node 22.20.0 (ver `.nvmrc`)
- Servidor de prueba: `GUILD_ID`, aplicación con `DISCORD_CLIENT_ID`
- Rol `Crex Staff` en el servidor (o `STAFF_ROLE_NAME`)
- Permisos del bot en canales de anuncio: ver, enviar, enlaces embebidos

## Configurar

Copia `.env.example` a `.env`. Nunca subas el token al repo.

```powershell
Copy-Item .env.example .env
```

Completa `DISCORD_TOKEN`, `DISCORD_CLIENT_ID` y `GUILD_ID`.

## Registrar los comandos (servidor de prueba)

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
/editar enlace:<enlace-del-mensaje> titulo:Nuevo texto:Hola de nuevo
```

Responde en privado si se publicó o corrigió. Publica con identidad `crex`. Solo edita mensajes del propio bot. Sin permiso, no ve ni ejecuta los comandos. Si el canal falla, dice que revises permisos del bot. Título máximo 256, texto máximo 2000, total máximo 6000 caracteres. Sin menciones masivas.

El registro guarda canal, mensaje, autor y fecha en `announcements.log` (`ANNOUNCE_LOG_PATH`). Si falla el registro, igual confirma y avisa en consola.

El servicio expone `GET /` en el puerto `PORT` (por defecto 3000). Responde `200 ok` solo cuando Discord está listo; durante una desconexión responde `503 unavailable`. Si falla el login, sale con código `1` para que el hosting lo reinicie.

## Hosting y monitoreo

Ver `docs/hosting-railway.md`. Railway debe usar un plan pago, reinicio `Always`, `Serverless` desactivado, disco `/data`, secretos como variables y alerta externa sobre `GET /`.

## Pendiente manual (lo hace una persona)

- Registrar comandos en servidor de prueba y probar `/anunciar` + `/editar` reales.
- Comprobar error con enlace ajeno, enlace falso y texto largo.
- Revisar anuncios en PC y móvil.
- Crear proyecto Railway, disco, secretos y alerta externa.
