import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const FEATURES = [
  {
    icon: '📝',
    title: 'Apply Online',
    desc: 'Fill out your application from the comfort of your home — no queues, no hassle.',
    color: 'from-brand-400 to-brand-600',
  },
  {
    icon: '📎',
    title: 'Upload Documents',
    desc: 'Securely upload hospital records, parent IDs, and supporting documents digitally.',
    color: 'from-violet-400 to-violet-600',
  },
  {
    icon: '🔔',
    title: 'Track Status',
    desc: 'Monitor your application in real-time as ward and district offices review it.',
    color: 'from-emerald-400 to-emerald-600',
  },
]

const STEPS = [
  { num: '01', title: 'Register', desc: 'Create your citizen account in seconds.' },
  { num: '02', title: 'Apply', desc: 'Fill the form and upload your documents online.' },
  { num: '03', title: 'Track', desc: 'Get approved — no office visits required.' },
]

const GALLERY = [
  {
    url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop&q=80',
    alt: 'Sleeping newborn baby',
    caption: 'New arrival',
  },
  {
    url: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400&h=300&fit=crop&q=80',
    alt: 'Baby holding parent finger',
    caption: 'First moments',
  },
  {
    url: 'https://images.pexels.com/photos/18857314/pexels-photo-18857314.jpeg',
    alt: 'Mother with newborn',
    caption: 'Family joy',
  },
  {
    url: 'https://images.pexels.com/photos/36786571/pexels-photo-36786571.jpeg?auto=compress&cs=tinysrgb&w=600',
    alt: 'Happy baby smiling',
    caption: 'First smile',
  },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-hero min-h-[calc(100vh-64px)] flex items-center overflow-hidden">

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl animate-float" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl animate-float delay-300" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-brand-200 text-sm font-medium px-4 py-1.5 rounded-full mb-8 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online E-Governance Portal
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight font-display animate-slide-up">
                Register Your
                <span className="block mt-1" style={{ background: 'linear-gradient(90deg, #a5b4fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Little One's Birth
                </span>
              </h1>

              <p className="text-lg text-brand-200 mb-10 animate-slide-up delay-100 leading-relaxed">
                Apply for a birth certificate, upload documents, and track your
                application status online — no need to visit the ward office.
              </p>

              {!user && (
                <div className="flex flex-col sm:flex-row items-start gap-4 animate-slide-up delay-200">
                  <Link
                    to="/register"
                    id="hero-get-started"
                    className="btn-primary text-base px-8 py-3.5 rounded-2xl shadow-xl shadow-brand-900/30"
                  >
                    Get Started — It&apos;s Free
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    id="hero-login"
                    className="flex items-center gap-2 text-base font-semibold text-white/80 hover:text-white px-6 py-3.5 rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {user && user.role === 'citizen' && (
                <Link
                  to="/apply"
                  id="hero-apply"
                  className="btn-primary text-base px-8 py-3.5 rounded-2xl shadow-xl shadow-brand-900/30 animate-slide-up delay-200"
                >
                  Submit a New Application
                </Link>
              )}

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-4 animate-slide-up delay-300">
                {[['Fully Online', 'No office visit'], ['Secure', 'Encrypted data'], ['Fast', 'Quick review']].map(([title, sub]) => (
                  <div key={title} className="text-center">
                    <p className="text-white font-bold text-base font-display">{title}</p>
                    <p className="text-brand-300 text-xs mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Photo collage */}
            <div className="hidden lg:block relative animate-slide-up delay-200">
              {/* Main large photo */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/40 animate-float">
                <img
                  src="https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=600&h=400&fit=crop&q=80"
                  alt="Mother holding newborn baby"
                  className="w-full h-72 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/40 to-transparent" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow">
                  <p className="text-brand-900 text-sm font-bold">Every Life Matters 💙</p>
                  <p className="text-slate-500 text-xs">Register your newborn today</p>
                </div>
              </div>

              {/* Small floating cards */}
              <div className="absolute -bottom-6 -left-6 w-40 h-32 rounded-2xl overflow-hidden shadow-xl border-4 border-white animate-float delay-200">
                <img
                  src="https://images.unsplash.com/photo-1544126592-807ade215a0b?w=200&h=160&fit=crop&q=80"
                  alt="Happy smiling baby"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-36 h-28 rounded-2xl overflow-hidden shadow-xl border-4 border-white animate-float delay-400">
                <img
                  src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=180&h=140&fit=crop&q=80"
                  alt="Parents holding newborn"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Certificate icon badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2">
                <span className="text-2xl">📜</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Digital Certificate</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">✓ Officially Registered</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Photo Gallery Strip ── */}
      <section className="py-12 bg-white border-y border-slate-100 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            Celebrating Every New Life in Nepal
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {GALLERY.map((img, i) => (
              <div
                key={img.alt}
                className="relative rounded-2xl overflow-hidden group cursor-default animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <p className="text-white text-xs font-semibold">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14 animate-slide-up">
          <span className="text-brand-600 font-bold text-xs uppercase tracking-widest">Simple Process</span>
          <h2 className="text-3xl font-extrabold text-slate-800 mt-2 font-display">3 Steps to Your Certificate</h2>
          <p className="text-slate-500 mt-2 text-base max-w-md mx-auto">From registration to approval — completely digital, completely hassle-free.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.num} className="relative card p-8 text-center animate-slide-up" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="text-5xl font-extrabold gradient-text font-display mb-4 opacity-30">{step.num}</div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm">{step.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-brand-300 text-xl">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features + Image side by side ── */}
      <section className="bg-gradient-to-b from-white/0 to-brand-50/60 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Photo */}
            <div className="relative rounded-3xl overflow-hidden shadow-card animate-slide-up">
              <img
                src="https://images.pexels.com/photos/34120065/pexels-photo-34120065.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Happy baby smiling"
                className="w-full h-72 lg:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 to-transparent" />
              {/* Floating stat */}
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg text-center">
                <p className="text-3xl font-extrabold gradient-text font-display">100%</p>
                <p className="text-xs text-slate-500 font-medium">Online Process</p>
              </div>
            </div>

            {/* Features list */}
            <div>
              <span className="text-brand-600 font-bold text-xs uppercase tracking-widest">Why Choose Us</span>
              <h2 className="text-3xl font-extrabold text-slate-800 mt-2 mb-8 font-display">Everything You Need</h2>
              <div className="space-y-5">
                {FEATURES.map((f, i) => (
                  <div key={f.title} className="flex items-start gap-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 mb-1">{f.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      {!user && (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-8 sm:p-10 shadow-xl border border-white/10">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-brand-400 blur-3xl animate-float" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-indigo-300 blur-3xl animate-float delay-300" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mb-2">Ready to get started?</h2>
                <p className="text-brand-200 text-sm sm:text-base mb-6 max-w-md">Register your newborn&apos;s birth certificate online in minutes — safe, secure, and fully digital.</p>
                <Link to="/register" id="cta-register" className="btn-primary text-base px-7 py-3">
                  Create Free Account →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Online Birth Certificate Portal
          </p>
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Online
          </div>
        </div>
      </footer>
    </div>
  )
}
