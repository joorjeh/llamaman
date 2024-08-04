// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{command, State};
use dirs;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct UserConfig {
    platform: String,
    url: String,
    model: String,
}

impl Default for UserConfig {
    fn default() -> Self {
        UserConfig {
            platform: "ollama".to_string(),
            url: "http://localhost:11434/api/generate".to_string(),
            model: "llama3.1".to_string(),
        }
    }
}

struct ConfigState(std::sync::Mutex<UserConfig>);

fn get_config_path() -> std::path::PathBuf {
    let mut config_dir = dirs::home_dir().expect("Failed to get home directory");
    config_dir.push(".vogelsang");
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).expect("Failed to create config directory");
    }
    config_dir.push("config.toml");
    config_dir
}

// TODO this should fill in missing values with defaults
fn read_config() -> UserConfig {
    let config_path = get_config_path();
    if config_path.exists() {
        let config_str = fs::read_to_string(config_path).expect("Failed to read config file");
        match toml::from_str(&config_str) {
            Ok(config) => config,
            Err(e) => {
                println!("Error parsing config file: {}", e);
                UserConfig::default()
            }
        }
    } else {
        let default_config = UserConfig::default();
        write_config(&default_config);
        default_config
    }
}

fn write_config(config: &UserConfig) {
    let config_path = get_config_path();
    let config_str = toml::to_string_pretty(config).expect("Failed to serialize config");
    fs::write(config_path, config_str).expect("Failed to write config file");
}

#[command]
fn get_user_config(state: State<ConfigState>) -> UserConfig {
    state.0.lock().unwrap().clone()
}

#[command]
fn update_user_config(state: State<ConfigState>, new_config: UserConfig) {
    let mut config = state.0.lock().unwrap();
    *config = new_config.clone();
    write_config(&new_config);
}

fn main() {
    let config = read_config();
    let config_state = ConfigState(std::sync::Mutex::new(config));

    tauri::Builder::default()
        .manage(config_state)
        .invoke_handler(tauri::generate_handler![
            get_user_config,
            update_user_config,
            add,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// TOOLS
#[command]
fn add(a: i64, b: i64) -> i64 {
    return a + b;
}
