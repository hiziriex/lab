import { Component, type ReactNode } from 'react';
import { Button, Callout } from '@radix-ui/themes';
export class ToolBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; generation: number }
> {
  state = { failed: false, generation: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Callout.Root color="red">
        <Callout.Text>ツールで予期しないエラーが発生しました。</Callout.Text>
        <Button
          highContrast
          onClick={() => this.setState((s) => ({ failed: false, generation: s.generation + 1 }))}
        >
          ツールを再読み込み
        </Button>
      </Callout.Root>
    ) : (
      <div key={this.state.generation}>{this.props.children}</div>
    );
  }
}
