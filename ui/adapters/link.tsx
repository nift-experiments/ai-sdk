import React from "react";
export default function Link({prefetch,replace,scroll,passHref,legacyBehavior,...props}: any){if(typeof props.href==='string'&&props.href.startsWith('https://ai-sdk.dev/'))props.href=props.href.slice('https://ai-sdk.dev'.length);return <a {...props}/>;}
