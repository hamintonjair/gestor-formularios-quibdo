import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing app if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/directory.readonly',
];

const createProvider = () => {
  const p = new GoogleAuthProvider();
  for (const scope of SCOPES) {
    p.addScope(scope);
  }
  p.setCustomParameters({
    prompt: 'consent select_account',
    access_type: 'offline',
  });
  return p;
};

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory. MUST NOT store in localStorage/sessionStorage.
let cachedAccessToken: string | null = null;

// Check redirect result on load
export const checkRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token =
        credential?.accessToken ||
        (result as unknown as { _tokenResponse?: { oauthAccessToken?: string } })
          ?._tokenResponse?.oauthAccessToken;

      if (token) {
        cachedAccessToken = token;
        return { user: result.user, accessToken: cachedAccessToken };
      }
    }
  } catch (error) {
    console.error('Redirect result error:', error);
  }
  return null;
};

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        try {
          const redirectRes = await checkRedirectResult();
          if (redirectRes) {
            cachedAccessToken = redirectRes.accessToken;
            if (onAuthSuccess) onAuthSuccess(redirectRes.user, redirectRes.accessToken);
            return;
          }
        } catch (e) {
          console.error(e);
        }

        if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = createProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    const token =
      credential?.accessToken ||
      (result as unknown as { _tokenResponse?: { oauthAccessToken?: string } })
        ?._tokenResponse?.oauthAccessToken;

    if (!token) {
      throw new Error(
        'No se pudo obtener el token de acceso de Google. Asegúrate de marcar los permisos de Google Forms en la ventana de autorización.'
      );
    }

    cachedAccessToken = token;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    const errObj = error as { code?: string };
    if (errObj?.code === 'auth/popup-closed-by-user' || errObj?.code === 'auth/popup-blocked') {
      throw new Error('La ventana emergente fue cerrada o bloqueada por el navegador. Usa el botón de inicio de sesión alternativo (Redirección).');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInRedirect = async () => {
  try {
    isSigningIn = true;
    const provider = createProvider();
    await signInWithRedirect(auth, provider);
  } catch (error) {
    console.error('Redirect sign in error:', error);
    isSigningIn = false;
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
