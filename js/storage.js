import { showToast } from './utils.js';
import { SUPABASE } from './config.js';

async function uploadToSupabase(file, folder) {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
  const fileExt = file.name.split('.').pop();
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', `${folder}/${filename}`);
  formData.append('upsert', 'true');
  
  const response = await fetch(`${SUPABASE.url}/storage/v1/object/${folder}/${filename}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE.anonKey}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error('Upload failed: ' + error);
  }
  
  const data = await response.json();
  const publicUrl = `${SUPABASE.url}/storage/v1/object/public/${folder}/${filename}`;
  
  return {
    publicUrl: publicUrl,
    publicId: filename,
    path: `${folder}/${filename}`
  };
}

export async function uploadEventImage(file, eventId) {
  if (!file) {
    return { data: null, error: 'No file provided' };
  }
  
  try {
    showToast('Uploading image...', 'info');
    const result = await uploadToSupabase(file, 'events');
    showToast('Image uploaded!', 'success');
    return { data: result, error: null };
  } catch (error) {
    showToast('Failed to upload image', 'error');
    return { data: null, error: error.message };
  }
}

export async function deleteEventImage(publicId) {
  return { error: null };
}

export async function uploadOrganizationLogo(file, orgId) {
  if (!file) {
    return { data: null, error: 'No file provided' };
  }
  
  try {
    showToast('Uploading logo...', 'info');
    const result = await uploadToSupabase(file, 'logos');
    showToast('Logo uploaded!', 'success');
    return { data: result, error: null };
  } catch (error) {
    showToast('Failed to upload logo', 'error');
    return { data: null, error: error.message };
  }
}

export async function uploadUserAvatar(file) {
  if (!file) {
    return { data: null, error: 'No file provided' };
  }
  
  try {
    showToast('Uploading avatar...', 'info');
    const result = await uploadToSupabase(file, 'avatars');
    showToast('Avatar uploaded!', 'success');
    return { data: result, error: null };
  } catch (error) {
    showToast('Failed to upload avatar', 'error');
    return { data: null, error: error.message };
  }
}

export function getPlaceholderAvatar(userId) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'user'}`;
}

export function getPlaceholderEventImage() {
  const placeholders = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800'
  ];
  return placeholders[Math.floor(Math.random() * placeholders.length)];
}
