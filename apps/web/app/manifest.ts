import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'منصة التعلم الفلسطينية',
    short_name: 'Pal Learning',
    description: 'تعلم المنهاج واكتشف الفجوات وعالجها.',
    start_url: '/student',
    display: 'standalone',
    background_color: '#f6f8fb',
    theme_color: '#14213d',
    lang: 'ar',
    dir: 'rtl',
  };
}
