import { showToast } from './utils.js';
import { CLOUDINARY } from './config.js';

async function generateSignature(params) {
  const paramsToSign = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  const stringToSign = paramsToSign + CLOUDINARY.apiSecret;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function uploadToCloudinary(file, folder) {
  const timestamp = Math.round(Date.now() / 1000);
  const publicId = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const params = {
    timestamp: timestamp.toString(),
    upload_preset: CLOUDINARY.uploadPreset,
    folder: `muk_luma/${folder}`,
    public_id: publicId
  };
  
  const signature = await generateSignature(params);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('timestamp', timestamp);
  formData.append('upload_preset', CLOUDINARY.uploadPreset);
  formData.append('folder', `muk_luma/${folder}`);
  formData.append('public_id', publicId);
  formData.append('signature', signature);
  formData.append('api_key', CLOUDINARY.apiKey);
  
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return {
      publicUrl: data.secure_url,
      publicId: data.public_id,
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
  
  try {
    showToast('Uploading image...', 'info');
    const result = await uploadToCloudinary(file, 'events');
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
