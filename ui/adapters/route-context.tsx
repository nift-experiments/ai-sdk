import React,{createContext,useContext} from 'react';
const Route=createContext('/docs/introduction');
export const RouteProvider=Route.Provider;
export const usePathname=()=>useContext(Route);
export const useParams=()=>{
 const segments=usePathname().split('/').filter(Boolean);
 const offset=['v5','v6'].includes(segments[0])?2:1;
 return {lang:'en',slug:segments.slice(offset)};
};
export const useRouter=()=>({push:(url:string)=>window.location.assign(url),replace:(url:string)=>window.location.replace(url),refresh:()=>window.location.reload(),prefetch:()=>{}});
export const useSelectedLayoutSegment=()=>usePathname().split('/').filter(Boolean)[0]??null;
