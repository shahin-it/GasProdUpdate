
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProductionRecord } from "../types";

export const getAIInsights = async (data: ProductionRecord[], targetDate: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Provide specific data for the target date and a small historical context
  const targetDayData = data.filter(r => r.date === targetDate);
  const dataSummary = targetDayData.map(r => `${r.field}: ${r.amount} MCF`).join('\n');
  
  const prompt = `
    Analyze the gas production data for the specific date: ${targetDate}.
    
    MD's View (Managing Director):
    ${dataSummary}
    
    Context: This is being viewed on a Google TV.
    Task:
    1. Summarize performance for ${targetDate} compared to typical operations.
    2. Identify the top performing field and any concerns (e.g. low output fields).
    3. Provide a strategic takeaway for the MD.
    
    Keep it high-level, executive, and direct (max 3 short paragraphs). Do not just repeat numbers; provide insight.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Insight generation paused for this timestamp.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Intelligence offline for this historical window. Manual review recommended.";
  }
};
