// lib/utils/error-handling.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

// Error handler for API routes
export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return {
      success: false,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode || 500,
      ...(error instanceof ValidationError && { errors: error.errors }),
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      message: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  return {
    success: false,
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  };
}

// Safe async function wrapper
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => never
): Promise<{ data: T | null; error: any }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    }
    return { data: null, error };
  }
}