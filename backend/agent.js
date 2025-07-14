import { agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


const apiKey = process.env.PERENUAL_API_KEY;

if (!apiKey) {
  throw new Error("PERENUAL_API_KEY is missing from environment variables!");
}

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

// Helper function: check if species matches host(s)
function hostMatches(species, hostArr, descriptions) {
  if (!hostArr || !species) return false;
  return (hostArr.some(h => h.toLowerCase().includes(species.toLowerCase()) ) || descriptions.some(descObj => descObj.description.toLowerCase().includes(species.toLowerCase()) ) 
  ) 
}

// Helper function: check if symptoms appear in any description
function symptomsMatch(symptoms, descriptions) {
  if (!descriptions || !symptoms) return false;
  const symptomsLower = symptoms.toLowerCase();
  return descriptions.some(descObj =>
    descObj.description.toLowerCase().includes(symptomsLower)
  );
}

// Main function to call API and match
async function callPlantApi({ species, symptoms }) {
  console.log('[callPlantApi] species:', species, '| symptoms:', symptoms);
  const url = `https://perenual.com/api/pest-disease-list?key=${apiKey}`;
  const response = await axios.get(url);
  console.log('[callPlantApi] API response:', JSON.stringify(response.data, null, 2));

  if (!response.data || !response.data.data || response.data.data.length === 0) {
    console.error('[callPlantApi] No se encontró información para tu consulta.');
    throw new Error("No se encontró información para tu consulta.");
  }

  // Find best match
  const matches = response.data.data.filter(disease =>
    hostMatches(species, disease.host, disease.description) &&
    symptomsMatch(symptoms, disease.description)
  );
  console.log('[callPlantApi] matches:', matches);

  // If no exact match, fallback: match only species
  const bestMatch = matches[0] ||
    response.data.data.find(disease => hostMatches(species, disease.host));
    //Se fija solo en las especies --> daría otro tipo de rta (hay q contemplar eso --> 
    //tendría q decir no se encuentran los sintomas, pero una lechuga puede tener tal, tal y tal otra enfermedades, podes investigar más sobre ellos) 
    console.log('[callPlantApi] bestMatch:', bestMatch);

  if (!bestMatch) {
    console.error('[callPlantApi] No se encontró enfermedad coincidente.');
    throw new Error("No se encontró enfermedad coincidente.");
  }
  return bestMatch;
}

// 2. The 'tool' to extract info and call the API
const plantDiagnosisTool = {
  name: "diagnosePlantProblem",
  description: "Diagnostica problemas de plantas usando especie y síntomas.",
  parameters: {
    type: "object",
    properties: {
      species: { type: "string", description: "Especie de la planta" },
      symptoms: { type: "string", description: "Síntomas observados" }
    },
    required: ["species", "symptoms"]
  },
  func: async ({ species, symptoms }) => {
    console.log('[plantDiagnosisTool.func] species:', species, '| symptoms:', symptoms);
    // Call API and return result
    const apiResult = await callPlantApi({ species, symptoms });
    console.log('[plantDiagnosisTool.func] apiResult:', apiResult);
    // Format output for LLM response
    let descText = apiResult.description.map(
      d => `**${d.subtitle}**\n${d.description}`
    ).join("\n\n");
    let solutionText = apiResult.solution.map(
      s => `**${s.subtitle}**\n${s.description}`
    ).join("\n\n");

    return `Enfermedad: ${apiResult.common_name}\n\n${descText}\n\nSoluciones:\n${solutionText}`;  }
};

// 3. Configure your agent
export const elAgente = agent({
  tools: [plantDiagnosisTool],
  llm: ollamaLLM,
  verbose: true,
  systemPrompt,
});
