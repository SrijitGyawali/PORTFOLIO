// The three engineering layers shown in Core Capabilities and summarised in llms.txt.
export const systems = [
  { name: 'BACKEND', title: 'THE FOUNDATION.', description: 'Clear contracts. Reliable data. Services that do the quiet, essential work.', skills: ['Go', 'PostgreSQL', 'Redis', 'REST / gRPC', 'Docker', 'Authentication / JWT'], label: 'REQUEST → PROCESS → PERSIST' },
  { name: 'DISTRIBUTED', title: 'BUILT TO COORDINATE.', description: 'Independent services. Shared intent. Systems that stay correct when everything happens at once.', skills: ['Goroutines / Channels / Context', 'Concurrency / Microservices', 'Kafka / Message Queues', 'Idempotency / WebSockets', 'Event-Driven Architecture', 'SQL Optimization / Scalable Design'], label: 'EVENT → COORDINATE → SCALE' },
  { name: 'WEB3', title: 'VALUE, PROGRAMMABLE.', description: 'Verifiable execution and transparent ownership, from the contract to the wallet.', skills: ['Solana / Anchor / Rust', 'Solidity / Ethereum', 'DeFi / Smart Contracts', 'Web3.js / Ethers.js', 'Wallet Integration / x402', 'On-chain Voting / Liquidity Pools'], label: 'SIGN → VERIFY → SETTLE' },
]
