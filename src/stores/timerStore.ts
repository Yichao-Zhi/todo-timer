import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Task } from "./taskStore";

export const useTimerStore = defineStore("timer", () => {
  const activeTask = ref<Task | null>(null);
  const isPaused = ref(false);
  const isOnBreak = ref(false);
  const elapsedSeconds = ref(0);
  const breakSeconds = ref(0);
  const startTime = ref<Date | null>(null);

  let intervalId: ReturnType<typeof setInterval> | null = null;

  const displaySeconds = computed(() => {
    if (activeTask.value?.timer_mode === "countdown" && !isOnBreak.value) {
      const total = (activeTask.value.duration ?? 25) * 60;
      return Math.max(0, total - elapsedSeconds.value);
    }
    return elapsedSeconds.value;
  });

  function startTimer(task: Task) {
    activeTask.value = task;
    isPaused.value = false;
    isOnBreak.value = false;
    elapsedSeconds.value = 0;
    breakSeconds.value = 0;
    startTime.value = new Date();
    startInterval();
  }

  function startInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (isPaused.value || isOnBreak.value) return;
      elapsedSeconds.value++;
    }, 1000);
  }

  function pauseTimer() {
    isPaused.value = true;
  }

  function resumeTimer() {
    isPaused.value = false;
  }

  function toggleBreak() {
    isOnBreak.value = !isOnBreak.value;
    if (isOnBreak.value) {
      isPaused.value = false;
    }
  }

  function resetTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    activeTask.value = null;
    isPaused.value = false;
    isOnBreak.value = false;
    elapsedSeconds.value = 0;
    breakSeconds.value = 0;
    startTime.value = null;
  }

  return {
    activeTask,
    isPaused,
    isOnBreak,
    elapsedSeconds,
    breakSeconds,
    startTime,
    displaySeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    toggleBreak,
    resetTimer,
  };
});
