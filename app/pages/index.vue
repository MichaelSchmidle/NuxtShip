<template>
  <div>
    <h1>Welcome to {{ projectName }}</h1>
  </div>
</template>

<script setup>
const projectName = useRuntimeConfig().public.PROJECT_NAME
</script>