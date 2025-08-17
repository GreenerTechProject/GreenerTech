declare global {
  interface Window {
    google?: {
      maps?: {
        Map?: new (element: HTMLElement, options?: any) => any;
        LatLng?: new (lat: number, lng: number) => any;
        LatLngBounds?: new () => any;
        Size?: new (width: number, height: number) => any;
        Point?: new (x: number, y: number) => any;
        geometry?: {
          spherical?: {
            computeDistanceBetween?: (from: any, to: any) => number;
          };
        };
        visualization?: {
          HeatmapLayer?: new (options?: any) => any;
        };
      };
    };
  }
}

export {};
