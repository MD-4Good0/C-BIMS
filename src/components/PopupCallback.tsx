import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function PopupCallback() {
  useEffect(() => {
    let handled = false;

    function notifyAndClose() {
      if (handled) return;

      handled = true;

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "BIMS_AUTH_SUCCESS",
          },
          "*"
        );

        window.close();
        return;
      }

      window.location.replace("/dashboard");
    }

    async function finishLogin() {
      try {
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Failed to set popup session:", error);
            window.location.replace("/");
            return;
          }

          notifyAndClose();
          return;
        }

        const { data } = await supabase.auth.getSession();

        if (data.session) {
          notifyAndClose();
          return;
        }

        window.location.replace("/");
      } catch (err) {
        console.error("Popup callback failed:", err);
        window.location.replace("/");
      }
    }

    finishLogin();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-black/60">Finishing login...</p>
    </div>
  );
}