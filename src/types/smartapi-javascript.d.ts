declare module 'smartapi-javascript' {
  export class SmartAPI {
    constructor(config: any);
    generateSession(clientId: string, password: string, otp: string): Promise<any>;
    getProfile(): Promise<any>;
    logout(): Promise<any>;
    // Add other methods as needed
  }
} 