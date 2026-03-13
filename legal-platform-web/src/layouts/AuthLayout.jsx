export default function AuthLayout({ children }) {
  return (
    <div className="flex justify-content-center align-items-center min-h-screen p-4 bg-blue-50">
      <div className="w-full md:w-30rem">
        {children}
      </div>
    </div>
  );
}