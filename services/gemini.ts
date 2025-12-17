import { GoogleGenAI, Chat } from "@google/genai";
import { CollectionStatus } from "../types";

// Note: In a production environment, this call would likely happen via a backend proxy 
// to secure the API key, or the key would be injected securely.
// Per strict system instructions, we assume process.env.API_KEY is available.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWasteImage = async (base64Image: string): Promise<CollectionStatus | null> => {
  try {
    // Remove data URL prefix if present for the raw base64 data
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image of household waste. Classify it strictly as one of these three: 'SEGREGATED' (if it looks cleanly separated into wet/dry bins), 'MIXED' (if it looks like a mess of mixed garbage), or 'REJECTED' (if it contains hazardous materials, construction debris, or is completely unacceptable). Return ONLY the word."
          }
        ]
      }
    });

    const text = response.text?.trim().toUpperCase();

    if (text?.includes("SEGREGATED")) return CollectionStatus.SEGREGATED;
    if (text?.includes("MIXED")) return CollectionStatus.MIXED;
    if (text?.includes("REJECTED")) return CollectionStatus.REJECTED;
    
    return null;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};

let chatSession: Chat | null = null;

export const resetCopilot = () => {
    chatSession = null;
};

export const sendCopilotMessage = async (text: string, lat?: number, lng?: number) => {
    if (!chatSession) {
        chatSession = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: "You are a savvy copilot for a waste management driver in India. Help with navigation, finding fuel, mechanics, and food. Be concise.",
            }
        });
    }

    const config: any = {
        tools: [{ googleMaps: {} }],
    };

    if (lat && lng) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: lat,
                    longitude: lng
                }
            }
        };
    }

    const result = await chatSession.sendMessage({
        message: text,
        config: config
    });

    return result;
};