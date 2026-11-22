// Značka MCDM Edu: tři stoupající sloupce = váhy a pořadí variant. Stejný tvar jako public/favicon.svg.
export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#0057FF" />
      <rect x="13" y="35" width="10" height="16" rx="3" fill="#FFFFFF" fillOpacity="0.6" />
      <rect x="27" y="25" width="10" height="26" rx="3" fill="#FFFFFF" fillOpacity="0.8" />
      <rect x="41" y="13" width="10" height="38" rx="3" fill="#FFFFFF" />
    </svg>
  );
}
