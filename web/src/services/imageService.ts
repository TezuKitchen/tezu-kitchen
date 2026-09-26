import api from './api';

type TransformPreset =
  | 'avatar-sm'
  | 'avatar-lg'
  | 'restaurant-card'
  | 'restaurant-hero'
  | 'menu-card'
  | 'menu-item'
  | 'gallery';

const TRANSFORM_MAP: Record<TransformPreset, string> = {
  'avatar-sm': 'w_100,h_100,c_fill,g_face,q_auto,f_auto',
  'avatar-lg': 'w_200,h_200,c_fill,g_face,q_auto,f_auto',
  'restaurant-card': 'w_400,h_250,c_fill,q_auto,f_auto',
  'restaurant-hero': 'w_800,h_400,c_fill,q_auto,f_auto',
  'menu-card': 'w_300,h_300,c_fill,q_auto,f_auto',
  'menu-item': 'w_300,h_300,c_fill,q_auto,f_auto',
  gallery: 'w_800,c_limit,q_auto,f_auto',
};

export function getTransformedUrl(
  url: string | undefined | null,
  preset: TransformPreset
): string {
  if (!url) return '';
  const transform = TRANSFORM_MAP[preset];
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  return (
    url.slice(0, uploadIndex + 8) +
    transform +
    '/' +
    url.slice(uploadIndex + 8)
  );
}

export async function uploadImage(
  file: File,
  folder: 'avatars' | 'restaurants' | 'menu-items'
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}
