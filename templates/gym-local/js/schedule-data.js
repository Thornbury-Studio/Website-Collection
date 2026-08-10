/* HOYT'S — the week, as it actually runs. day: 0=Mon … 6=Sun. */

window.HOYTS_TYPES = {
  boxing:   'Boxing',
  strength: 'Strength',
  cond:     'Conditioning',
  mobility: 'Yoga & Mobility',
  kids:     'Kids'
};

window.HOYTS_WEEK = [
  /* Monday */
  { day: 0, time: '06:00', name: 'Iron Hour', type: 'strength', coach: 'Frank', mins: 60 },
  { day: 0, time: '09:30', name: 'Boxing Fundamentals', type: 'boxing', coach: 'Dana', mins: 60 },
  { day: 0, time: '12:15', name: 'Lunch Circuit', type: 'cond', coach: 'Dana', mins: 40 },
  { day: 0, time: '17:30', name: 'Strength Club', type: 'strength', coach: 'Frank', mins: 60 },
  { day: 0, time: '18:30', name: 'Sparring Night', type: 'boxing', coach: 'Dana', mins: 75, note: 'wraps required' },
  { day: 0, time: '19:45', name: 'Slow Burn', type: 'mobility', coach: 'Mei', mins: 55 },

  /* Tuesday */
  { day: 1, time: '06:00', name: 'Bagwork Before Work', type: 'boxing', coach: 'Dana', mins: 45 },
  { day: 1, time: '12:15', name: 'Lunch Circuit', type: 'cond', coach: 'Mei', mins: 40 },
  { day: 1, time: '17:30', name: 'Barbell Basics', type: 'strength', coach: 'Frank', mins: 60, note: 'beginner friendly' },
  { day: 1, time: '18:30', name: 'Kids Boxing 8–12', type: 'kids', coach: 'Dana', mins: 45 },
  { day: 1, time: '19:30', name: 'Mobility Hour', type: 'mobility', coach: 'Mei', mins: 55 },

  /* Wednesday */
  { day: 2, time: '06:00', name: 'Iron Hour', type: 'strength', coach: 'Frank', mins: 60 },
  { day: 2, time: '09:30', name: 'Old-Timers Strength', type: 'strength', coach: 'Frank', mins: 50, note: '60+, coffee after' },
  { day: 2, time: '12:15', name: 'Lunch Circuit', type: 'cond', coach: 'Dana', mins: 40 },
  { day: 2, time: '17:30', name: 'Boxing Fundamentals', type: 'boxing', coach: 'Dana', mins: 60 },
  { day: 2, time: '18:45', name: 'Fight Team', type: 'boxing', coach: 'Dana', mins: 90, note: 'invite only' },
  { day: 2, time: '19:45', name: 'Slow Burn', type: 'mobility', coach: 'Mei', mins: 55 },

  /* Thursday */
  { day: 3, time: '06:00', name: 'Bagwork Before Work', type: 'boxing', coach: 'Dana', mins: 45 },
  { day: 3, time: '12:15', name: 'Lunch Circuit', type: 'cond', coach: 'Mei', mins: 40 },
  { day: 3, time: '17:30', name: 'Strength Club', type: 'strength', coach: 'Frank', mins: 60 },
  { day: 3, time: '18:30', name: 'Kids Boxing 8–12', type: 'kids', coach: 'Dana', mins: 45 },
  { day: 3, time: '19:30', name: 'Engine Room', type: 'cond', coach: 'Dana', mins: 45, note: 'bring a towel' },

  /* Friday */
  { day: 4, time: '06:00', name: 'Iron Hour', type: 'strength', coach: 'Frank', mins: 60 },
  { day: 4, time: '12:15', name: 'Lunch Circuit', type: 'cond', coach: 'Dana', mins: 40 },
  { day: 4, time: '17:00', name: 'Open Ring', type: 'boxing', coach: 'Dana', mins: 90, note: 'all levels' },
  { day: 4, time: '18:30', name: 'Deadlift Friday', type: 'strength', coach: 'Frank', mins: 60 },

  /* Saturday */
  { day: 5, time: '08:00', name: 'Long Run Club', type: 'cond', coach: 'Mei', mins: 60, note: 'free, meets at the door' },
  { day: 5, time: '09:30', name: 'Boxing Fundamentals', type: 'boxing', coach: 'Dana', mins: 60 },
  { day: 5, time: '10:45', name: 'Family Hour', type: 'kids', coach: 'Frank', mins: 50, note: 'kids + grown-ups' },
  { day: 5, time: '12:00', name: 'Slow Burn', type: 'mobility', coach: 'Mei', mins: 55 },

  /* Sunday */
  { day: 6, time: '09:00', name: 'Quiet Iron', type: 'strength', coach: 'Frank', mins: 75, note: 'no music, no talking' },
  { day: 6, time: '10:30', name: 'Mobility Hour', type: 'mobility', coach: 'Mei', mins: 55 },
  { day: 6, time: '16:00', name: 'Fight Team', type: 'boxing', coach: 'Dana', mins: 90, note: 'invite only' }
];

window.HOYTS_COACHES = [
  {
    img: 'img/coach-frank.webp', name: 'Frank Hoyt Jr.', role: 'Strength · Owner',
    line: 'His father opened the place in 1987. Frank has coached the barbell side since he could reach it. Runs Quiet Iron on Sundays and means the no-talking rule.'
  },
  {
    img: 'img/coach-marcus.webp', name: 'Dana Okafor', role: 'Boxing · Fight team',
    line: 'Golden Gloves, 2011. Teaches the fundamentals class like footwork is a religion, because it is. Wraps your hands properly whether you ask or not.'
  },
  {
    img: 'img/coach-mei.webp', name: 'Mei Lin', role: 'Conditioning · Mobility',
    line: 'Built the Saturday run club from three people to thirty. Her Slow Burn class is the reason half the fight team can still touch their toes.'
  }
];
