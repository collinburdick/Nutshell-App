import { GoogleGenAI } from "@google/genai";
import { MOCK_TRANSCRIPTS, MOCK_TABLES } from "../constants";

// This function simulates a sophisticated RAG (Retrieval-Augmented Generation) pipeline
// by feeding the mock data as context to Gemini.
export const queryTranscripts = async (query: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure process.env.API_KEY to use the Explore feature.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare context from mock data
  const context = MOCK_TRANSCRIPTS.map(t => {
    const table = MOCK_TABLES.find(tb => tb.id === t.tableId);
    return `[${new Date(t.timestamp).toLocaleTimeString()}] Table: ${table?.name} (${table?.topic}) | Speaker: ${t.speaker} | "${t.text}"`;
  }).join("\n");

  const prompt = `
    You are an AI analyst for Nutshell, a conference intelligence platform.
    Analyze the following transcript segments from a live event.
    User Query: "${query}"

    Transcript Data:
    ${context}

    Instructions:
    1. Answer the query based ONLY on the provided transcript data.
    2. If the data supports it, provide a direct answer or summary.
    3. Cite specific tables and speakers in your answer (e.g., "Table A1 mentioned...").
    4. If the answer is not found in the transcripts, strictly state that there is no evidence in the current data.
    5. Format your response in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights found.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while processing your request. Please try again.";
  }
};
