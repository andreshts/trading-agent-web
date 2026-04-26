# Trading Agent Web

Interfaz React + Bootstrap para operar el backend FastAPI del trading agent.

## Ejecutar

```bash
npm install
npm run dev
```

Por defecto llama a `http://localhost:8000`. Para usar otra URL:

```bash
$env:VITE_API_BASE_URL="http://localhost:8000"
npm run dev
```

## Variables de entorno

```env
VITE_API_BASE_URL=http://localhost:8000
```

En Railway, configura `VITE_API_BASE_URL` con el dominio publico del backend antes de
construir/desplegar el frontend, por ejemplo:

```env
VITE_API_BASE_URL=https://trading-agent-api.up.railway.app
```

Para servir el build en Railway, usa:

```bash
npm run build
npm run start
```

Funcionalidades cubiertas:

- `GET /health`
- `GET /system/status`, `GET /system/account`, `GET /system/audit`
- controles de kill switch y trading enable/disable
- `GET /risk/limits`, `POST /risk/validate`
- `POST /agent/signal`, `POST /agent/run`, `POST /agent/autonomous/tick`
- `POST /trades/execute`, `GET /trades/positions`, `POST /trades/positions/{id}/close`
- visualizacion de `current_price` y `unrealized_pnl` para posiciones abiertas
- visualizacion de modo de ejecucion: local, Binance Testnet o Binance Live

## Uso recomendado en Testnet

- Deja `Precio opcional` vacio para que el backend use precio de mercado.
- Usa `Analizar` para revisar la señal si cambias el criterio.
- Usa `Iniciar automatico` para que el backend evalúe, cierre y abra por intervalo.
- La orden asistida queda bloqueada hasta que exista una señal completa.
