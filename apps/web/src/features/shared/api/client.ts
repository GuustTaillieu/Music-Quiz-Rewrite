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
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${import.meta.env.VITE_BACKEND_URL}${endpoint}`;

    const { schema, ...init } = options ?? {};

    // Always include credentials (session cookies) for cross-origin requests
    const response = await fetch(url, {
      credentials: 'include',
      ...init,
    });

    if (!response.ok) {
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const body = await response.json();
        if (body && typeof body === 'object' && body.message) {
          errMsg = body.message;
        }
      } catch { }
      return { data: null, error: new Error(errMsg) };
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
