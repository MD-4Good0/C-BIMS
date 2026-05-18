import { useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function PopupCallback() {
  useEffect(() => {
    let handled = false;

    function finishLogin() {
      if (handled) return;

      handled = true;

      if (window.opener) {
        window.opener.postMessage(
          {
            type: "BIMS_AUTH_SUCCESS",
          },
          window.location.origin
        );

        window.close();
      } else {
        window.location.href = "/dashboard";
      }
    }

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        finishLogin();
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        finishLogin();
      }
    });

    checkSession();

    const fallbackTimer = setTimeout(() => {
      checkSession();
    }, 1000);

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-sm text-black/60">Finishing login...</p>
    </div>
  );
}