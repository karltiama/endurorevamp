import { ErrorHandler, ErrorType } from '@/lib/error-handling'

// Mock Response for Node.js environment
global.Response = class MockResponse {
  status: number
  statusText: string
  
  constructor(body: any, init?: { status?: number; statusText?: string }) {
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
  }
} as any

describe('ErrorHandler', () => {
  describe('parseOAuthError', () => {
    it('should return null when no error parameter exists', () => {
      const searchParams = new URLSearchParams()
      const result = ErrorHandler.parseOAuthError(searchParams)
      expect(result).toBeNull()
    })

    it('should parse access_denied error correctly', () => {
      const searchParams = new URLSearchParams()
      searchParams.set('error', 'access_denied')
      
      const result = ErrorHandler.parseOAuthError(searchParams)
      
      expect(result).toEqual({
        type: ErrorType.OAUTH_ERROR,
        message: 'Access was denied by the user',
        details: { 
          error: 'access_denied', 
          errorDescription: null, 
          errorUri: null 
        },
        code: 'access_denied',
        retryable: false
      })
    })

    it('should use error_description when provided', () => {
      const searchParams = new URLSearchParams()
      searchParams.set('error', 'invalid_request')
      searchParams.set('error_description', 'Custom error message')
      
      const result = ErrorHandler.parseOAuthError(searchParams)
      
      expect(result?.message).toBe('Custom error message')
      expect(result?.details.errorDescription).toBe('Custom error message')
    })

    it('should mark server errors as retryable', () => {
      const searchParams = new URLSearchParams()
      searchParams.set('error', 'server_error')
      
      const result = ErrorHandler.parseOAuthError(searchParams)
      
      expect(result?.retryable).toBe(true)
    })

    it('should mark temporarily unavailable as retryable', () => {
      const searchParams = new URLSearchParams()
      searchParams.set('error', 'temporarily_unavailable')
      
      const result = ErrorHandler.parseOAuthError(searchParams)
      
      expect(result?.retryable).toBe(true)
    })
  })

  describe('parseApiError', () => {
    it('should handle 401 unauthorized errors', () => {
      const response = new Response('', { status: 401, statusText: 'Unauthorized' })
      
      const result = ErrorHandler.parseApiError(response)
      
      expect(result).toEqual({
        type: ErrorType.API_ERROR,
        message: 'Invalid authorization code. Please try connecting again.',
        details: { 
          status: 401, 
          statusText: 'Unauthorized', 
          responseData: undefined 
        },
        code: 401,
        retryable: false
      })
    })

    it('should handle 429 rate limit errors as retryable', () => {
      const response = new Response('', { status: 429, statusText: 'Too Many Requests' })
      
      const result = ErrorHandler.parseApiError(response)
      
      expect(result.message).toBe('Too many requests. Please wait a moment and try again.')
      expect(result.retryable).toBe(true)
    })

    it('should handle 500 server errors as retryable', () => {
      const response = new Response('', { status: 500, statusText: 'Internal Server Error' })
      
      const result = ErrorHandler.parseApiError(response)
      
      expect(result.message).toBe('Server error. Please try again later.')
      expect(result.retryable).toBe(true)
    })

    it('should include response data when provided', () => {
      const response = new Response('', { status: 400, statusText: 'Bad Request' })
      const responseData = { error: 'Invalid input' }
      
      const result = ErrorHandler.parseApiError(response, responseData)
      
      expect(result.message).toBe('Invalid input')
      expect(result.details.responseData).toEqual(responseData)
    })
  })

  describe('parseNetworkError', () => {
    it('should handle AbortError as non-retryable', () => {
      const error = new Error('Request aborted')
      error.name = 'AbortError'
      
      const result = ErrorHandler.parseNetworkError(error)
      
      expect(result).toEqual({
        type: ErrorType.NETWORK_ERROR,
        message: 'Request was cancelled',
        details: { 
          originalError: 'Request aborted', 
          name: 'AbortError' 
        },
        retryable: false
      })
    })

    it('should handle timeout errors as retryable', () => {
      const error = new Error('Request timeout')
      
      const result = ErrorHandler.parseNetworkError(error)
      
      expect(result.message).toBe('Request timed out. Please try again.')
      expect(result.retryable).toBe(true)
    })

    it('should handle fetch failures as retryable', () => {
      const error = new Error('Failed to fetch')
      
      const result = ErrorHandler.parseNetworkError(error)
      
      expect(result.message).toBe('Unable to connect. Please check your internet connection.')
      expect(result.retryable).toBe(true)
    })
  })

  describe('createTimeoutError', () => {
    it('should create timeout error with correct message', () => {
      const result = ErrorHandler.createTimeoutError(30000)
      
      expect(result).toEqual({
        type: ErrorType.TIMEOUT_ERROR,
        message: 'Operation timed out after 30 seconds. Please try again.',
        details: { duration: 30000 },
        retryable: true
      })
    })
  })

  describe('parseError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Something went wrong')
      
      const result = ErrorHandler.parseError(error)
      
      expect(result).toEqual({
        type: ErrorType.UNKNOWN_ERROR,
        message: 'Something went wrong',
        details: { originalError: error },
        retryable: false
      })
    })

    it('should handle string errors', () => {
      const result = ErrorHandler.parseError('String error message')
      
      expect(result).toEqual({
        type: ErrorType.UNKNOWN_ERROR,
        message: 'String error message',
        retryable: false
      })
    })

    it('should handle unknown error types', () => {
      const result = ErrorHandler.parseError({ unknown: 'object' })
      
      expect(result).toEqual({
        type: ErrorType.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
        details: { originalError: { unknown: 'object' } },
        retryable: false
      })
    })

    it('should identify fetch errors as network errors', () => {
      const error = new TypeError('Failed to fetch')
      
      const result = ErrorHandler.parseError(error)
      
      expect(result.type).toBe(ErrorType.NETWORK_ERROR)
      expect(result.message).toBe('Unable to connect. Please check your internet connection.')
    })
  })

  describe('utility methods', () => {
    it('should get user message from error', () => {
      const error = {
        type: ErrorType.API_ERROR,
        message: 'Test message',
        retryable: false
      }
      
      expect(ErrorHandler.getUserMessage(error)).toBe('Test message')
    })

    it('should check if error is retryable', () => {
      const retryableError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true
      }
      
      const nonRetryableError = {
        type: ErrorType.OAUTH_ERROR,
        message: 'OAuth error',
        retryable: false
      }
      
      expect(ErrorHandler.isRetryable(retryableError)).toBe(true)
      expect(ErrorHandler.isRetryable(nonRetryableError)).toBe(false)
    })
  })
}) 