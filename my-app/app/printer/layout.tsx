import Sidebar from "./Sidebar";

type PrinterLayoutProps = {
  children: React.ReactNode;
};

export default function PrinterLayout({ children }: PrinterLayoutProps) {
  return (
    <div className="flex bg-gradient-to-t from-blue-900 via-green-700 to-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="bg-white/10 rounded-lg p-6 shadow-lg h-full text-white">
          {children}
        </div>
      </main>
    </div>
  );
}
