import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ErrorHandler, AppError, ErrorType } from '@/lib/error-handling';

// ✨ API Response utilities
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

export class ApiUtils {
  /**
   * Create standardized success response
   */
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message,
    });
  }

  /**
   * Create standardized error response
   */
  static error(
    error: string | AppError | Error,
    status: number = 500,
    details?: unknown
  ): NextResponse<ApiResponse> {
    let message: string;

    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = error.message;
    }

    const response: ApiResponse = {
      success: false,
      error: message,
      details,
    };

    return NextResponse.json(response, { status });
  }

  /**
   * Get authenticated user from request
   */
  static async getAuthenticatedUser() {
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error('Authentication required');
      }

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Parse request body safely
   */
  static async parseRequestBody<T = unknown>(request: NextRequest): Promise<T> {
    try {
      const text = await request.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      return JSON.parse(text) as T;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Invalid request body format');
    }
  }

  /**
   * Handle API route errors consistently
   */
  static handleError(error: unknown, context?: string): NextResponse<ApiResponse> {
    console.error(`❌ API Error${context ? ` [${context}]` : ''}:`, error);
    
    const appError = ErrorHandler.parseError(error);
    ErrorHandler.logError(appError, context);

    // Map error types to HTTP status codes
    const statusMap: Partial<Record<ErrorType, number>> = {
      [ErrorType.OAUTH_ERROR]: 400,
      [ErrorType.API_ERROR]: 500,
      [ErrorType.NETWORK_ERROR]: 502,
      [ErrorType.UNKNOWN_ERROR]: 500,
    };

    const status = statusMap[appError.type] || 500;
    
    return this.error(appError, status);
  }

  /**
   * Validate required fields in request body
   */
  static validateRequiredFields<T extends Record<string, unknown>>(
    data: T,
    requiredFields: Array<keyof T>
  ): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Extract query parameters safely
   */
  static getQueryParams(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    
    return {
      getString: (key: string, defaultValue?: string) => 
        searchParams.get(key) || defaultValue,
      
      getNumber: (key: string, defaultValue?: number) => {
        const value = searchParams.get(key);
        if (!value) return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
      },
      
      getBoolean: (key: string, defaultValue?: boolean) => {
        const value = searchParams.get(key);
        if (!value) return defaultValue;
        return value.toLowerCase() === 'true';
      },

      getAll: () => Object.fromEntries(searchParams.entries()),
    };
  }

  /**
   * Rate limiting helper (basic implementation)
   */
  static async checkRateLimit(
    userId: string,
    operation: string,
    limit: number,
    windowMs: number = 60000 // 1 minute
  ): Promise<boolean> {
    // In a real implementation, you'd use Redis or similar
    // This is a simplified in-memory implementation
    const key = `${userId}:${operation}`;
    
    // For demonstration - in production, use proper rate limiting
    console.log(`Rate limit check: ${key} (${limit}/${windowMs}ms)`);
    return true; // Always allow for now
  }

  /**
   * CORS headers helper
   */
  static addCorsHeaders(response: NextResponse): NextResponse {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  /**
   * Pagination helper
   */
  static parsePagination(request: NextRequest) {
    const params = this.getQueryParams(request);
    
    const page = Math.max(1, params.getNumber('page', 1) || 1);
    const limit = Math.min(100, Math.max(1, params.getNumber('limit', 10) || 10)); // Max 100 items
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Create paginated response
   */
  static paginatedResponse<T>(
    data: T[],
    total: number,
    page: number = 1,
    limit: number = 10
  ): ApiResponse<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data: {
        items: data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  }
}

// ✨ Common middleware functions
export async function withAuth<T>(
  handler: (request: NextRequest, user: { id: string; email?: string }) => Promise<T>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await ApiUtils.getAuthenticatedUser();
      const result = await handler(request, user);
      return result instanceof NextResponse ? result : ApiUtils.success(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Authentication required') {
        return ApiUtils.error('Authentication required', 401);
      }
      return ApiUtils.handleError(error, 'withAuth');
    }
  };
}

export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  context?: string
) {
  return async (): Promise<NextResponse> => {
    try {
      const result = await handler();
      return result instanceof NextResponse ? result : ApiUtils.success(result);
    } catch (error) {
      return ApiUtils.handleError(error, context);
    }
  };
}

// ✨ Strava API specific utilities
export class StravaApiUtils {
  /**
   * Get Strava auth header from request
   */
  static getAuthHeader(request: NextRequest): string {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization token provided');
    }
    return authHeader;
  }

  /**
   * Make authenticated Strava API request
   */
  static async makeStravaRequest(
    url: string,
    authHeader: string,
    options?: RequestInit
  ): Promise<unknown> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': authHeader,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strava API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Build Strava API URL with pagination
   */
  static buildStravaUrl(
    endpoint: string,
    params: {
      page?: string;
      per_page?: string;
      before?: string;
      after?: string;
    }
  ): string {
    const url = new URL(`https://www.strava.com/api/v3/${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    
    return url.toString();
  }
} 