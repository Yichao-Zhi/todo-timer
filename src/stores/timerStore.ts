import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Task } from "./taskStore";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

export const useTimerStore = defineStore("timer", () => {
  const activeTask = ref<Task | null>(null);
  const isPaused = ref(false);
  const isOnBreak = ref(false);
  const elapsedSeconds = ref(0);
  const breakSeconds = ref(0);
  const startTime = ref<Date | null>(null);
  const isCountdownFinished = ref(false);

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let onCountdownFinish: (() => void) | null = null;

  const displaySeconds = computed(() => {
    if (activeTask.value?.timer_mode === "countdown" && !isOnBreak.value) {
      const total = (activeTask.value.duration ?? 25) * 60;
      return Math.max(0, total - elapsedSeconds.value);
    }
    return elapsedSeconds.value;
  });

  function playNotificationSound() {
    try {
      const ctx = new AudioContext();
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playBeep(880, now, 0.2);
      playBeep(880, now + 0.3, 0.2);
      playBeep(1100, now + 0.6, 0.4);
    } catch {
      // 静默失败
    }
  }

  async function sendNotificationToUser(title: string, body: string) {
    try {
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      if (granted) {
        sendNotification({ title, body });
      }
    } catch {
      // 静默失败
    }
  }

  function startTimer(task: Task) {
    console.log("startTimer:", task.name, "mode:", task.timer_mode, "duration:", task.duration);
    activeTask.value = task;
    isPaused.value = false;
    isOnBreak.value = false;
    isCountdownFinished.value = false;
    elapsedSeconds.value = 0;
    breakSeconds.value = 0;
    startTime.value = new Date();
    startInterval();
  }

  function startInterval() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (isPaused.value || isOnBreak.value) return;

      // 倒计时模式：检查是否到达 0
      if (activeTask.value?.timer_mode === "countdown") {
        const total = (activeTask.value.duration ?? 25) * 60;
        if (elapsedSeconds.value >= total) {
          console.log(`倒计时结束: elapsed=${elapsedSeconds.value}, total=${total}`);
          // 倒计时结束
          clearInterval(intervalId!);
          intervalId = null;
          isCountdownFinished.value = true;
          isPaused.value = true;
          playNotificationSound();
          sendNotificationToUser(
            "计时结束",
            `「${activeTask.value.name}」倒计时已完成！`
          );
          onCountdownFinish?.();
          return;
        }
      }

      elapsedSeconds.value++;
    }, 1000);
  }

  function pauseTimer() {
    isPaused.value = true;
  }

  function resumeTimer() {
    if (isCountdownFinished.value) return;
    isPaused.value = false;
  }

  function toggleBreak() {
    if (isCountdownFinished.value) return;
    isOnBreak.value = !isOnBreak.value;
    if (isOnBreak.value) {
      isPaused.value = false;
    }
  }

  function setOnCountdownFinish(callback: () => void) {
    onCountdownFinish = callback;
  }

  function resetTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    activeTask.value = null;
    isPaused.value = false;
    isOnBreak.value = false;
    isCountdownFinished.value = false;
    elapsedSeconds.value = 0;
    breakSeconds.value = 0;
    startTime.value = null;
    onCountdownFinish = null;
  }

  return {
    activeTask,
    isPaused,
    isOnBreak,
    isCountdownFinished,
    elapsedSeconds,
    breakSeconds,
    startTime,
    displaySeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    toggleBreak,
    setOnCountdownFinish,
    resetTimer,
  };
});
