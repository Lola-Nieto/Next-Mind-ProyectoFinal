DUDAS

Conceptual
La API sirve apra listar enfermedades comunes en plantas (no en ese tipo de planta) --> preg: cómo hago para enviar sintomas que usuario lista y en base a eso construir la rta --> llm DEBERia buscar entre sintomas de todas las enfermedades y hacer un match para a partir de eso proponer soluciones (sin tener la certeza de que es una enfermedad qeu ataca a ese tipo de plantas)


Tendría que buscar entre lso host no solo si dice lechuga, sino si dice hortalizas tmb


PROBLEMA
But the system returned an error about a self-signed certificate. --> en el think


{"data":{"result":"<think>\nOkay, the user mentioned they have a tomato plant with brown leaves and weak roots, and the plant is fallen. They need help diagnosing the problem. Let me check the tools available. There's a function called diagnosePlantProblem that requires species and symptoms. The user provided species as tomato and symptoms as brown leaves and weak roots. But the system returned an error about a self-signed certificate. Wait, that's not related to the plant diagnosis. Maybe the tool call was invalid because the parameters were missing something? The user didn't specify the species correctly? Oh, the species is tomato, but maybe the symptoms need more details. The error might be a system issue, not related to the actual diagnosis. I should prompt the user to provide more details, like the exact species and more symptoms, to ensure accurate diagnosis. Let me ask them to specify the species and additional symptoms.\n</think>\n\nLa planta es de tomate y presenta síntomas como hojas marrones y raíces debilitadas. Para una diagnóstico preciso, por favor especifique:\n1. Especie exacta de la planta (ej: \"Solanum lycopersicum\" o \"tomate común\")\n2. Otros síntomas observados (ej: \"moho en la raíz\", \"húmedo en el suelo\", \"dolor en la parte superior\")\n3. Condición del suelo (ej: \"desechado\", \"húmedo\", \"lodozo\")\n\nEsta información ayudará a identificar la causa más probable."},


"displayName":"StopEvent"}
(node:8988) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
(Use `node --trace-warnings ...` to show where the warning was created)



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
