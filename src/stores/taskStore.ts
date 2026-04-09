import { defineStore } from "pinia";
import { ref } from "vue";
import { getDb, generateId, nowISO } from "@/utils/database";

export interface Task {
  id: string;
  name: string;
  timer_mode: "countup" | "countdown";
  duration: number | null;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
}

export const useTaskStore = defineStore("task", () => {
  const tasks = ref<Task[]>([]);
  const loading = ref(false);

  async function fetchTasks() {
    loading.value = true;
    try {
      const db = await getDb();
      const result = await db.select<Task[]>(
        "SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY sort_order ASC, created_at DESC"
      );
      tasks.value = result;
    } catch (e) {
      console.error("fetchTasks failed:", e);
    } finally {
      loading.value = false;
    }
  }

  async function createTask(data: {
    name: string;
    timer_mode: "countup" | "countdown";
    duration?: number;
    color?: string;
    icon?: string;
  }): Promise<Task> {
    const db = await getDb();
    const now = nowISO();
    const task: Task = {
      id: generateId(),
      name: data.name,
      timer_mode: data.timer_mode,
      duration: data.duration ?? null,
      color: data.color ?? "#18a058",
      icon: data.icon ?? "",
      sort_order: tasks.value.length,
      created_at: now,
      updated_at: now,
      is_deleted: 0,
    };
    await db.execute(
      `INSERT INTO tasks (id, name, timer_mode, duration, color, icon, sort_order, created_at, updated_at, is_deleted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [task.id, task.name, task.timer_mode, task.duration, task.color, task.icon, task.sort_order, task.created_at, task.updated_at, task.is_deleted]
    );
    tasks.value.unshift(task);
    return task;
  }

  async function updateTask(id: string, data: Partial<Task>) {
    const db = await getDb();
    const now = nowISO();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push("name = $1"); values.push(data.name); }
    if (data.timer_mode !== undefined) { fields.push("timer_mode = $2"); values.push(data.timer_mode); }
    if (data.duration !== undefined) { fields.push("duration = $3"); values.push(data.duration); }
    if (data.color !== undefined) { fields.push("color = $4"); values.push(data.color); }
    if (data.icon !== undefined) { fields.push("icon = $5"); values.push(data.icon); }

    if (fields.length === 0) return;

    fields.push("updated_at = $6");
    values.push(now);
    values.push(id);

    await db.execute(`UPDATE tasks SET ${fields.join(", ")} WHERE id = $7`, values);
    await fetchTasks();
  }

  async function deleteTask(id: string) {
    const db = await getDb();
    await db.execute("UPDATE tasks SET is_deleted = 1, updated_at = $1 WHERE id = $2", [nowISO(), id]);
    tasks.value = tasks.value.filter((t) => t.id !== id);
  }

  return { tasks, loading, fetchTasks, createTask, updateTask, deleteTask };
});
