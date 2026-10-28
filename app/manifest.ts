import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest{
  return {
    name:'تعلم سلمى وسما',
    short_name:'سلمى وسما',
    description:'منصة تعليم منزلية للرزم التعليمية الفلسطينية — الفصل الأول',
    start_url:'/',
    display:'standalone',
    background_color:'#f7f8f5',
    theme_color:'#244b45',
    orientation:'portrait',
    lang:'ar',
    dir:'rtl',
    icons:[
      {src:'/icon-192.svg',sizes:'192x192',type:'image/svg+xml',purpose:'any'},
      {src:'/icon-512.svg',sizes:'512x512',type:'image/svg+xml',purpose:'any'}
    ]
  };
}
