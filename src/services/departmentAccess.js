// services/departmentAccess.js
import { db } from '../firebase-config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

export class DepartmentAccessService {
  /**
   * Check if user is member of department
   */
  static async isMember(deptId, userId) {
    const memberRef = doc(db, 'departments', deptId, 'members', userId);
    const memberSnap = await getDoc(memberRef);
    return memberSnap.exists();
  }

  /**
   * Get user's departments
   */
  static async getUserDepartments(userId) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.data().departments || [];
  }

  /**
   * Get department posts (only if member)
   */
  static async getPosts(deptId, userId) {
    // Verify membership first
    const isMember = await this.isMember(deptId, userId);
    if (!isMember) {
      throw new Error('Access denied: You are not a member of this department');
    }

    const postsRef = collection(db, 'departments', deptId, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Post to department (only if member)
   */
  static async createPost(deptId, userId, postData) {
    const isMember = await this.isMember(deptId, userId);
    if (!isMember) {
      throw new Error('Access denied: You are not a member of this department');
    }

    const postsRef = collection(db, 'departments', deptId, 'posts');
    const newPost = await addDoc(postsRef, {
      ...postData,
      authorId: userId,
      createdAt: new Date(),
      likes: 0,
      likedBy: []
    });

    return newPost.id;
  }

  /**
   * Delete post (admin or author only)
   */
  static async deletePost(deptId, postId, userId, userRole) {
    const postRef = doc(db, 'departments', deptId, 'posts', postId);
    const postSnap = await getDoc(postRef);
    const postData = postSnap.data();

    const isAuthor = postData.authorId === userId;
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    if (!isAuthor && !isAdmin) {
      throw new Error('Access denied: You can only delete your own posts');
    }

    await deleteDoc(postRef);
  }

  /**
   * Add member to department (admin only)
   */
  static async addMember(deptId, userId, role, adminId) {
    const memberRef = doc(db, 'departments', deptId, 'members', userId);
    
    await setDoc(memberRef, {
      userId,
      role: role || 'member',
      joinedAt: new Date(),
      joinedBy: adminId,
      status: 'active'
    });

    // Update user's departments array
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      departments: arrayUnion(deptId)
    });
  }

  /**
   * Remove member from department (admin only)
   */
  static async removeMember(deptId, userId, adminId) {
    const memberRef = doc(db, 'departments', deptId, 'members', userId);
    await deleteDoc(memberRef);

    // Update user's departments array
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      departments: arrayRemove(deptId)
    });
  }
}