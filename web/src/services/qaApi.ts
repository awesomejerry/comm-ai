const API_URL = 'https://n8n.awesomejerry.space/webhook/comm-ai/knowledge-base-qa';

export interface QAData {
  id: string;
  question: string;
  answer: string;
  evidence: string;
}

export async function fetchQAs(): Promise<QAData[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch Q&As');
  }
  return response.json();
}

export async function regenerateQAs(): Promise<void> {
  const response = await fetch(API_URL, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to regenerate Q&As');
  }
}
