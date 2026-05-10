/**
 * Integration Tests for Critical Flows
 * Run after starting all services: auth-service (4000), api-gateway (3001), query-service (4002), alert-service (5003)
 */

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:4000';
const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:3001';
const QUERY_SERVICE = process.env.QUERY_SERVICE_URL || 'http://localhost:4002';

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function get(url, token) {
  const res = await fetch(url, {
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function runTests() {
  console.log('\n🔄 Running Integration Tests...\n');

  let token = null;
  let organizationId = null;

  // Test 1: User Registration
  await test('User Registration', async () => {
    const result = await post(`${AUTH_SERVICE}/auth/register`, {
      email: `test-${Date.now()}@galecto.io`,
      password: 'TestPassword123!',
      organizationName: 'TestOrg'
    });
    if (!result.token) throw new Error('No token returned');
    token = result.token;
    organizationId = result.user.organizationId;
    console.log(`   Created user with org: ${organizationId}`);
  });

  // Test 2: User Login
  await test('User Login', async () => {
    const result = await post(`${AUTH_SERVICE}/auth/login`, {
      email: `test-${Date.now()}@galecto.io`,
      password: 'TestPassword123!'
    });
    if (!result.token) throw new Error('Login failed');
    token = result.token;
  });

  // Test 3: JWT Auth on Query Service
  await test('JWT Auth on Query Service - Traces', async () => {
    const result = await get(`${QUERY_SERVICE}/api/v1/traces`, token);
    if (!result.success) throw new Error('Query failed');
  });

  // Test 4: JWT Auth on Query Service - Logs
  await test('JWT Auth on Query Service - Logs', async () => {
    const result = await get(`${QUERY_SERVICE}/api/v1/logs`, token);
    if (!result.success) throw new Error('Query failed');
  });

  // Test 5: Project Creation
  await test('Project Creation', async () => {
    const result = await post(`${AUTH_SERVICE}/projects`, 
      { name: 'Test Project', environment: 'DEVELOPMENT' },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    if (!result.success) throw new Error('Project creation failed');
  });

  // Test 6: API Key Generation
  await test('API Key Generation', async () => {
    const projects = await get(`${AUTH_SERVICE}/projects`, token);
    if (!projects.data?.length) throw new Error('No projects found');
    
    const projectId = projects.data[0].id;
    const result = await post(`${AUTH_SERVICE}/projects/${projectId}/keys`,
      { name: 'Test Key' },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    if (!result.success) throw new Error('Key generation failed');
  });

  // Test 7: Get Organization Settings
  await test('Get Organization Settings', async () => {
    const result = await get(`${AUTH_SERVICE}/organization/settings`, token);
    if (!result.success) throw new Error('Failed to get settings');
  });

  // Test 8: Update Organization Settings
  await test('Update Retention Settings', async () => {
    const result = await post(`${AUTH_SERVICE}/organization/settings`,
      { retentionDays: 60 },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    if (!result.success) throw new Error('Failed to update settings');
  });

  // Test 9: Dashboard Creation
  await test('Dashboard Creation', async () => {
    const result = await post(`${AUTH_SERVICE}/dashboards`,
      { name: 'Test Dashboard', config: { panels: [] } },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    if (!result.success) throw new Error('Dashboard creation failed');
  });

  // Test 10: Saved Search Creation
  await test('Saved Search Creation', async () => {
    const result = await post(`${AUTH_SERVICE}/dashboards/searches`,
      { name: 'Test Search', query: 'error', filters: {} },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    if (!result.success) throw new Error('Search creation failed');
  });

  // Test 11: Service Map Endpoint
  await test('Service Map Query', async () => {
    const result = await get(`${QUERY_SERVICE}/api/v1/service-map`, token);
    if (!result.success) throw new Error('Service map failed');
  });

  // Test 12: SLO Status Endpoint
  await test('SLO Status Query', async () => {
    const result = await get(`${QUERY_SERVICE}/api/v1/slo-status`, token);
    if (!result.success) throw new Error('SLO status failed');
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});