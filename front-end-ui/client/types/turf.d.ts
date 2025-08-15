declare module '@turf/turf' {
  export function lineString(
    coordinates: Array<[number, number]>,
    properties?: any,
    options?: any
  ): any;
  export function buffer(
    geojson: any,
    radius: number,
    options?: { units?: 'meters' | 'kilometers' | 'miles' | 'feet' }
  ): any;
  export function simplify(
    geojson: any,
    options?: { tolerance?: number; highQuality?: boolean }
  ): any;
}


