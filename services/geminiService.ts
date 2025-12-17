
export const generateStoryboardPanels = async (story: string): Promise<string[]> => {
  if (!story.trim()) {
    throw new Error("Story cannot be empty.");
  }

  const response = await fetch('/.netlify/functions/gemini-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ story }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data.imageUrls || !Array.isArray(data.imageUrls) || data.imageUrls.length !== 4) {
      throw new Error("Invalid response format from the server.");
  }

  return data.imageUrls;
};
