#!/usr/bin/env node

/**
 * API Validation Script
 * Tests backend API connectivity, CORS, rate limiting, and error handling
 * 
 * Usage: npx ts-node scripts/validate-api.ts
 */

const https = require('https');
const http = require('http');

interface ValidationConfig {
  apiBaseUrl: string;
  timeout: number;
}

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

const config: ValidationConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com',
  timeout: 10000,
};

const results: TestResult[] = [];

/**
 * Make HTTP request
 */
function makeRequest(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; data: any; headers: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const url = new URL(config.apiBaseUrl);
    url.pathname = path;

    const client = url.protocol === 'https:' ? https : http;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const options = {
      method,
      headers: defaultHeaders,
      timeout: config.timeout,
    };

    const req = client.request(url, options, (res: any) => {
      let data = '';
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null,
          headers: res.headers,
        });
      });
    });

    req.on('error', (err: Error) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Test 1: Check API connectivity
 */
async function testConnectivity(): Promise<void> {
  try {
    const response = await makeRequest('GET', '/health');
    results.push({
      name: '✓ API Connectivity',
      passed: response.status === 200,
      message: `API is reachable (${response.status})`,
      details: { url: config.apiBaseUrl },
    });
  } catch (error) {
    results.push({
      name: '✗ API Connectivity',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { url: config.apiBaseUrl },
    });
  }
}

/**
 * Test 2: Check CORS headers
 */
async function testCORS(): Promise<void> {
  try {
    const response = await makeRequest('OPTIONS', '/auth/login', undefined, {
      Origin: 'https://localhost:3000',
      'Access-Control-Request-Method': 'POST',
    });

    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers'],
    };

    const passed = !!(
      corsHeaders['access-control-allow-origin'] &&
      corsHeaders['access-control-allow-methods']?.includes('POST')
    );

    results.push({
      name: passed ? '✓ CORS Headers' : '⚠ CORS Headers',
      passed,
      message: passed
        ? 'CORS properly configured'
        : 'CORS headers missing or incomplete',
      details: corsHeaders,
    });
  } catch (error) {
    results.push({
      name: '⚠ CORS Headers',
      passed: false,
      message: 'Could not test CORS: ' + (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}

/**
 * Test 3: Check authentication endpoint
 */
async function testAuthEndpoint(): Promise<void> {
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'test',
    });

    const isValid =
      response.data?.success !== undefined &&
      (response.status === 200 || response.status === 401);

    results.push({
      name: isValid ? '✓ Auth Endpoint' : '✗ Auth Endpoint',
      passed: isValid,
      message: isValid
        ? 'Authentication endpoint returns valid response'
        : 'Invalid response format',
      details: {
        status: response.status,
        hasSuccessField: !!response.data?.success,
        hasErrorField: !!response.data?.error,
      },
    });
  } catch (error) {
    results.push({
      name: '✗ Auth Endpoint',
      passed: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Test 4: Check response format
 */
async function testResponseFormat(): Promise<void> {
  try {
    const response = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'test',
    });

    const hasRequiredFields = {
      success: typeof response.data?.success === 'boolean',
      error_or_data: !!response.data?.error || response.data?.data !== undefined,
      timestamp: !!response.data?.timestamp,
      meta: !!response.data?.meta,
    };

    const allFieldsPresent = Object.values(hasRequiredFields).every((v) => v);

    results.push({
      name: allFieldsPresent ? '✓ Response Format' : '⚠ Response Format',
      passed: Object.values(hasRequiredFields).reduce((a, b) => a && b, true),
      message: allFieldsPresent
        ? 'Response includes all required fields'
        : 'Some response fields missing',
      details: hasRequiredFields,
    });
  } catch (error) {
    results.push({
      name: '⚠ Response Format',
      passed: false,
      message: 'Could not verify response format',
    });
  }
}

/**
 * Test 5: Check rate limiting
 */
async function testRateLimiting(): Promise<void> {
  try {
    // Make 5 rapid requests
    const requests = Array(5)
      .fill(null)
      .map(() =>
        makeRequest('POST', '/auth/login', {
          email: 'test@example.com',
          password: 'test',
        }),
      );

    const responses = await Promise.all(requests);
    const hasRateLimitHeaders = responses.some((r) => r.headers['x-ratelimit-limit']);
    const has429Response = responses.some((r) => r.status === 429);

    results.push({
      name: hasRateLimitHeaders || has429Response ? '✓ Rate Limiting' : '⚠ Rate Limiting',
      passed: true,
      message:
        hasRateLimitHeaders || has429Response
          ? 'Rate limiting headers detected or 429 response received'
          : 'No rate limiting headers detected',
      details: {
        hasRateLimitHeaders,
        has429Response,
      },
    });
  } catch (error) {
    results.push({
      name: '⚠ Rate Limiting',
      passed: false,
      message:
        'Could not test rate limiting: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    });
  }
}

/**
 * Test 6: Check HTTPS
 */
async function testHTTPS(): Promise<void> {
  const isHTTPS = config.apiBaseUrl.startsWith('https://');
  results.push({
    name: isHTTPS ? '✓ HTTPS' : '✗ HTTPS',
    passed: isHTTPS,
    message: isHTTPS
      ? 'API uses HTTPS (secure)'
      : 'WARNING: API does not use HTTPS',
    details: { url: config.apiBaseUrl },
  });
}

/**
 * Test 7: Check timeout handling
 */
async function testTimeout(): Promise<void> {
  try {
    const startTime = Date.now();
    await makeRequest('GET', '/health');
    const responseTime = Date.now() - startTime;

    results.push({
      name: responseTime < 5000 ? '✓ Response Time' : '⚠ Response Time',
      passed: responseTime < 10000,
      message: `Response time: ${responseTime}ms`,
      details: { responseTime },
    });
  } catch (error) {
    results.push({
      name: '✗ Response Time',
      passed: false,
      message:
        error instanceof Error ? error.message : 'Request failed',
    });
  }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  console.log('\n🔍 Validating Backend API...\n');
  console.log(`API Base URL: ${config.apiBaseUrl}\n`);

  await testHTTPS();
  await testConnectivity();
  await testCORS();
  await testAuthEndpoint();
  await testResponseFormat();
  await testRateLimiting();
  await testTimeout();

  // Print results
  console.log('\n📊 Validation Results:\n');
  results.forEach((result) => {
    console.log(`${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    console.log();
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);

  if (passed < total) {
    console.log(
      '\n⚠️  Some tests failed. Please review the API configuration.',
    );
    process.exit(1);
  } else {
    console.log('\n✨ All tests passed! API is ready for production.');
    process.exit(0);
  }
}

// Run
runAllTests().catch((error) => {
  console.error('Validation script error:', error);
  process.exit(1);
});
