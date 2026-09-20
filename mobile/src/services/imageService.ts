import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import api from './api';

export const pickImage = async (options?: { aspect?: [number, number] }): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    alert('Permission to access gallery is required!');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: options?.aspect || [1, 1],
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
};

export const takePhoto = async (options?: { aspect?: [number, number] }): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    alert('Permission to access camera is required!');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: options?.aspect || [1, 1],
    quality: 0.8,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
};

export const uploadImage = async (
  localUri: string,
  folder: 'avatars' | 'restaurants' | 'menu-items'
): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  const filename = localUri.split('/').pop() || 'image.jpg';
  const match = /\.([\w]+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
    name: filename,
    type,
  } as any);
  formData.append('folder', folder);

  const response = await api.post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

type TransformPreset = 'avatar-sm' | 'avatar-lg' | 'restaurant-card' | 'restaurant-hero' | 'menu-card' | 'menu-item' | 'gallery';

const TRANSFORM_MAP: Record<TransformPreset, string> = {
  'avatar-sm': 'w_100,h_100,c_fill,g_face,q_auto,f_auto',
  'avatar-lg': 'w_200,h_200,c_fill,g_face,q_auto,f_auto',
  'restaurant-card': 'w_400,h_250,c_fill,q_auto,f_auto',
  'restaurant-hero': 'w_800,h_400,c_fill,q_auto,f_auto',
  'menu-card': 'w_300,h_300,c_fill,q_auto,f_auto',
  'menu-item': 'w_300,h_300,c_fill,q_auto,f_auto',
  'gallery': 'w_800,c_limit,q_auto,f_auto',
};

export const getTransformedUrl = (url: string, preset: TransformPreset): string => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Insert transform before /v{number}/ or /tezu-kitchen/
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;
  const before = url.substring(0, uploadIndex + 8); // includes '/upload/'
  const after = url.substring(uploadIndex + 8);
  return `${before}${TRANSFORM_MAP[preset]}/${after}`;
};
