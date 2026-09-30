// Símbolo del logo Arboleda Ayerbe (vectorizado desde "LOGO AA CONSTRUCCIONES SAS.png").
// Las piezas gris carbón usan `currentColor` para poder invertirlas sobre fondos oscuros;
// las piezas doradas mantienen el color de marca.
const VIEW_W = 706
const VIEW_H = 376

export const BRAND_CHARCOAL = '#2f3338'
export const BRAND_GOLD = '#ad864b'

const CHARCOAL_PATH =
  'M213.5 0L279.5 0L422 253L422 376L390 376L302 193.5L244.5 87L86 376L0 376Z' +
  'M175 239L310.5 239L335 291L147 291Z' +
  'M441 162L481 137L481 376L441 376Z' +
  'M540 250.5L568 278.5L568 376L540 376Z'

const GOLD_PATH =
  'M426 0L491.5 0L706 376L620.5 376L579 303.5L579 277.5L459.5 65L392.5 179L358.5 118.5Z' +
  'M494.5 224.5L521.5 208L521.5 376L494.5 376Z'

export default function BrandMark({ height, color = BRAND_CHARCOAL, className }: { height: number; color?: string; className?: string }) {
  return (
    <svg width={Math.round((height * VIEW_W) / VIEW_H)} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className} style={{ color }} aria-hidden="true">
      <path d={CHARCOAL_PATH} fill="currentColor" />
      <path d={GOLD_PATH} fill={BRAND_GOLD} />
    </svg>
  )
}
