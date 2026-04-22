const VITE_DOMAIN = import.meta.env.VITE_DOMAIN;
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const BASE_URL = `${VITE_DOMAIN}${VITE_API_BASE_URL}`;

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
    headers: {
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Content-Type': 'application/json',
    },
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
