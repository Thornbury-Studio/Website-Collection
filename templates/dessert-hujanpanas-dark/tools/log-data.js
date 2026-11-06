/* Hujan Panas: the shop's own October count (an invented example for the template).
   t = air temperature at 15:00, rain = it rained between 13:00 and 18:00, warm/cold = bowls sold 12:00-18:00.
   Mondays are closed and left out. Replace with the real till export. */
(function (root) {
  var raw = [
    [1, 31.2, 0, 41, 77], [2, 30.4, 1, 70, 38], [3, 31.8, 0, 38, 92], [4, 32.3, 0, 44, 101], [5, 29.1, 1, 88, 31],
    [7, 31.0, 0, 46, 74], [8, 30.6, 0, 52, 66], [9, 28.4, 1, 79, 27], [10, 29.7, 1, 74, 40], [11, 32.0, 0, 47, 97], [12, 31.5, 0, 58, 88],
    [14, 30.9, 0, 45, 69], [15, 29.4, 1, 69, 35], [16, 31.6, 0, 40, 83], [17, 28.9, 1, 81, 30], [18, 32.6, 0, 49, 112], [19, 30.2, 1, 90, 44],
    [21, 31.1, 0, 43, 71], [22, 32.1, 0, 39, 86], [23, 29.0, 1, 76, 29], [24, 31.4, 0, 51, 84], [25, 30.0, 1, 84, 47], [26, 31.9, 0, 55, 95],
    [28, 30.8, 0, 47, 70], [29, 28.7, 1, 72, 26], [30, 31.3, 0, 46, 79], [31, 29.8, 1, 93, 52]
  ];
  root.HP_LOG = { days: raw.map(function (r) { return { date: r[0], t: r[1], rain: !!r[2], warm: r[3], cold: r[4] }; }) };
})(typeof window !== 'undefined' ? window : globalThis);
