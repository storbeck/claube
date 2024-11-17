import WebSocket from 'ws';

let messageId = 1;

// Find the WebSocket URL for the Electron app
async function findWebSocketUrl() {
  const response = await fetch('http://localhost:9222/json');
  const pages = await response.json();
  return pages[0]?.webSocketDebuggerUrl;
}

// Function to send a command to the WebSocket
function sendCommand(ws, method, params = {}) {
  const message = {
    id: messageId++,
    method,
    params
  };
  ws.send(JSON.stringify(message));
}

// Function to decode base64-encoded postData
function decodeBase64Data(data) {
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
  } catch (error) {
    console.error('Error decoding base64 data:', error);
    return null;
  }
}

// Main function to connect to Electron and log only the prompt
async function main() {
  const wsUrl = await findWebSocketUrl();
  if (!wsUrl) {
    console.error('WebSocket URL not found.');
    return;
  }

  const ws = new WebSocket(wsUrl, {
    headers: { 'Sec-WebSocket-Protocol': 'chrome-devtools' }
  });

  ws.on('open', () => {
    console.log('Connected to Electron via WebSocket');

    // Enable Network events to capture outgoing requests
    sendCommand(ws, 'Network.enable');
    console.log('Listening for relevant WebSocket messages...');
  });

  // Set to store request IDs to avoid duplicates
  const processedRequests = new Set();

  // Log filtered WebSocket messages
  ws.on('message', (data) => {
    try {
      const parsedData = JSON.parse(data);

      // Check if the message is a Network request
      if (parsedData.method === 'Network.requestWillBeSent') {
        const { requestId, request } = parsedData.params;

        // Filter for the specific URL pattern ending with /completion
        if (request.url.includes('/completion') && request.method === 'POST') {
          // Check if this request has already been processed
          if (processedRequests.has(requestId)) return;
          processedRequests.add(requestId);

          // Decode and log only the prompt if available
          if (request.hasPostData) {
            const decodedData = decodeBase64Data(request.postDataEntries[0].bytes);
            if (decodedData && decodedData.prompt) {
              console.log(`Prompt: "${decodedData.prompt}"`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
  });

  ws.on('error', (err) => console.error('WebSocket error:', err));
  ws.on('close', () => console.log('WebSocket closed'));
}

main();
