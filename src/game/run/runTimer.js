export const RUN_TIMER = Object.freeze({
  version: 1,
  tickIntervalMs: 250
});

export function getElapsedRunMs(startedAtMs, nowMs, frozenElapsedMs = null) {
  if (frozenElapsedMs != null) {
    return Math.max(0, Number(frozenElapsedMs) || 0);
  }

  const startedAt = Math.max(0, Number(startedAtMs) || 0);
  const now = Math.max(startedAt, Number(nowMs) || startedAt);
  return Math.max(0, now - startedAt);
}

export function formatSurvivalTime(elapsedMs) {
  const totalSeconds = Math.floor(Math.max(0, Number(elapsedMs) || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getRunTimerFixtures() {
  return Object.freeze({
    tenSecondsExpected: 10000,
    tenSecondsActual: getElapsedRunMs(1000, 11000),
    minuteFormatExpected: '01:05',
    minuteFormatActual: formatSurvivalTime(65000),
    hourFormatExpected: '01:01:01',
    hourFormatActual: formatSurvivalTime(3661000),
    frozenExpected: 43210,
    frozenActual: getElapsedRunMs(1000, 999999, 43210)
  });
}
