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
  timeout: (180 * 1000),
});


// System prompt for the agent
const systemPrompt = `
Sos un asistente para diagnosticar enfermedades de plantas.

Tu tarea es:
- Detectar la especie (nombre común) de la planta y sus síntomas.
- Si ambos están presentes, llamá al tool "diagnosePlantProblem" directamente.
- No des explicaciones ni sugerencias por tu cuenta. Devolvé solo el resultado del tool.
- Si el tool no devuelve resultados, informá que no se encontró una enfermedad coincidente. No inventes una respuesta.

`.trim();




function normalizeText(str) {
  return str
    .toLowerCase()
    .normalize("NFD")           // separa acentos
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos
}


function stemWords(text) {
  return text
    .toLowerCase()
    .split(/[\s,\.]+/)
    .map(w => natural.PorterStemmer.stem(w))
    .filter(w => w.length > 2);
}

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

function getRankedMatches(species, symptoms, allData) {
  if (!species || !symptoms || !allData) return [];

  const speciesLower = species.toLowerCase();

  // Filtrar por especie
  const filtered = allData.filter(disease =>
    (disease.host && disease.host.some(h => h.toLowerCase().includes(speciesLower))) ||
    (disease.description && disease.description.some(descObj => descObj.description.toLowerCase().includes(speciesLower)))
  );
  console.log('[getRankedMatches] filtered count:', filtered.length);

  // Asignar score a cada enfermedad
  const ranked = filtered.map(disease => ({
    ...disease,
    score: scoreSymptomMatch(symptoms, disease.description || [])
  }));
  

  // Ordenar por score descendente
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

async function traducirTexto(texto) {
  try {
    const res = await ollamaLLM.complete({
      prompt: `Traduce al inglés el siguiente texto manteniendo el sentido:\n\n${texto}`,
      temperature: 0.2
    });
    return (res?.text || texto).trim();
  } catch (err) {
    console.error("[traducirTexto] Error:", err.message);
    return texto; // fallback si falla
  }
}

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

  const ranked = getRankedMatches(species, symptoms, allData);
  console.log('[callPlantApi] ranked count:', ranked.length);
  ranked.forEach(element => {
    console.log('[callPlantApi] ranked element:', element.id || 'no id', '| score:', element.score);
  });

  if (!ranked.length) return { notFound: true };
  return { bestMatch: ranked[0] };
}

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
  const normalizedSpecies = normalizeText(species);
  let speciesEnglish =  await traducirEspecie(normalizedSpecies);

  const symptomsEnglish = await traducirTexto(symptoms);

    console.log("[plantDiagnosisTool.func] especie traducida:", speciesEnglish);
    console.log("[plantDiagnosisTool.func] sintomas traducidos:", symptomsEnglish);
  try {
    const { bestMatch, notFound } = await callPlantApi({ species: speciesEnglish, symptoms: normalizeText(symptomsEnglish) });
    
    if (notFound) {
      return "No se encontró ninguna enfermedad que coincida con tu consulta.";
    }

    const descText = (bestMatch.description || [])
      .map(d => `**${d.subtitle || ''}**\n${d.description || ''}`)
      .join("\n\n");

    const solutionText = (bestMatch.solution || [])
      .map(s => `**${s.subtitle || ''}**\n${s.description || ''}`)
      .join("\n\n");

    const rawResponse = `**Más probable:** ${bestMatch.common_name}\n\n${descText}\n\n**Soluciones:**\n${solutionText}`;

    // Traducir al español (si la info está en inglés)
    const translated = await traducirTexto(rawResponse);

    return ( translated || '').trim();

  } catch (error) {
    console.error('[plantDiagnosisTool.func] Error calling API:', error.message);
    return "No se pudo conectar con la API de enfermedades de plantas.";
  }
  }

});


const SPECIES_LEX = { 
  frutilla: "strawberry", 
  tomate: "tomato", 
  lechuga: "lettuce",
  pimiento: "pepper",
  morron: "pepper",
  morrones: "peppers",
  ají: "chili",
  ajies: "chilis",
  berenjena: "eggplant",
  zapallo: "squash",
  calabaza: "squash",
  calabacin: "zucchini",
  pepino: "cucumber",
  albahaca: "basil",
  menta: "mint",
  oregano: "oregano",
  perejil: "parsley",
  cilantro: "cilantro",
  tomillo: "thyme",
  palta: "avocado",
  uvas: "grapes",
  kiwi: "kiwi",
  manzana: "apple",
  pera: "pear",
  naranja: "orange",
  limon: "lemon",
  durazno: "peach",
  ciruela: "plum",
  cereza: "cherry",
  frambuesa: "raspberry",
  mora: "blackberry", 
  zanahoria: "carrot",
  cebolla: "onion",
  ajo: "garlic",
  batata: "sweet potato",
  remolacha: "beetroot",
  brocoli: "broccoli",
  coliflor: "cauliflower",
  repollo: "cabbage",
  berenjena: "eggplant",
  espinaca: "spinach",  

};


export const elAgente = agent({
  tools: [plantDiagnosisTool],
  llm: ollamaLLM,
  verbose: true,
  systemPrompt,
});


function extractParams(utterance) {
  const normalized = normalizeText(utterance);
  let foundKey = null;

  for (const k of Object.keys(SPECIES_LEX)) {
    const normalizedKey = normalizeText(k);
    if (normalized.includes(normalizedKey)) {
      foundKey = k;
      break;
    }
  }

  const species = foundKey ? SPECIES_LEX[foundKey] : null;
  const symptoms = utterance; // dejamos el texto original

  return { species, symptoms };
}


export async function chatWithDiagnosis(utterance) {
  //const { species, symptoms } = extractParams(utterance);

  let response;
  if (species) {
    response = await plantDiagnosisTool.execute({ species, symptoms });
  }else{
    const raw = await elAgente.chat({ message: utterance });
    response = typeof raw === 'string' ? raw : (raw.data?.result || JSON.stringify(raw));
  }
    return response;
  }

