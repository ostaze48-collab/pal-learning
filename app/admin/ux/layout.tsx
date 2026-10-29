import type {ReactNode} from 'react';
import JourneyEntryPanel from './JourneyEntryPanel';

export default function UXLayout({children}:{children:ReactNode}){
 return <>{children}<JourneyEntryPanel/></>;
}
