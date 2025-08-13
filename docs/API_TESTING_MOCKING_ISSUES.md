# API Testing Mocking Issues and Solutions

## Problem Summary

When testing API routes that make external API calls (like Strava's API), we encountered several mocking challenges that prevented tests from running successfully.

### Core Issue

The main problem was that our API routes were making real `fetch` calls to external services, but our test mocks weren't properly simulating the data flow and response objects that these calls expected.

## Specific Problems Encountered

### 1. Response.json is not a function

**Error:**

```
TypeError: Response.json is not a function
```

**Root Cause:**

- Our API route was calling `response.json()` on the result of a `fetch` call
- The mocked `fetch` was returning plain objects instead of proper Response objects
- NextResponse objects in the test environment didnt have a `json()` method

### 2plete Mock Objects

**Problem:**

```javascript
// ❌ This didn't work
;(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => mockData
})
```

**Issues:**

- Plain objects don't have the same interface as real Response objects
- Missing proper status codes and headers
- Inconsistent behavior with real fetch responses

### 3. NextResponse Mocking

**Problem:**

- Tests calling `response.json()` on NextResponse objects
- No global mock for NextResponse in Jest setup
- Tests failing when trying to parse response data

## Solutions Implemented

### 1er Response Object Mocking

**Solution:**

```javascript
// ✅ Create proper Response mock objects
const mockResponse = {
  ok: true,
  status:200  json: jest.fn().mockResolvedValue(mockAthleteData)
}
;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
```

**Key Improvements:**

- Include all necessary Response properties (`ok`, `status`, `statusText`)
- Use `jest.fn()` for methods to enable proper mocking
- Maintain realistic response structure

### 2. Global NextResponse Mock

**Added to `jest.setup.js`:**

```javascript
jest.mock('next/server, () => ({
  NextRequest: global.Request,
  NextResponse: class NextResponse[object Object]  constructor(body, init)[object Object]
      this.body = body
      this.status = (init && init.status) || 200
      this.statusText = (init && init.statusText) || 'OK'
      this.headers = new Headers(init && init.headers)
      this.ok = this.status >= 200 && this.status < 300   }

    json() {
      return Promise.resolve(this.body)
    }

    static json(data, init) [object Object]   return new NextResponse(data, init)
    }
  }
}))
```

**Benefits:**

- Provides consistent NextResponse behavior across all tests
- Enables `response.json()` calls in tests
- Maintains proper status code and header handling

### 3. Comprehensive Test Scenarios

**Implemented test cases for:**

- ✅ Successful API responses
- ✅ Missing authorization headers
- ✅ External API errors (41 etc.)
- ✅ Network connectivity issues
- ✅ Malformed JSON responses

## Testing Pattern for External API Calls

### Step-by-Step Approach

1. **Mock the fetch function globally**

   ```javascript
   global.fetch = jest.fn();
   ```

2. **Create realistic Response objects**

   ```javascript
   const mockResponse =[object Object]    ok: true,
     status: 200
     json: jest.fn().mockResolvedValue(expectedData)
   }
   ```

3. **Test different scenarios**

   ```javascript
   // Success case
   ;(fetch as jest.Mock).mockResolvedValueOnce(successResponse)

   // Error case
   ;(fetch as jest.Mock).mockResolvedValueOnce(errorResponse)

   // Network error
   ;(fetch as jest.Mock).mockRejectedValueOnce(new Error(Network error'))
   ```

4. **Verify external API calls**
   ```javascript
   expect(fetch).toHaveBeenCalledWith(
   https://api.external.com/endpoint,
     { headers: { Authorization: 'Bearer token' } }
   )
   ```

## Lessons Learned

### 1. Mock What Youre Actually Using

- Don't just mock the function, mock the complete interface
- Include all methods and properties that your code actually calls
- Test the contract, not just the happy path

### 2. External Dependencies Need Special Attention

- API routes that call external services require more sophisticated mocking
- Consider the full data flow: Request → External API → Response → NextResponse
- Mock at the right level (fetch, not the business logic)

### 3. Jest Setup Matters

- Global mocks in `jest.setup.js` provide consistency
- NextResponse mocking is essential for API route testing
- Proper Response object structure prevents runtime errors

### 4. Test Error Scenarios

- External APIs can fail in many ways
- Network issues, authentication errors, rate limiting
- Malformed responses from external services
- Always test both success and failure paths

## Best Practices

### For API Route Testing

1ernal dependencies completely\*\*

```javascript
// Mock fetch for external API calls
global.fetch = jest.fn();

// Mock database clients
jest.mock('@/lib/supabase/server');
```

2. **Create realistic test data**

   ```javascript
   const mockAthleteData = [object Object]   id: 12345,
     username: 'test_athlete,
     // ... all expected fields
   }
   ```

3. **Test the complete flow**

   ```javascript
   // Test request → external API → response → NextResponse
   const response = await GET(mockRequest);
   const data = await response.json();
   expect(data).toEqual(expectedData);
   ```

4. **Verify external calls**
   ```javascript
   expect(fetch).toHaveBeenCalledWith(expectedUrl, expectedOptions);
   ```

### For Complex API Testing

1. **Use beforeEach to reset mocks**
   ```javascript
   beforeEach(() =>[object Object]     jest.clearAllMocks()
   })
   ```

2multiple scenarios\*\*

- Success responses
- Error responses
- Network failures
- Authentication issues3\*Mock at the right abstraction level\*\*
- Mock fetch for external APIs
- Mock database clients for data access
- Mock authentication for protected routes

## Example: Strava Athlete API Test

```javascript
describe('Strava Athlete API', () => {
  it('should return athlete data successfully', async () => {
    // Mock successful Strava API response
    const mockAthleteData = { /* ... */ }

    const mockResponse = [object Object]   ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockAthleteData)
    }
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

    const mockRequest = new Request(http://localhost:30api/strava/athlete, {
      headers: { Authorization: Bearer test-token' }
    })

    const response = await GET(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200
    expect(data).toEqual(mockAthleteData)
    expect(fetch).toHaveBeenCalledWith(
     https://www.strava.com/api/v3/athlete,
      { headers: { Authorization: Bearer test-token' } }
    )
  })
})
```

## Conclusion

The key to successful API testing with external dependencies is:

1. **Complete mocking** - Mock the entire interface, not just the function
2. **Realistic data** - Use test data that matches real API responses
3. **Error scenarios** - Test how your code handles external failures4. **Proper setup** - Configure Jest to handle Next.js server components

By following these patterns, we can create robust tests for API routes that depend on external services while maintaining fast, reliable test execution.
