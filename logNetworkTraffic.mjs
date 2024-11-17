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

// Function to fetch response body for a given requestId
async function getResponseBody(ws, requestId) {
  return new Promise((resolve) => {
    const message = {
      id: messageId++,
      method: 'Network.getResponseBody',
      params: { requestId }
    };
    ws.send(JSON.stringify(message));
    ws.once('message', (data) => {
      const response = JSON.parse(data.toString());
      if (response.result) {
        resolve(response.result.body);
      } else {
        resolve(null);
      }
    });
  });
}

// Main function to connect to Electron and log network traffic
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

    // Enable Network events to capture network traffic
    sendCommand(ws, 'Network.enable');
    console.log('Listening for network traffic...');
  });

  // Log all outgoing requests and incoming responses
  ws.on('message', async (data) => {
    const parsedData = JSON.parse(data);

    // Log outgoing requests
    if (parsedData.method === 'Network.requestWillBeSent') {
      const request = parsedData.params.request;
      console.log(`\n[REQUEST] ${request.method} ${request.url}`);
      console.log(`Headers: ${JSON.stringify(request.headers, null, 2)}`);
      if (request.postData) {
        console.log(`Post Data: ${request.postData}`);
      }
    }

    // Log incoming responses
    if (parsedData.method === 'Network.responseReceived') {
      const response = parsedData.params.response;
      const requestId = parsedData.params.requestId;
      console.log(`\n[RESPONSE] ${response.status} ${response.url}`);
      console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);

      // Fetch and log the response body if it's JSON or text
      if (response.mimeType.includes('application/json') || response.mimeType.includes('text')) {
        const responseBody = await getResponseBody(ws, requestId);
        console.log(`Response Body: ${responseBody}`);
      }
    }
  });

  ws.on('error', (err) => console.error('WebSocket error:', err));
  ws.on('close', () => console.log('WebSocket closed'));
}

main();
