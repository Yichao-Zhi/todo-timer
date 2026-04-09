<template>
  <div class="tasks-page">
    <div class="page-header">
      <n-h2 style="margin: 0">任务管理</n-h2>
      <n-button type="primary" @click="showCreateModal = true">
        <template #icon>
          <n-icon><add-outline /></n-icon>
        </template>
        新建任务
      </n-button>
    </div>

    <div v-if="taskStore.loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <div v-else-if="taskStore.tasks.length === 0" class="empty-container">
      <n-empty description="还没有任务，点击右上角新建一个吧" />
    </div>

    <div v-else class="task-grid">
      <n-card
        v-for="task in taskStore.tasks"
        :key="task.id"
        hoverable
        class="task-card"
        :style="{ borderLeft: `4px solid ${task.color}` }"
      >
        <div class="task-card-header">
          <span class="task-name">{{ task.name }}</span>
          <n-dropdown :options="taskMenuOptions" @select="(key: string) => handleTaskAction(key, task)">
            <n-button text>
              <n-icon size="18"><ellipsis-horizontal /></n-icon>
            </n-button>
          </n-dropdown>
        </div>
        <div class="task-card-info">
          <n-tag :type="task.timer_mode === 'countup' ? 'info' : 'warning'" size="small">
            {{ task.timer_mode === 'countup' ? '正计时' : '倒计时' }}
          </n-tag>
          <span v-if="task.timer_mode === 'countdown'" class="task-duration">
            {{ task.duration }} 分钟
          </span>
        </div>
      </n-card>
    </div>

    <!-- 创建/编辑任务弹窗 -->
    <n-modal
      v-model:show="showCreateModal"
      preset="dialog"
      :title="editingTask ? '编辑任务' : '新建任务'"
      positive-text="确定"
      negative-text="取消"
      @positive-click="handleSubmit"
    >
      <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="top">
        <n-form-item label="任务名称" path="name">
          <n-input v-model:value="formData.name" placeholder="例如：健身、阅读、编程..." maxlength="30" show-count />
        </n-form-item>
        <n-form-item label="计时模式" path="timer_mode">
          <n-radio-group v-model:value="formData.timer_mode">
            <n-space>
              <n-radio value="countup">正向计时</n-radio>
              <n-radio value="countdown">倒计时</n-radio>
            </n-space>
          </n-radio-group>
        </n-form-item>
        <n-form-item v-if="formData.timer_mode === 'countdown'" label="倒计时时长（分钟）" path="duration">
          <n-input-number
            v-model:value="formData.duration"
            :min="1"
            :max="180"
            placeholder="1 - 180"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item label="颜色">
          <n-color-picker v-model:value="formData.color" :swatches="colorSwatches" />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import {
  NH2, NButton, NIcon, NCard, NTag, NDropdown, NModal, NForm,
  NFormItem, NInput, NInputNumber, NRadioGroup, NRadio, NSpace,
  NColorPicker, NEmpty, NSpin, useMessage,
} from "naive-ui";
import { AddOutline, EllipsisHorizontal } from "@vicons/ionicons5";
import { useTaskStore, type Task } from "@/stores/taskStore";

const message = useMessage();
const taskStore = useTaskStore();

const showCreateModal = ref(false);
const editingTask = ref<Task | null>(null);

const colorSwatches = [
  "#18a058", "#2080f0", "#f0a020", "#d03050",
  "#8a2be2", "#36cfc9", "#ff69b4", "#708090",
];

const taskMenuOptions = [
  { label: "编辑", key: "edit" },
  { label: "删除", key: "delete" },
];

const formData = reactive({
  name: "",
  timer_mode: "countup" as "countup" | "countdown",
  duration: 25,
  color: "#18a058",
});

const formRules = {
  name: { required: true, message: "请输入任务名称", trigger: "blur" },
};

function resetForm() {
  formData.name = "";
  formData.timer_mode = "countup";
  formData.duration = 25;
  formData.color = "#18a058";
  editingTask.value = null;
}

function handleTaskAction(key: string, task: Task) {
  if (key === "edit") {
    editingTask.value = task;
    formData.name = task.name;
    formData.timer_mode = task.timer_mode;
    formData.duration = task.duration ?? 25;
    formData.color = task.color;
    showCreateModal.value = true;
  } else if (key === "delete") {
    taskStore.deleteTask(task.id);
    message.success("任务已删除");
  }
}

async function handleSubmit() {
  if (!formData.name.trim()) {
    message.warning("请输入任务名称");
    return false;
  }

  try {
    if (editingTask.value) {
      await taskStore.updateTask(editingTask.value.id, {
        name: formData.name,
        timer_mode: formData.timer_mode,
        duration: formData.timer_mode === "countdown" ? formData.duration : null,
        color: formData.color,
      });
      message.success("任务已更新");
    } else {
      await taskStore.createTask({
        name: formData.name,
        timer_mode: formData.timer_mode,
      duration: formData.timer_mode === "countdown" ? formData.duration : undefined,
      color: formData.color,
    });
    message.success("任务已创建");
    }
  } catch (e) {
    console.error("创建/更新任务失败:", e);
    message.error(`操作失败: ${e}`);
    return false;
  }

  resetForm();
  return true;
}

onMounted(() => {
  taskStore.fetchTasks();
});
</script>

<style scoped>
.tasks-page {
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

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.task-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-name {
  font-size: 16px;
  font-weight: 600;
}

.task-card-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-duration {
  color: #999;
  font-size: 13px;
}
</style>
