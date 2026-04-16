import { ref, get } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirebaseDb } from './config.js';

export async function fetchOrganizations() {
  const db = getFirebaseDb();
  
  try {
    const orgsRef = ref(db, 'organizations');
    const snapshot = await get(orgsRef);
    
    if (!snapshot.exists()) {
      return { data: [], error: null };
    }
    
    const orgsData = snapshot.val();
    const organizations = Object.entries(orgsData).map(([id, data]) => ({ id, ...data }));
    
    organizations.sort((a, b) => a.name.localeCompare(b.name));
    
    return { data: organizations, error: null };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return { data: [], error };
  }
}

export async function fetchOrganization(orgId) {
  const db = getFirebaseDb();
  
  try {
    const orgRef = ref(db, `organizations/${orgId}`);
    const snapshot = await get(orgRef);
    
    if (!snapshot.exists()) {
      return { data: null, error: 'Organization not found' };
    }
    
    return { data: { id: snapshot.key, ...snapshot.val() }, error: null };
  } catch (error) {
    console.error('Error fetching organization:', error);
    return { data: null, error };
  }
}

export async function fetchOrganizationsByIds(orgIds) {
  if (!orgIds || orgIds.length === 0) return [];
  
  const db = getFirebaseDb();
  const organizations = [];
  
  for (const orgId of orgIds) {
    try {
      const orgRef = ref(db, `organizations/${orgId}`);
      const snapshot = await get(orgRef);
      
      if (snapshot.exists()) {
        organizations.push({ id: snapshot.key, ...snapshot.val() });
      }
    } catch (error) {
      console.error(`Error fetching org ${orgId}:`, error);
    }
  }
  
  return organizations;
}

export function renderOrganizationCard(org) {
  return `
    <div class="card" style="padding: var(--space-6); text-align: center;">
      <div style="width: 64px; height: 64px; border-radius: 50%; margin: 0 auto var(--space-4); overflow: hidden;">
        ${org.logo_url 
          ? `<img src="${org.logo_url}" alt="${org.name}" style="width: 100%; height: 100%; object-fit: cover;">`
          : `<div style="width: 100%; height: 100%; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary); font-weight: bold; font-size: 1.5rem;">${org.name.charAt(0)}</div>`
        }
      </div>
      <h3 style="font-size: 1.125rem; margin-bottom: var(--space-2);">${org.name}</h3>
      <p style="color: var(--text-secondary); font-size: 0.875rem;">${org.description || 'No description'}</p>
    </div>
  `;
}

export function renderOrganizationSkeleton() {
  return `
    <div class="card" style="padding: var(--space-6);">
      <div class="skeleton" style="width: 64px; height: 64px; border-radius: 50%; margin: 0 auto var(--space-4);"></div>
      <div class="skeleton skeleton-text" style="width: 80%; height: 1.5em; margin: 0 auto var(--space-2);"></div>
      <div class="skeleton skeleton-text" style="width: 60%; margin: 0 auto;"></div>
    </div>
  `;
}
