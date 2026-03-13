import Navbar from '../components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen surface-ground">
      <Navbar />
      <div className="p-4 md:p-5">
        {children}
      </div>
    </div>
  );
}