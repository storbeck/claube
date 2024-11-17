import WebSocket from 'ws';

let messageId = 1;

async function findWebSocketUrl() {
  const response = await fetch('http://localhost:9222/json');
  const pages = await response.json();
  return pages[0]?.webSocketDebuggerUrl;
}

async function evaluateExpression(ws, expression) {
  return new Promise((resolve, reject) => {
    const message = {
      id: messageId++,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true }
    };
    ws.send(JSON.stringify(message));
    ws.once('message', (data) => {
      resolve(JSON.parse(data.toString()).result.result.value);
    });
    ws.once('error', reject);
  });
}

async function getStorageInfo(ws) {
  const expression = `
    (function() {
      const info = {
        localStorage: Object.entries(localStorage),
        sessionStorage: Object.entries(sessionStorage),
        cookies: document.cookie.split('; ').map(c => c.split('='))
      };
      return info;
    })()
  `;
  const storageInfo = await evaluateExpression(ws, expression);
  console.log("\n--- Local Storage ---");
  storageInfo.localStorage.forEach(([key, value]) => console.log(`${key}: ${value}`));
  console.log("\n--- Session Storage ---");
  storageInfo.sessionStorage.forEach(([key, value]) => console.log(`${key}: ${value}`));
  console.log("\n--- Cookies ---");
  storageInfo.cookies.forEach(([key, value]) => console.log(`${key}: ${value}`));
}

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
    await getStorageInfo(ws);
    ws.close();
  });

  ws.on('error', (err) => console.error('WebSocket error:', err));
}

main();
