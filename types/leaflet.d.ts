declare module 'leaflet' {
  export type LatLngExpression = any;
  export type IconOptions = any;
  export type Icon = any;

  export const icon: (options?: IconOptions) => Icon;

  const L: any;
  export default L;
}
