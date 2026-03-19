// Library code for Tauri application
use tauri::{CommandAction, Emitter, RunEvent};
use serde::{Deserialize, Serialize};
use std::fs;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct MusicFile {
    pub path: String,
    pub name: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioMetadata {
    pub title: String,
    pub artist: String,
    pub album: Option<String>,
    pub duration: Option<f64>,
}

// Supported audio extensions
const AUDIO_EXTENSIONS: &[&str] = &["mp3", "wav", "flac", "ogg", "aac", "wma", "m4a", "opus"];

fn is_audio_file(name: &str) -> bool {
    if let Some(ext) = name.split('.').last() {
        AUDIO_EXTENSIONS.contains(&ext.to_lowercase().as_str())
    } else {
        false
    }
}

// Scan folder for audio files
#[tauri::command]
async fn scan_folder(path: String) -> Result<Vec<MusicFile>, String> {
    let mut audio_files = Vec::new();
    
    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Some(file_name) = entry.path().to_str() {
                if is_audio_file(file_name) {
                    if let Ok(metadata) = fs::metadata(entry.path()) {
                        audio_files.push(MusicFile {
                            path: file_name.to_string(),
                            name: entry.file_name().to_string_lossy().to_string(),
                            size: metadata.len(),
                        });
                    }
                }
            }
        }
    }
    
    Ok(audio_files)
}

// Read audio file metadata using ID3 tags
#[tauri::command]
async fn read_metadata(path: String) -> Result<AudioMetadata, String> {
    let handle = id3::Handle::read_from_path(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let title = handle
        .title()
        .map(|t| t.as_str().to_string())
        .unwrap_or_else(|| path.split('/').last().unwrap_or("Unknown").to_string());
    
    let artist = handle
        .artist()
        .map(|a| a.as_str().to_string())
        .unwrap_or_else(|| "Unknown Artist".to_string());
    
    let album = handle
        .album()
        .map(|a| a.as_str().to_string());
    
    Ok(AudioMetadata {
        title,
        artist,
        album,
        duration: None, // Duration requires parsing the audio stream
    })
}

#[tauri::command]
fn get_supported_formats() -> Vec<String> {
    AUDIO_EXTENSIONS.iter().map(|&s| s.to_string()).collect()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_folder,
            read_metadata,
            get_supported_formats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
