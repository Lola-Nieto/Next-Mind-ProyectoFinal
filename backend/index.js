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

  console.log("Mensaje recibido:", mensaje);

  // Use only the memory as context for the agent
  try {
    const respuesta = await elAgente.run(mensaje);

    let thought = '';
    let finalAnswer = respuesta;
    const match = respuesta.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/i);
    if (match) {
      thought = match[1].trim();
      finalAnswer = match[2].trim();
    }

    // Show verbose/thought in backend console
    if (thought) {
      console.log('AGENT THOUGHT:', thought);
    }
    // Send only the final answer to the frontend
    res.json({ respuesta: finalAnswer });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});