import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true, layout: 'empty' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresGuest: true, layout: 'empty' }
  },
  {
    path: '/polls',
    name: 'Polls',
    component: () => import('@/views/PollsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/polls/create',
    name: 'CreatePoll',
    component: () => import('@/views/CreatePollView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/polls/:id',
    name: 'PollDetail',
    component: () => import('@/views/PollDetailView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/polls/:id/results',
    name: 'PollResults',
    component: () => import('@/views/PollResultsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-polls',
    name: 'MyPolls',
    component: () => import('@/views/MyPollsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-votes',
    name: 'MyVotes',
    component: () => import('@/views/MyVotesView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})

export default router