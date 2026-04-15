import { ReactNode } from 'react';
import skoolvynLogo from '@/assets/skoolvyn_logo.png';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-primary-foreground/20 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-primary-foreground/10 translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-primary-foreground/10" />
        </div>
        <div className="relative z-10 text-primary-foreground text-center px-12 max-w-lg">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={skoolvynLogo} alt="Skoolvyn logo" className="h-20 w-auto drop-shadow-2xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Skoolvyn</h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Digital System for Modern Schools. Simplify administration, empower educators, and engage students.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
            <img src={skoolvynLogo} alt="Skoolvyn logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-foreground">Skoolvyn</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
