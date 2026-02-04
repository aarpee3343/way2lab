declare module 'jsonwebtoken' {
  export type JwtPayload = Record<string, any>;

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string,
    options?: any
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: any
  ): JwtPayload | string;

  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
  };

  export default jwt;
}
