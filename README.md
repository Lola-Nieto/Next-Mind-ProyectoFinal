
PROBLEMAS

- Traduce morrón como Morrison, marrow... a veces lo confunde con el tomate
- No funciona la función que traduce al español la rta
- No traduce algunas especies a inglés

FALTA
- Que rta no salga con formato {"data":{"result":" TEXTO  "},"displayName":"StopEvent"}

# Next-Mind Proyecto Final

Asistente inteligente para diagnóstico de enfermedades de plantas

## Descripción
Este proyecto es una aplicación web fullstack que permite a los usuarios consultar sobre enfermedades de plantas, obteniendo diagnósticos y soluciones automáticas mediante IA y una API externa. El sistema extrae especie y síntomas, consulta la API de Perenual y responde de forma clara y natural.

## Estructura del proyecto
```
Next-Mind-ProyectoFinal/
  backend/         # Servidor Express + lógica de agente
  frontend/        # Aplicación React
  package.json     # Dependencias y scripts globales
  README.md        # Este archivo
```

## Requisitos previos
- Node.js >= 16
- npm

## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuusuario/Next-Mind-ProyectoFinal.git
   cd Next-Mind-ProyectoFinal
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
     ```env
     PERENUAL_API_KEY=tu_api_key_aqui
     ```
   - Puedes guiarte con el archivo `.env.example` si existe.

## Uso
1. Inicia el backend y el frontend simultáneamente:
   ```bash
   npm start
   ```
   - El backend corre en `http://localhost:3001`
   - El frontend corre en `http://localhost:3000`
2. Abre tu navegador en `http://localhost:3000` y comienza a chatear con el asistente.

## Variables de entorno
- `PERENUAL_API_KEY`: Clave de acceso a la API de Perenual para obtener información sobre enfermedades de plantas.

## Scripts útiles
- `npm start`: Inicia backend y frontend juntos.
- `npm run start-backend`: Solo backend.
- `npm run start-frontend`: Solo frontend.

## Tecnologías utilizadas
- **Backend:** Node.js, Express, llamaindex, Ollama, dotenv, axios
- **Frontend:** React, Axios

## Notas
- El backend valida la entrada y maneja errores de forma robusta.
- El frontend tiene scroll automático y manejo de errores de red.
- El sistema está preparado para depuración con logs detallados en el backend.

## Licencia
MIT
