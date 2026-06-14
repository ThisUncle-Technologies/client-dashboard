import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

interface Step {
  href: string
  title: string
  body: string
}

const ALL_STEPS: Step[] = [
  { href: '/dashboard', title: 'Overview', body: 'Your home base. Get a quick summary of your account and recent activity.' },
  { href: '/clients',   title: 'Clients',  body: 'Manage all your clients and their contact information.' },
  { href: '/users',     title: 'Users',    body: 'Manage login accounts and assign sites to each client.' },
  { href: '/sites',     title: 'Sites',    body: 'View and manage the websites connected to your account.' },
  { href: '/media',     title: 'Media',    body: 'Upload images and videos. Everything you upload is stored here and ready to use.' },
  { href: '/gallery',   title: 'Gallery',  body: 'Group your media into named sections that appear on your website automatically.' },
  { href: '/analytics', title: 'Analytics', body: 'See how visitors are interacting with your website.' },
]

function storageKey(userId: string) {
  return `tour_done_${userId}`
}

interface Rect { top: number; left: number; width: number; height: number }

function getRect(href: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`a[href="${href}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

interface TourProps {
  openTrigger: number
}

export function Tour({ openTrigger }: TourProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [steps, setSteps] = useState<Step[]>([])

  const resolveSteps = useCallback(() => {
    return ALL_STEPS.filter(s => !!document.querySelector(`a[href="${s.href}"]`))
  }, [])

  useEffect(() => {
    if (!user) return
    const seen = localStorage.getItem(storageKey(user.id))
    if (!seen) {
      setTimeout(() => {
        const visible = resolveSteps()
        setSteps(visible)
        setStep(0)
        setOpen(true)
      }, 600)
    }
  }, [user, resolveSteps])

  useEffect(() => {
    if (openTrigger === 0) return
    const visible = resolveSteps()
    setSteps(visible)
    setStep(0)
    setOpen(true)
  }, [openTrigger, resolveSteps])

  useEffect(() => {
    if (!open || steps.length === 0) return
    const current = steps[step]
    if (!current) return
    setRect(getRect(current.href))
  }, [open, step, steps])

  function next() {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      done()
    }
  }

  function prev() {
    setStep(s => s - 1)
  }

  function done() {
    setOpen(false)
    if (user) localStorage.setItem(storageKey(user.id), '1')
  }

  const current = steps[step]
  const isLast = step === steps.length - 1

  const tooltipStyle = rect ? {
    top: Math.max(8, rect.top + rect.height / 2 - 80),
    left: rect.left + rect.width + 20,
  } : { top: '50%', left: 220 }

  return (
    <>
      {open && current && (
        <>
          <div
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={done}
          />

          {rect && (
            <div
              className="fixed z-[201] rounded-lg pointer-events-none"
              style={{
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
                boxShadow: '0 0 0 3px white, 0 0 0 6px rgba(255,255,255,0.3)',
              }}
            />
          )}

          <div
            className="fixed z-[202] w-72"
            style={tooltipStyle}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-3 bg-white dark:bg-gray-800 rotate-45"
              style={{ marginTop: -2 }}
            />
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-5">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
                Step {step + 1} of {steps.length}
              </p>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{current.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">{current.body}</p>

              <div className="flex items-center gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${i === step ? 'w-4 h-1.5 bg-gray-900 dark:bg-white' : 'w-1.5 h-1.5 bg-gray-200 dark:bg-gray-600'}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                >
                  {isLast ? 'Done' : 'Next →'}
                </button>
              </div>

              <button
                onClick={done}
                className="w-full mt-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Skip tour
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
