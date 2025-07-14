import express from "express";
import cors from "cors";
import { elAgente } from "./agent.js";


const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json()); // Para procesar cuerpos JSON

// Endpoint raíz
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Endpoint para el chat
app.post("/api/chat", async (req, res) => {
  const { mensaje } = req.body;

  if (typeof mensaje !== "string" || !mensaje.trim()) {
    return res.status(400).json({ error: "El mensaje es requerido y debe ser un texto." });
  }

  console.log("Mensaje recibido:", mensaje);

  // Use only the memory as context for the agent
  try {
    const respuesta = await elAgente.run(mensaje);

    let thought = '';
    let finalAnswer = respuesta;
    /*
const match = respuesta.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/i);
    if (match) {
      thought = match[1].trim();
      finalAnswer = match[2].trim();
    }
    */

    // Show verbose/thought in backend console
    if (thought) {
      console.log('AGENT THOUGHT:', thought);
    }
    // Send only the final answer to the frontend
    if (typeof finalAnswer !== 'string') {
      finalAnswer = JSON.stringify(finalAnswer);
    }
    res.json({ respuesta: finalAnswer });
    
  } catch (error) {
    console.error("Error en el agente:", error);
    res.status(500).json({ error: "Error interno del servidor. Intenta nuevamente más tarde." });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});