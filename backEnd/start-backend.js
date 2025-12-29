const { exec } = require('child_process');
const app = require('./app');

const PORT = process.env.PORT || 5000;

// Function to kill process using the port
const killPortProcess = (port) => {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
            pids.add(parts[4]);
          }
        });
        
        if (pids.size > 0) {
          console.log(`🔄 Port ${port} is in use. Clearing...`);
          pids.forEach(pid => {
            exec(`taskkill /PID ${pid} /F`, () => {});
          });
          setTimeout(resolve, 1000);
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  });
};

// Start server with port conflict handling
const startServer = async () => {
  try {
    await killPortProcess(PORT);
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📡 API Status: http://localhost:${PORT}/api/status`);
      console.log(`🔗 Frontend should connect to: http://localhost:${PORT}/api`);
    });

    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`❌ Port ${PORT} still in use. Retrying...`);
        await killPortProcess(PORT);
        setTimeout(() => startServer(), 2000);
      } else {
        console.error('❌ Server error:', error.message);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

startServer();