export enum ErrorType {
  OAUTH_ERROR = 'OAUTH_ERROR',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  code?: string | number;
  retryable?: boolean;
}

export class ErrorHandler {
  /**
   * Parse OAuth errors from URL parameters
   */
  static parseOAuthError(searchParams: URLSearchParams): AppError | null {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const errorUri = searchParams.get('error_uri');

    if (!error) return null;

    const errorMap: Record<string, string> = {
      'access_denied': 'Access was denied by the user',
      'invalid_request': 'The request is missing a required parameter',
      'invalid_client': 'Client authentication failed',
      'invalid_grant': 'The provided authorization grant is invalid',
      'unauthorized_client': 'The client is not authorized to request an authorization code',
      'unsupported_response_type': 'The authorization server does not support this response type',
      'invalid_scope': 'The requested scope is invalid or unknown',
      'server_error': 'The authorization server encountered an unexpected condition',
      'temporarily_unavailable': 'The authorization server is currently unable to handle the request'
    };

    return {
      type: ErrorType.OAUTH_ERROR,
      message: errorDescription || errorMap[error] || `OAuth error: ${error}`,
      details: { error, errorDescription, errorUri },
      code: error,
      retryable: error === 'temporarily_unavailable' || error === 'server_error'
    };
  }

  /**
   * Parse API errors from HTTP responses
   */
  static parseApiError(response: Response, responseData?: any): AppError {
    const status = response.status;
    const statusText = response.statusText;

    let message = 'An unexpected error occurred';
    let retryable = false;

    switch (status) {
      case 400:
        message = responseData?.error || 'Invalid request';
        break;
      case 401:
        message = 'Invalid authorization code. Please try connecting again.';
        break;
      case 403:
        message = 'Access forbidden. Please check your permissions.';
        break;
      case 404:
        message = 'The requested resource was not found';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment and try again.';
        retryable = true;
        break;
      case 500:
        message = 'Server error. Please try again later.';
        retryable = true;
        break;
      case 502:
      case 503:
      case 504:
        message = 'Service temporarily unavailable. Please try again later.';
        retryable = true;
        break;
      default:
        message = responseData?.error || `HTTP ${status}: ${statusText}`;
    }

    return {
      type: ErrorType.API_ERROR,
      message,
      details: { status, statusText, responseData },
      code: status,
      retryable
    };
  }

  /**
   * Parse network/fetch errors
   */
  static parseNetworkError(error: Error): AppError {
    let message = 'Network error occurred';
    let retryable = true;

    if (error.name === 'AbortError') {
      message = 'Request was cancelled';
      retryable = false;
    } else if (error.message.includes('timeout')) {
      message = 'Request timed out. Please try again.';
    } else if (error.message.includes('Failed to fetch')) {
      message = 'Unable to connect. Please check your internet connection.';
    }

    return {
      type: ErrorType.NETWORK_ERROR,
      message,
      details: { originalError: error.message, name: error.name },
      retryable
    };
  }

  /**
   * Create a timeout error
   */
  static createTimeoutError(duration: number): AppError {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      message: `Operation timed out after ${duration / 1000} seconds. Please try again.`,
      details: { duration },
      retryable: true
    };
  }

  /**
   * Parse any error into a consistent format
   */
  static parseError(error: unknown): AppError {
    if (error instanceof Error) {
      // Check if it's a fetch/network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return this.parseNetworkError(error);
      }
      
      return {
        type: ErrorType.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred',
        details: { originalError: error },
        retryable: false
      };
    }

    if (typeof error === 'string') {
      return {
        type: ErrorType.UNKNOWN_ERROR,
        message: error,
        retryable: false
      };
    }

    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      details: { originalError: error },
      retryable: false
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    return error.message;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: AppError): boolean {
    return error.retryable === true;
  }

  /**
   * Log error with appropriate level
   */
  static logError(error: AppError, context?: string) {
    const logContext = context ? `[${context}]` : '';
    const logMessage = `${logContext} ${error.type}: ${error.message}`;

    if (error.type === ErrorType.NETWORK_ERROR || error.retryable) {
      console.warn(logMessage, error.details);
    } else {
      console.error(logMessage, error.details);
    }
  }
} 