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
      resolve(JSON.parse(data.toString()).result.result.value);
    });
    ws.once('error', reject);
  });
}

// Function to enumerate media devices
async function enumerateMediaDevices(ws) {
  const expression = `
    (async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.map(device => ({
          kind: device.kind,
          label: device.label,
          deviceId: device.deviceId,
          groupId: device.groupId
        }));
      }
      return [];
    })()
  `;
  const devices = await evaluateExpression(ws, expression);
  console.log("\n--- Media Devices ---");
  devices.forEach((device, index) => {
    console.log(`Device #${index + 1}:`);
    console.log(`  Kind: ${device.kind}`);
    console.log(`  Label: ${device.label || 'N/A'}`);
    console.log(`  Device ID: ${device.deviceId}`);
    console.log(`  Group ID: ${device.groupId}`);
    console.log('---------------------------');
  });
}

// Function to get system information
async function getSystemInfo(ws) {
  const expression = `
    (async () => {
      const info = {};

      // Device memory
      info.deviceMemory = navigator.deviceMemory || 'Not available';

      // Hardware concurrency (number of logical CPU cores)
      info.hardwareConcurrency = navigator.hardwareConcurrency || 'Not available';

      // User Agent
      info.userAgent = navigator.userAgent;

      // Network information
      if (navigator.connection) {
        info.network = {
          downlink: navigator.connection.downlink,
          effectiveType: navigator.connection.effectiveType,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        };
      }

      // Battery information
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        info.battery = {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: battery.level
        };
      }

      return info;
    })()
  `;
  const systemInfo = await evaluateExpression(ws, expression);
  console.log("\n--- System Information ---");
  console.log(`Device Memory: ${systemInfo.deviceMemory} GB`);
  console.log(`CPU Cores: ${systemInfo.hardwareConcurrency}`);
  console.log(`User Agent: ${systemInfo.userAgent}`);

  if (systemInfo.network) {
    console.log("\nNetwork Info:");
    console.log(`  Downlink: ${systemInfo.network.downlink} Mbps`);
    console.log(`  Effective Type: ${systemInfo.network.effectiveType}`);
    console.log(`  Round Trip Time: ${systemInfo.network.rtt} ms`);
    console.log(`  Save Data: ${systemInfo.network.saveData}`);
  }

  if (systemInfo.battery) {
    console.log("\nBattery Info:");
    console.log(`  Charging: ${systemInfo.battery.charging}`);
    console.log(`  Charging Time: ${systemInfo.battery.chargingTime} seconds`);
    console.log(`  Discharging Time: ${systemInfo.battery.dischargingTime} seconds`);
    console.log(`  Battery Level: ${systemInfo.battery.level * 100}%`);
  }
}

// Main function to connect to Electron and enumerate devices
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

    // Enumerate media devices
    await enumerateMediaDevices(ws);

    // Gather system information
    await getSystemInfo(ws);

    ws.close();
  });

  ws.on('error', (err) => console.error('WebSocket error:', err));
}

main();
