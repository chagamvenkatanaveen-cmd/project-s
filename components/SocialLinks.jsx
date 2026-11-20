import SocialBrandIcon from './SocialBrandIcon';

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/slipcordlive/?hl=en',
    platform: 'instagram',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/slip-cord-0bb63244b/',
    platform: 'linkedin',
  },
  {
    label: 'X',
    href: 'https://x.com/slipcordlive',
    platform: 'x',
  },
  {
    label: 'Reddit',
    href: 'https://www.reddit.com/user/slipcordlive/',
    platform: 'reddit',
  },
];

export default function SocialLinks({ className = '' }) {
  return (
    <nav aria-label="Social media" className={`flex flex-col items-center gap-3 ${className}`}>
      <span className="text-xs font-medium text-[#71847a]">Follow us for quick updates:</span>
      <div className="flex items-center gap-3">
        {socialLinks.map(({ label, href, platform }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0b3d2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167a42]"
          >
            <SocialBrandIcon platform={platform} size={18} />
          </a>
        ))}
      </div>
    </nav>
  );
}
