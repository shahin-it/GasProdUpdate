
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProductionRecord } from "../types.ts";

export const getAIInsights = async (data: ProductionRecord[], targetDate: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Provide specific data for the target date and a small historical context
  const targetDayData = data.filter(r => r.date === targetDate);
  if (targetDayData.length === 0) return "No operational logs found for this date.";

  const dataSummary = targetDayData.map(r => 
    `${r.field}: Gas ${r.amount} MCF, Condensate ${r.condensate} BBL, Water ${r.water} BBL`
  ).join('\n');
  
  const prompt = `
    Analyze the gas production data for the specific date: ${targetDate}.
    
    MD's View (Managing Director):
    ${dataSummary}
    
    Context: This is being viewed on a Google TV at a Gas Production Company (BGFCL).
    Task:
    1. Summarize Gas, Condensate, and Water production performance for ${targetDate}.
    2. Identify efficiency or maintenance concerns based on water levels or condensate yield.
    3. Provide a strategic takeaway for the MD regarding field health.
    
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
