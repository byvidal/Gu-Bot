# GuChkr-bot

> Bot de Telegram ligero para funcionalidades varias (generación de tarjetas, menús y comandos).

## Resumen

GuChkr-bot es un proyecto Node.js que utiliza Telegraf para interactuar con la API de Telegram. Está organizado en comandos, acciones, servicios y utilidades para mantener el código modular y fácil de extender.

## Requisitos

- Node.js v16 o superior
- npm (o yarn)

## Dependencias principales

- `telegraf` — Cliente de Telegram
- `dotenv` — Carga variables de entorno desde `.env`
- `axios` — Cliente HTTP (usado por servicios)

Estas dependencias están listadas en `package.json`.

## Instalación

1. Clona el repositorio:

```bash
git clone <repo-url>
cd GuChkr-bot
```

2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` en la raíz con la variable obligatoria:

```
BOT_TOKEN=<tu_token_de_telegram>
```

4. Inicia el bot:

```bash
npm start
# o
npm run dev
```

Si el `BOT_TOKEN` falta, el bot lanzará un error indicando "Falta BOT_TOKEN en el archivo .env".

## Estructura del proyecto (resumen)

- `index.js` — Punto de entrada; registra comandos, acciones y arranca el bot.
- `package.json` — Metadatos y scripts (`start`, `dev`).
- `config/bot.js` — Inicializa `Telegraf` usando `process.env.BOT_TOKEN`.
- `commands/` — Comandos públicos (ej. `start.command.js`).
- `actions/` — Handlers para acciones de teclado y callbacks (ej. `menu.actions.js`, `close.action.js`).
- `features/` — Funcionalidades agrupadas. Actualmente hay `card-generator/` con archivos:
  - `cardGenerator.command.js` — Registro del comando/flujo.
  - `cardGenerator.actions.js` — Acciones asociadas (ej. regenerar).
  - `cardGenerator.parser.js`, `cardGenerator.service.js`, `cardGenerator.session.js` — Lógica de negocio y sesiones.
- `keyboards/` — Definición de teclados (ej. `main.keyboard.js`).
- `messages/` — Mensajes predefinidos y plantillas.
- `services/` — Servicios reutilizables (ej. `bin.service.js`, `user.service.js`).
- `utils/` — Utilidades y manejadores (ej. `errorHandler.js`).

Explora estos archivos para entender cómo se registra cada comando/acción en `index.js`.

## Cómo funciona (flujo básico)

1. `index.js` importa `config/bot` y registra comandos y acciones.
2. Al recibir eventos de Telegram, Telegraf ejecuta los handlers registrados.
3. Las funcionalidades complejas (como `card-generator`) delegan en servicios y parsers dentro de `features/`.

## Desarrollo

- Añade nuevas funcionalidades dentro de `features/` y registra sus handlers en `index.js`.
- Mantén la separación: comandos (entrada de usuario), acciones (callbacks/teclados), servicios (lógica externa) y utils (helpers).
- Cuando modifiques `config/bot.js`, recuerda que `BOT_TOKEN` es obligatorio.

### Ejecución en desarrollo

Usa `npm run dev` para levantar el bot localmente. Si deseas reinicios automáticos, instala `nodemon` globalmente o como dependencia de desarrollo y añade un script `dev:nodemon`.

## Troubleshooting

- Error: `Falta BOT_TOKEN en el archivo .env` → crea `.env` con `BOT_TOKEN` válido.
- Problemas con dependencias → Borra `node_modules` y ejecuta `npm install` de nuevo.

## Contribuciones

Si quieres contribuir:

1. Crea un fork y una rama nueva.
2. Añade tests o verificación manual para la nueva funcionalidad.
3. Abre un pull request con descripción clara.

## Licencia

Actualmente no hay licencia especificada en el repositorio (`package.json` indica `ISC` por defecto). Añade o modifica `LICENSE` según prefieras.

## Contacto

Para dudas o soporte, abre una issue en el repositorio o contacta al mantenedor del proyecto..