import logo from '../assets/logo.svg';

export function Logo({ size = 40, withWord = false, color = 'inherit' }: { size?: number; withWord?: boolean; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color }}>
      <img src={logo} width={size} height={(size * 50) / 52} alt="HATO" />
      {withWord && <span style={{ fontWeight: 800, fontSize: size * 0.5, letterSpacing: '-0.02em' }}>HATO</span>}
    </span>
  );
}
