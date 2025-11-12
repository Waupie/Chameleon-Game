// Environment configuration
export const config = {
  // WebSocket server URL - will auto-detect based on current host
  getWebSocketUrl(): string {
    const host = window.location.hostname;
    const port = '8080';
    return `ws://${host}:${port}`;
  },
  
  // Development mode check
  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }
};
