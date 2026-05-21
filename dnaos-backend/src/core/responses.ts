export function ok<T>(data: T) {
  return {
    success: true,
    data
  };
}

export function fail(code: string, message: string, details?: unknown) {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
}
