<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider
      bordered
      :width="200"
      :collapsed-width="64"
      collapse-mode="width"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
      style="display: flex; flex-direction: column"
    >
      <div class="logo">
        <n-icon size="28" style="margin-right: 8px">
          <timer-outline />
        </n-icon>
        <span v-if="!collapsed" class="logo-text">TODO Timer</span>
      </div>
      <n-menu
        v-model:value="activeKey"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleMenuSelect"
      />

      <!-- 计时中指示器 -->
      <div v-if="timerStore.activeTask" class="timer-indicator" @click="router.push('/timer')">
        <div class="timer-dot" :class="{ paused: timerStore.isPaused, onbreak: timerStore.isOnBreak }"></div>
        <span v-if="!collapsed" class="timer-indicator-text">
          {{ timerStore.activeTask.name }} {{ formatTime(timerStore.displaySeconds) }}
        </span>
      </div>
    </n-layout-sider>
    <n-layout-content>
      <router-view />
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, computed, h } from "vue";
import { useRouter, useRoute } from "vue-router";
import { NLayout, NLayoutSider, NMenu, NIcon } from "naive-ui";
import { ListOutline, TimeOutline, StatsChartOutline, HourglassOutline, TimerOutline } from "@vicons/ionicons5";
import { useTimerStore } from "@/stores/timerStore";

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);
const timerStore = useTimerStore();

const activeKey = computed(() => route.name as string);

const menuOptions = [
  {
    label: "任务",
    key: "tasks",
    icon: () => h(NIcon, null, { default: () => h(ListOutline) }),
  },
  {
    label: "计时",
    key: "timer",
    icon: () => h(NIcon, null, { default: () => h(TimeOutline) }),
  },
  {
    label: "统计",
    key: "stats",
    icon: () => h(NIcon, null, { default: () => h(StatsChartOutline) }),
  },
  {
    label: "历史",
    key: "history",
    icon: () => h(NIcon, null, { default: () => h(HourglassOutline) }),
  },
];

function handleMenuSelect(key: string) {
  router.push({ name: key });
}

function formatTime(seconds: number): string {
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  font-size: 18px;
  font-weight: 700;
  color: #18a058;
  padding: 0 16px;
  white-space: nowrap;
  overflow: hidden;
}

.logo-text {
  background: linear-gradient(135deg, #18a058, #36cfc9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.timer-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-top: auto;
  cursor: pointer;
  border-top: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.timer-indicator:hover {
  background: #f5f5f5;
}

.timer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #18a058;
  flex-shrink: 0;
  animation: pulse 1.5s infinite;
}

.timer-dot.paused {
  background: #2080f0;
  animation: none;
}

.timer-dot.onbreak {
  background: #f0a020;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.timer-indicator-text {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
