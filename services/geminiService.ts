import { GoogleGenAI, Type } from "@google/genai";
import { Advice } from "../types";

export const extractAdviceFromVideo = async (
  apiKey: string,
  videoUrl: string,
  extraNotes: string
): Promise<Partial<Advice>[]> => {
  if (!apiKey) throw new Error("API Key is missing");

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
    
    Output JSON format only.
  `;

  const prompt = `
    Analyze this LoL video: ${videoUrl}.
    Additional context: ${extraNotes}.
    
    Extract actionable advice items.
    Return a JSON object with a key 'adviceList' containing an array of items.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Required for tool use
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Use search to "watch" the video content/metadata
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            adviceList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  content: { type: Type.STRING, description: "The specific advice" },
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

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};