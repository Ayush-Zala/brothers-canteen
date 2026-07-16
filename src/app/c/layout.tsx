import { Coffee, LogOut } from 'lucide-react'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col bg-white text-zinc-900 max-w-2xl mx-auto w-full relative sm:border-x sm:border-zinc-200 shadow-2xl">
      <header className="flex h-14 items-center justify-between px-4 border-b border-zinc-200 bg-white/90 backdrop-blur z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
            <Coffee className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900">Brothers Canteen</h1>
            <p className="text-[10px] text-emerald-500 font-medium tracking-wider uppercase">Open</p>
          </div>
        </div>
        <div className="flex items-center">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-zinc-400 hover:text-zinc-900 p-2 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </main>
    </div>
  )
}
