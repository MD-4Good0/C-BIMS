// src/pages/PopupCallback.tsx
import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function PopupCallback() {
  useEffect(() => {
    async function sendSessionToOpener() {
      // Get the new session
      const { data } = await supabase.auth.getSession();

      // Send session info back to main window
      if (window.opener && data.session) {
        window.opener.postMessage(
          { type: "SUPABASE_LOGIN_SUCCESS", session: data.session },
          window.location.origin
        );
      }

      // Close the popup
      window.close();
    }

    sendSessionToOpener();
  }, []);

  return (  
    <div className="w-screen h-screen flex items-center justify-center font-poppins font-light text-xl bg-black text-white/30">
    </div>
  );

}
