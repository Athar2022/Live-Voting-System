<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import Navbar from './Navbar.vue'

export default defineComponent({
  name: 'DefaultLayout',
  components: {
    Navbar
  }
})
</script>