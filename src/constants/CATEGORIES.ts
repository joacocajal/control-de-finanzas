// Categorías por defecto — espejo de lo definido en handle_new_user() SQL
// Usadas para seed local y para referencia en la UI

export const DEFAULT_CATEGORIES = [
  { name: 'Comida',     color: '#ef4444', icon: 'utensils'       },
  { name: 'Gym',        color: '#f97316', icon: 'dumbbell'        },
  { name: 'Streetwear', color: '#8b5cf6', icon: 'shirt'           },
  { name: 'Transporte', color: '#3b82f6', icon: 'car'             },
  { name: 'Salud',      color: '#10b981', icon: 'heart-pulse'     },
  { name: 'Ocio',       color: '#f59e0b', icon: 'gamepad-2'       },
  { name: 'Sueldo',     color: '#22c55e', icon: 'banknote'        },
  { name: 'Otros',      color: '#6b7280', icon: 'more-horizontal' },
] as const
