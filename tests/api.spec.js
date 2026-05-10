// @ts-check
const { test, expect, request } = require('@playwright/test');

const AUTH_SERVICE = 'http://localhost:4000';
const GATEWAY = 'http://localhost:3001';
const QUERY_SERVICE = 'http://localhost:4002';

let token = null;
let organizationId = null;

test.describe('Galecto API Integration Tests', () => {
  
  test('1. User Registration', async ({ request }) => {
    const email = `test-${Date.now()}@galecto.io`;
    const response = await request.post(`${AUTH_SERVICE}/auth/register`, {
      data: {
        email,
        password: 'TestPassword123!',
        organizationName: 'TestOrg'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.user).toBeDefined();
    
    token = body.token;
    organizationId = body.user.organizationId;
    console.log('✓ User registered, org:', organizationId);
  });

  test('2. User Login', async ({ request }) => {
    const email = `test-${Date.now()}@galecto.io`;
    
    // First register
    await request.post(`${AUTH_SERVICE}/auth/register`, {
      data: {
        email,
        password: 'TestPassword123!',
        organizationName: 'TestOrg2'
      }
    });
    
    // Then login
    const response = await request.post(`${AUTH_SERVICE}/auth/login`, {
      data: {
        email,
        password: 'TestPassword123!'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    
    token = body.token;
    console.log('✓ User logged in');
  });

  test('3. JWT Auth - Query Service Traces', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/traces`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ JWT auth on traces endpoint works');
  });

  test('4. JWT Auth - Query Service Logs', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ JWT auth on logs endpoint works');
  });

  test('5. JWT Auth - Query Service Metrics', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/traces/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ JWT auth on metrics endpoint works');
  });

  test('6. Create Project with Environment', async ({ request }) => {
    const response = await request.post(`${AUTH_SERVICE}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Test Project',
        environment: 'DEVELOPMENT',
        region: 'us-east-1'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.environment).toBe('DEVELOPMENT');
    console.log('✓ Project created with environment');
  });

  test('7. List Projects', async ({ request }) => {
    const response = await request.get(`${AUTH_SERVICE}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    console.log('✓ Projects listed');
  });

  test('8. Generate API Key', async ({ request }) => {
    // First get projects
    const projects = await request.get(`${AUTH_SERVICE}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const projectData = await projects.json();
    
    if (projectData.data && projectData.data.length > 0) {
      const projectId = projectData.data[0].id;
      
      const response = await request.post(`${AUTH_SERVICE}/projects/${projectId}/keys`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          name: 'Test API Key',
          expiresInDays: 30,
          scope: { ingest: true, read: true, write: true }
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.success).toBe(true);
      console.log('✓ API key generated');
    }
  });

  test('9. Get Organization Settings', async ({ request }) => {
    const response = await request.get(`${AUTH_SERVICE}/organization/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    console.log('✓ Organization settings retrieved');
  });

  test('10. Update Retention Settings', async ({ request }) => {
    const response = await request.put(`${AUTH_SERVICE}/organization/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        retentionDays: 60
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.retentionDays).toBe(60);
    console.log('✓ Retention settings updated');
  });

  test('11. Create Dashboard', async ({ request }) => {
    const response = await request.post(`${AUTH_SERVICE}/dashboards`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Test Dashboard',
        config: { panels: [] }
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Dashboard created');
  });

  test('12. List Dashboards', async ({ request }) => {
    const response = await request.get(`${AUTH_SERVICE}/dashboards`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Dashboards listed');
  });

  test('13. Create Saved Search', async ({ request }) => {
    const response = await request.post(`${AUTH_SERVICE}/dashboards/searches`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Error Logs Search',
        query: 'error',
        filters: { service: 'api-gateway' }
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Saved search created');
  });

  test('14. List Saved Searches', async ({ request }) => {
    const response = await request.get(`${AUTH_SERVICE}/dashboards/searches`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Saved searches listed');
  });

  test('15. Create Notification Channel', async ({ request }) => {
    const response = await request.post(`${AUTH_SERVICE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'SLACK',
        name: 'Test Slack',
        config: { webhookUrl: 'https://hooks.slack.com/test' }
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Notification channel created');
  });

  test('16. List Notification Channels', async ({ request }) => {
    const response = await request.get(`${AUTH_SERVICE}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Notification channels listed');
  });

  test('17. Service Map Endpoint', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/service-map`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    console.log('✓ Service map endpoint works');
  });

  test('18. SLO Status Endpoint', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/slo-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    console.log('✓ SLO status endpoint works');
  });

  test('19. Anomaly Trends Endpoint', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/anomaly-trends`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Anomaly trends endpoint works');
  });

  test('20. Create Deploy Marker', async ({ request }) => {
    const response = await request.post(`${AUTH_SERVICE}/platform/deploys`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        service: 'api-gateway',
        version: '1.2.3',
        environment: 'production',
        commitSha: 'abc123'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Deploy marker created');
  });

  test('21. List Deploy Markers', async ({ request }) => {
    const response = await request.get(`${AUTH_SERVICE}/platform/deploys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ Deploy markers listed');
  });

  test('22. Create SLO Definition', async ({ request }) => {
    const response = await request.post(`${AUTH_SERVICE}/platform/slos`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'API Availability',
        service: 'api-gateway',
        indicatorType: 'error_rate',
        targetPercent: 99.9,
        windowDays: 7
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ SLO definition created');
  });

  test('23. List SLO Definitions', async ({ request }) => {
    const response = await request.get(`${AUTH_SERVICE}/platform/slos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    console.log('✓ SLO definitions listed');
  });

  test('24. Unauthorized Access Blocked', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/traces`);
    expect(response.status()).toBe(401);
    console.log('✓ Unauthorized access properly blocked');
  });

  test('25. Invalid Token Rejected', async ({ request }) => {
    const response = await request.get(`${QUERY_SERVICE}/api/v1/traces`, {
      headers: { Authorization: 'Bearer invalid-token-123' }
    });
    expect(response.status()).toBe(401);
    console.log('✓ Invalid token properly rejected');
  });
});