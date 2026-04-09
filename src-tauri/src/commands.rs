use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use uuid::Uuid;
use chrono::Utc;

pub struct AppState {
    pub db_initialized: Mutex<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub name: String,
    pub timer_mode: String,
    pub duration: Option<i64>,
    pub color: String,
    pub icon: String,
    pub sort_order: i64,
    pub created_at: String,
    pub updated_at: String,
    pub is_deleted: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FocusRecord {
    pub id: String,
    pub task_id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration: i64,
    pub break_duration: i64,
    pub is_manual: i64,
    pub note: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskInput {
    pub name: String,
    pub timer_mode: String,
    pub duration: Option<i64>,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFocusRecordInput {
    pub task_id: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration: i64,
    pub break_duration: Option<i64>,
    pub is_manual: Option<i64>,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateFocusRecordInput {
    pub id: String,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub duration: Option<i64>,
    pub break_duration: Option<i64>,
    pub note: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct DateStats {
    pub date: String,
    pub total_duration: i64,
    pub task_count: i64,
}

#[derive(Debug, Serialize)]
pub struct TaskStats {
    pub task_id: String,
    pub task_name: String,
    pub total_duration: i64,
    pub record_count: i64,
}

#[tauri::command]
pub async fn init_db(state: State<'_, AppState>) -> Result<(), String> {
    let mut initialized = state.db_initialized.lock().map_err(|e| e.to_string())?;
    if *initialized {
        return Ok(());
    }
    *initialized = true;
    Ok(())
}

#[tauri::command]
pub async fn create_task(input: CreateTaskInput) -> Result<Task, String> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();
    let color = input.color.unwrap_or_else(|| "#18a058".to_string());
    let icon = input.icon.unwrap_or_default();

    Ok(Task {
        id,
        name: input.name,
        timer_mode: input.timer_mode,
        duration: input.duration,
        color,
        icon,
        sort_order: 0,
        created_at: now.clone(),
        updated_at: now,
        is_deleted: 0,
    })
}

#[tauri::command]
pub async fn get_tasks() -> Result<Vec<Task>, String> {
    Ok(vec![])
}

#[tauri::command]
pub async fn create_focus_record(input: CreateFocusRecordInput) -> Result<FocusRecord, String> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    Ok(FocusRecord {
        id,
        task_id: input.task_id,
        start_time: input.start_time,
        end_time: input.end_time,
        duration: input.duration,
        break_duration: input.break_duration.unwrap_or(0),
        is_manual: input.is_manual.unwrap_or(0),
        note: input.note.unwrap_or_default(),
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub async fn update_focus_record(_input: UpdateFocusRecordInput) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn delete_focus_record(_record_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn get_focus_records(
    _start_date: Option<String>,
    _end_date: Option<String>,
    _task_id: Option<String>,
) -> Result<Vec<FocusRecord>, String> {
    Ok(vec![])
}

#[tauri::command]
pub async fn get_focus_records_by_task(_task_id: String) -> Result<Vec<FocusRecord>, String> {
    Ok(vec![])
}

#[tauri::command]
pub async fn get_stats_by_date_range(
    _start_date: String,
    _end_date: String,
) -> Result<Vec<DateStats>, String> {
    Ok(vec![])
}
