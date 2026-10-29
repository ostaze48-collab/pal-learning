import type {ReactNode} from 'react';
import StudentRouteJourneyTracker from './StudentRouteJourneyTracker';

export default async function StudentLayout({children,params}:{children:ReactNode;params:Promise<{slug:string}>}){
 const {slug}=await params;
 return <><StudentRouteJourneyTracker student={slug}/>{children}</>;
}
