import React from "react";
export default function Link({prefetch,replace,scroll,passHref,legacyBehavior,...props}: any){
 if(typeof props.href==='string'){
  if(/^https:\/\/ai-sdk\.dev(?:[/?#]|$)/.test(props.href))props.href=props.href.slice('https://ai-sdk.dev'.length)||'/';
  if(props.href.startsWith('/')&&!props.href.startsWith('//'))props.href=props.href.replace(/\/(?=[?#]|$)/,'')||'/';
 }
 return <a {...props}/>;
}
