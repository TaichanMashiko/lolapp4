import { GoogleGenAI } from "@google/genai";
import { Advice } from "../types";

export const extractAdviceFromVideo = async (
  apiKey: string,
  videoUrl: string,
  extraNotes: string
): Promise<Partial<Advice>[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Initialize with the provided API key
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an expert League of Legends coach.
    Your task is to analyze the content of a provided YouTube video URL (using Google Search grounding) and extracting specific, actionable mindset or gameplay advice.
    
    Rules:
    1. Focus on specific habits, decision-making rules, or mechanical tips.
    2. Ignore generic fluff.
    3. Determine the Role (Top, Jungle, Mid, ADC, Support, or General).
    4. Determine the Champion if specific (or General).
    5. Categorize into: Laning, Teamfight, Vision, Macro, or Mental.
    6. Rate importance: High, Medium, Low.
    7. **Crucial**: The 'content' of the advice MUST be in **Japanese**.
    
    Output strictly in valid JSON format.
    Structure: { "adviceList": [ { "content": "...", "role_tags": "...", "champion_tags": "...", "category": "...", "importance": "..." } ] }
  `;

  const prompt = `
    Analyze this LoL video: ${videoUrl}.
    Additional context: ${extraNotes}.
    
    Extract actionable advice items.
    Return a JSON object with a key 'adviceList' containing an array of items.
    Ensure the 'content' field is written in Japanese.
  `;

  try {
    // Use 'gemini-2.5-flash' as requested.
    // Note: We cannot use responseMimeType: 'application/json' together with googleSearch tool in this model version currently.
    // We must rely on prompt engineering for JSON output.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], 
      },
    });

    const text = response.text;
    if (!text) return [];

    // Helper to extract JSON if wrapped in markdown code blocks or contains extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    const parsed = JSON.parse(jsonStr);
    return parsed.adviceList || [];

  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    // Re-throw with the raw message so the UI can parse it
    throw new Error(error.message || JSON.stringify(error));
  }
};