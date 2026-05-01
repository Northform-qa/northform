/**
 * Northform Forge — k6 Load Test Template
 *
 * Three scenarios — select via K6_SCENARIO env var (default: smoke):
 *   smoke  — 2 VUs for 30s. Confirms the app responds. Safe to run anytime.
 *   load   — Ramps to K6_MAX_VUS over 30s, holds 1 min, ramps down. Validates sustained traffic.
 *   stress — Ramps past K6_MAX_VUS in steps to find the breaking point.
 *
 * WARNING: Never run load or stress against production without explicit
 *          written sign-off from the client.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL  = __ENV.K6_BASE_URL  || 'http://localhost:3000';
const SCENARIO  = __ENV.K6_SCENARIO  || 'smoke';
const MAX_VUS   = parseInt(__ENV.K6_MAX_VUS || '20', 10);

const SCENARIOS = {
  smoke: {
    executor: 'constant-vus',
    vus: 2,
    duration: '30s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: MAX_VUS },
      { duration: '1m',  target: MAX_VUS },
      { duration: '30s', target: 0 },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: Math.floor(MAX_VUS * 0.5) },
      { duration: '30s', target: MAX_VUS },
      { duration: '1m',  target: MAX_VUS },
      { duration: '30s', target: MAX_VUS * 2 },
      { duration: '1m',  target: MAX_VUS * 2 },
      { duration: '30s', target: 0 },
    ],
  },
};

export const options = {
  scenarios: {
    default: SCENARIOS[SCENARIO] || SCENARIOS.smoke,
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95th percentile under 500ms
    http_req_failed:   ['rate<0.01'],  // error rate under 1%
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'status is 200':         r => r.status === 200,
    'response time < 500ms': r => r.timings.duration < 500,
  });

  // Replace or extend with client-specific flows:
  // const itemsRes = http.get(`${BASE_URL}/items`);
  // check(itemsRes, { 'items 200': r => r.status === 200 });

  sleep(1);
}
