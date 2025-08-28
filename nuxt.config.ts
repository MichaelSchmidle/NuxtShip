// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  css: ['~/assets/css/main.css'],
  devtools: {
    enabled: true,
  },
  fonts: {
    defaults: {
      weights: ['200 700'],
    },
  },
  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
    locales: ['en'],
  },
  modules: [
    '@logto/nuxt',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
  ],
  logto: {
    fetchUserInfo: true,
    pathnames: {
      signIn: '/auth/sign-in',
      signOut: '/auth/sign-out',
      callback: '/auth/callback',
    },
    postCallbackRedirectUri: '/',
    postLogoutRedirectUri: '/auth/sign-in',
    scopes: ['openid', 'profile', 'email'],
  },
  runtimeConfig: {
    public: {
      PROJECT_NAME: process.env.PROJECT_NAME || 'Set PROJECT_NAME in .env',
      PROJECT_DISPLAY_NAME: process.env.PROJECT_DISPLAY_NAME || 'Set PROJECT_DISPLAY_NAME in .env',
      VERSION: process.env.VERSION || 'Set VERSION in .env',
      APP_DOMAIN: process.env.APP_DOMAIN || 'Set APP_DOMAIN in .env',
      AUTH_DOMAIN: process.env.AUTH_DOMAIN || 'Set AUTH_DOMAIN in .env',
      ADMIN_DOMAIN: process.env.ADMIN_DOMAIN || 'Set ADMIN_DOMAIN in .env',
      BUILD_YEAR: new Date().getFullYear().toString(),
      PROJECT_PATH: process.cwd(),
    },
  },
  vite: {
    server: {
      allowedHosts: [process.env.APP_DOMAIN || 'Set APP_DOMAIN in .env'],
    },
  },
})
