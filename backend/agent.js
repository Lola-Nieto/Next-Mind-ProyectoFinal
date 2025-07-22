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

// System prompt for the agent
const systemPrompt = `
Sos un asistente para ayudar a usuarios a aclarar sus dudas sobre enfermedades de sus plantas.
Extraé especie y síntomas de la consulta del usuario, usá la API para obtener causa y solución, y respondé solo usando esa información, de manera clara y natural.
Si falta información clave, pedile al usuario que la provea antes de continuar, pero no pidas que detallen de forma muy específica (si recibis los datos para llenar los parámetros alcanza). 
La información de la API está en inglés, por lo que deberías traducir los campos de especie y síntomas a inglés antes de usar cualquier herramienta.
`.trim();

const ollamaLLM = new Ollama({
  model: "qwen3:1.7b",
  temperature: 0.75,
  timeout: 2 * 60 * 1000,
});


function stemWords(text) {
  return text
    .toLowerCase()
    .split(/[\s,\.]+/)
    .map(w => natural.PorterStemmer.stem(w))
    .filter(w => w.length > 2);
}

function flexibleSymptomMatch(symptoms, descriptions) {
  const symptomStems = stemWords(symptoms);
  return descriptions.some(descObj => {
    const descStems = stemWords(descObj.description);
    // Check if any symptom stem is in the description stems --> No debería considerar solo 1, sino varias
    return symptomStems.some(stem => descStems.includes(stem));
  });
}

// Helper: combine species and symptoms matching in descriptions
//PROBLEMA: SOlo encuntra si son las mismas palabras usadas en las enviadas por el agente (no considera similares)
function combinedMatch(species, symptoms, hostArr, descriptions) {
  if (!species || !symptoms || !descriptions) return false;
    // 1. Filter by species first
  const speciesLower = species.toLowerCase();
  const filteredBySpecies = allData.filter(disease =>
    (disease.host && disease.host.some(h => h.toLowerCase().includes(speciesLower))) ||
    (disease.description && disease.description.some(descObj => descObj.description.toLowerCase().includes(speciesLower)))
  );

    // 2. Within filtered, match symptoms flexibly
  const matches = filteredBySpecies.filter(disease =>
    flexibleSymptomMatch(symptoms, disease.description)
  );
  console.log('[callPlantApi] matches:', matches.length);

  /*
  // Check if species matches host or description AND symptoms appear in description (in the same disease)
  const speciesInHost = hostArr && hostArr.some(h => h.toLowerCase().includes(speciesLower));
  const speciesInDesc = descriptions.some(descObj => descObj.description.toLowerCase().includes(speciesLower));
  const symptomsInDesc = descriptions.some(descObj =>
    symptomKeywords.some(keyword => descObj.description.toLowerCase().includes(keyword))
  );  
  //PROBLEMA: podria filtrar 1ero por especie y dsp considerar si hay match de sintomas

  */

  console.log('[combinedMatch] species:', species, '| symptomKeywords:', symptomKeywords);
  // Only if both species match (host or desc) AND symptoms appear in description
  return (speciesInHost || speciesInDesc) && symptomsInDesc;
}


// Main function to call API and match
async function callPlantApi({ species, symptoms }) {
  console.log('[callPlantApi] species:', species, '| symptoms:', symptoms);
  const url = `https://perenual.com/api/pest-disease-list?key=${apiKey}`;
  let response;
  try {
    response = await axios.get(url);
  } catch (error) {
    console.error('[callPlantApi] API request failed:', error.message);
    throw new Error('No se pudo conectar con la API de enfermedades de plantas.');
  }
  const pages = response.data.last_page;
  console.log()('[callPlantApi] total pages:', pages);
  let allData = response.data.data;

  //Para traer la info de todas las páginas
  if (pages > 1) {
    for (let i = 2; i <= pages; i++) { //ERROR: No trae toda la data (solo 1 pag)
      try {
        const pageResponse = await axios.get(`${url}&page=${i}`);
        allData.push(...pageResponse.data.data); 
      } catch (error) {
        console.error(`[callPlantApi] API request for page ${i} failed:`, error.message);
      }
    }
  }
  console.log('[callPlantApi] response length:', allData.length);
  if (!allData || allData.length === 0) {
    console.error('[callPlantApi] No se encontró información para tu consulta.');
    return { notFound: true };
  }

  // Find best match using combined condition
  const matches = allData.filter(disease =>
    combinedMatch(species, symptoms, disease.host, disease.description)
  );
  console.log('[callPlantApi] matches:', matches.length);

  // If no exact match, fallback: match only species
  //Devuelve el primero de los encontrados, no todos ni el más acertado
  const bestMatch = matches[0] || filteredBySpecies[0];
  console.log('[callPlantApi] bestMatch:', bestMatch);

  /*
    allData.find(disease => {
      const speciesLower = species?.toLowerCase();
      return (disease.host && disease.host.some(h => h.toLowerCase().includes(speciesLower))) ||
             (disease.description && disease.description.some(descObj => descObj.description.toLowerCase().includes(speciesLower)));
    });
  console.log('[callPlantApi] bestMatch:', bestMatch);
*/
  if (!bestMatch) {
    console.error('[callPlantApi] No se encontró enfermedad coincidente.');
    return { notFound: true };
  }
  return bestMatch;
}

// Main function to call API and match
const plantDiagnosisTool = tool({
  name: "diagnosePlantProblem",
  description: "Diagnostica problemas de plantas usando el nombre genérico y síntomas.",
  parameters: {
    type: "object",
    properties: {
      species: { type: "string", description: "Nombre usado comunmente de la planta" },
      symptoms: { type: "string", description: "Síntomas observados" }
    },
    required: ["species", "symptoms"] 
  },
  execute: async ({ species, symptoms }) => { 
    console.log('[plantDiagnosisTool.func] species:', species, '| symptoms:', symptoms);
    // Call API and return result
    const apiResult = await callPlantApi({ species, symptoms }); 
    console.log('[plantDiagnosisTool.func] apiResult:', apiResult);
    // Format output for LLM response
    if (apiResult.notFound) {
    return "No se encontró ninguna enfermedad que coincida con tu consulta. Por favor revisa la especie y los síntomas.";
    }
    let descText = apiResult.description.map(
      d => `**${d.subtitle}**\n${d.description}`
    ).join("\n\n");
    let solutionText = apiResult.solution.map(
      s => `**${s.subtitle}**\n${s.description}`
    ).join("\n\n");

    return `Enfermedad: ${apiResult.common_name}\n\n${descText}\n\nSoluciones:\n${solutionText}`;
  }
});

// 3. Configure your agent
export const elAgente = agent({
  tools: [plantDiagnosisTool],
  llm: ollamaLLM,
  verbose: true,
  systemPrompt,
});