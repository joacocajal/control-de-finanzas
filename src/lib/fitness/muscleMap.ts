// Mapa muscular — datos de geometría SVG + lógica de heatmap.
// Portado del handoff de diseño "Mapa Muscular ascend". Los paths son anatomía
// real (viewBox 0 0 320 660); los músculos `paired` dibujan la mitad derecha y
// el render espeja con matrix(-1,0,0,1,320,0).

export type MuscleGroup =
  | 'neck' | 'traps' | 'delt_ant' | 'delt_lat' | 'delt_post' | 'chest'
  | 'biceps' | 'triceps' | 'forearm' | 'lats' | 'lower_back' | 'abs'
  | 'obliques' | 'glutes' | 'quads' | 'hamstrings' | 'adductors'
  | 'calves' | 'tibialis'

export interface MusclePath {
  id: string
  group: MuscleGroup
  d: string
  fibers: string[] | null
  paired: boolean
}

const M = (id: string, group: MuscleGroup, d: string, fibers?: string[]): MusclePath =>
  ({ id, group, d, fibers: fibers ?? null, paired: true })
const C = (id: string, group: MuscleGroup, d: string, fibers?: string[]): MusclePath =>
  ({ id, group, d, fibers: fibers ?? null, paired: false })

const BODY = `
  M160 14
  C 184 14 198 32 198 54 C 198 76 185 88 175 90 L 177 106
  C 183 114 197 118 211 126 C 223 152 221 180 217 202
  C 213 252 207 286 203 314 C 201 332 207 346 213 358
  C 219 374 219 390 217 406 L 211 472 L 201 508 L 199 522
  L 201 562 L 193 608 L 193 630 L 169 630 L 167 542 L 163 452
  L 160 374 L 157 452 L 153 542 L 151 630 L 127 630 L 127 608
  L 119 562 L 121 522 L 119 508 L 109 472 L 103 406
  C 101 390 101 374 107 358 C 113 346 119 332 117 314
  C 113 286 107 252 103 202 C 99 180 97 152 109 126
  C 123 118 137 114 143 106 L 145 90 C 135 88 122 76 122 54
  C 122 32 136 14 160 14 Z`

const ARM = `
  M 232 126 C 256 130 271 150 269 180 L 263 252
  C 262 286 256 322 252 348 C 250 364 244 370 238 370
  C 233 370 229 364 229 350 L 231 300 L 229 250
  C 225 210 224 168 232 126 Z`

const front: MusclePath[] = [
  M('neck_f', 'neck', `M 150 90 L 161 92 L 171 118 L 158 118 Z`),
  M('traps_f', 'traps', `M 164 108 C 184 114 202 120 213 127 C 200 122 184 120 167 121 Z`),
  M('delt_ant_f', 'delt_ant', `M 213 126 C 233 128 251 140 258 161 C 250 176 235 180 223 175 C 215 161 213 144 213 126 Z`,
    [`M 218 134 C 234 142 246 153 252 167`, `M 226 131 C 240 139 250 151 256 165`]),
  M('delt_lat_f', 'delt_lat', `M 250 138 C 264 146 270 162 268 180 C 260 182 252 178 248 168 C 247 156 247 146 250 138 Z`),
  M('chest_f', 'chest', `M 160 138 C 178 136 199 141 211 150 C 215 167 212 186 203 196 C 187 201 171 199 160 197 Z`,
    [`M 164 147 C 182 147 198 153 207 162`, `M 163 162 C 180 165 194 173 202 182`, `M 162 177 C 177 182 189 189 197 195`]),
  M('biceps_f', 'biceps', `M 234 179 C 246 184 252 201 252 231 C 250 259 244 281 238 297 C 232 282 230 257 230 227 C 230 205 230 190 234 179 Z`,
    [`M 237 189 C 244 215 244 247 240 277`, `M 244 191 C 249 215 248 247 244 275`]),
  M('forearm_f', 'forearm', `M 231 300 C 242 305 250 321 252 345 C 250 361 244 367 240 367 C 234 354 230 330 228 308 Z`,
    [`M 234 309 C 243 327 247 348 246 364`]),
  C('abs', 'abs', `M 138 202 C 150 198 170 198 182 202 C 186 232 186 272 182 308 C 178 318 168 322 160 322 C 152 322 142 318 138 308 C 134 272 134 232 138 202 Z`,
    [`M 160 204 L 160 320`, `M 140 228 C 152 226 168 226 180 228`, `M 139 256 C 152 254 168 254 181 256`, `M 139 284 C 152 282 168 282 181 284`]),
  M('obliques_f', 'obliques', `M 185 212 C 197 216 203 232 203 258 C 201 288 195 306 187 314 C 189 282 189 242 185 212 Z`),
  M('quads_f', 'quads', `M 163 366 C 179 364 197 370 207 384 C 211 420 207 460 199 492 C 191 500 179 500 171 494 C 167 450 165 405 163 366 Z`,
    [`M 178 376 C 185 414 183 456 175 490`, `M 192 379 C 200 412 197 450 191 482`, `M 166 374 C 169 412 170 456 169 490`]),
  M('adductors_f', 'adductors', `M 160 374 C 168 374 176 382 178 402 C 178 432 174 462 168 488 C 164 462 162 417 160 382 Z`),
  M('tibialis_f', 'tibialis', `M 169 524 C 181 524 191 540 193 566 C 191 592 185 602 179 604 C 175 580 171 550 169 524 Z`),
]

const back: MusclePath[] = [
  C('traps_b', 'traps', `M 160 106 C 140 110 122 119 112 128 C 124 150 140 165 160 171 C 180 165 196 150 208 128 C 198 119 180 110 160 106 Z M 160 173 C 176 175 190 183 196 197 C 188 211 174 219 160 221 C 146 219 132 211 124 197 C 130 183 144 175 160 173 Z`,
    [`M 160 110 L 160 169`, `M 160 114 C 142 120 128 130 118 142`, `M 160 114 C 178 120 192 130 202 142`]),
  M('delt_post_b', 'delt_post', `M 212 126 C 232 128 250 140 256 161 C 248 176 234 180 222 175 C 214 161 212 144 212 126 Z`),
  M('delt_lat_b', 'delt_lat', `M 250 138 C 264 146 270 162 268 180 C 260 182 252 178 248 168 C 247 156 247 146 250 138 Z`),
  M('triceps_b', 'triceps', `M 233 179 C 247 185 253 206 253 236 C 251 262 245 282 239 297 C 233 282 231 257 231 227 C 231 205 230 191 233 179 Z`,
    [`M 236 189 C 243 215 243 249 239 279`, `M 244 191 C 249 217 248 249 244 277`]),
  M('forearm_b', 'forearm', `M 231 300 C 242 305 250 321 252 345 C 250 361 244 367 240 367 C 234 354 230 330 228 308 Z`,
    [`M 234 309 C 243 327 247 348 246 364`]),
  M('lats_b', 'lats', `M 200 198 C 211 212 213 236 207 260 C 200 278 188 290 175 294 C 173 272 176 242 182 216 C 188 204 194 200 200 198 Z`,
    [`M 195 210 C 198 238 191 268 178 288`, `M 202 216 C 205 242 198 270 186 290`]),
  C('lower_back', 'lower_back', `M 142 270 C 152 266 168 266 178 270 C 182 292 182 318 176 334 C 168 342 152 342 144 334 C 138 318 138 292 142 270 Z`,
    [`M 160 270 L 160 338`, `M 150 280 C 150 302 150 324 152 336`, `M 170 280 C 170 302 170 324 168 336`]),
  M('glutes_b', 'glutes', `M 160 344 C 178 342 197 352 205 372 C 207 393 201 409 187 415 C 173 417 162 409 160 397 Z`,
    [`M 165 354 C 180 356 192 365 200 379`]),
  M('hamstrings_b', 'hamstrings', `M 162 418 C 178 416 197 423 205 439 C 207 471 201 501 193 521 C 185 527 175 525 169 519 C 167 484 165 451 162 418 Z`,
    [`M 177 428 C 183 462 181 498 173 520`, `M 190 430 C 197 460 194 492 188 512`]),
  M('calves_b', 'calves', `M 169 524 C 183 524 195 542 197 570 C 195 596 187 606 181 606 C 175 582 171 552 169 524 Z`,
    [`M 177 534 C 183 560 183 590 179 602`, `M 188 540 C 192 562 191 588 187 598`]),
]

export const MUSCLE_PATHS = { viewBox: '0 0 320 660', BODY, ARM, front, back }

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  neck: 'Cuello', traps: 'Trapecio', delt_ant: 'Deltoides anterior',
  delt_lat: 'Deltoides lateral', delt_post: 'Deltoides posterior', chest: 'Pecho',
  biceps: 'Bíceps', triceps: 'Tríceps', forearm: 'Antebrazo', lats: 'Dorsal ancho',
  lower_back: 'Lumbar', abs: 'Abdominales', obliques: 'Oblicuos', glutes: 'Glúteos',
  quads: 'Cuádriceps', hamstrings: 'Isquiotibiales', adductors: 'Aductores',
  calves: 'Gemelos', tibialis: 'Tibial',
}

// ─── Heatmap: intensidad 0..1 → color ─────────────────────────

type Stop = [number, [number, number, number]]

export const PALETTES: Record<string, Stop[]> = {
  Azul:  [[0,[55,61,73]],[0.16,[38,64,120]],[0.4,[34,98,214]],[0.66,[46,146,255]],[0.85,[104,196,255]],[1,[168,230,255]]],
  Hielo: [[0,[58,64,76]],[0.2,[78,104,156]],[0.5,[126,166,224]],[0.8,[184,214,246]],[1,[228,242,255]]],
  Aqua:  [[0,[52,64,68]],[0.18,[22,92,104]],[0.45,[18,150,160]],[0.7,[40,202,200]],[1,[150,246,236]]],
  Fuego: [[0,[60,58,60]],[0.18,[120,52,40]],[0.45,[210,86,40]],[0.72,[255,150,46]],[1,[255,224,150]]],
}

export type RGB = [number, number, number]

export function heatRGB(t: number, pal: string): RGB {
  const stops = PALETTES[pal] || PALETTES.Azul
  t = Math.max(0, Math.min(1, t))
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i]
    if (t <= p1) {
      const [p0, c0] = stops[i - 1]
      const f = (t - p0) / (p1 - p0 || 1)
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ]
    }
  }
  return [...stops[stops.length - 1][1]] as RGB
}

/** amt>0 → hacia blanco, amt<0 → hacia negro */
export function mix(rgb: RGB, amt: number): RGB {
  return rgb.map(c => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))) as RGB
}

export const rgbStr = (a: RGB) => `rgb(${a[0]},${a[1]},${a[2]})`
export const heat = (t: number, pal: string) => rgbStr(heatRGB(t, pal))

export function heatGradient(pal: string): string {
  const stops = PALETTES[pal] || PALETTES.Azul
  return 'linear-gradient(90deg,' + stops.map(([p, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${p * 100}%`).join(',') + ')'
}

/**
 * Volumen por músculo a partir de una rutina: { nombreEjercicio → series }.
 * `muscleOf` mapea nombre de ejercicio → pesos por músculo.
 */
export function computeVolume(
  sets: Record<string, number>,
  muscleOf: (name: string) => Partial<Record<MuscleGroup, number>> | null,
): Record<string, number> {
  const vol: Record<string, number> = {}
  for (const [name, n] of Object.entries(sets)) {
    const muscles = muscleOf(name)
    if (!muscles) continue
    for (const [m, w] of Object.entries(muscles)) {
      vol[m] = (vol[m] || 0) + n * (w as number)
    }
  }
  return vol
}

/** Normaliza volumen → intensidad 0..1 con exponente de contraste. */
export function computeIntensity(volume: Record<string, number>, contrast = 0.85): Record<string, number> {
  const max = Math.max(...Object.values(volume), 0.0001)
  const out: Record<string, number> = {}
  for (const [m, v] of Object.entries(volume)) out[m] = Math.pow(v / max, contrast)
  return out
}
