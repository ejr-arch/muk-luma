import { showToast } from './utils.js';
import { CLOUDINARY } from './config.js';

async function uploadToCloudinary(file, folder) {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
  
  console.log('Uploading to Cloudinary:', CLOUDINARY.cloudName);
  console.log('File:', file.name, file.type, file.size);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY.uploadPreset);
  if (folder) formData.append('folder', folder);
  
  try {
    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    console.log('Cloudinary response:', response.status, JSON.stringify(data));
    
    if (!response.ok) {
      console.error('Cloudinary error:', data);
      throw new Error(data.error?.message || data.error?.error?.message || 'Upload failed');
    }
    
    console.log('Cloudinary upload success:', data.secure_url);
    
    return {
      publicUrl: data.secure_url,
      publicId: filename,
      path: data.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function uploadEventImage(file, eventId) {
  if (!file) {
    return { data: null, error: 'No file provided' };
  }
  
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return { data: null, error: 'File too large. Maximum size is 20MB.' };
  }
  
  try {
    const isVideo = file.type.startsWith('video/');
    showToast(isVideo ? 'Uploading video...' : 'Uploading...', 'info');
    const result = await uploadToCloudinary(file, 'events');
    showToast('Uploaded successfully!', 'success');
    return { data: result, error: null };
  } catch (error) {
    showToast('Failed to upload', 'error');
    return { data: null, error: error.message };
  }
}

export async function deleteEventImage(imageUrl) {
  if (!imageUrl || !CLOUDINARY.cloudName) {
    return { error: null };
  }
  
  try {
    const publicId = `events/${imageUrl.split('/').pop().split('.')[0]}`;
    
    const timestamp = Math.round(Date.now() / 1000);
    const paramsStr = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY.uploadPreset}`;
    
    console.log('Deleting Cloudinary image:', publicId);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_id: publicId, timestamp, upload_preset: CLOUDINARY.uploadPreset })
    });
    
    if (!response.ok) {
      console.error('Cloudinary delete error:', response.status);
    } else {
      console.log('Cloudinary image deleted successfully');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Delete image error:', error);
    return { error: error.message };
  }
}

export async function uploadOrganizationLogo(file, orgId) {
  if (!file) {
    return { data: null, error: 'No file provided' };
  }
  
  try {
    showToast('Uploading logo...', 'info');
    const result = await uploadToCloudinary(file, 'logos');
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
    const result = await uploadToCloudinary(file, 'avatars');
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
