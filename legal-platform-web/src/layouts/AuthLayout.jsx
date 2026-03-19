export default function AuthLayout({ children }) {
  return (
    <div className="auth-stage">
      <div className="auth-stage__mesh" />
      <div className="auth-stage__content">
        {children}
      </div>
    </div>
  );
}
