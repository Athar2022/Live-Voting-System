<template>
  <div id="app">
    <DefaultLayout v-if="authStore.isAuthenticated" />
    <RouterView v-else />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DefaultLayout from '@/components/Layout/DefaultLayout.vue'

export default {
  name: 'App',
  components: {
    DefaultLayout
  },
  setup() {
    const authStore = useAuthStore()

    onMounted(() => {
      authStore.initializeAuth()
    })

    return {
      authStore
    }
  }
}
</script>