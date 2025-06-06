declare module 'notp' {
  export namespace totp {
    function gen(secret: Buffer): string;
    function verify(token: string, secret: Buffer, options?: { window?: number }): boolean;
  }
} 