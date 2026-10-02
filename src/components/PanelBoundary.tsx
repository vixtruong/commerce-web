import { messages } from '../lib/messages';
import { Component, type ReactNode } from 'react';
import { ErrorState } from './Feedback';

/** Contains a section's rendering failure while leaving the surrounding workspace usable. */
export class PanelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <ErrorState error={new Error(messages.panelFailed)} retry={() => this.setState({ failed: false })} />
    ) : (
      this.props.children
    );
  }
}
