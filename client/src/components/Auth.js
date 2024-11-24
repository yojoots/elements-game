import { auth, provider } from "../firebase-config.js";
import { signInWithPopup } from "firebase/auth";
import "../styles/Auth.css";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export const Auth = ({ setIsAuth }) => {
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Only store the token after successful authentication
      cookies.set("auth-token", result.user.refreshToken, {
        path: '/',
        sameSite: 'strict',
        secure: window.location.protocol === 'https:',
        maxAge: 3600 * 24 * 30 // 30 days
      });
      setIsAuth(true);
    } catch (err) {
      console.error("Auth error:", err);
      cookies.remove("auth-token");
      setIsAuth(false);
    }
  };

  return (
    <div className="auth auth-button-section">
      <button className="auth-button" onClick={signInWithGoogle}> Sign In With Google </button>
    </div>
  );
};