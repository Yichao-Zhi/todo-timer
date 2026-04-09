<template>
  <div class="history-page">
    <div class="page-header">
      <n-h2 style="margin: 0">历史记录</n-h2>
      <n-button type="primary" @click="showAddModal = true">
        <template #icon>
          <n-icon><add-outline /></n-icon>
        </template>
        手动添加
      </n-button>
    </div>

    <!-- 日期筛选 -->
    <div class="date-filter">
      <n-date-picker
        v-model:value="dateRange"
        type="daterange"
        clearable
        @update:value="loadRecords"
      />
    </div>

    <!-- 加载中 -->
    <div v-if="focusStore.loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <!-- 空状态 -->
    <div v-else-if="groupedRecords.length === 0" class="empty-container">
      <n-empty description="暂无专注记录" />
    </div>

    <!-- 时间轴列表 -->
    <div v-else class="timeline">
      <div v-for="group in groupedRecords" :key="group.date" class="timeline-group">
        <div class="timeline-date">
          <span class="date-label">{{ group.label }}</span>
          <span class="date-total">{{ formatDuration(group.totalDuration) }}</span>
        </div>
        <div class="timeline-items">
          <div
            v-for="record in group.records"
            :key="record.id"
            class="timeline-item"
            :style="{ borderLeftColor: record.task_color || '#18a058' }"
          >
            <div class="timeline-item-content">
              <div class="timeline-item-header">
                <span class="timeline-task-name">{{ record.task_name || '未知任务' }}</span>
                <span class="timeline-duration">{{ formatDuration(record.duration) }}</span>
              </div>
              <div class="timeline-item-meta">
                <span>{{ formatTime(record.start_time) }}</span>
                <span v-if="record.end_time"> - {{ formatTime(record.end_time) }}</span>
                <n-tag v-if="record.is_manual" size="tiny" type="warning" style="margin-left: 8px">手动</n-tag>
                <n-tag v-if="record.break_duration > 0" size="tiny" type="info" style="margin-left: 4px">
                  休息 {{ formatDuration(record.break_duration) }}
                </n-tag>
              </div>
              <div v-if="record.note" class="timeline-note">{{ record.note }}</div>
            </div>
            <div class="timeline-item-actions">
              <n-button text size="small" @click="editRecord(record)">
                <n-icon><create-outline /></n-icon>
              </n-button>
              <n-button text size="small" @click="confirmDelete(record.id)">
                <n-icon><trash-outline /></n-icon>
              </n-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑记录弹窗 -->
    <n-modal
      v-model:show="showAddModal"
      preset="dialog"
      :title="editingRecord ? '编辑记录' : '手动添加记录'"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handleSaveRecord"
    >
      <n-form :model="recordForm" label-placement="top">
        <n-form-item label="任务">
          <n-select
            v-model:value="recordForm.task_id"
            :options="taskOptions"
            placeholder="选择任务"
          />
        </n-form-item>
        <n-form-item label="日期">
          <n-date-picker v-model:value="recordForm.date" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="开始时间">
          <n-time-picker v-model:value="recordForm.startTime" format="HH:mm" style="width: 100%" />
        </n-form-item>
        <n-form-item label="时长（分钟）">
          <n-input-number v-model:value="recordForm.durationMinutes" :min="1" :max="1440" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="recordForm.note" type="textarea" placeholder="可选" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import {
  NH2, NButton, NIcon, NDatePicker, NModal, NForm, NFormItem,
  NSelect, NInput, NInputNumber, NTimePicker, NTag, NEmpty, NSpin,
  useMessage, useDialog,
} from "naive-ui";
import { AddOutline, CreateOutline, TrashOutline } from "@vicons/ionicons5";
import { useTaskStore } from "@/stores/taskStore";
import { useFocusStore, type FocusRecord } from "@/stores/focusStore";

const message = useMessage();
const dialog = useDialog();
const taskStore = useTaskStore();
const focusStore = useFocusStore();

const dateRange = ref<[number, number] | null>(null);
const showAddModal = ref(false);
const editingRecord = ref<FocusRecord | null>(null);

const recordForm = reactive({
  task_id: "",
  date: Date.now(),
  startTime: Date.now(),
  durationMinutes: 25,
  note: "",
});

const taskOptions = computed(() =>
  taskStore.tasks.map((t) => ({ label: t.name, value: t.id }))
);

interface DateGroup {
  date: string;
  label: string;
  totalDuration: number;
  records: FocusRecord[];
}

const groupedRecords = computed((): DateGroup[] => {
  const groups = new Map<string, FocusRecord[]>();

  focusStore.records.forEach((r) => {
    const date = r.start_time.split("T")[0];
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(r);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, records]) => ({
      date,
      label: formatDateLabel(date),
      totalDuration: records.reduce((sum, r) => sum + r.duration, 0),
      records,
    }));
});

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) return "今天";
  if (dateStr === yesterday.toISOString().split("T")[0]) return "昨天";

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${month}月${day}日 ${weekdays[d.getDay()]}`;
}

async function loadRecords() {
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (dateRange.value) {
    startDate = new Date(dateRange.value[0]).toISOString();
    endDate = new Date(dateRange.value[1]).toISOString();
  }

  await focusStore.fetchRecords(startDate, endDate);
}

function resetForm() {
  recordForm.task_id = "";
  recordForm.date = Date.now();
  recordForm.startTime = Date.now();
  recordForm.durationMinutes = 25;
  recordForm.note = "";
  editingRecord.value = null;
}

function editRecord(record: FocusRecord) {
  editingRecord.value = record;
  recordForm.task_id = record.task_id;
  recordForm.date = new Date(record.start_time).getTime();
  recordForm.startTime = new Date(record.start_time).getTime();
  recordForm.durationMinutes = Math.round(record.duration / 60);
  recordForm.note = record.note;
  showAddModal.value = true;
}

async function handleSaveRecord() {
  if (!recordForm.task_id) {
    message.warning("请选择任务");
    return false;
  }

  const date = new Date(recordForm.date);
  const startTime = new Date(recordForm.startTime);
  date.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

  const startISO = date.toISOString();
  const duration = recordForm.durationMinutes * 60;
  const endTime = new Date(date.getTime() + duration * 1000);

  if (endTime > new Date()) {
    message.warning("任务的结束时间不能超过当前时间");
    return false;
  }

  if (editingRecord.value) {
    await focusStore.updateRecord(editingRecord.value.id, {
      start_time: startISO,
      end_time: endTime.toISOString(),
      duration,
      note: recordForm.note,
    });
    message.success("记录已更新");
  } else {
    await focusStore.createRecord({
      task_id: recordForm.task_id,
      start_time: startISO,
      end_time: endTime.toISOString(),
      duration,
      is_manual: 1,
      note: recordForm.note,
    });
    message.success("记录已添加");
  }

  resetForm();
  await loadRecords();
  return true;
}

function confirmDelete(id: string) {
  dialog.warning({
    title: "确认删除",
    content: "确定删除这条专注记录吗？此操作不可撤销。",
    positiveText: "删除",
    negativeText: "取消",
    onPositiveClick: async () => {
      await focusStore.deleteRecord(id);
      message.success("记录已删除");
    },
  });
}

onMounted(async () => {
  await taskStore.fetchTasks();
  await loadRecords();
});
</script>

<style scoped>
.history-page {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.date-filter {
  margin-bottom: 24px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.timeline-group {
  margin-bottom: 32px;
}

.timeline-date {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.date-label {
  font-size: 16px;
  font-weight: 600;
}

.date-total {
  color: #18a058;
  font-weight: 600;
  font-size: 14px;
}

.timeline-items {
  padding-left: 16px;
}

.timeline-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-left: 4px solid #18a058;
  border-radius: 0 8px 8px 0;
  background: #fafafa;
  transition: background 0.2s;
}

.timeline-item:hover {
  background: #f5f5f5;
}

.timeline-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.timeline-task-name {
  font-weight: 600;
  font-size: 15px;
}

.timeline-duration {
  color: #18a058;
  font-weight: 600;
}

.timeline-item-meta {
  color: #999;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.timeline-note {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}

.timeline-item-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
</style>
