/* Copper Ridge — mock ship rules for showcase checkout. Not legal advice. */

window.CR_SHIP = {
  freeGroundOver: 20000, /* cents */
  rates: {
    1: 1299,
    2: 1699,
    3: 2499,
    4: 4999
  },
  /* States where we refuse ammo / primers / powder in this showcase */
  blockedAmmo: ['AK', 'HI'],
  /* States with extra product-level restrictions (defensive JHPs, green tip, etc.) */
  strictStates: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'IL'],
  noHazmatAir: true,
  copy: {
    ground: 'Ammunition and primers ship ground only (hazmat). Signature required on delivery. Adult ID may be requested.',
    blocked: 'We cannot ship ammunition, primers, or powder to this destination.',
    productBlocked: 'This SKU cannot ship to the selected state under our current compliance list.'
  }
};

window.CR_STATES = [
  'AL','AR','AZ','CA','CO','CT','DC','DE','FL','GA','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'
];
