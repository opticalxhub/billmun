type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'cookie', 'refresh_token', 'access_token', 'api_key'];

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
        const shouldRedact = SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey));
        return [key, shouldRedact ? '[REDACTED]' : redactValue(nested)];
      }),
    );
  }

  return value;
}

export function logEvent(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: context ? redactValue(context) : undefined,
  };

  const line = JSON.stringify(payload);

  switch (level) {
    case 'debug':
      console.debug(line);
      break;
    case 'info':
      console.info(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    default:
      console.error(line);
      break;
  }
}

export function reportError(error: unknown, context?: LogContext) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  logEvent('error', 'Unhandled application error', {
    ...context,
    error: normalized,
  });
}
