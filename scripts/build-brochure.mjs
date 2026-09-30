// Genera public/brochure-peritaje-estructural.pdf a partir de brochure/brochure.html.
// Toma el contacto del .env (mismas variables que la web) y dibuja el logo desde BrandMark.tsx.
// Uso: pnpm brochure   (requiere Chrome o Edge instalado; CHROME_PATH para indicar otra ruta)
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = path.join(root, 'public', 'brochure-peritaje-estructural.pdf')

function readEnv() {
  const env = {}
  const file = path.join(root, '.env')
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
  for (const key of Object.keys(process.env)) if (key.startsWith('VITE_')) env[key] = process.env[key]
  return env
}

function brandMark(height, charcoal) {
  const src = readFileSync(path.join(root, 'src', 'components', 'BrandMark.tsx'), 'utf8')
  const pathOf = (name) => [...src.match(new RegExp(`const ${name} =([\\s\\S]*?)\\n\\n`))[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).join('')
  const gold = src.match(/BRAND_GOLD = '([^']+)'/)[1]
  const width = Math.round((height * 706) / 376)
  return `<svg width="${width}" height="${height}" viewBox="0 0 706 376" aria-hidden="true"><path fill="${charcoal}" d="${pathOf('CHARCOAL_PATH')}"/><path fill="${gold}" d="${pathOf('GOLD_PATH')}"/></svg>`
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function contactRows(env) {
  const rows = []
  const whatsapp = (env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
  const whatsappDisplay = env.VITE_WHATSAPP_DISPLAY?.trim() || (whatsapp && `+${whatsapp}`)
  const email = env.VITE_CONTACT_EMAIL?.trim()
  if (whatsapp) {
    rows.push(`<a class="crow" href="https://wa.me/${whatsapp}">
      <span class="crow-icon" style="background:rgba(37,211,102,.15)"><svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z"/></svg></span>
      <span><span class="crow-label">WhatsApp</span><br /><span class="crow-value">${escapeHtml(whatsappDisplay)}</span></span>
    </a>`)
  }
  if (email) {
    rows.push(`<a class="crow" href="mailto:${escapeHtml(email)}">
      <span class="crow-icon" style="background:rgba(216,173,87,.14)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#d8ad57" stroke-width="1.6"/><path d="M2 8l10 7 10-7" stroke="#d8ad57" stroke-width="1.6" stroke-linecap="round"/></svg></span>
      <span><span class="crow-label">Correo electrónico</span><br /><span class="crow-value">${escapeHtml(email)}</span></span>
    </a>`)
  }
  return rows.join('\n')
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ]
  const found = candidates.find((p) => p && existsSync(p))
  if (!found) throw new Error('No se encontró Chrome/Edge. Defina CHROME_PATH con la ruta del ejecutable.')
  return found
}

const env = readEnv()
const html = readFileSync(path.join(root, 'brochure', 'brochure.html'), 'utf8')
  .replaceAll('{{MARK_WHITE_34}}', brandMark(34, '#ffffff'))
  .replaceAll('{{MARK_WHITE_64}}', brandMark(64, '#ffffff'))
  .replaceAll('{{YEAR}}', String(new Date().getFullYear()))
  .replaceAll('{{CONTACT_ROWS}}', contactRows(env))

const work = mkdtempSync(path.join(tmpdir(), 'brochure-'))
try {
  const page = path.join(work, 'brochure.html')
  writeFileSync(page, html)
  execFileSync(findChrome(), [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    `--user-data-dir=${path.join(work, 'profile')}`,
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=20000',
    `--print-to-pdf=${OUTPUT}`,
    pathToFileURL(page).href,
  ], { stdio: 'inherit' })
  console.log(`Brochure generado: ${path.relative(root, OUTPUT)}`)
} finally {
  rmSync(work, { recursive: true, force: true })
}
