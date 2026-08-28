export type FetchResult<T> =
  | { data: T; error: null }
  | { data: null; error: Error };

export interface ApiFetchOptions<TSchema = any> extends RequestInit {
  schema?: TSchema;
}

// Overload 1: Schema is provided
export async function apiFetch<TSchema extends { safeParse: any }>(
  endpoint: string,
  options: ApiFetchOptions<TSchema> & { schema: TSchema },
): Promise<
  FetchResult<
    TSchema extends { _output: infer Output } ? Output : any
  >
>;

// Overload 2: Schema is NOT provided
export async function apiFetch<T = any>(
  endpoint: string,
  options?: Omit<ApiFetchOptions, 'schema'>,
): Promise<FetchResult<T>>;

/**
 * Go-style API fetch helper that handles base URL resolution, status checking,
 * JSON decoding, and optional Zod schema parsing.
 */
export async function apiFetch(
  endpoint: string,
  options?: ApiFetchOptions,
): Promise<FetchResult<any>> {
  try {
    const baseUrl =
      typeof window !== 'undefined'
        ? '/api'
        : (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/api');

    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${baseUrl}${formattedEndpoint}`;

    const { schema, ...init } = options ?? {};

    // Always include credentials (session cookies) for cross-origin requests
    const response = await fetch(url, {
      credentials: 'include',
      ...init,
    });

    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      let errCode: string | undefined;
      try {
        const body = await response.json();
        if (body && typeof body === 'object') {
          if (body.message) errMsg = body.message;
          if (body.code) errCode = body.code;
        }
      } catch { }
      const err = new Error(errMsg) as Error & { code?: string; status?: number };
      err.code = errCode;
      err.status = response.status;
      return { data: null, error: err };
    }

    const json = await response.json();

    if (schema) {
      const validation = schema.safeParse(json);
      if (!validation.success) {
        return {
          data: null,
          error: new Error(`Schema validation failed: ${validation.error.message}`),
        };
      }
      return { data: validation.data, error: null };
    }

    return { data: json, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}
