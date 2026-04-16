import { 
  ref, get, set, push, remove 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getFirebaseAuth, getFirebaseDb } from './config.js';
import { getCurrentUser } from './auth.js';
import { showToast, timeAgo, getInitials } from './utils.js';

export async function fetchComments(eventId) {
  const db = getFirebaseDb();
  
  try {
    const commentsRef = ref(db, `events/${eventId}/comments`);
    const snapshot = await get(commentsRef);
    
    if (!snapshot.exists()) {
      return { data: [], error: null };
    }
    
    const commentsData = snapshot.val();
    let comments = Object.entries(commentsData).map(([id, data]) => ({ id, ...data }));
    
    comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    
    const enriched = await Promise.all(comments.map(async (comment) => {
      if (comment.user_id) {
        const userRef = ref(db, `users/${comment.user_id}`);
        const userSnap = await get(userRef);
        if (userSnap.exists()) {
          comment.profiles = { id: userSnap.key, ...userSnap.val() };
        }
      }
      return comment;
    }));
    
    return { data: enriched, error: null };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { data: [], error };
  }
}

export async function addComment(eventId, content) {
  const user = await getCurrentUser();
  if (!user) {
    showToast('Please sign in to comment', 'error');
    return { error: 'Not authenticated' };
  }
  
  if (!content.trim()) {
    showToast('Please enter a comment', 'error');
    return { error: 'Empty comment' };
  }
  
  if (content.length > 500) {
    showToast('Comment is too long (max 500 characters)', 'error');
    return { error: 'Comment too long' };
  }
  
  const db = getFirebaseDb();
  
  try {
    const commentsRef = ref(db, `events/${eventId}/comments`);
    const newCommentRef = push(commentsRef);
    
    await set(newCommentRef, {
      event_id: eventId,
      user_id: user.id,
      user_name: user.displayName || user.profile?.name || user.email,
      user_avatar: user.photoURL || user.profile?.avatar_url,
      content: content.trim(),
      createdAt: Date.now()
    });
    
    const comment = {
      id: newCommentRef.key,
      event_id: eventId,
      user_id: user.id,
      user_name: user.displayName || user.profile?.name || user.email,
      user_avatar: user.photoURL || user.profile?.avatar_url,
      content: content.trim(),
      createdAt: Date.now()
    };
    
    return { data: comment, error: null };
  } catch (error) {
    showToast(error.message || 'Failed to post comment', 'error');
    return { data: null, error: error.message };
  }
}

export async function deleteComment(eventId, commentId) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }
  
  const db = getFirebaseDb();
  
  try {
    const commentRef = ref(db, `events/${eventId}/comments/${commentId}`);
    await remove(commentRef);
    showToast('Comment deleted', 'info');
    return { error: null };
  } catch (error) {
    showToast(error.message || 'Failed to delete comment', 'error');
    return { error: error.message };
  }
}

export function renderComment(comment, currentUserId) {
  const isOwn = currentUserId === comment.user_id;
  const name = comment.profiles?.name || comment.user_name || 'Unknown';
  const avatar = comment.profiles?.avatar_url || comment.user_avatar;
  const initials = getInitials(name);
  
  const timestamp = comment.createdAt 
    ? new Date(comment.createdAt).toISOString() 
    : new Date().toISOString();
  
  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <div class="avatar avatar-sm">
        ${avatar ? 
          `<img src="${avatar}" alt="${name}">` :
          `<span>${initials}</span>`
        }
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">${name}</span>
          ${comment.profiles?.role !== 'student' ? 
            `<span class="badge badge-${comment.profiles?.role === 'admin' ? 'primary' : 'warning'}" style="font-size: 0.625rem; padding: 2px 6px;">${comment.profiles?.role}</span>` 
            : ''
          }
          <span class="comment-time">${timeAgo(timestamp)}</span>
        </div>
        <p class="comment-text">${escapeHtml(comment.content)}</p>
      </div>
      ${isOwn ? `
        <button class="btn btn-ghost btn-icon delete-comment" data-comment-id="${comment.id}" title="Delete comment">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      ` : ''}
    </div>
  `;
}

export function renderCommentsList(comments, currentUserId) {
  if (comments.length === 0) {
    return `
      <div class="empty-state" style="padding: var(--space-8) 0;">
        <p class="empty-state-text">No comments yet. Be the first to share your thoughts!</p>
      </div>
    `;
  }
  
  return comments.map(comment => renderComment(comment, currentUserId)).join('');
}

export function renderCommentForm() {
  return `
    <form class="comment-form" id="comment-form">
      <textarea 
        class="input" 
        id="comment-input" 
        placeholder="Share your thoughts about this event..."
        rows="3"
        maxlength="500"
      ></textarea>
      <div class="char-counter" id="char-counter">0/500</div>
      <div class="comment-form-actions">
        <button type="submit" class="btn btn-primary btn-sm" id="submit-comment">
          Post Comment
        </button>
      </div>
    </form>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function subscribeToComments(eventId, callback) {
  const db = getFirebaseDb();
  
  const commentsRef = ref(db, `events/${eventId}/comments`);
  
  import { onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
  
  const unsubscribe = onValue(commentsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback({ type: 'INITIAL', data: [] });
      return;
    }
    
    const commentsData = snapshot.val();
    const comments = Object.entries(commentsData).map(([id, data]) => ({ id, ...data }));
    comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    
    callback({ type: 'INITIAL', data: comments });
  });
  
  return unsubscribe;
}
