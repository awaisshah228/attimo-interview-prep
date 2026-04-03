export default function TicketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-3">
        <nav className="flex items-center gap-4">
          <span className="text-lg font-semibold tracking-tight">
            Support Portal
          </span>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl">{children}</main>
    </div>
  )
}