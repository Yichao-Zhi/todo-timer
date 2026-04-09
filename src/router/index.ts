import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/tasks",
    },
    {
      path: "/tasks",
      name: "tasks",
      component: () => import("@/views/TasksView.vue"),
      meta: { title: "任务", icon: "list" },
    },
    {
      path: "/timer",
      name: "timer",
      component: () => import("@/views/TimerView.vue"),
      meta: { title: "计时", icon: "time" },
    },
    {
      path: "/stats",
      name: "stats",
      component: () => import("@/views/StatsView.vue"),
      meta: { title: "统计", icon: "stats" },
    },
    {
      path: "/history",
      name: "history",
      component: () => import("@/views/HistoryView.vue"),
      meta: { title: "历史", icon: "history" },
    },
  ],
});

export default router;
