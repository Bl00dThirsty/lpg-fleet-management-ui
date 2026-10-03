// scripts/dev-kill.js — kill any process listening on port 8787 (mock-api) before dev
const { execSync } = require('node:child_process')

const PORT = 8787

function killPort(port) {
  let output
  try {
    output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' })
  } catch {
    console.log(`[dev-kill] port ${port} is free`)
    return
  }

  const pids = new Set()
  for (const line of output.split('\n')) {
    const match = line.trim().match(/\s(\d+)$/)
    if (match) pids.add(match[1])
  }

  if (pids.size === 0) {
    console.log(`[dev-kill] port ${port} is free`)
    return
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
      console.log(`[dev-kill] killed PID ${pid} on port ${port}`)
    } catch {
      // already gone
    }
  }
}

killPort(PORT)
