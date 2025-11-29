import { GoogleGenAI, Type } from "@google/genai";
import { ComicScript, Language } from "../types";

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

export const generateComicScript = async (
  storyText: string, 
  theme: string = "", 
  chapterCount: number = 3,
  language: Language = 'English'
): Promise<ComicScript> => {
  const ai = getClient();
  
  const themePrompt = theme ? `Theme/Tone guidance: "${theme}".` : "";

  const prompt = `
    You are an expert comic book scriptwriter. 
    Convert the following story text into a structured comic book script.
    
    Constraints:
    1. Break the story down into EXACTLY ${chapterCount} pages/chapters.
    2. If the story has distinct sections, assign a "Chapter Title" to the pages.
    3. ${themePrompt} Ensure the visual elements (clothing, architecture, technology) remain consistent with this theme throughout the script, but ensure the panel compositions and actions are dynamic and varied.
    4. LANGUAGE REQUIREMENT: Write ALL captions, dialogue, and titles in ${language}.
    5. The "description" for the panels (visual prompt) must remain in English for the image generator.

    For each panel, provide:
    1. A visual description for an image generator (detailed, describing characters, setting, action).
    2. A caption or dialogue bubble text. 
    
    IMPORTANT CONSTRAINTS:
    - Keep captions/dialogue VERY CONCISE (maximum 15 words) to fit inside comic bubbles.
    - Focus on visual storytelling.
    
    Story Text:
    "${storyText.slice(0, 8000)}" 
    // Truncating to 8000 chars to avoid token limits.
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
                  chapterTitle: { type: Type.STRING, description: "Title for the chapter/page" },
                  panels: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: { type: Type.STRING, description: "Visual prompt for image generator (Always English)" },
                        caption: { type: Type.STRING, description: `Dialogue or narration text (in ${language})` }
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

export const generatePanelSuggestion = async (
  style: string,
  chapterContext: string,
  prevPanel?: { description: string; caption: string },
  nextPanel?: { description: string; caption: string }
): Promise<{ description: string; caption: string }> => {
  const ai = getClient();

  const contextPrompt = `
    I am editing a comic book script and adding a new panel.
    Art Style: ${style}
    Current Chapter Context: "${chapterContext}".
    
    ${prevPanel ? `Previous Panel: "${prevPanel.description}" (Caption: "${prevPanel.caption}")` : "This is the start of the scene."}
    ${nextPanel ? `Next Panel: "${nextPanel.description}" (Caption: "${nextPanel.caption}")` : "This is the end of the scene."}

    Task: Generate a description and caption for a NEW panel that fits strictly within the Current Chapter Context.
    It must bridge the gap between the Previous and Next panels naturally.
    The new panel should not introduce new plot points outside the current chapter's scope.
    
    The caption must be short (max 15 words).
    The description should be visually detailed for an image generator.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            caption: { type: Type.STRING }
          },
          required: ["description", "caption"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from suggestion");
    return JSON.parse(text) as { description: string; caption: string };
  } catch (error) {
    console.error("Suggestion Error:", error);
    return {
      description: "A new scene unfolds...",
      caption: "..."
    };
  }
};

export const updateVisualPrompt = async (
  currentCaption: string,
  currentDescription: string,
  artStyle: string
): Promise<string> => {
  const ai = getClient();

  const prompt = `
    The user is editing a comic book script. They changed the caption for a panel.
    
    Art Style: ${artStyle}
    Old Visual Description: "${currentDescription}"
    New Caption/Dialogue: "${currentCaption}"

    Task: Update the Visual Description to better match the context of the New Caption.
    - If the caption implies a specific action (e.g., "Take that!" -> punching), update the description to show that action.
    - If the caption implies an emotion, update the character's expression.
    - Keep the core visual elements (characters, setting) consistent with the Old Description unless the caption contradicts them.
    - Keep it purely visual.
    
    Return ONLY the new visual description string.
  `;

  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text?.trim() || currentDescription;
  } catch (error) {
    console.warn("Failed to update visual prompt automatically", error);
    return currentDescription;
  }
};

export const generatePanelImage = async (panelDescription: string, artStyle: string): Promise<string> => {
  const ai = getClient();
  
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
    });

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
    throw error;
  }
};