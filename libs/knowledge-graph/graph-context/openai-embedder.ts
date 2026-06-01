export interface OpenAIEmbedderOptions {
  apiKey?: string;
  model: string;
  dimensions: number;
  batchSize: number;
}

interface OpenAIEmbeddingResponse {
  data?: Array<{ index: number; embedding: number[] }>;
  error?: { message?: string };
}

export class OpenAIEmbedder {
  private readonly apiKey: string;

  constructor(private readonly options: OpenAIEmbedderOptions) {
    const apiKey = (options.apiKey ?? process.env.OPENAI_API_KEY)?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required for graph context embeddings. Set it in the environment, repo-root .env.local, or repo-root .env.");
    }
    this.apiKey = apiKey;
  }

  async embed(text: string): Promise<number[]> {
    const [embedding] = await this.embedBatch([text]);
    if (!embedding) throw new Error("OpenAI returned no embedding for query.");
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (let index = 0; index < texts.length; index += this.options.batchSize) {
      embeddings.push(...(await this.embedChunk(texts.slice(index, index + this.options.batchSize))));
    }
    return embeddings;
  }

  private async embedChunk(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: texts,
        model: this.options.model,
        dimensions: this.options.dimensions,
        encoding_format: "float",
      }),
    });

    const payload = (await response.json()) as OpenAIEmbeddingResponse;
    if (!response.ok) {
      throw new Error(`OpenAI embeddings request failed: ${payload.error?.message ?? response.statusText}`);
    }
    if (!Array.isArray(payload.data)) {
      throw new Error("OpenAI embeddings response did not include data.");
    }

    return payload.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((item) => {
        if (item.embedding.length !== this.options.dimensions) {
          throw new Error(`OpenAI returned ${item.embedding.length} dimensions; expected ${this.options.dimensions}.`);
        }
        return item.embedding;
      });
  }
}
