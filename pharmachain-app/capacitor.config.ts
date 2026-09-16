import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.evvaipharma.app',
  appName: 'EVVAI Pharma',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
