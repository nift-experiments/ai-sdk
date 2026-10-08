import React from 'react';
export default function Image({src,fill,priority,quality,placeholder,blurDataURL,loader,unoptimized,...props}: any){
  const value=typeof src==='string'?src:src?.src;
  return <img {...props} src={value} loading={priority?'eager':'lazy'} style={{...(fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:{}),...props.style}}/>;
}
