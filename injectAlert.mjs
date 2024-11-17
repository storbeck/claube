import WebSocket from 'ws';

let messageId = 1;

// Find the WebSocket URL for the Electron app
async function findWebSocketUrl() {
  const response = await fetch('http://localhost:9222/json');
  const pages = await response.json();
  return pages[0]?.webSocketDebuggerUrl;
}

// Function to evaluate JavaScript code in the Electron app's context
async function evaluateExpression(ws, expression) {
  return new Promise((resolve, reject) => {
    const message = {
      id: messageId++,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true }
    };
    ws.send(JSON.stringify(message));
    ws.once('message', (data) => {
      resolve(JSON.parse(data.toString()));
    });
    ws.once('error', reject);
  });
}

// Function to trigger an alert dialog
async function showAlert(ws, message) {
  const expression = `alert("${message}")`;
  const result = await evaluateExpression(ws, expression);
  console.log(result?.result?.result?.value || 'Alert triggered successfully');
}

// Main function to connect to Electron and trigger the alert
async function main() {
  const wsUrl = await findWebSocketUrl();
  if (!wsUrl) {
    console.error('WebSocket URL not found.');
    return;
  }

  const ws = new WebSocket(wsUrl, {
    headers: { 'Sec-WebSocket-Protocol': 'chrome-devtools' }
  });

  ws.on('open', async () => {
    // Trigger an alert with a custom message
    await showAlert(ws, '💋');
    ws.close();
  });

  ws.on('error', (err) => console.error('WebSocket error:', err));
}

main();
