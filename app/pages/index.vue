<template>
  <UPage>
    <UPageBody>
      <UPageSection :headline="t('welcome')" :title="config.public.PROJECT_DISPLAY_NAME" />
      <UContainer>
        <div class="mx-auto prose dark:prose-invert">
          <p>{{ t('p1') }}</p>
          <i18n-t keypath="p2" tag="p">
            <template #module>
              <code>nuxt-oidc-auth</code>
            </template>
            <template #object>
              <code>user</code>
            </template>
            <template #composable>
              <code>useOidcAuth</code>
            </template>
          </i18n-t>
          <pre>const { user } = useOidcAuth()</pre>
          <i18n-t keypath="p3" tag="p">
            <template #object>
              <code>user</code>
            </template>
          </i18n-t>
          <pre>{{ user }}</pre>
          <i18n-t keypath="p4" tag="p">
            <template #layout>
              <code>app/layouts/default.vue</code>
            </template>
            <template #page>
              <code>app/pages/index.vue</code>
            </template>
            <template #components>
              <code>app/components</code>
            </template>
          </i18n-t>
          <i18n-t keypath="p5" tag="p">
            <template #NuxtShip>
              <a href="https://www.nuxtship.dev">NuxtShip</a>
            </template>
          </i18n-t>
        </div>
      </UContainer>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
const { t } = useI18n()
const config = useRuntimeConfig()
const { user } = useOidcAuth()
</script>

<i18n lang="yaml">
en:
  welcome: Welcome to
  p1: 🥳 You’ve successfully logged in! Check out your simple user avatar at the end of the header with a simple dropdown menu, including a color mode switch and logout.
  p2: "🧑‍💻 To get the {object} object, use the {composable} composable from the {module} module like so:"
  p3: "ℹ️ This will give you the user’s profile information, such as name, email, and more. Below are the contents of your own {object} object:"
  p4: 🔎 Take a look at the {layout} layout, {page} page, and components in {components} to see how this little demo works.
  p5: 🚀 Enjoy your journey with {NuxtShip}!
</i18n>