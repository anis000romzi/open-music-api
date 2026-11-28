import '@hapi/hapi';

declare module '@hapi/hapi' {
  interface RequestApplicationState {
    requestId: string;
  }

  interface PluginsStates {
    startTime: number;
  }

  interface AuthCredentials {
    id: string;
  }
}
