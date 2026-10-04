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

// Project descriptions and awards follow the owner's brief. Public links were
// checked against GitHub's repository API and ETHGlobal's official showcase.
// No team roles, performance measurements or deployment claims are inferred.
export const projects: Project[] = [
  {
    id: 'verix',
    number: '01',
    name: 'VERIX',
    category: 'Carbon credit infrastructure',
    statement: 'FROM PHYSICAL SIGNAL TO ON-CHAIN VALUE.',
    description: 'A Solana carbon credit ecosystem connecting real-time IoT monitoring, AI agents and an automated marketplace. Environmental data becomes the starting point for verifiable credits and transparent compliance.',
    problem: 'Carbon credit trading needs a traceable connection between what happens in the physical world and what changes hands in a marketplace.',
    solution: 'Sensor data moves into a multi-agent layer. Agents coordinate marketplace activity, while Solana records the credits on-chain. The system connects observation, coordination and settlement in one flow.',
    detail: 'Real-time IoT signals feed a Google ADK and A2A agent layer before resolving into on-chain carbon credits.',
    stack: ['Solana', 'AI Agents', 'IoT', 'Google ADK', 'A2A'],
    flow: ['IoT sensors', 'Live data', 'AI agents', 'Marketplace', 'On-chain credit'],
    award: 'WINNER — CYPHERPUNK / $5,000 LOCAL TRACK, NEPAL',
    decisions: [
      { title: 'Start with the signal', body: 'Bring environmental monitoring into the credit lifecycle through real-time IoT data.' },
      { title: 'Coordinate through agents', body: 'Use Google ADK and agent-to-agent communication to connect the marketplace’s separate responsibilities.' },
      { title: 'Make the record inspectable', body: 'Represent credits on Solana so the marketplace has a transparent on-chain record.' },
    ],
    outcomes: 'Winner of the Cypherpunk $5,000 local track in Nepal. Verix brings sensing, agent coordination and on-chain credits into a single carbon trading ecosystem.',
  },
  {
    id: 'cex',
    number: '02',
    name: 'CEX',
    category: 'Go / trading systems',
    statement: 'A CONCURRENT TRADING ENGINE BUILT IN GO.',
    description: 'A Go trading-system project exploring order matching, persistent balances and real-time market data. Its central concern is how concurrent requests become ordered, auditable state changes.',
    problem: 'Orders arrive concurrently. Matching, balances and market updates need a consistent view of what happened, even when a client retries or the process restarts.',
    solution: 'The architecture connects authenticated, validated orders to a matching engine, persistent state and WebSocket feeds. The current public simulator is being developed around durable commands, deterministic replay and an auditable ledger.',
    detail: 'Concurrency, order validation and real-time market data meet a design focused on deterministic replay and auditable balances.',
    stack: ['Go', 'PostgreSQL', 'REST', 'WebSockets', 'Concurrency'],
    flow: ['Buy / sell orders', 'Validation', 'Match engine', 'Trade', 'Market feed'],
    repo: 'https://github.com/SrijitGyawali/Centralized-Exchange',
    decisions: [
      { title: 'Order the state changes', body: 'Treat matching and balance updates as one systems problem, with concurrency correctness at the center.' },
      { title: 'Design for recovery', body: 'The public simulator targets a durable command journal and replay that reproduces the same state after restart.' },
      { title: 'Separate request and delivery', body: 'REST handles commands; WebSockets carry market updates to connected clients in the planned architecture.' },
    ],
    outcomes: 'An ongoing backend systems project. The linked public simulator currently documents an early implementation stage; durability, replay and ledger guarantees are explicit development targets. Paper trading uses simulated funds.',
  },
  {
    id: 'tapguard',
    number: '03',
    name: 'TAPGUARD VAULT',
    category: 'Cryptographic payments',
    statement: 'CRYPTOGRAPHIC PAYMENTS AT THE TAP OF A DEVICE.',
    description: 'An NFC payment flow backed by a Solana smart vault. A device interaction becomes a cryptographic signature, then an authorized transfer under the vault’s rules.',
    problem: 'A payment can feel simple at the interface while still requiring verifiable authorization, controlled spending and a way to halt access.',
    solution: 'The client connects a Web NFC interaction to signature verification. Anchor programs govern PDA-based vault accounts, daily limits and an emergency freeze before SOL or SPL tokens move.',
    detail: 'secp256k1 verification, PDA-based vault accounts, daily spending limits and emergency freeze controls.',
    stack: ['Rust / Anchor', 'Solana', 'React', 'TypeScript', 'Web NFC'],
    flow: ['NFC device', 'Signature', 'Verification', 'Smart vault', 'Solana'],
    repo: 'https://github.com/SrijitGyawali/tapguard-vault',
    decisions: [
      { title: 'Verify the authorization', body: 'Use secp256k1 signature verification to connect a signed payment request to the vault’s execution path.' },
      { title: 'Keep policy with the vault', body: 'PDA-based accounts hold vault state, including daily spending limits and emergency freeze controls.' },
      { title: 'Cover native and token value', body: 'The payment flow accounts for both SOL and SPL token transfers.' },
    ],
    outcomes: 'A payment interaction that connects a physical tap with cryptographic verification and programmable vault controls on Solana.',
  },
  {
    id: 'smartmarket',
    number: '04',
    name: 'SMARTMARKET',
    category: 'Autonomous commerce',
    statement: 'AGENTS COORDINATE. VALUE MOVES.',
    description: 'Autonomous agents coordinate a decentralized carbon credit marketplace, connecting user intent, marketplace activity and blockchain payments.',
    problem: 'A marketplace request spans several responsibilities: understanding intent, finding credits, checking balances and coordinating payment.',
    solution: 'An orchestrator routes tasks to specialist agents. Google A2A connects their conversations, while the Hedera Agent Kit supports the payment layer.',
    detail: 'Specialist agents carry a task from orchestration through marketplace coordination to blockchain settlement.',
    stack: ['Hedera', 'Hedera Agent Kit', 'Google A2A', 'AI Agents'],
    flow: ['User intent', 'Orchestration', 'Agent coordination', 'Transaction', 'Settlement'],
    award: '2ND PLACE — ETHONLINE 2025 / HEDERA AGENT KIT + GOOGLE A2A',
    year: '2025',
    repo: 'https://github.com/NirajBhattarai/a2amarketplace',
    demo: 'https://ethglobal.com/showcase/smartmarket-1g67h',
    decisions: [
      { title: 'Give agents focused work', body: 'Separate marketplace, payment and monitoring responsibilities behind a central orchestrator.' },
      { title: 'Connect intent to execution', body: 'Use agent communication to carry a request across services through to a blockchain transaction.' },
      { title: 'Keep the flow observable', body: 'Return transaction confirmations and expose agent status through the web interface.' },
    ],
    outcomes: 'Awarded second place for Best Use of Hedera Agent Kit & Google A2A at ETHOnline 2025.',
  },
]
