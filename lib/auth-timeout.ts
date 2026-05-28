const DEFAULT_AUTH_TIMEOUT_MS = 15000;

export function withAuthTimeout<T>(
  request: Promise<T>,
  timeoutMessage = 'Authentication took too long. Check your connection and try again.',
  timeoutMs = DEFAULT_AUTH_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([request, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
