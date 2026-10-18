import HeroScene from './HeroScene';

// Split screen for login/register: illustration on the left, form on the right.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-[calc(100vh-61px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <HeroScene className="absolute inset-0 size-full" />
        <div className="relative p-12">
          <p className="max-w-sm font-display text-6xl leading-[0.95] tracking-wide">
            Twisties, ghats &amp; <span className="text-brand-500">honest reviews.</span>
          </p>
          <p className="mt-4 max-w-sm text-zinc-300">Join riders across Mumbai and Pune mapping the best (and worst) roads.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-5xl leading-none tracking-wide">{title}</h1>
          <p className="mb-8 mt-2 text-zinc-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
