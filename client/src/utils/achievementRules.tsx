// client/src/utils/achievementRules.ts
export const computeAchievements = (sessions: any[]) => {
  const domains = new Set(sessions.map(s => s.domain));
  const avg   = sessions.length
    ? sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length
    : 0;
  const last3 = sessions.slice(-3);
  const last7 = sessions.slice(-7);

  return {
    // ------------- Tier 1 -------------
    firstSteps:      sessions.length >= 1,
    gettingStarted:  sessions.reduce((sum, s) => sum + s.totalQuestions, 0) >= 10,
    excellence:      sessions.some(s => s.score >= 8),
    dedicated:       sessions.length >= 5,
    versatile:       domains.size >= 3,
    consistent:      avg >= 7,

    // ------------- Tier 2 -------------
    clutchPerformer: last3.length === 3 && last3.every(s => s.score >= 9),
    perfect10:       sessions.some(s => s.score === s.totalQuestions),
    speedDemon:      sessions.some(s => s.durationMinutes < 5 && s.score >= 8),

    // ------------- Tier 3 (hidden) -------------
    unstoppable:     last7.length === 7 && last7.every(s => s.score >= 9),
    marathon:        sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) >= 120,
    polyglot:        domains.size >= 6,
    perfectStorm:    sessions.some(s => s.score === s.totalQuestions && s.durationMinutes <= 3),
  };
};