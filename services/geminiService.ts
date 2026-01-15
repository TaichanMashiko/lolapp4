import { GoogleGenAI, Type } from "@google/genai";
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
    
    Output JSON format only.
  `;

  const prompt = `
    Analyze this LoL video: ${videoUrl}.
    Additional context: ${extraNotes}.
    
    Extract actionable advice items.
    Return a JSON object with a key 'adviceList' containing an array of items.
    Ensure the 'content' field is written in Japanese.
  `;

  try {
    // Use 'gemini-2.0-flash' which is generally available and performant.
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        // Google Search Grounding allows the model to "see" the video metadata/content via search.
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            adviceList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING, description: "The specific advice in Japanese" },
                  role_tags: { type: Type.STRING, description: "Comma separated roles, e.g. 'Mid, Top'" },
                  champion_tags: { type: Type.STRING, description: "Comma separated champs, e.g. 'Ahri' or 'General'" },
                  category: { type: Type.STRING, enum: ['Laning', 'Teamfight', 'Vision', 'Macro', 'Mental'] },
                  importance: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                }
              }
            }
          }
        }
      },
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    return parsed.adviceList || [];

  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    // Re-throw with the raw message so the UI can parse it
    throw new Error(error.message || JSON.stringify(error));
  }
};