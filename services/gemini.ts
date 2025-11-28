import { GoogleGenAI, Type } from "@google/genai";
import { ComicScript } from "../types";

// Initialize the client. 
// Note: We create a new instance per request in the app flow to ensure we have the latest env var if needed, 
// but here we define the helper functions.

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateComicScript = async (storyText: string): Promise<ComicScript> => {
  const ai = getClient();
  
  const prompt = `
    You are an expert comic book scriptwriter. 
    Convert the following story text into a structured comic book script.
    Break the story down into pages (maximum 3 pages for this demo) and panels (2-4 panels per page).
    For each panel, provide:
    1. A visual description for an image generator (detailed, describing characters, setting, action).
    2. A caption or dialogue bubble text.
    
    Story Text:
    "${storyText.slice(0, 5000)}" 
    // Truncating to 5000 chars to avoid token limits for this demo if user uploads a novel.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  panels: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING, description: "Visual prompt for image generator" },
                        caption: { type: Type.STRING, description: "Dialogue or narration text" }
                      },
                      required: ["description", "caption"]
                    }
                  }
                },
                required: ["pageNumber", "panels"]
              }
            }
          },
          required: ["title", "pages"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from script generation");
    
    return JSON.parse(text) as ComicScript;
  } catch (error) {
    console.error("Script Generation Error:", error);
    throw error;
  }
};

export const generatePanelImage = async (panelDescription: string, artStyle: string): Promise<string> => {
  const ai = getClient();
  
  // Construct a strong prompt for the Nano Banana model
  const fullPrompt = `
    Create a comic book panel image.
    Art Style: ${artStyle}.
    Scene Description: ${panelDescription}.
    Ensure the image has a comic book aesthetic. 
    Do not include speech bubbles or text inside the image itself, only the visual art.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: fullPrompt,
      // No specific config needed for standard image gen in nano banana other than model choice
    });

    // Parse response for image data
    // The guide says: response.candidates[0].content.parts check for inlineData
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error("No content parts returned");

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Generation Error:", error);
    // Return a placeholder if generation fails to keep the UI intact (or rethrow to show error)
    // Rethrowing allows the UI to mark the panel as failed
    throw error;
  }
};
