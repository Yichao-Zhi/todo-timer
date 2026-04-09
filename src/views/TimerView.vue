<template>
  <div class="timer-page">
    <!-- 任务选择视图 -->
    <div v-if="!timerStore.activeTask" class="task-select-view">
      <n-h2>选择任务</n-h2>
      <n-p style="color: #999; margin-bottom: 24px">点击任务开始计时</n-p>

      <div v-if="taskStore.tasks.length === 0" class="empty-container">
        <n-empty description="还没有任务，先去创建一个吧" />
        <n-button type="primary" style="margin-top: 16px" @click="$router.push('/tasks')">
          前往创建
        </n-button>
      </div>

      <div v-else class="task-select-grid">
        <n-card
          v-for="task in taskStore.tasks"
          :key="task.id"
          hoverable
          class="task-select-card"
          :style="{ borderLeft: `4px solid ${task.color}` }"
          @click="timerStore.startTimer(task)"
        >
          <div class="task-select-name">{{ task.name }}</div>
          <div class="task-select-meta">
            <n-tag :type="task.timer_mode === 'countup' ? 'info' : 'warning'" size="small">
              {{ task.timer_mode === 'countup' ? '正计时' : `${task.duration}分钟` }}
            </n-tag>
          </div>
        </n-card>
      </div>
    </div>

    <!-- 计时器视图 -->
    <div v-else class="timer-active-view">
      <div class="timer-header">
        <n-button text @click="confirmStop">
          <template #icon>
            <n-icon><arrow-back-outline /></n-icon>
          </template>
          返回
        </n-button>
      </div>

      <div class="timer-content">
        <div class="timer-task-name" :style="{ color: timerStore.activeTask.color }">
          {{ timerStore.activeTask.name }}
        </div>

        <div class="timer-display" :class="{ 'timer-paused': timerStore.isPaused, 'timer-break': timerStore.isOnBreak }">
          {{ formatTime(timerStore.displaySeconds) }}
        </div>

        <div v-if="timerStore.isOnBreak" class="timer-status">
          <n-tag type="warning" size="large">休息中</n-tag>
        </div>
        <div v-else-if="timerStore.isPaused" class="timer-status">
          <n-tag type="info" size="large">已暂停</n-tag>
        </div>
        <div v-else class="timer-status">
          <n-tag type="success" size="large">专注中</n-tag>
        </div>

        <div class="timer-actions">
          <template v-if="!timerStore.isOnBreak">
            <n-button
              v-if="!timerStore.isPaused"
              type="warning"
              size="large"
              round
              @click="timerStore.pauseTimer()"
            >
              <template #icon><n-icon><pause-outline /></n-icon></template>
              暂停
            </n-button>
            <n-button
              v-else
              type="success"
              size="large"
              round
              @click="timerStore.resumeTimer()"
            >
              <template #icon><n-icon><play-outline /></n-icon></template>
              继续
            </n-button>
          </template>

          <n-button
            :type="timerStore.isOnBreak ? 'success' : 'info'"
            size="large"
            round
            @click="timerStore.toggleBreak()"
          >
            <template #icon><n-icon><cafe-outline /></n-icon></template>
            {{ timerStore.isOnBreak ? '结束休息' : '短暂休息' }}
          </n-button>

          <n-button
            type="error"
            size="large"
            round
            @click="confirmStop"
          >
            <template #icon><n-icon><stop-outline /></n-icon></template>
            结束
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import {
  NH2, NP, NButton, NIcon, NCard, NTag, NEmpty, useMessage, useDialog,
} from "naive-ui";
import {
  ArrowBackOutline, PauseOutline, PlayOutline, StopOutline, CafeOutline,
} from "@vicons/ionicons5";
import { useTaskStore } from "@/stores/taskStore";
import { useFocusStore } from "@/stores/focusStore";
import { useTimerStore } from "@/stores/timerStore";

const message = useMessage();
const dialog = useDialog();
const taskStore = useTaskStore();
const focusStore = useFocusStore();
const timerStore = useTimerStore();

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

async function stopTimer() {
  if (!timerStore.activeTask || !timerStore.startTime) return;

  if (timerStore.elapsedSeconds < 10) {
    message.info("专注时间不足 10 秒，已忽略");
    timerStore.resetTimer();
    return;
  }

  const taskName = timerStore.activeTask.name;
  const duration = timerStore.elapsedSeconds;
  const start = timerStore.startTime;

  await focusStore.createRecord({
    task_id: timerStore.activeTask.id,
    start_time: start.toISOString(),
    end_time: new Date().toISOString(),
    duration,
    break_duration: timerStore.breakSeconds,
    is_manual: 0,
  });

  const minutes = Math.floor(duration / 60);
  message.success(`${taskName}：本次专注 ${minutes} 分钟`);
  timerStore.resetTimer();
}

function confirmStop() {
  if (timerStore.elapsedSeconds < 10) {
    dialog.info({
      title: "专注时间过短",
      content: `本次「${timerStore.activeTask?.name}」仅专注 ${formatTime(timerStore.elapsedSeconds)}，不足 10 秒，不计入记录。`,
      positiveText: "确定",
      negativeText: "继续专注",
      onPositiveClick: () => timerStore.resetTimer(),
    });
    return;
  }

  dialog.warning({
    title: "确认结束",
    content: `确定结束本次「${timerStore.activeTask?.name}」的专注吗？已专注 ${formatTime(timerStore.elapsedSeconds)}，记录将被保存。`,
    positiveText: "确定结束",
    negativeText: "取消",
    onPositiveClick: () => stopTimer(),
  });
}

onMounted(() => {
  taskStore.fetchTasks();
});
</script>

<style scoped>
.timer-page {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.task-select-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.task-select-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.task-select-card:hover {
  transform: translateY(-2px);
}

.task-select-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.task-select-meta {
  display: flex;
  align-items: center;
}

/* 计时器活跃视图 */
.timer-active-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.timer-header {
  align-self: flex-start;
  margin-bottom: 40px;
}

.timer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-task-name {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 32px;
}

.timer-display {
  font-size: 96px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: 4px;
  color: #18a058;
  margin-bottom: 16px;
  transition: color 0.3s;
}

.timer-display.timer-paused {
  color: #2080f0;
}

.timer-display.timer-break {
  color: #f0a020;
}

.timer-status {
  margin-bottom: 48px;
}

.timer-actions {
  display: flex;
  gap: 16px;
}
</style>
