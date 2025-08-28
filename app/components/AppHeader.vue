<!-- App Header -->
<template>
  <UHeader>
    <template #left>
      <ULink class="font-bold text-lg" :to="`/${locale}/`">
        {{ config.public.PROJECT_DISPLAY_NAME }}
      </ULink>

      <UBadge :label="config.public.VERSION" size="sm" variant="soft" />
    </template>

    <template #right>
      <UDropdownMenu :content="{ align: 'end' }" :items="items">
        <UAvatar :alt="user.username" class="cursor-pointer" />

        <template #loggedInAs>
          <UUser :avatar="{
            alt: user.username,
          }" :name="user.username" :description="user.email" />
        </template>
      </UDropdownMenu>
    </template>
  </UHeader>
</template>

<script setup lang="ts">
import * as locales from "@nuxt/ui-pro/locale"
import type { DropdownMenuItem } from '#ui/types'

const { locale, t } = useI18n()
const config = useRuntimeConfig()
const user = await useLogtoUser()
const client = useLogtoClient()

const colorMode = useColorMode()

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
  title: config.public.PROJECT_DISPLAY_NAME,
})

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light'
  },
})

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      class: 'font-normal',
      slot: 'loggedInAs',
      type: 'label',
    },
  ],
  [
    {
      class: 'cursor-pointer',
      icon: isDark.value ? 'i-ph-sun' : 'i-ph-moon',
      label: isDark.value ? t('lightMode') : t('darkMode'),
      onSelect: () => {
        isDark.value = !isDark.value
      },
    },
  ],
  [
    {
      icon: 'i-ph-user',
      label: t('account'),
      target: '_blank',
      to: config.public.ADMIN_DOMAIN
        ? `https://${config.public.ADMIN_DOMAIN}`
        : '#',
      // TODO: Replace with custom user profile page - Logto doesn't provide end-user profile UI
    },
    {
      class: 'cursor-pointer',
      icon: 'i-ph-sign-out',
      label: t('logout'),
      to: '/auth/sign-out',
    },
  ],
])
</script>

<i18n lang="yaml">
en:
  lightMode: Light Mode
  darkMode: Dark Mode
  account: Account
  logout: Logout
</i18n>