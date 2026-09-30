// Global network guard for online run snapshots.
// Coalesces rapid snapshot writes, enforces a minimum interval and retries transient failures.
const SNAPSHOT_PATH = '/api/run/snapshot';
const MIN_INTERVAL_MS = 3000;
const MAX_RETRIES = 4;
const MAX_BACKOFF_MS = 12000;

const originalFetch = window.fetch.bind(window);
let lastStartedAt = 0;
let inFlight = false;
let queued = null;
let timerId = null;

function isSnapshotRequest(input, init = {}) {
  const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();
  if (method !== 'POST') return false;

  let url = '';
  try {
    url = typeof input === 'string' ? input : input?.url || '';
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname === SNAPSHOT_PATH;
  } catch {
    return false;
  }
}

function responseForError(status, error, retryAfterSeconds = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (retryAfterSeconds != null) headers['Retry-After'] = String(retryAfterSeconds);
  return new Response(JSON.stringify({ error }), { status, headers });
}

function resolveWaiters(waiters, response) {
  waiters.forEach(({ resolve }) => {
    try {
      resolve(response.clone());
    } catch {
      resolve(responseForError(503, 'snapshot_response_clone_failed'));
    }
  });
}

function rejectWaiters(waiters, error) {
  waiters.forEach(({ reject }) => reject(error));
}

function scheduleFlush(delayMs = 0) {
  if (timerId != null) return;
  timerId = window.setTimeout(() => {
    timerId = null;
    flushQueue();
  }, Math.max(0, delayMs));
}

async function performWithRetry(input, init, attempt = 0) {
  try {
    const response = await originalFetch(input, init);
    if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
      const retryAfterHeader = Number(response.headers.get('Retry-After'));
      const retryAfterMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader * 1000
        : Math.min(MAX_BACKOFF_MS, 1000 * (2 ** attempt));
      await new Promise((resolve) => window.setTimeout(resolve, retryAfterMs));
      return performWithRetry(input, init, attempt + 1);
    }
    return response;
  } catch (error) {
    if (attempt >= MAX_RETRIES) throw error;
    const backoffMs = Math.min(MAX_BACKOFF_MS, 1000 * (2 ** attempt));
    await new Promise((resolve) => window.setTimeout(resolve, backoffMs));
    return performWithRetry(input, init, attempt + 1);
  }
}

async function flushQueue() {
  if (inFlight || !queued) return;

  const elapsed = Date.now() - lastStartedAt;
  if (elapsed < MIN_INTERVAL_MS) {
    scheduleFlush(MIN_INTERVAL_MS - elapsed);
    return;
  }

  const current = queued;
  queued = null;
  inFlight = true;
  lastStartedAt = Date.now();

  try {
    const response = await performWithRetry(current.input, current.init);
    resolveWaiters(current.waiters, response);
  } catch (error) {
    rejectWaiters(current.waiters, error);
  } finally {
    inFlight = false;
    if (queued) {
      const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastStartedAt));
      scheduleFlush(wait);
    }
  }
}

window.fetch = function guardedFetch(input, init = {}) {
  if (!isSnapshotRequest(input, init)) return originalFetch(input, init);

  // pagehide/keepalive should not create a second competing stream. It is folded
  // into the same coalesced queue and the newest snapshot always wins.
  return new Promise((resolve, reject) => {
    if (queued) {
      queued.input = input;
      queued.init = init;
      queued.waiters.push({ resolve, reject });
    } else {
      queued = { input, init, waiters: [{ resolve, reject }] };
    }

    if (!inFlight) {
      const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastStartedAt));
      scheduleFlush(wait);
    }
  });
};

window.addEventListener('pagehide', () => {
  if (!queued || inFlight) return;
  // Give a queued keepalive snapshot a best-effort immediate send on navigation,
  // without spawning multiple concurrent requests.
  const current = queued;
  queued = null;
  if (timerId != null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
  inFlight = true;
  lastStartedAt = Date.now();
  originalFetch(current.input, { ...current.init, keepalive: true })
    .then((response) => resolveWaiters(current.waiters, response))
    .catch((error) => rejectWaiters(current.waiters, error))
    .finally(() => { inFlight = false; });
});
