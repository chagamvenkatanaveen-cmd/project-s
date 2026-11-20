import { UserRound } from 'lucide-react';
import {
  AVATAR_GLASSES_DESIGNS,
  AVATAR_HAIR_STYLES,
  AVATAR_SCARF_DESIGNS,
  AVATAR_SHIRT_DESIGNS,
  AVATAR_SKIN_TONES,
  DEFAULT_AVATAR_CONFIG,
  normalizeAvatarConfig,
} from '@/lib/avatarConfig';

const MALE_HAIR_PATHS = [
  'M31 36c0-12 7-20 17-20s17 8 17 20c-5-2-8-6-10-11-6 6-14 10-24 11Z',
  'M30 37c-1-12 5-20 15-21 11-2 20 7 21 19-5-3-9-5-12-10-5 7-13 11-24 12Z',
  'M29 37c0-13 7-21 19-21s19 8 19 21c-5-2-7-5-9-9-3 4-6 5-10 5-5 0-9 2-13 4-2 1-4 1-6 0Z',
  'M30 37l3-12 6 6 4-14 7 11 7-12 3 14 7-8 1 15c-7-2-12-5-16-10-5 6-12 9-22 10Z',
  'M30 37c0-13 7-21 18-21 10 0 17 7 18 20-6-1-9-5-12-9-2 5-6 7-11 7-4 0-8 2-13 3Z',
  'M29 38c0-15 8-23 19-23 12 0 19 9 19 24-7-2-12-6-16-12-5 7-13 10-22 11Z',
  'M28 38c0-14 8-23 20-23s20 9 20 23c-6-2-9-5-12-10-3 5-8 8-13 8-6 0-10 1-15 2Z',
  'M30 37c0-13 7-21 18-21s18 8 18 21c-6-2-11-5-15-10-5 7-12 10-21 10Z',
];

const FEMALE_HAIR_PATHS = [
  'M31 36c0-13 7-22 17-22s17 9 17 22c-5-2-9-6-11-11-5 6-13 10-23 11Z',
  'M30 37c-1-13 6-22 17-23 11-1 19 8 19 22-6-2-10-5-13-11-5 7-13 11-23 12Z',
  'M29 37c0-14 8-23 19-23s19 9 19 23c-6-2-9-6-11-11-4 6-13 10-27 11Z',
  'M29 37c0-14 7-23 19-23 12 0 19 9 19 23-5-1-10-5-13-11-4 7-13 11-25 11Z',
  'M29 37c0-15 8-24 19-24s19 9 19 24c-7-2-11-7-14-13-5 8-14 12-24 13Z',
  'M28 38c0-16 8-25 20-25 12 0 20 10 20 25-8-2-13-7-16-14-5 8-13 12-24 14Z',
  'M28 38c0-16 8-25 20-25s20 9 20 25c-7-2-12-6-15-12-6 8-14 11-25 12Z',
  'M29 37c0-14 7-23 19-23 11 0 18 9 19 23-7-2-11-5-14-10-5 6-13 10-24 10Z',
];

const FEMALE_BACK_HAIR_PATHS = [
  'M31 35c-5 8-6 19-3 30l4 7h8V42m16 0v30h8l4-8c3-11 2-21-3-29Z',
  'M30 34c-6 8-7 22-3 39l5 8h8V39m16 0v42h8l5-9c4-17 3-30-3-38Z',
  'M29 35c-7 8-7 23-2 35l5 8h9V40m14 0v38h9l5-8c5-14 4-27-3-35Z',
  'M30 35c-6 9-7 22-3 36l5 7h8V40m16 0v38h8l5-8c4-15 3-27-3-35Z',
  'M29 35c-6 10-7 25-2 40l5 8h8V39m16 0v44h8l5-9c5-16 4-30-3-39Z',
  'M29 34c-7 11-7 27-2 44l5 7h8V39m16 0v46h8l5-8c5-18 4-32-3-43Z',
  'M28 35c-7 10-8 26-3 42l6 9h8V39m16 0v47h8l6-9c5-17 4-32-3-42Z',
  'M30 35c-6 9-7 23-3 37l5 8h8V40m16 0v40h8l5-9c4-14 3-27-3-36Z',
];

function renderHairDetails(style) {
  switch (style) {
    case 1:
      return <path d="M49 17c4 6 9 9 15 10" fill="none" stroke="#9B7563" strokeWidth="1.5" />;
    case 2:
      return (
        <g fill="#3F342F">
          <circle cx="35" cy="24" r="4" />
          <circle cx="42" cy="18" r="4" />
          <circle cx="50" cy="17" r="4" />
          <circle cx="58" cy="21" r="4" />
          <circle cx="63" cy="28" r="4" />
        </g>
      );
    case 4:
      return (
        <path
          d="M34 30c4-4 7-4 10 0s6 4 9 0 6-4 9 0"
          fill="none"
          stroke="#9B7563"
          strokeLinecap="round"
          strokeWidth="2"
        />
      );
    case 5:
      return (
        <path
          d="M32 30c-4 8-3 15 0 22m32-22c4 8 3 15 0 22"
          fill="none"
          stroke="#3F342F"
          strokeLinecap="round"
          strokeWidth="5"
        />
      );
    case 6:
      return (
        <g fill="#3F342F">
          <circle cx="34" cy="30" r="3" />
          <circle cx="40" cy="20" r="3" />
          <circle cx="48" cy="17" r="3" />
          <circle cx="56" cy="19" r="3" />
          <circle cx="62" cy="27" r="3" />
          <circle cx="43" cy="27" r="3" />
          <circle cx="53" cy="28" r="3" />
        </g>
      );
    case 7:
      return <path d="M34 31 39 36l5-7 5 7 5-7 5 7 6-5" fill="#3F342F" />;
    default:
      return null;
  }
}

function renderShirtPattern(pattern) {
  switch (pattern) {
    case 'stripes':
      return <path d="M34 79h28v4H34zm0 9h28v3H34z" fill="#DCFCE7" opacity=".8" />;
    case 'panel':
      return <path d="M44 70h8v26h-8z" fill="#FCA5A5" opacity=".8" />;
    case 'collar':
      return (
        <>
          <path d="m38 70 10 8 10-8-5 13h-10z" fill="#DBEAFE" />
          <path d="M47 78h2v18h-2z" fill="#93C5FD" />
        </>
      );
    case 'dots':
      return (
        <g fill="#CCFBF1" opacity=".9">
          <circle cx="38" cy="82" r="1.5" />
          <circle cx="48" cy="86" r="1.5" />
          <circle cx="58" cy="81" r="1.5" />
          <circle cx="40" cy="92" r="1.5" />
          <circle cx="57" cy="92" r="1.5" />
        </g>
      );
    case 'block':
      return <path d="M17 86h31v10H17zm31-16h12v26H48z" fill="#C4B5FD" opacity=".8" />;
    case 'zip':
      return (
        <>
          <path d="M47 70h2v26h-2z" fill="#D1D5DB" />
          <circle cx="48" cy="82" r="1.5" fill="#F9FAFB" />
        </>
      );
    case 'vneck':
      return <path d="m39 70 9 12 9-12" fill="none" stroke="#FEF3C7" strokeWidth="3" />;
    default:
      return null;
  }
}

function renderGlasses(design) {
  const { shape, color } = design;
  const frameProps = {
    fill: 'none',
    stroke: color,
    strokeWidth: shape === 'bold' ? 2.4 : 1.6,
  };

  let lenses;
  switch (shape) {
    case 'round':
      lenses = <><circle cx="41" cy="42" r="5.5" /><circle cx="55" cy="42" r="5.5" /></>;
      break;
    case 'square':
      lenses = <><rect x="35" y="37" width="12" height="10" rx="2" /><rect x="49" y="37" width="12" height="10" rx="2" /></>;
      break;
    case 'oval':
      lenses = <><ellipse cx="41" cy="42" rx="6" ry="4" /><ellipse cx="55" cy="42" rx="6" ry="4" /></>;
      break;
    case 'aviator':
      lenses = <><path d="M35 37h12l-1 8c-1 4-8 5-10 0Z" /><path d="M49 37h12l-1 8c-2 5-9 4-10 0Z" /></>;
      break;
    case 'bold':
      lenses = <><rect x="35" y="37" width="12" height="10" rx="4" /><rect x="49" y="37" width="12" height="10" rx="4" /></>;
      break;
    case 'browline':
      lenses = <><path d="M35 39c2-3 9-3 12 0v5c-1 5-10 5-12 0Z" /><path d="M49 39c3-3 10-3 12 0v5c-2 5-11 5-12 0Z" /><path d="M35 39c3-3 9-3 12 0m2 0c3-3 9-3 12 0" strokeWidth="2.4" /></>;
      break;
    case 'hexagon':
      lenses = <><path d="m36 39 3-2h5l3 3v5l-3 2h-5l-3-3Z" /><path d="m50 40 3-3h5l3 2v5l-3 3h-5l-3-2Z" /></>;
      break;
    default:
      lenses = <><path d="M35 39c3-3 9-3 12 0l-1 6c-3 4-9 3-11-1Z" /><path d="M49 39c3-3 9-3 12 0l-1 5c-2 4-8 5-11 1Z" /></>;
  }

  return (
    <g {...frameProps} strokeLinecap="round" strokeLinejoin="round">
      {lenses}
      <path d="M47 41h2M35 40l-3-1m29 1 3-1" />
    </g>
  );
}

function renderScarfPattern(pattern, color) {
  switch (pattern) {
    case 'stripe':
      return <path d="m39 69 18 6-1 3-18-6zm1 7 13 5-1 3-13-5z" fill="#FFFFFF" opacity=".8" />;
    case 'dots':
      return <g fill="#FFFFFF" opacity=".85"><circle cx="42" cy="70" r="1.5" /><circle cx="52" cy="73" r="1.5" /><circle cx="46" cy="78" r="1.5" /></g>;
    default:
      return <path d="M47 67h2v13h-2z" fill={color} opacity=".7" />;
  }
}

function getInitials(name) {
  const parts = typeof name === 'string' ? name.trim().split(/\s+/).filter(Boolean) : [];
  if (parts.length === 0) {
    return '';
  }
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function ProfileAvatar({
  avatarKey,
  avatarConfig = DEFAULT_AVATAR_CONFIG,
  name,
  size = 112,
}) {
  if (avatarKey === 'male' || avatarKey === 'female') {
    const isFemale = avatarKey === 'female';
    const config = normalizeAvatarConfig(avatarConfig);
    const skin = AVATAR_SKIN_TONES[config.skinTone];
    const shirt = AVATAR_SHIRT_DESIGNS[config.shirt];
    const hairStyle = AVATAR_HAIR_STYLES[config.hair];
    const glasses = config.glasses === null ? null : AVATAR_GLASSES_DESIGNS[config.glasses];
    const scarf = config.scarf === null ? null : AVATAR_SCARF_DESIGNS[config.scarf];

    return (
      <svg
        role="img"
        aria-label={`${isFemale ? 'Female' : 'Male'} avatar${name ? ` for ${name}` : ''}; ${hairStyle} hair; ${skin.name} skin tone; ${shirt.name} shirt${glasses ? `; ${glasses.name} spectacles` : ''}${scarf ? `; ${scarf.name} scarf` : ''}`}
        viewBox="0 0 96 96"
        width={size}
        height={size}
        className="shrink-0 rounded-full"
      >
        <circle cx="48" cy="48" r="48" fill={isFemale ? '#FCE7F3' : '#DBEAFE'} />
        {isFemale && (
          <path d={FEMALE_BACK_HAIR_PATHS[config.hair]} fill="#6B3F31" />
        )}
        <path d="M17 96c2-15 14-24 31-24s29 9 31 24H17Z" fill={shirt.color} />
        {renderShirtPattern(shirt.pattern)}
        {isFemale && (
          <path d={FEMALE_HAIR_PATHS[config.hair]} fill="#6B3F31" />
        )}
        <path d="M38 51h20v18c0 5-4 8-10 8s-10-3-10-8Z" fill={skin.color} />
        <ellipse cx="48" cy="39" rx="15" ry="18" fill={skin.color} />
        <circle cx="33" cy="41" r="3" fill={skin.color} />
        <circle cx="63" cy="41" r="3" fill={skin.color} />
        <path
          d={isFemale ? FEMALE_HAIR_PATHS[config.hair] : MALE_HAIR_PATHS[config.hair]}
          fill="#3F342F"
        />
        {renderHairDetails(config.hair)}
        <path d="M41 42h1m11 0h1" stroke="#48352D" strokeLinecap="round" strokeWidth="2" />
        <path d="M44 50c2 2 6 2 8 0" fill="none" stroke="#9D5E4E" strokeLinecap="round" strokeWidth="2" />
        {glasses && renderGlasses(glasses)}
        {scarf && (
          <>
            <path d="M38 61h20l3 13-13 9-13-9Z" fill={scarf.color} />
            {renderScarfPattern(scarf.pattern, scarf.color)}
          </>
        )}
      </svg>
    );
  }

  return (
    <div
      role="img"
      aria-label={name ? `Avatar for ${name}` : 'Profile avatar'}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#e5e7eb] font-black text-slate-700"
      style={{ width: size, height: size, fontSize: Math.max(16, Math.round(size / 3.5)) }}
    >
      {getInitials(name) || <UserRound size={Math.max(20, Math.round(size / 2.5))} aria-hidden="true" />}
    </div>
  );
}
