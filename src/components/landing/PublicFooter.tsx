import { Link } from 'react-router-dom';
import skoolvynLogo from '@/assets/skoolvyn_logo.png';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[hsl(222,47%,4%)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src={skoolvynLogo} alt="Skoolvyn logo" className="h-9 w-auto" />
              <span className="text-lg font-bold text-white tracking-tight">Skoolvyn</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Digital System for Modern Schools. Manage students, staff, fees, and more — all in one platform.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-sm font-semibold text-white/80 uppercase tracking-wider">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-white/40 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/30">© {new Date().getFullYear()} Skoolvyn. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
