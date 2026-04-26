import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="glass p-8 text-center space-y-3 max-w-md mx-auto mt-16"
        >
          <p className="text-red-400 font-medium">{this.props.message}</p>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => window.location.reload()}
          >
            ↺ Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
