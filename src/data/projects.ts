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
]
