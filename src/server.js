import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3000;

// ==============================
// Start Server
// ==============================
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════╗');
  console.log('║        POS BACKEND SERVER            ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  🚀 Server  : http://localhost:${PORT}  ║`);
  console.log(`║  🌍 Env     : ${(process.env.NODE_ENV || 'development').padEnd(20)} ║`);
  console.log(`║  📅 Started : ${new Date().toLocaleTimeString().padEnd(20)} ║`);
  console.log('╚══════════════════════════════════════╝');
});
