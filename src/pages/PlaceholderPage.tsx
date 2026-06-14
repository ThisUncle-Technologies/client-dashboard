import { AppLayout } from '../components/layout/AppLayout'

interface Props {
  title: string
}

export function PlaceholderPage({ title }: Props) {
  return (
    <AppLayout title={title}>
      <div className="flex items-center justify-center h-64 border border-dashed border-gray-200 rounded-lg">
        <p className="text-sm text-gray-400">Coming soon</p>
      </div>
    </AppLayout>
  )
}
