export type Project = {
  id: string
  number: string
  name: string
  category: string
  statement: string
  description: string
  problem: string
  solution: string
  detail: string
  stack: string[]
  flow: string[]
  award?: string
  year?: string
  repo?: string
  demo?: string
  decisions: { title: string; body: string }[]
  outcomes: string
}

// Project content and results transcribed from Srijit Gyawali's resume.
export const projects: Project[] = [
  {
    id: 'cex', number: '01', name: 'CEX',
    category: 'Centralized Exchange',
    statement: 'CRASH-SAFE SPOT EXCHANGE IN GO.',
    description: 'Engineered a crash-safe spot-exchange matching engine in Go with one goroutine owning all trading state and a checksummed write-ahead journal.',
    problem: 'Concurrent order processing, crash recovery and exact monetary accounting.',
    solution: 'Group commit shares one disk sync (fsync) across many orders. Integer fixed-point units and a double-entry ledger keep money exact, with ledger invariants checked after every crash.',
    detail: '3,200 orders/s at 2.4 ms median latency; recovery replays 1M commands in 8 seconds.',
    stack: ['Go', 'PostgreSQL', 'WebSocket', 'Prometheus', 'Docker'],
    flow: ['HTTP request', 'Single-owner engine', 'Write-ahead journal', 'Ledger postings', 'Replay inspector'],
    repo: 'https://github.com/SrijitGyawali/Centralized-Exchange',
    decisions: [
      { title: 'Throughput and latency', body: 'Group commit sustained 3,200 orders/s at a 2.4 ms median latency, about 4× the ~750 orders/s ceiling of one fsync per order.' },
      { title: 'Crash-tested durability', body: 'Hard-killed the live server 5 times under 32 concurrent clients: 129,063 of 129,063 acknowledged requests survived. All 233 lost responses, retried with the same idempotency key, took effect exactly once. Recovery replays 1M commands in 8 seconds.' },
      { title: 'Exact accounting and inspection', body: 'Used integer fixed-point units and a double-entry ledger whose invariants are checked after every crash. Added a replay inspector that traces any order from request to ledger postings.' },
      { title: 'Profiling and instrumentation', body: 'Instrumented HTTP, engine and disk latency with Prometheus. Profiling showed ~93% of engine time was spent waiting on disk syncs. Cut per-order metrics overhead by 72% and shipped the release with 12 design records and Docker Compose.' },
    ],
    outcomes: 'Crash-safe matching, verified recovery and exactly-once effects under retry, with measured throughput and latency.',
  },
  {
    id: 'swiflo', number: '02', name: 'SWIFLO',
    category: 'Gulf-to-Nepal Remittance on Solana',
    statement: 'USDC TO NPR. GULF TO NEPAL.',
    description: "Built a USDC remittance platform where on-chain escrow locks the sender’s funds and a Money Transfer Operator pays the family’s eSewa wallet in NPR.",
    problem: 'Tracking remittances from on-chain escrow through local payout and settlement.',
    solution: 'Anchor programs manage the remittance pool and LP liquidity vault. The backend combines a settlement service, Helius-webhook indexer and a layered rate service using Pyth and ExchangeRate-API with cached fallbacks.',
    detail: 'On-chain escrow, eSewa payouts, LP liquidity and settlement tracking.',
    stack: ['Solana Anchor (Rust)', 'Fastify + TypeScript', 'PostgreSQL (Prisma)', 'Next.js', 'Pyth', 'Docker'],
    flow: ['INITIATED', 'ADVANCED', 'DISBURSED', 'SETTLED'],
    repo: 'https://github.com/SrijitGyawali/SWIFLO', demo: 'https://www.swiflo.xyz/',
    decisions: [
      { title: 'Escrow and local payout', body: 'Locked sender USDC in on-chain escrow while a Money Transfer Operator pays the family’s eSewa wallet in NPR. Each transfer progresses through INITIATED, ADVANCED, DISBURSED and SETTLED.' },
      { title: 'Programs and backend services', body: 'Wrote Anchor programs for the remittance pool and LP liquidity vault, plus a settlement service, Helius-webhook indexer and layered rate service with Pyth, ExchangeRate-API and cached fallbacks.' },
    ],
    outcomes: 'A Gulf-to-Nepal remittance platform connecting USDC escrow with NPR payouts to eSewa wallets.',
  },
  {
    id: 'smartmarket', number: '03', name: 'SMARTMARKET',
    category: 'AI-Agent Carbon Credit Marketplace',
    statement: 'EIGHT AGENTS. ONE CARBON MARKETPLACE.',
    description: 'Built a carbon credit marketplace run by 8 specialized AI agents. An orchestrator routes natural-language requests, such as “buy 100 credits”, to payment, marketplace, IoT and pre-booking agents.',
    problem: 'Coordinating natural-language credit purchases, sensor data, pre-sales and blockchain payments.',
    solution: 'Connected ESP32 CO₂ sensors over MQTT to predict future credits for discounted pre-sale, with real payments on Hedera, Ethereum and Polygon.',
    detail: '8 specialized agents, ESP32 CO₂ sensing and payments across Hedera, Ethereum and Polygon.',
    stack: ['Google ADK + Gemini', 'Hedera Agent Kit', 'A2A', 'Next.js', 'PostgreSQL', 'Redis', 'MQTT / ESP32'],
    flow: ['Natural-language request', 'Orchestrator', 'Specialist agents', 'Carbon credits', 'Blockchain payment'],
    award: '2ND PLACE — HEDERA: BEST USE OF HEDERA AGENT KIT & GOOGLE A2A', year: '2025',
    demo: 'https://ethglobal.com/showcase/smartmarket-1g67h',
    decisions: [
      { title: 'Specialized agent orchestration', body: 'Built an 8-agent marketplace where an orchestrator routes natural-language requests to payment, marketplace, IoT and pre-booking agents.' },
      { title: 'Sensor-driven pre-sales', body: 'Connected ESP32 CO₂ sensors over MQTT to predict future credits for discounted pre-sale, with real payments on Hedera, Ethereum and Polygon.' },
    ],
    outcomes: '2nd Place — Hedera: Best Use of Hedera Agent Kit & Google A2A, ETHOnline 2025 (ETHGlobal).',
  },
  {
    id: 'swasthyasetu', number: '04', name: 'SWASTHYASETU',
    category: 'Telehealth Platform',
    statement: 'FIRST-AID CHAT TO LIVE DOCTOR CALLS.',
    description: 'Built a Go backend with REST APIs and WebSockets in one process for AI first-aid chat in English and Nepali via MedGemma, urgent-message flagging and a live doctor queue.',
    problem: 'Connecting bilingual first-aid chat with verified doctors for WebRTC video consultations.',
    solution: 'Verified doctors accept patients from a live queue for WebRTC calls. Google OAuth, admin-reviewed professional verification, rate limiting and a server-side verified-only check control access.',
    detail: 'MedGemma first-aid chat, urgent-message flagging and verified-doctor video consultations.',
    stack: ['Go', 'PostgreSQL', 'WebSockets', 'WebRTC', 'Google OAuth', 'Next.js', 'Docker'],
    flow: ['First-aid chat', 'Urgent-message flagging', 'Live queue', 'Verified doctor', 'WebRTC call'],
    repo: 'https://github.com/POOKIEE-DEVS/SwasthyaSetu', demo: 'https://swasthyasetu-580o.onrender.com/',
    decisions: [
      { title: 'Bilingual chat and consultations', body: 'Built REST APIs and WebSockets in one Go process for MedGemma first-aid chat in English and Nepali, urgent-message flagging and a live queue where verified doctors accept patients for WebRTC video calls.' },
      { title: 'Verification and access controls', body: 'Added Google OAuth, admin-reviewed professional verification, rate limiting and a server-side verified-only check, covered by 169 Go tests and CI on GitHub Actions.' },
    ],
    outcomes: 'A telehealth platform with bilingual first-aid chat and verified-doctor consultations, covered by 169 Go tests and GitHub Actions CI.',
  },
]
