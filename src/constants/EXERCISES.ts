// Biblioteca de ejercicios comunes para autocompletar al armar rutinas.
// El usuario puede elegir uno o escribir el suyo libremente.

export const EXERCISE_LIBRARY: Record<string, string[]> = {
  'Pecho': [
    'Press de banca', 'Press inclinado', 'Press con mancuernas', 'Aperturas', 'Fondos en paralelas', 'Pec deck',
  ],
  'Espalda': [
    'Dominadas', 'Remo con barra', 'Remo con mancuerna', 'Jalón al pecho', 'Remo en polea', 'Peso muerto',
  ],
  'Piernas': [
    'Sentadilla', 'Prensa', 'Zancadas', 'Extensión de cuádriceps', 'Curl femoral', 'Hip thrust', 'Gemelos de pie', 'Peso muerto rumano',
  ],
  'Hombros': [
    'Press militar', 'Press Arnold', 'Elevaciones laterales', 'Elevaciones frontales', 'Pájaros', 'Face pull',
  ],
  'Brazos': [
    'Curl de bíceps', 'Curl martillo', 'Curl en banco Scott', 'Extensión de tríceps', 'Press francés', 'Fondos de tríceps',
  ],
  'Core': [
    'Plancha', 'Crunch', 'Elevación de piernas', 'Rueda abdominal', 'Russian twist',
  ],
  'Cardio': [
    'Cinta', 'Bici', 'Elíptico', 'Remo', 'Cuerda', 'Burpees',
  ],
}

// Lista plana para el <datalist>
export const ALL_EXERCISES: string[] = Object.values(EXERCISE_LIBRARY).flat()

// ─── Mapeo ejercicio → músculos (peso por serie) ──────────────
// Convención: 1.0 = primario, ~0.4 = secundario. Para el mapa muscular.
import type { MuscleGroup } from '@/lib/fitness/muscleMap'

type MuscleWeights = Partial<Record<MuscleGroup, number>>

const RAW_MUSCLES: Record<string, MuscleWeights> = {
  // Pecho
  'Press de banca': { chest: 1, delt_ant: 0.5, triceps: 0.4 },
  'Press inclinado': { chest: 1, delt_ant: 0.6, triceps: 0.3 },
  'Press con mancuernas': { chest: 1, delt_ant: 0.5, triceps: 0.4 },
  'Aperturas': { chest: 1, delt_ant: 0.3 },
  'Fondos en paralelas': { triceps: 1, chest: 0.6, delt_ant: 0.3 },
  'Pec deck': { chest: 1 },
  // Espalda
  'Dominadas': { lats: 1, biceps: 0.6, traps: 0.4, forearm: 0.3 },
  'Remo con barra': { lats: 1, traps: 0.6, biceps: 0.4, lower_back: 0.3 },
  'Remo con mancuerna': { lats: 1, traps: 0.5, biceps: 0.4 },
  'Jalón al pecho': { lats: 1, biceps: 0.5, traps: 0.3 },
  'Remo en polea': { lats: 1, traps: 0.5, biceps: 0.4 },
  'Peso muerto': { hamstrings: 1, glutes: 0.8, lower_back: 0.8, traps: 0.4, forearm: 0.4 },
  // Piernas
  'Sentadilla': { quads: 1, glutes: 0.7, hamstrings: 0.4, lower_back: 0.3, adductors: 0.3 },
  'Prensa': { quads: 1, glutes: 0.6, hamstrings: 0.3 },
  'Zancadas': { quads: 0.8, glutes: 1, hamstrings: 0.4 },
  'Extensión de cuádriceps': { quads: 1 },
  'Curl femoral': { hamstrings: 1 },
  'Hip thrust': { glutes: 1, hamstrings: 0.4 },
  'Gemelos de pie': { calves: 1, tibialis: 0.2 },
  'Peso muerto rumano': { hamstrings: 1, glutes: 0.6, lower_back: 0.4 },
  // Hombros
  'Press militar': { delt_ant: 1, delt_lat: 0.5, triceps: 0.5, traps: 0.2 },
  'Press Arnold': { delt_ant: 1, delt_lat: 0.6, triceps: 0.4 },
  'Elevaciones laterales': { delt_lat: 1, traps: 0.2 },
  'Elevaciones frontales': { delt_ant: 1 },
  'Pájaros': { delt_post: 1, traps: 0.4 },
  'Face pull': { delt_post: 1, traps: 0.5 },
  // Brazos
  'Curl de bíceps': { biceps: 1, forearm: 0.4 },
  'Curl martillo': { biceps: 1, forearm: 0.6 },
  'Curl en banco Scott': { biceps: 1 },
  'Extensión de tríceps': { triceps: 1 },
  'Press francés': { triceps: 1 },
  'Fondos de tríceps': { triceps: 1, chest: 0.4, delt_ant: 0.2 },
  // Core
  'Plancha': { abs: 1, obliques: 0.5, lower_back: 0.3 },
  'Crunch': { abs: 1, obliques: 0.3 },
  'Elevación de piernas': { abs: 1, obliques: 0.3 },
  'Rueda abdominal': { abs: 1, lower_back: 0.3 },
  'Russian twist': { obliques: 1, abs: 0.5 },
  // Cardio (contribución leve)
  'Cinta': { quads: 0.3, calves: 0.3, hamstrings: 0.2 },
  'Bici': { quads: 0.4, calves: 0.2 },
  'Elíptico': { quads: 0.3, calves: 0.3, glutes: 0.2 },
  'Remo': { lats: 0.5, biceps: 0.3, lower_back: 0.3 },
  'Cuerda': { calves: 0.5, delt_lat: 0.2 },
  'Burpees': { quads: 0.4, chest: 0.3, abs: 0.3 },
}

// Índice normalizado (minúsculas, sin espacios extra) para matchear nombres libres.
const norm = (s: string) => s.trim().toLowerCase()
const MUSCLE_INDEX: Record<string, MuscleWeights> = Object.fromEntries(
  Object.entries(RAW_MUSCLES).map(([k, v]) => [norm(k), v])
)

/** Devuelve los pesos musculares de un ejercicio por nombre, o null si no está mapeado. */
export function musclesForExercise(name: string): MuscleWeights | null {
  return MUSCLE_INDEX[norm(name)] ?? null
}
