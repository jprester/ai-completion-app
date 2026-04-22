const VITE_DOMAIN = import.meta.env.VITE_DOMAIN;
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCESS_TOKEN = import.meta.env.VITE_ACCESS_TOKEN;

const BASE_URL = `${VITE_DOMAIN}${VITE_API_BASE_URL}`;

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ACCESS_TOKEN) headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  return headers;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface CompletionResponse {
  response?: string;
  error?: string;
}

export async function fetchCompletion(
  messages: Array<{ role: string; content: string }>,
  model: string = 'mistral-tiny',
  provider: string = 'mistral',
  signal?: AbortSignal
): Promise<CompletionResponse> {
  const response = await fetch(`${BASE_URL}/completion`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model,
      provider,
      content: messages,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchImageRecognition(
  messages: Array<{ role: string; type: string; content: string }>,
  model: string = 'pixtral-12b-2409',
  provider: string = 'mistral',
  signal?: AbortSignal
): Promise<CompletionResponse> {
  const response = await fetch(`${BASE_URL}/image-recognition`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      model,
      provider,
      messages,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchMockResponse(): Promise<CompletionResponse> {
  const response = await fetch('/data/chatResponse.json');
  const mockData = await response.json();
  return { response: mockData.choices[0].message.content };
}

export type OpenRouterModel = {
  id: string;
  name: string;
  context_length: number | null;
  pricing: { prompt: string; completion: string };
  is_free: boolean;
  supports_images: boolean;
};

export type OpenRouterModelsResponse = {
  data: OpenRouterModel[];
  fetched_at: number;
};

export async function fetchOpenRouterModels(
  signal?: AbortSignal
): Promise<OpenRouterModelsResponse> {
  const response = await fetch(`${BASE_URL}/providers/openrouter/models`, {
    headers: authHeaders(),
    signal,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch OpenRouter models (${response.status})`);
  }
  return response.json();
}
