import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import axios from "axios";
import dotenv from "dotenv";
import natural from "natural";
dotenv.config();

const apiKey = process.env.PERENUAL_API_KEY;

if (!apiKey) {
  throw new Error("PERENUAL_API_KEY is missing from environment variables!");
}


const ollamaLLM = new Ollama({
  model: "mistral:7b",
  temperature: 0.3,
  timeout: 2 * 60 * 1000,
});


// System prompt for the agent
const systemPrompt = `
Sos un asistente para diagnosticar enfermedades de plantas.
Debes:
- Extraer especie y síntomas del usuario.
- Si ya podés detectar ambos, llamá al tool "diagnosePlantProblem" directamente.
- No pidas confirmaciones innecesarias si los datos ya están presentes.
- Devolvé solo la información del tool.
- La API está en inglés: traduce especie y síntomas antes de usarlos si es necesario.
`.trim();


function stemWords(text) {
  return text
    .toLowerCase()
    .split(/[\s,\.]+/)
    .map(w => natural.PorterStemmer.stem(w))
    .filter(w => w.length > 2);
}

/*
function flexibleSymptomMatch(symptoms, descriptions) {
  const symptomStems = stemWords(symptoms);
  return descriptions.some(descObj => {
    const descStems = stemWords(descObj.description);
    return symptomStems.some(stem => descStems.includes(stem));
  });
}
*/

function scoreSymptomMatch(symptoms, descriptions) {
  const symptomStems = stemWords(symptoms);
  let score = 0;
  descriptions.forEach(descObj => {
    const descStems = stemWords(descObj.description);
    symptomStems.forEach(stem => {
      if (descStems.includes(stem)) score++;
    });
  });
  return score;
}

function rankedMatches(species, symptoms, allData) {
  if (!species || !symptoms || !allData) return [];

  const speciesLower = species.toLowerCase();

  // Filtrar por especie
  const filtered = allData.filter(disease =>
    (disease.host && disease.host.some(h => h.toLowerCase().includes(speciesLower))) ||
    (disease.description && disease.description.some(descObj => descObj.description.toLowerCase().includes(speciesLower)))
  );

  // Asignar score a cada enfermedad
  const ranked = filtered.map(disease => ({
    ...disease,
    score: scoreSymptomMatch(symptoms, disease.description || [])
  }));

  // Ordenar por score descendente
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}


// --- 4. FUNCIÓN PARA LLAMAR A LA API ---
async function callPlantApi({ species, symptoms }) {
  console.log('[callPlantApi] species:', species, '| symptoms:', symptoms);
  const base = `https://perenual.com/api/pest-disease-list?key=${apiKey}`;
  let response;
  try {
    response = await axios.get(base);
  } catch (error) {
    console.error('[callPlantApi] API request failed:', error.message);
    throw new Error('No se pudo conectar con la API de enfermedades de plantas.');
  }

  let allData = response.data.data;
  const pages = response.data.last_page || 1;
  console.log('[callPlantApi] total pages:', pages);
  
  // Traer todas las páginas
  for (let i = 2; i <= pages; i++) {
    try {
      const pageResponse = await axios.get(`${base}&page=${i}`);
      allData.push(...pageResponse.data.data);
    } catch (error) {
      console.error(`[callPlantApi] API request for page ${i} failed:`, error.message);
    }
  }

  if (!allData || allData.length === 0) return { notFound: true };

  const ranked = rankedMatches(species, symptoms, allData);
  console.log('[callPlantApi] ranked count:', ranked.length);

  if (!ranked.length) return { notFound: true };
  return { bestMatch: ranked[0], ranked };
}

// --- 5. TOOL PARA EL AGENTE ---
const plantDiagnosisTool = tool({
  name: "diagnosePlantProblem",
  description: "Diagnostica problemas de plantas usando el nombre genérico y síntomas.",
  parameters: {
    type: "object",
    properties: {
      species: { type: "string", description: "Nombre usado comúnmente de la planta" },
      symptoms: { type: "string", description: "Síntomas observados" }
    },
    required: ["species", "symptoms"]
  },
  execute: async ({ species, symptoms }) => {
    console.log('[plantDiagnosisTool.func] species:', species, '| symptoms:', symptoms);
    try {
      const { bestMatch, ranked, notFound } = await callPlantApi({ species, symptoms });
      if (notFound) {
        return "No se encontró ninguna enfermedad que coincida con tu consulta.";
      }

      // Top 3 enfermedades
      const top3 = ranked.slice(0, 3).map(
        (d, i) => `${i + 1}. ${d.common_name} (coincidencias: ${d.score})`
      ).join("\n");

      const descText = (bestMatch.description || [])
        .map(d => `**${d.subtitle || ''}**\n${d.description || ''}`)
        .join("\n\n");

      const solutionText = (bestMatch.solution || [])
        .map(s => `**${s.subtitle || ''}**\n${s.description || ''}`)
        .join("\n\n");

      return `**Top posibles enfermedades:**\n${top3}\n\n**Más probable:** ${bestMatch.common_name}\n\n${descText}\n\n**Soluciones:**\n${solutionText}`;
    } catch (error) {
      console.error('[plantDiagnosisTool.func] Error calling API:', error.message);
      return "No se pudo conectar con la API de enfermedades de plantas.";
    }
  }
});

// --- 6. AGENTE ---
export const elAgente = agent({
  tools: [plantDiagnosisTool],
  llm: ollamaLLM,
  verbose: true,
  systemPrompt,
});
