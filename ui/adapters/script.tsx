import React from 'react';
export default function Script({strategy,onLoad,onReady,...props}:any){return <script {...props} onLoad={onLoad}/>;}
