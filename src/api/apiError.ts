/**
 * Lives in its own module so the demo transport can throw it without importing the
 * request helper that delegates to the transport.
 */
export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
