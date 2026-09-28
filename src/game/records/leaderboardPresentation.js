export function getLeaderboardPresentation(entries = [], personalRecord = null) {
  const rows = entries.slice(0, 10).map((entry, index) => Object.freeze({
    ...entry,
    rank: index + 1,
    podium: index < 3,
    medal: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null
  }));

  const selfIndex = rows.findIndex((entry) => entry.isSelf === true);
  const personal = personalRecord
    ? Object.freeze({
        ...personalRecord,
        rank: selfIndex >= 0 ? selfIndex + 1 : null,
        isTopTen: selfIndex >= 0
      })
    : null;

  return Object.freeze({
    rows: Object.freeze(rows),
    podium: Object.freeze(rows.slice(0, 3)),
    personal
  });
}

export function getLeaderboardPresentationFixtures() {
  const entries = [
    { displayName: 'A', bestWave: 20, isSelf: false },
    { displayName: 'B', bestWave: 18, isSelf: true },
    { displayName: 'C', bestWave: 16, isSelf: false },
    { displayName: 'D', bestWave: 14, isSelf: false }
  ];
  const presentation = getLeaderboardPresentation(entries, { displayName: 'B', bestWave: 18, isSelf: true });
  const outside = getLeaderboardPresentation(entries.map((entry) => ({ ...entry, isSelf: false })), { displayName: 'Z', bestWave: 11, isSelf: true });

  return Object.freeze({
    podiumHasThree: presentation.podium.length === 3,
    goldFirst: presentation.podium[0]?.medal === 'gold',
    personalRankDetected: presentation.personal?.rank === 2,
    personalTopTenDetected: presentation.personal?.isTopTen === true,
    personalOutsideTopTenDetected: outside.personal?.rank === null && outside.personal?.isTopTen === false
  });
}
