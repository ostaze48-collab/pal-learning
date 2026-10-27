import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'منصة التعلم الفلسطينية — Beta',
    short_name: 'تعلم فلسطين',
    description: 'نسخة تجريبية: علوم الصف الخامس — المجهر واكتشاف الخلية.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f8fb',
    theme_color: '#176b3a',
    lang: 'ar',
    dir: 'rtl',
  };
}
