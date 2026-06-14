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
  /** Increment this to force-open the tour from outside */
  openTrigger: number
}

export function Tour({ openTrigger }: TourProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)

  // Filter steps to only those whose nav link is actually in the DOM
  const [steps, setSteps] = useState<Step[]>([])

  const resolveSteps = useCallback(() => {
    return ALL_STEPS.filter(s => !!document.querySelector(`a[href="${s.href}"]`))
  }, [])

  // Auto-open on first visit
  useEffect(() => {
    if (!user) return
    const seen = localStorage.getItem(storageKey(user.id))
    if (!seen) {
      setTimeout(() => {
        const visible = resolveSteps()
        setSteps(visible)
        setStep(0)
        setOpen(true)
      }, 600) // slight delay so layout renders first
    }
  }, [user, resolveSteps])

  // Manual trigger from the ? button
  useEffect(() => {
    if (openTrigger === 0) return
    const visible = resolveSteps()
    setSteps(visible)
    setStep(0)
    setOpen(true)
  }, [openTrigger, resolveSteps])

  // Update highlight rect whenever step or open state changes
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

  // Position tooltip to the right of the sidebar nav item
  const tooltipStyle = rect ? {
    top: Math.max(8, rect.top + rect.height / 2 - 80),
    left: rect.left + rect.width + 20,
  } : { top: '50%', left: 220 }

  return (
    <>
      {open && current && (
        <>
          {/* Backdrop — click outside to dismiss */}
          <div
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={done}
          />

          {/* Spotlight ring around the nav item */}
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

          {/* Tooltip card */}
          <div
            className="fixed z-[202] w-72"
            style={tooltipStyle}
            onClick={e => e.stopPropagation()}
          >
            {/* Arrow pointing left toward the nav item */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-3 bg-white rotate-45"
              style={{ marginTop: -2 }}
            />
            <div className="bg-white rounded-xl shadow-2xl p-5">
              {/* Step counter */}
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                Step {step + 1} of {steps.length}
              </p>

              <h3 className="text-sm font-semibold text-gray-900 mb-1">{current.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{current.body}</p>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all ${i === step ? 'w-4 h-1.5 bg-gray-900' : 'w-1.5 h-1.5 bg-gray-200'}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex-1 py-2 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex-1 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  {isLast ? 'Done' : 'Next →'}
                </button>
              </div>

              <button
                onClick={done}
                className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
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
