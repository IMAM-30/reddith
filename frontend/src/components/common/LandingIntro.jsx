import { useState } from 'react';

const ITH_LOGO = '/logo/ith-logo.png';
const ITH_WORDMARK = '/logo/ith-wordmark.png';

const steps = [
  {
    kicker: 'Selamat datang',
    title: 'Forum diskusi kampus untuk mahasiswa ITH.',
    body: 'Reddith menjadi ruang hangat untuk mahasiswa Institut Teknologi Bacharuddin Jusuf Habibie berbagi informasi, bertanya, dan mengikuti percakapan kampus yang relevan.',
    accent: '#ff6b35',
    chips: ['Akademik', 'Kegiatan', 'Komunitas'],
    previewTitle: 'Diskusi kampus hari ini',
    previewRows: ['Info kelas pengganti minggu ini', 'Rekomendasi komunitas teknologi', 'Agenda organisasi dan kegiatan kampus'],
    stat: 'Ruang kampus',
    statValue: 'ITH BJ Habibie',
  },
  {
    kicker: 'Forum mahasiswa',
    title: 'Topik akademik dan kabar kampus lebih mudah diikuti.',
    body: 'Cari diskusi perkuliahan, organisasi, kegiatan, dan komunitas. Percakapan yang paling membantu bisa naik lewat vote agar mudah ditemukan mahasiswa lain.',
    accent: '#2563eb',
    chips: ['Cari topik', 'Vote', 'Komentar'],
    previewTitle: 'Alur diskusi yang rapi',
    previewRows: ['Filter topik per komunitas', 'Vote untuk jawaban bernilai', 'Komentar tersusun dalam satu tempat'],
    stat: 'Alur diskusi',
    statValue: 'Baca, cari, respon',
  },
  {
    kicker: 'Terima kasih',
    title: 'Masuk ke beranda dan mulai jelajahi Reddith.',
    body: 'Kamu bisa melihat diskusi kampus dari beranda publik. Saat ingin ikut memberi suara, berkomentar, atau membuat postingan, login dengan akunmu dan mulai berkontribusi.',
    accent: '#16a34a',
    chips: ['Beranda publik', 'Login opsional', 'Mulai kontribusi'],
    previewTitle: 'Siap masuk ke Reddith',
    previewRows: ['Lihat postingan kampus tanpa login', 'Masuk saat ingin berinteraksi', 'Jaga diskusi tetap rapi dan bermanfaat'],
    stat: 'Mulai dari',
    statValue: 'Beranda kampus',
  },
];

function IntroPreview({ step }) {
  const current = steps[step];

  return (
    <div
      className="landing-preview-card relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] border p-4 shadow-2xl"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        boxShadow: '0 28px 70px rgba(15, 23, 42, 0.18)',
      }}
    >
      <div className="landing-preview-header mb-4 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={ITH_LOGO}
            alt=""
            className="landing-preview-logo h-11 w-11 shrink-0 rounded-xl bg-white object-contain p-1.5 shadow-sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: current.accent }}>
              Forum Kampus
            </p>
            <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Institut Teknologi B.J. Habibie
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className="h-2.5 w-2.5 rounded-full transition-all duration-500"
              style={{
                backgroundColor: item === step ? current.accent : 'var(--border-color)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="landing-preview-main rounded-[22px] border p-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                {current.previewTitle}
              </p>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                Ruang percakapan mahasiswa ITH
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-black"
              style={{ backgroundColor: 'var(--accent-soft)', color: current.accent }}
            >
              Aktif
            </span>
          </div>

          <div className="space-y-2">
            {current.previewRows.map((row, index) => (
              <div key={row} className="landing-preview-row flex items-center gap-3 rounded-2xl px-3 py-3" style={{ backgroundColor: 'var(--bg-card)' }}>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                  style={{ backgroundColor: index === 0 ? current.accent : 'var(--text-faint)' }}
                >
                  {index + 1}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {row}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-preview-chips grid grid-cols-3 gap-2">
          {current.chips.map((label, index) => (
            <div
              key={label}
              className="rounded-2xl border px-3 py-4 text-center transition-all duration-500"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: index === 0 ? 'var(--accent-soft)' : 'var(--bg-card)',
              }}
            >
              <div className="mx-auto mb-2 h-7 w-7 rounded-full transition-all duration-500" style={{ backgroundColor: index === 0 ? current.accent : 'var(--bg-input)' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="landing-preview-stat rounded-2xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
          <img src={ITH_WORDMARK} alt="" className="mb-3 h-8 max-w-full object-contain object-left" />
          <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-faint)' }}>
            {current.stat}
          </p>
          <p className="mt-1 text-lg font-black" style={{ color: current.accent }}>
            {current.statValue}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingIntro({ isExiting = false, onFinish }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isExiting) return;

    if (isLast) {
      onFinish?.();
      return;
    }
    setStep((value) => value + 1);
  };

  return (
    <section
      className={`landing-intro-shell relative isolate min-h-screen overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5 sm:py-6 ${isExiting ? 'landing-intro-exit' : ''}`}
      style={{
        color: 'var(--text-primary)',
      }}
      aria-label="Pembuka Reddith"
    >
      <img src={ITH_LOGO} alt="" className="landing-watermark pointer-events-none absolute object-contain" aria-hidden="true" />
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full min-w-0 max-w-6xl flex-col">
        <header className="landing-intro-header flex justify-start pt-1 sm:pt-4">
          <div className="landing-brand-lockup flex min-w-0 items-center gap-4">
            <img
              src={ITH_LOGO}
              alt="Logo Institut Teknologi Bacharuddin Jusuf Habibie"
              className="landing-campus-emblem h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
            />
            <div className="min-w-0">
              <p className="landing-brand-wordmark text-5xl font-black tracking-tight text-orange-500 sm:text-6xl lg:text-7xl">
                Reddith
              </p>
              <p className="landing-brand-subtitle mt-2 max-w-xl text-sm font-semibold leading-6 sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                Forum diskusi kampus Institut Teknologi Bacharuddin Jusuf Habibie
              </p>
            </div>
          </div>
        </header>

        <div className="landing-intro-content relative grid min-w-0 flex-1 items-center gap-6 py-6 sm:gap-8 sm:py-8 lg:grid-cols-[1fr_0.9fr] lg:py-10">
          <div key={`landing-copy-${step}`} className="landing-copy-motion w-full min-w-0 max-w-2xl">
            <p className="app-kicker mb-4" style={{ color: current.accent }}>{current.kicker}</p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--text-primary)' }}>
              {current.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 sm:text-lg" style={{ color: 'var(--text-secondary)' }}>
              {current.body}
            </p>

            <div className="landing-hero-chips mt-7 flex flex-wrap gap-2">
              {current.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border px-3 py-1.5 text-xs font-black"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="landing-action-row mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={handleNext}
                disabled={isExiting}
                className="app-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black transition-all hover:-translate-y-0.5 active:scale-95 disabled:pointer-events-none disabled:opacity-80"
              >
                {isExiting ? 'Membuka Beranda' : isLast ? 'Masuk ke Beranda' : 'Lanjut'}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </div>

            <div className="landing-step-dots mt-8 flex gap-2" aria-hidden="true">
              {steps.map((item, index) => (
                <span
                  key={item.title}
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: index === step ? 32 : 10,
                    backgroundColor: index === step ? current.accent : 'var(--border-color)',
                  }}
                />
              ))}
            </div>
          </div>

          <div key={`landing-preview-${step}`} className="landing-preview-motion landing-preview-panel w-full min-w-0">
            <IntroPreview step={step} />
          </div>
        </div>
      </div>

      {isExiting && (
        <div className="landing-transition-overlay absolute inset-0 z-50 flex items-center justify-center px-6" aria-live="polite">
          <span className="landing-transition-sheen" aria-hidden="true" />
          <div className="landing-transition-panel text-center">
            <div className="landing-transition-mark mx-auto mb-5 flex items-center justify-center gap-4">
              <img src={ITH_LOGO} alt="" className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20" />
              <span className="text-5xl font-black tracking-tight text-orange-500 sm:text-6xl">Reddith</span>
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-[0.22em]" style={{ color: 'var(--text-secondary)' }}>
              Membuka beranda kampus
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
