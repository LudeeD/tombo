const isDevelopment = import.meta.env.MODE === 'development'

export const config = {
  apiBaseUrl: isDevelopment 
    ? 'http://localhost:3000'
    : 'https://tombotower.eu',
  isDevelopment,
  isProduction: !isDevelopment,
} as const

export default config