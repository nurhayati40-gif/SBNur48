
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// This file should contain a valid API key, but we are using a placeholder
// for security reasons. The execution environment will provide the actual key.
if (!process.env.API_KEY) {
  // In a real app, you'd want to handle this more gracefully.
  // For this example, we'll throw an error if the key is missing.
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractImageData = (response: GenerateContentResponse): string | null => {
  // Iterate through parts to find inlineData, which contains the image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString: string = part.inlineData.data;
      // Return a data URL for easy display in an <img> tag
      return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
    }
  }
  return null;
};

export const generateStoryboardPanels = async (story: string): Promise<string[]> => {
  if (!story.trim()) {
    throw new Error("Story cannot be empty.");
  }

  const model = 'gemini-2.5-flash-image';
  
  // Create an array of 4 promises, one for each panel, to run in parallel
  const panelPromises = Array.from({ length: 4 }, (_, i) => {
    const panelNumber = i + 1;
    const prompt = `
      As a Storyboard Artist Bot, visualize the following narrative.
      Artistic Style: Your artistic style must be strictly "Cyberpunk Neon City at Night with Rain".
      Visual Consistency: It is CRITICAL to ensure the main character and environment maintain high visual consistency across all 4 panels.
      
      Full Story: "${story}"
      
      Your Task: Generate ONLY the image for Panel ${panelNumber} of a 4-panel storyboard sequence based on the story.
    `;

    return ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9", // Widescreen for a cinematic feel
        },
      },
    });
  });

  // Wait for all image generation promises to resolve
  const responses = await Promise.all(panelPromises);

  // Process each response to extract the image data
  const imageUrls = responses.map(response => {
    const imageUrl = extractImageData(response);
    if (!imageUrl) {
      console.error("Gemini API response did not contain image data:", response);
      throw new Error("Failed to generate one or more storyboard panels. The model did not return an image.");
    }
    return imageUrl;
  });

  return imageUrls;
};
