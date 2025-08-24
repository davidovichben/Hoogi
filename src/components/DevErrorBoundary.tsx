import React from "react";
type State = { error: Error | null };
export default class DevErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(err: Error, info: any) { console.error("UI Error:", err, info); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{padding:16,fontFamily:"sans-serif"}}>
        <h2>Something went wrong</h2>
        <pre style={{whiteSpace:"pre-wrap"}}>{this.state.error.message}</pre>
        <button onClick={()=>location.reload()}>Reload</button>
      </div>
    );
  }
}
