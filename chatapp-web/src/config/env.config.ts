// src/config/env.config.ts

interface EnvConfig {
  apiUrl: string;
  hubUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: EnvConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  hubUrl: import.meta.env.VITE_HUB_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

if (!config.apiUrl) {
  throw new Error('VITE_API_URL is not set');
}

if (!config.hubUrl) {
  throw new Error('VITE_HUB_URL is not set');
}

export default config;