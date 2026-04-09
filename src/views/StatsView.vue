<template>
  <div class="stats-page">
    <div class="page-header">
      <n-h2 style="margin: 0">数据统计</n-h2>
      <n-date-picker v-model:value="selectedDate" type="date" @update:value="onDateChange" />
    </div>

    <!-- 概览卡片 -->
    <div class="stats-overview">
      <n-card class="stat-card">
        <n-statistic label="今日专注时长" :value="formatDuration(dailyStats.total)" />
      </n-card>
      <n-card class="stat-card">
        <n-statistic label="今日任务数" :value="dailyStats.byTask.length" />
      </n-card>
      <n-card class="stat-card">
        <n-statistic label="总任务数" :value="taskStore.tasks.length" />
      </n-card>
    </div>

    <!-- 时间维度统计 -->
    <n-card title="专注时长分布" style="margin-bottom: 16px">
      <template #header-extra>
        <n-radio-group v-model:value="dateRange" size="small" @update:value="onRangeChange">
          <n-radio-button value="week">本周</n-radio-button>
          <n-radio-button value="month">本月</n-radio-button>
        </n-radio-group>
      </template>
      <v-chart :option="barChartOption" style="height: 300px" autoresize />
    </n-card>

    <!-- 任务维度统计 -->
    <n-card title="任务时长分布">
      <v-chart :option="pieChartOption" style="height: 300px" autoresize />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { NH2, NCard, NStatistic, NDatePicker, NRadioGroup, NRadioButton } from "naive-ui";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, PieChart } from "echarts/charts";
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from "echarts/components";
import { useTaskStore } from "@/stores/taskStore";
import { useFocusStore } from "@/stores/focusStore";

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const taskStore = useTaskStore();
const focusStore = useFocusStore();

const selectedDate = ref(Date.now());
const dateRange = ref<"week" | "month">("week");
const dailyStats = ref<{ total: number; byTask: { task_id: string; task_name: string; task_color: string; duration: number }[] }>({
  total: 0,
  byTask: [],
});

const weekBarData = ref<{ date: string; duration: number }[]>([]);
const monthBarData = ref<{ date: string; duration: number }[]>([]);

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(date: number | Date): string {
  return new Date(date).toISOString().split("T")[0];
}

function getWeekDates(): string[] {
  const dates: string[] = [];
  const now = new Date(selectedDate.value);
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

function getMonthDates(): string[] {
  const dates: string[] = [];
  const now = new Date(selectedDate.value);
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(formatDate(new Date(year, month, i)));
  }
  return dates;
}

const barChartOption = computed(() => {
  const dates = dateRange.value === "week" ? getWeekDates() : getMonthDates();
  const data = dateRange.value === "week" ? weekBarData.value : monthBarData.value;
  const dataMap = new Map(data.map((d) => [d.date, d.duration]));

  const labels = dateRange.value === "week"
    ? dates.map((d) => d.slice(5))
    : dates.filter((_, i) => (i + 1) % 2 === 0).map((d) => d.slice(5));

  const values = dateRange.value === "week"
    ? dates.map((d) => Math.round((dataMap.get(d) ?? 0) / 60))
    : dates.map((d) => Math.round((dataMap.get(d) ?? 0) / 60));

  return {
    tooltip: { trigger: "axis", formatter: "{b}<br/>{c} 分钟" },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 11 },
    },
    yAxis: {
      type: "value",
      name: "分钟",
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: "bar",
      data: values,
      itemStyle: { color: "#18a058", borderRadius: [4, 4, 0, 0] },
    }],
  };
});

const pieChartOption = computed(() => {
  const data = dailyStats.value.byTask.map((t) => ({
    name: t.task_name,
    value: Math.round(t.duration / 60),
    itemStyle: { color: t.task_color },
  }));

  if (data.length === 0) {
    return {
      title: { text: "暂无数据", left: "center", top: "center", textStyle: { color: "#999" } },
    };
  }

  return {
    tooltip: { trigger: "item", formatter: "{b}: {c}分钟 ({d}%)" },
    legend: { orient: "vertical", left: "left", top: "middle" },
    series: [{
      type: "pie",
      radius: ["40%", "70%"],
      center: ["60%", "50%"],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14 } },
      data,
    }],
  };
});

async function loadDailyStats() {
  const dateStr = formatDate(selectedDate.value);
  dailyStats.value = await focusStore.getDailyStats(dateStr);
}

async function loadBarData() {
  const dates = dateRange.value === "week" ? getWeekDates() : getMonthDates();
  const startDate = dates[0] + "T00:00:00";
  const endDate = dates[dates.length - 1] + "T23:59:59";

  await focusStore.fetchRecords(startDate, endDate);

  const dataMap = new Map<string, number>();
  focusStore.records.forEach((r) => {
    const date = r.start_time.split("T")[0];
    dataMap.set(date, (dataMap.get(date) ?? 0) + r.duration);
  });

  const result = dates.map((d) => ({
    date: d,
    duration: dataMap.get(d) ?? 0,
  }));

  if (dateRange.value === "week") {
    weekBarData.value = result;
  } else {
    monthBarData.value = result;
  }
}

function onDateChange() {
  loadDailyStats();
  loadBarData();
}

function onRangeChange() {
  loadBarData();
}

onMounted(async () => {
  await taskStore.fetchTasks();
  await loadDailyStats();
  await loadBarData();
});
</script>

<style scoped>
.stats-page {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}
</style>
