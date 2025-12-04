import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ResourceType, ResourceStatus, ParsedReport } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const reportSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name or approximate location of the place mentioned." },
    type: { 
      type: Type.STRING, 
      enum: [ResourceType.SHELTER, ResourceType.WATER, ResourceType.MEDICAL, ResourceType.DANGER],
      description: "The category of the resource."
    },
    status: {
      type: Type.STRING,
      enum: [ResourceStatus.OPERATIONAL, ResourceStatus.CROWDED, ResourceStatus.CRITICAL, ResourceStatus.UNKNOWN],
      description: "The operational status inferred from the text."
    },
    notes: { type: Type.STRING, description: "A brief summary of the situation." }
  },
  required: ["name", "type", "status", "notes"]
};

/**
 * Parses a natural language report into structured data using Gemini 2.5 Flash.
 */
export const parseIncidentReport = async (text: string): Promise<ParsedReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this emergency report: "${text}". Extract the location/name, type of resource, and its status.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: reportSchema,
        systemInstruction: "You are an emergency command AI. Be conservative. If a shelter is full, status is CROWDED. If out of water, CRITICAL. If contaminated, DANGER."
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text) as ParsedReport;
    }
    throw new Error("No text returned from model");
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

/**
 * Uses Google Maps Grounding to find real-world info if requested.
 */
export const searchGlobalMap = async (query: string): Promise<{ text: string, links: { title: string, uri: string }[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    const text = response.text || "No information available.";
    
    // Extract grounding chunks for links
    const links: { title: string, uri: string }[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          links.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { text, links };
  } catch (error) {
    console.error("Gemini Map Search Error:", error);
    return { text: "Connection to command center failed.", links: [] };
  }
};
