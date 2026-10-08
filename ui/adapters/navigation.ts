// The pinned English documentation components only read the locale parameter.
// Nift route/version ownership stays in the explicit publication manifest.
export {useParams,usePathname,useRouter,useSelectedLayoutSegment} from './route-context';

export const notFound=()=>{throw new Error('Unresolved migration route');};
