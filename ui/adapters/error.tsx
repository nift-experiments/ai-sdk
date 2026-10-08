import React from 'react';
// Only the package's scoped chat render boundary uses this API.
export function catchError(fallback:any){
 return class Boundary extends React.Component<any,{error:Error|null}>{
  state={error:null as Error|null};
  static getDerivedStateFromError(error:Error){return {error};}
  render(){return this.state.error?fallback(this.props,{error:this.state.error,retry:()=>this.setState({error:null})}):this.props.children;}
 };
}
