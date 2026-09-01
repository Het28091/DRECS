export function Footer() {
  return (
    <footer className="border-t border-slate-800 px-6 py-4 text-center">
      <p className="text-xs text-slate-600">
        &copy; {new Date().getFullYear()} DRECS — Disaster Response &amp; Emergency Coordination System
      </p>
    </footer>
  );
}
