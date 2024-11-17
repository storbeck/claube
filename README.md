# Electron Debug Scripts

A collection of utility scripts for debugging Electron applications over port 9222. These scripts connect to a running Electron app's DevTools protocol to perform various diagnostic and testing functions.

## Prerequisites

- Node.js installed
- An Electron application running with remote debugging enabled (port 9222)
- WebSocket (`ws`) npm package installed

## Scripts

### enumerateSystem.mjs

Gathers and displays detailed system information from the Electron context, including:
- Media devices (cameras, microphones, speakers)
- Device memory
- CPU cores
- Network information
- Battery status
- User agent details

### injectAlert.mjs

A simple demonstration script that injects an alert dialog into the running Electron application. Useful for testing remote code execution and debugging message passing.

### promptLogger.mjs

Monitors and logs AI completion prompts sent from the Electron application. Specifically:
- Captures network requests to endpoints ending in `/completion`
- Decodes and displays the prompt content from POST requests
- Filters out duplicate requests
- Useful for debugging AI-related functionality

### inspectStorage.mjs

Inspects and displays all client-side storage data from the Electron application:
- Local Storage contents
- Session Storage contents
- Cookie data
- Useful for debugging persistence issues and tracking stored data

### logNetworkTraffic.mjs

Monitors and logs all network traffic from the Electron application in real-time:
- Captures all outgoing HTTP requests
- Logs incoming responses with status codes
- Displays headers and request/response bodies
- Particularly useful for API debugging and network analysis

## Usage

1. Start your Electron application with remote debugging enabled on port 9222
2. Run any script using Node.js:
