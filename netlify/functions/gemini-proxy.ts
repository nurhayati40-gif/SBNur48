
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Handler, HandlerEvent } from "@netlify/functions";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractImageData = (response: GenerateContentResponse): string | null => {
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString: string = part.inlineData.data;
      return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
    }
  }
  return null;
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const story = body.story;

    if (!story || typeof story !== 'string' || !story.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Story parameter is required and must be a non-empty string.' }),
      };
    }

    const model = 'gemini-2.5-flash-image';
  
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
            aspectRatio: "16:9",
          },
        },
      });
    });

    const responses = await Promise.all(panelPromises);

    const imageUrls = responses.map(response => {
      const imageUrl = extractImageData(response);
      if (!imageUrl) {
        throw new Error("Failed to generate one or more storyboard panels. The model did not return an image.");
      }
      return imageUrl;
    });
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrls }),
    };

  } catch (error) {
    console.error('Error generating storyboard:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'An internal server error occurred.' }),
    };
  }
};

export { handler };
