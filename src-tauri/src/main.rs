// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{command, State};
use dirs;
use toml;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AwsCredentials {
    aws_access_key_id: String,
    aws_secret_access_key: String,
}

#[derive(Debug, Deserialize)]
struct AwsConfig {
    default: AwsCredentials,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct UserConfig {
    platform: String,
    url: String,
    model: String,
    temperature: f32,
}

impl Default for UserConfig {
    fn default() -> Self {
        UserConfig {
            platform: "ollama".to_string(),
            url: "http://localhost:11434/api/generate".to_string(),
            model: "llama3.1".to_string(),
            temperature: 0.0,
        }
    }
}

struct ConfigState(std::sync::Mutex<UserConfig>);

fn get_config_path() -> std::path::PathBuf {
    let mut config_dir = dirs::home_dir().expect("Failed to get home directory");
    config_dir.push(".llamaman");
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).expect("Failed to create config directory");
    }
    config_dir.push("config.toml");
    config_dir
}

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
fn get_aws_credentials() -> AwsCredentials {
    let home = dirs::home_dir().unwrap();
    let credentials_path = home.join(".aws").join("credentials");
    let contents = std::fs::read_to_string(credentials_path).expect("Failed to read credentials file");

    let config: AwsConfig = toml::de::from_str(&contents).expect("Failed to parse toml file");
    
    config.default
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
            get_aws_credentials,
            get_user_config,
            update_user_config,
            read_file,
            write_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// TOOLS
use std::fs::File;
use std::fs::OpenOptions;
use std::io::Write;
use std::io::Read;
use std::path::PathBuf;

#[command]
fn read_file(filename: &str) -> Result<String, String> {
    let mut path = PathBuf::new();
    path.push(dirs::home_dir().ok_or_else(|| "Unable to get home directory".to_string())?);
    path.push(".llamaman");
    path.push(filename);

    let mut file = File::open(path).map_err(|err| err.to_string())?;
    let mut contents = String::new();
    file.read_to_string(&mut contents).map_err(|err| err.to_string())?;
    Ok(contents)
}

#[command]
fn write_file(filename: &str, content: &str) -> Result<String, String> {
    let mut path = PathBuf::new();
    path.push(dirs::home_dir().ok_or_else(|| "Unable to get home directory".to_string())?);
    path.push(".llamaman");
    path.push(filename);
    
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(path)
        .map_err(|e| e.to_string())?;
    
    file.write_all(content.as_bytes())
        .map_err(|e| e.to_string())?;
    
    Ok(format!("Contents were written to file {}.", filename))
}
