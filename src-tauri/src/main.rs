// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::str::FromStr;
use tauri::{command, State};
use dirs;
use toml;
use std::fs::File;
use std::fs::OpenOptions;
use std::io::Write;
use std::io::Read;
use std::path::PathBuf;
use std::process::Command;
use reqwest::Client;
use tauri::Manager;
use futures_util::StreamExt;

// Idiomatic error for Tauri 
#[derive(Debug, thiserror::Error)]
enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error("Command failed with status: {0:?}")]
  CommandFailed(std::process::ExitStatus),
  #[error("UTF-8 conversion error")]
  Utf8Error(#[from] std::string::FromUtf8Error),
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

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
    max_steps: u8,
    top_p: f32,
    workspace_dir: String,
}

impl Default for UserConfig {
    fn default() -> Self {
        UserConfig {
            platform: "ollama".to_string(),
            url: "http://localhost:11434/api/generate".to_string(),
            model: "llama3.1".to_string(),
            temperature: 0.0,
            max_steps: 10,
            top_p: 0.9,
            workspace_dir: dirs::home_dir().unwrap().join(".llamaman").to_str().unwrap().to_string(),
        }
    }
}

fn populate_file_tree(path: &PathBuf, file_tree: &mut Vec<FileNode>) -> Result<(), Error> {
    for entry in fs::read_dir(path).map_err(|err| err.to_string()).unwrap() {
        let entry = entry.map_err(|err| err.to_string()).unwrap();
        let metadata = entry.metadata().map_err(|err| err.to_string()).unwrap();
        let file_node = FileNode {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
            children: Vec::new(),
        };
        file_tree.push(file_node);

        if metadata.is_dir() {
            populate_file_tree(&entry.path(), &mut file_tree.last_mut().unwrap().children)?;
        }
    }
    Ok(())
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

#[tauri::command]
async fn stream_data(window: tauri::Window) -> Result<(), String> {
    let client = Client::new();
    let url = "https://api.example.com/stream"; // Replace with your streaming API URL

    let res = client.get(url).send().await.map_err(|e| e.to_string())?;

    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        let data = String::from_utf8_lossy(&chunk);
        
        // Send each chunk to the frontend
        window.emit("stream-data", data.to_string()).map_err(|e| e.to_string())?;
    }

    Ok(())
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

// Default tools
#[command]
fn system_call(command: &str) -> Result<String, Error> {
    let config = read_config();
    let workspace_dir = PathBuf::from_str(&config.workspace_dir)
        .map_err(|err| err.to_string()).unwrap();

    let output = Command::new("bash")
        .arg("-c")
        .arg(command)
        .current_dir(workspace_dir)
        .output()?;

    if output.status.success() {
        Ok(String::from_utf8(output.stdout)?)
    } else {
        Err(Error::CommandFailed(output.status))
    }
}

#[derive(Serialize, Deserialize, Debug)]
struct FileNode {
    name: String,
    path: String,
    is_directory: bool,
    children: Vec<FileNode>,
}

#[command]
fn get_file_tree(path_string: String) -> Result<Vec<FileNode>, Error> {
    let path = PathBuf::from_str(&path_string).map_err(|err| err.to_string()).unwrap();

    let mut file_tree = Vec::new();
    populate_file_tree(&path, &mut file_tree)?;
    Ok(file_tree)
}

#[command]
fn read_file(filename: &str) -> Result<String, Error> {
    let config = read_config();
    let mut path = PathBuf::from(&config.workspace_dir);
    path.push(filename);

    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

#[command]
fn write_file(filename: &str, content: &str) -> Result<String, Error> {
    let config = read_config();
    let mut path = PathBuf::from_str(&config.workspace_dir).map_err(|err| err.to_string()).unwrap();
    path.push(filename);
    
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(path)?;
    
    file.write_all(content.as_bytes())?;
    
    Ok(format!("Contents were written to file {}.", filename))
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
            system_call,
            get_file_tree,
            read_file,
            write_file,
            stream_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// User defined tools
