mod db;
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::init_db,
            commands::create_task,
            commands::get_tasks,
            commands::create_focus_record,
            commands::update_focus_record,
            commands::delete_focus_record,
            commands::get_focus_records,
            commands::get_focus_records_by_task,
            commands::get_stats_by_date_range,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
