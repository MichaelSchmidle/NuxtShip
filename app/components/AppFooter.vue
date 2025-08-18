<!-- App Footer -->
<template>
  <UFooter>
    <template #left>
      <ULink class="font-bold text-lg" :to="`/${locale}/`">
        {{ config.public.PROJECT_DISPLAY_NAME }}
      </ULink>

      <UBadge :label="config.public.VERSION" size="sm" variant="soft" />
    </template>

    <UNavigationMenu :items="items" orientation="vertical" />

    <template #right>
      <div class="text-muted text-sm">
        {{ t('copyright', { year: config.public.BUILD_YEAR, name: config.public.PROJECT_DISPLAY_NAME }) }}
      </div>
    </template>
  </UFooter>
</template>

<script setup lang="ts">
import * as locales from "@nuxt/ui-pro/locale"
import type { NavigationMenuItem } from '#ui/types'

const { locale, t } = useI18n()
const config = useRuntimeConfig()

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
  title: config.public.PROJECT_DISPLAY_NAME,
})

const items = computed<NavigationMenuItem[][]>(() => [
  [
    {
      icon: 'i-ph-users',
      label: t('userManagement'),
      target: '_blank',
      to: config.public.AUTH_DOMAIN
        ? `https://${config.public.AUTH_DOMAIN}`
        : '#',
    },
  ],
])
</script>

<i18n lang="yaml">
en:
  userManagement: User Management
  copyright: © {year} by {name}
</i18n>