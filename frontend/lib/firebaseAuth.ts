import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Interface for user data
export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'teacher' | 'student';
  createdAt: Date;
  updatedAt: Date;
}

// Register with email and password
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  role: 'teacher' | 'student' = 'teacher'
): Promise<UserCredential | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile
    await updateProfile(userCredential.user, { displayName });
    
    // Save user data to Firestore
    await saveUserToFirestore(userCredential.user, role);
    
    return userCredential;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential | null> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check if user exists in Firestore, if not create
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await saveUserToFirestore(result.user, 'teacher');
    }
    
    return result;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Sign in with GitHub
export const signInWithGithub = async (): Promise<UserCredential | null> => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    
    // Check if user exists in Firestore, if not create
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await saveUserToFirestore(result.user, 'teacher');
    }
    
    return result;
  } catch (error) {
    console.error('GitHub sign in error:', error);
    throw error;
  }
};

// Save user to Firestore
export const saveUserToFirestore = async (
  firebaseUser: User,
  role: 'teacher' | 'student' = 'teacher'
): Promise<void> => {
  try {
    const userData: UserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Only add photoURL if it exists
    if (firebaseUser.photoURL) {
      userData.photoURL = firebaseUser.photoURL;
    }
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    throw error;
  }
};

// Get user from Firestore
export const getUserFromFirestore = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? (userDoc.data() as UserData) : null;
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    return null;
  }
};

// Sign out
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Get current user ID token
export const getUserIdToken = async (): Promise<string> => {
  const user = getCurrentUser();
  if (!user) throw new Error('No user logged in');
  return await user.getIdToken();
};
