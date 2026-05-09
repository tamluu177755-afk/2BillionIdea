const os = require('os');
const fs = require('fs');

const nets = os.networkInterfaces();
let ip = '127.0.0.1';

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      ip = net.address;
      // Get the first public IPv4 we find (usually Wi-Fi or Ethernet)
      break;
    }
  }
}

const expoUrl = `exp://${ip}:8081`;

const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quét Mã QR Expo</title>
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f0f2f5; margin: 0; }
        .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #333; margin-top: 0; }
        img { border: 1px solid #ddd; padding: 10px; border-radius: 8px; margin: 20px 0; }
        p { color: #666; font-size: 16px; margin: 0; }
        .url { font-weight: bold; color: #007bff; margin-top: 10px; display: inline-block; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Quét Để Mở App (Expo)</h1>
        <p>Mở camera trên thiết bị iOS hoặc ứng dụng Expo Go trên Android để quét mã này.</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(expoUrl)}" alt="QR Code" />
        <br/>
        <span class="url">${expoUrl}</span>
    </div>
</body>
</html>
`;

fs.writeFileSync('d:\\2BillionIdea\\mobile\\qr.html', html);
console.log('Created qr.html with URL:', expoUrl);
