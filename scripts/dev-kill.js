// Kills any process holding the dev ports (8787 mock-api, 5173/5174 vite)
// so `pnpm run dev` always starts from a clean slate. Cross-platform (Node).
const { execSync } = require('node:child_process')

const PORTS = [8787, 5173, 5174]

function pidsOnPort(port) {
  const out = execSync(`netstat -ano -p tcp`, { windowsHide: true })
    .toString()
    .split('\n')
    .filter((l) => l.includes(`:${port}`) && /LISTENING/.test(l))
    .map((l) => l.trim().split(/\s+/).pop())
    .filter(Boolean)
  return [...new Set(out)]
}

for (const port of PORTS) {
  const pids = pidsOnPort(port)
  if (!pids.length) continue
  for (const pid of pids) {
    try {
      process.kill(Number(pid), 'SIGKILL')
      console.log(`freed port ${port} (killed pid ${pid})`)
    } catch {
      // already gone
    }
  }
}
console.log('dev ports cleared')
