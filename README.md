# 💤 WinSleep

**WinSleep** is a modern, lightweight, and blazing-fast Windows desktop utility designed for scheduled system action execution (Sleep, Hibernate, Shutdown, Restart, Lock, Sign Out).

---

## ✨ Features

*   ⏳ **Task Scheduling**: An intuitive countdown timer to transition your PC into the selected action.
*   🔋 **Comprehensive System Actions**:
    *   **Sleep** and **Hibernate** triggered via direct low-level Win32 APIs.
    *   **Shutdown** and **Restart** system actions.
    *   **Lock Workstation** and **Sign Out (Logoff)**.
*   🔔 **Native Notifications**: Real-time Windows OS notifications regarding timer progress, warnings, and system action transitions.

---

## 🚀 Quick Start

### Prerequisites
To build and run the application locally, you will need:
1.  **Node.js** (v24 or newer).
2.  **Rust & Cargo** (for building the Tauri Rust backend). See the [Tauri Setup Guide](https://v2.tauri.app/start/prerequisites/) for OS setup instructions.

### Dependencies Installation
Install npm packages in the project root directory:
```bash
npm install
```

### Run Dev Environment & Build
Launch the development environment (Rust backend + React frontend in Tauri dev mode):
```bash
npm run tauri:dev
```

To compile and bundle the production release (`.exe`):
```bash
npm run tauri:build
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0). For details, please check the **[GPL-3.0 License](./LICENSE)** file.
