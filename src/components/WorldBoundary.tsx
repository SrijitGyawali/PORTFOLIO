import { Component, type ReactNode } from 'react'

/** Loading or rendering the optional world must never remove the portfolio. */
export default class WorldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <div className="webgl-world" data-webgl="fallback" aria-hidden="true" /> : this.props.children
  }
}
