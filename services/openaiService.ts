import { MOCK_TRANSCRIPTS, MOCK_TABLES } from "../constants";

export const queryTranscripts = async (query: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return "API key is missing. Please configure VITE_OPENAI_API_KEY in .env.local to use the Explore feature.";
  }

  const context = MOCK_TRANSCRIPTS.map(t => {
    const table = MOCK_TABLES.find(tb => tb.id === t.tableId);
    return `[${new Date(t.timestamp).toLocaleTimeString()}] Table: ${table?.name} (${table?.topic}) | Speaker: ${t.speaker} | "${t.text}"`;
  }).join("\n");

  const prompt = [
    "You are an AI analyst for Nutshell, a conference intelligence platform.",
    "Analyze the following transcript segments from a live event.",
    `User Query: "${query}"`,
    "",
    "Transcript Data:",
    context,
    "",
    "Instructions:",
    "1. Answer the query based ONLY on the provided transcript data.",
    "2. If the data supports it, provide a direct answer or summary.",
    "3. Cite specific tables and speakers in your answer (e.g., \"Table A1 mentioned...\").",
    "4. If the answer is not found in the transcripts, strictly state that there is no evidence in the current data.",
    "5. Format your response in Markdown."
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a precise, grounded analyst." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return `OpenAI API error: ${response.status} ${response.statusText}. ${errorText}`;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "No insights found.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "An error occurred while processing your request. Please try again.";
  }
};
