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
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/ui-pro',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'nuxt-oidc-auth',
  ],
  oidc: {
    defaultProvider: 'zitadel',
    providers: {
      zitadel: {
        authenticationScheme: 'none', // PKCE flow
        authorizationUrl: '',
        baseUrl: '',
        clientId: '',
        clientSecret: '', // PKCE flow
        exposeAccessToken: true, // Enable access to tokens on server-side
        logoutUrl: '',
        logoutRedirectUri: '',
        redirectUri: '',
        responseType: 'code',
        scope: ['openid', 'profile', 'email'],
        tokenUrl: '',
        userInfoUrl: '',
      },
    },
    session: {
      automaticRefresh: true,
      maxAge: 3600, // 1 hour session timeout
      cookie: {
        secure: true, // HTTPS with mkcert certificates
        sameSite: 'lax',
      },
    },
  },
  runtimeConfig: {
    public: {
      PROJECT_NAME: process.env.PROJECT_NAME || 'myapp',
      VERSION: process.env.VERSION || 'development',
      APP_DOMAIN: process.env.APP_DOMAIN || 'app.localhost',
      AUTH_DOMAIN: process.env.AUTH_DOMAIN || 'auth.localhost',
      BUILD_YEAR: new Date().getFullYear().toString(),
      PROJECT_PATH: process.cwd(),
    },
  },
  vite: {
    server: {
      allowedHosts: [process.env.APP_DOMAIN || 'app.localhost'],
    },
  },
})
