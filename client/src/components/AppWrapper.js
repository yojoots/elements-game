import { auth } from "../firebase-config.js";
import { signOut } from "firebase/auth";

import Cookies from "universal-cookie";

const cookies = new Cookies();

export const AppWrapper = ({ children, isAuth, setIsAuth, setIsInChat }) => {
  const signUserOut = async () => {
    await signOut(auth);
    cookies.remove("auth-token");
    setIsAuth(false);
    setIsInChat(false);
  };

  return (
    <div className="App">
      <div className="w-full">{children}</div>
      {isAuth && (
        <div className="signout">
          <button title="Sign Out" className="auth-button signout-button" onClick={signUserOut}>⏻</button>
        </div>
      )}
    </div>
  );
};
