export type ApiError = { message: string; code?: string; details?: string; hint?: string };

// Keep the existing data/error handling while making the public result SDK-independent.
export async function apiResult<T>(request: PromiseLike<{ data: T; error: ApiError | null }>) {
  const { data, error } = await request;
  return {
    data,
    error: error
      ? { message: error.message, code: error.code, details: error.details, hint: error.hint }
      : null,
  };
}
