export default function NotRegistered() {
  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="bg-white text-black p-8 rounded-lg text-center">
        <h1 className="text-xl font-bold mb-2">Access Denied</h1>
        <p className="mb-4">Your account is not registered in the system.</p>
        <p className="text-sm text-gray-500">
          Please contact an administrator to request access.
        </p>
      </div>
    </div>
  );
}