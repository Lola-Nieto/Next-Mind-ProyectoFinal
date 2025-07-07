import { agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


const apiKey = process.env.PERENUAL_API_KEY;

// System prompt for the agent
const systemPrompt = `
Sos un asistente para ayudar a usuarios a aclarar sus dudas sobre enfermedades de sus plantas.
Extraé especie y síntomas de la consulta del usuario, usá la API para obtener causa y solución, y respondé solo usando esa información, de manera clara y natural.
Si falta información clave, pedile al usuario que la provea antes de continuar.
`.trim();

const ollamaLLM = new Ollama({
  model: "qwen3:1.7b",
  temperature: 0.75,
  timeout: 2 * 60 * 1000,
});

// 1. Function to call your external API - now receives extracted info
async function callPlantApi({ species, symptoms }) {
  const url = `https://perenual.com/api/pest-disease-list?key=${apiKey}&species=${encodeURIComponent(species)}&symptoms=${encodeURIComponent(symptoms)}`;
  const response = await axios.get(url);
  // Adapt parsing based on actual API response:
  if (!response.data || !response.data.data || response.data.data.length === 0) {
    throw new Error("No se encontró información para tu consulta.");
  }
  const result = response.data.data[0]; // Or adapt as needed
  return result;
}

// 2. The 'tool' to extract info and call the API
const plantDiagnosisTool = {
  name: "diagnosePlantProblem",
  description: "Diagnostica problemas de plantas usando especie y síntomas.",
  parameters: {
    species: { type: "string", description: "Especie de la planta" },
    symptoms: { type: "string", description: "Síntomas observados" }
  },
  func: async ({ species, symptoms }) => {
    // Call API and return result
    const apiResult = await callPlantApi({ species, symptoms });
    // Format for LLM
    return `Causa: ${apiResult.cause}\nSolución: ${apiResult.solution}\nRecomendación: ${apiResult.recommendation || ""}`;
  }
};

// 3. Configure your agent
export const elAgente = agent({
  tools: [plantDiagnosisTool],
  llm: ollamaLLM,
  verbose: true,
  systemPrompt,
});
