import { reportError } from '@/lib/logger';

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  operationName?: string;
};

const circuitState = new Map<string, { failures: number; openedAt: number | null }>();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string) {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function canProceed(operationName: string) {
  const current = circuitState.get(operationName);
  if (!current?.openedAt) return true;
  return Date.now() - current.openedAt > 30_000;
}

function recordSuccess(operationName: string) {
  circuitState.set(operationName, { failures: 0, openedAt: null });
}

function recordFailure(operationName: string) {
  const current = circuitState.get(operationName) ?? { failures: 0, openedAt: null };
  const failures = current.failures + 1;
  circuitState.set(operationName, {
    failures,
    openedAt: failures >= 3 ? Date.now() : null,
  });
}

export async function executeWithRetry<T>(operation: () => Promise<T>, options?: RetryOptions) {
  const retries = options?.retries ?? 2;
  const baseDelayMs = options?.baseDelayMs ?? 250;
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const operationName = options?.operationName ?? 'operation';

  if (!canProceed(operationName)) {
    throw new Error(`${operationName} is temporarily unavailable`);
  }

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const result = await withTimeout(Promise.resolve().then(operation), timeoutMs, operationName);
      recordSuccess(operationName);
      return result;
    } catch (error) {
      lastError = error;
      recordFailure(operationName);

      if (attempt === retries) {
        reportError(error, { operationName, attempt });
        throw error;
      }

      await delay(baseDelayMs * Math.pow(2, attempt));
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${operationName} failed`);
}
