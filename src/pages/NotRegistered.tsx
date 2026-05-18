import { Link } from "react-router-dom";

export default function NotRegistered() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/95 p-8 text-center text-black shadow-xl">
        <h1 className="mb-2 text-2xl font-extrabold text-upred">
          Access Required
        </h1>

        <p className="mb-4 text-sm text-black/70">
          Your account is not yet approved for the system.
        </p>

        <Link
          to="/request-access"
          className="inline-flex rounded-xl bg-upred px-5 py-2 text-sm font-medium text-white transition hover:scale-105"
        >
          Request Access
        </Link>
      </div>
    </div>
  );
}