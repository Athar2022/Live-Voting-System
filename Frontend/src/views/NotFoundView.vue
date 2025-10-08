<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="text-center">
      <div class="text-6xl mb-4">🔍</div>
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p class="text-xl text-gray-600 mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div class="space-x-4">
        <RouterLink to="/" class="btn btn-primary">
          Go Home
        </RouterLink>
        <button @click="$router.go(-1)" class="btn btn-outline">
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
}
</script>