import { defineStore } from "pinia";
import { ref } from "vue";
import { getDb, generateId, nowISO } from "@/utils/database";

export interface FocusRecord {
  id: string;
  task_id: string;
  task_name?: string;
  task_color?: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  break_duration: number;
  is_manual: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export const useFocusStore = defineStore("focus", () => {
  const records = ref<FocusRecord[]>([]);
  const loading = ref(false);

  async function fetchRecords(startDate?: string, endDate?: string, taskId?: string) {
    loading.value = true;
    try {
      const db = await getDb();
      let sql = `
        SELECT fr.*, t.name as task_name, t.color as task_color
        FROM focus_records fr
        LEFT JOIN tasks t ON fr.task_id = t.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        sql += " AND fr.start_time >= $1";
        params.push(startDate);
      }
      if (endDate) {
        const idx = params.length + 1;
        sql += ` AND fr.start_time <= $${idx}`;
        params.push(endDate);
      }
      if (taskId) {
        const idx = params.length + 1;
        sql += ` AND fr.task_id = $${idx}`;
        params.push(taskId);
      }

      sql += " ORDER BY fr.start_time DESC";
      records.value = await db.select<FocusRecord[]>(sql, params);
    } catch (e) {
      console.error("fetchRecords failed:", e);
    } finally {
      loading.value = false;
    }
  }

  async function createRecord(data: {
    task_id: string;
    start_time: string;
    end_time?: string;
    duration: number;
    break_duration?: number;
    is_manual?: number;
    note?: string;
  }): Promise<FocusRecord> {
    const db = await getDb();
    const now = nowISO();
    const record: FocusRecord = {
      id: generateId(),
      task_id: data.task_id,
      start_time: data.start_time,
      end_time: data.end_time ?? null,
      duration: data.duration,
      break_duration: data.break_duration ?? 0,
      is_manual: data.is_manual ?? 0,
      note: data.note ?? "",
      created_at: now,
      updated_at: now,
    };
    await db.execute(
      `INSERT INTO focus_records (id, task_id, start_time, end_time, duration, break_duration, is_manual, note, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [record.id, record.task_id, record.start_time, record.end_time, record.duration, record.break_duration, record.is_manual, record.note, record.created_at, record.updated_at]
    );
    return record;
  }

  async function updateRecord(id: string, data: Partial<FocusRecord>) {
    const db = await getDb();
    const now = nowISO();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.start_time !== undefined) { fields.push("start_time = $1"); values.push(data.start_time); }
    if (data.end_time !== undefined) { fields.push("end_time = $2"); values.push(data.end_time); }
    if (data.duration !== undefined) { fields.push("duration = $3"); values.push(data.duration); }
    if (data.break_duration !== undefined) { fields.push("break_duration = $4"); values.push(data.break_duration); }
    if (data.note !== undefined) { fields.push("note = $5"); values.push(data.note); }

    if (fields.length === 0) return;

    fields.push("updated_at = $6");
    values.push(now);
    values.push(id);

    await db.execute(`UPDATE focus_records SET ${fields.join(", ")} WHERE id = $7`, values);
  }

  async function deleteRecord(id: string) {
    const db = await getDb();
    await db.execute("DELETE FROM focus_records WHERE id = $1", [id]);
    records.value = records.value.filter((r) => r.id !== id);
  }

  async function getDailyStats(date: string): Promise<{ total: number; byTask: { task_id: string; task_name: string; task_color: string; duration: number }[] }> {
    const db = await getDb();
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    const totalResult = await db.select<{ total: number }[]>(
      "SELECT COALESCE(SUM(duration), 0) as total FROM focus_records WHERE start_time >= $1 AND start_time <= $2",
      [dayStart, dayEnd]
    );

    const byTaskResult = await db.select<{ task_id: string; task_name: string; task_color: string; duration: number }[]>(
      `SELECT fr.task_id, t.name as task_name, t.color as task_color, SUM(fr.duration) as duration
       FROM focus_records fr
       LEFT JOIN tasks t ON fr.task_id = t.id
       WHERE fr.start_time >= $1 AND fr.start_time <= $2
       GROUP BY fr.task_id
       ORDER BY duration DESC`,
      [dayStart, dayEnd]
    );

    return {
      total: totalResult[0]?.total ?? 0,
      byTask: byTaskResult,
    };
  }

  return { records, loading, fetchRecords, createRecord, updateRecord, deleteRecord, getDailyStats };
});
