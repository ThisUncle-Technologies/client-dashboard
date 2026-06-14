interface TopbarProps {
  title: string
}

export function Topbar({ title }: TopbarProps) {
  return (
    <header className="h-14 flex items-center px-6 border-b border-gray-100 bg-white shrink-0">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
    </header>
  )
}
