const logo = (id: number) => new URL(`./assets/logoipsum-${id}.svg`, import.meta.url).href

export const airlines = {
  Northline: { code: 'NX', name: 'Northline (placeholder)', color: '#23435a', logo: logo(439) },
  Daybreak: { code: 'DX', name: 'Daybreak (placeholder)', color: '#7a3544', logo: logo(438) },
  Waypoint: { code: 'WX', name: 'Waypoint (placeholder)', color: '#365547', logo: logo(437) },
} as const

export type Airline = keyof typeof airlines
export const cabins = {
  Economy: { code: 'Y', note: 'Zone' },
  'Premium Economy': { code: 'W', note: 'Zone' },
  Business: { code: 'J', note: 'Priority' },
  First: { code: 'F', note: 'Priority' },
} as const
export type Cabin = keyof typeof cabins
