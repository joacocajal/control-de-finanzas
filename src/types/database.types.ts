export type TransactionType = 'income' | 'expense'

// ─── Wallets ──────────────────────────────────────────────────

export type WalletType = 'personal' | 'negocio'

export interface Wallet {
  id: string
  user_id: string
  name: string
  type: WalletType
  color: string
  icon: string | null
  is_default: boolean
  archived: boolean
  created_at: string
}

export interface CreateWalletInput {
  name: string
  type: WalletType
  color?: string
  icon?: string | null
  is_default?: boolean
}

export interface UpdateWalletInput {
  name?: string
  type?: WalletType
  color?: string
  icon?: string | null
  is_default?: boolean
  archived?: boolean
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  is_default: boolean
  monthly_budget: number | null
  parent_category_id: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface UpdateCategoryInput {
  name?: string
  color?: string
  icon?: string | null
  monthly_budget?: number | null
}

export interface BudgetAlert {
  categoryId: string
  name: string
  color: string
  spent: number
  budget: number
  percentage: number
  level: 'warning' | 'danger'
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  wallet_id: string | null
  type: TransactionType
  amount: number
  currency: string
  exchange_rate: number | null
  amount_ars: number | null
  amount_usd: number | null
  description: string | null
  transaction_date: string
  created_at: string
  updated_at: string
}

export interface ExchangeRate {
  id: string
  date: string
  ars_to_usd: number
  source: string
  created_at: string
}

export interface TransactionWithCategory extends Transaction {
  categories: Pick<Category, 'name' | 'color' | 'icon'> | null
}

export interface CategoryTotal {
  categoryId: string
  name: string
  color: string
  amount: number
  percentage: number
}

export interface CreateTransactionInput {
  type: TransactionType
  amount: number
  category_id: string | null
  description: string | null
  transaction_date: string
  wallet_id?: string | null
  currency?: 'ARS' | 'USD'
  exchange_rate?: number | null
}

export interface CreateCategoryInput {
  name: string
  color: string
  icon?: string | null
}

export interface AIChatContext {
  balance: number
  totalIncome: number
  totalExpenses: number
  topCategories: Array<{
    name: string
    amount: number
    percentage: number
  }>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

// ─── Gamificación ────────────────────────────────────────────

export type HabilidadCategoria = 'finanzas' | 'fitness' | 'aprendizaje'
export type MisionEstado = 'pendiente' | 'completada' | 'fallada'
export type MisionDificultad = 'facil' | 'media' | 'dificil'

export interface ProfileGamificado extends Profile {
  nivel_global: number
  xp_global: number
  racha_dias: number
  ultima_actividad: string | null
}

export interface HabilidadStat {
  id: string
  perfil_id: string
  categoria: HabilidadCategoria
  nivel: number
  xp: number
  ultima_actualizacion: string
}

export interface MisionDiaria {
  id: string
  perfil_id: string
  descripcion: string
  dificultad: MisionDificultad
  xp_recompensa: number
  xp_penalizacion: number
  estado: MisionEstado
  fecha: string
}

export interface CreateMisionInput {
  descripcion: string
  dificultad: MisionDificultad
  xp_recompensa: number
}

// ─── Gym / Salud ─────────────────────────────────────────────

export interface GymRutina {
  id: string
  perfil_id: string
  nombre_rutina: string
  creado_en: string
}

export interface GymEjercicio {
  id: string
  rutina_id: string
  nombre_ejercicio: string
  notas: string | null
}

export interface GymSerieLog {
  id: string
  ejercicio_id: string
  numero_serie: number
  peso_kg: number | null
  repeticiones: number | null
  completado: boolean
  fecha: string
}

export interface GymPR {
  id: string
  perfil_id: string
  tipo_ejercicio: string
  valor_record: number
  fecha: string
}

export interface CreateGymRutinaInput {
  nombre_rutina: string
}

export interface CreateGymEjercicioInput {
  rutina_id: string
  nombre_ejercicio: string
  notas?: string | null
}

export interface CreateGymSerieLogInput {
  ejercicio_id: string
  numero_serie: number
  peso_kg?: number | null
  repeticiones?: number | null
}

// ─── Nutrición / Agua ────────────────────────────────────────

export interface AlimentoBase {
  id: string
  nombre: string
  calorias_por_100g: number
  proteinas: number
  carbohidratos: number
  grasas: number
}

export interface NutricionDiariaLog {
  id: string
  perfil_id: string
  alimento_id: string | null
  nombre_alimento_custom: string | null
  cantidad_g: number
  calorias_totales: number
  proteinas_totales: number
  fecha: string
}

export interface RegistroAgua {
  id: string
  perfil_id: string
  cantidad_ml: number
  fecha: string
}

export interface ResumenNutricionDiaria {
  logs: NutricionDiariaLog[]
  totalCalorias: number
  totalProteinas: number
  totalAguaMl: number
}

export interface CreateNutricionLogInput {
  alimento_id?: string | null
  nombre_alimento_custom?: string | null
  cantidad_g: number
  calorias_totales: number
  proteinas_totales: number
}

// ─── Aprendizaje ─────────────────────────────────────────────

export interface SuggestedSkill {
  id: string
  name: string
  category: string
  description: string
  why_it_matters: string | null
  difficulty: 'principiante' | 'intermedio' | 'avanzado'
  estimated_hours: number | null
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface AprendizajeSkill {
  id: string
  perfil_id: string
  nombre_habilidad: string
  nivel_skill: number
  xp_skill: number
  suggested_skill_id: string | null
}

export interface AprendizajeLog {
  id: string
  skill_id: string
  horas_estudio: number
  youtube_url: string | null
  notas: string | null
  fecha: string
}

export interface CreateAprendizajeSkillInput {
  nombre_habilidad: string
}

export interface CreateAprendizajeLogInput {
  skill_id: string
  horas_estudio: number
  youtube_url?: string | null
  notas?: string | null
}

export type PlannedMinutes = 25 | 45 | 60 | 90 | null

export interface LearningSession {
  id: string
  user_id: string
  skill_id: string
  started_at: string
  finished_at: string | null
  duration_minutes: number | null
  planned_minutes: number | null
  was_completed: boolean
  what_studied: string | null
  resource_id: string | null
  notes: string | null
  created_at: string
}

export interface CreateLearningSessionInput {
  skill_id: string
  planned_minutes: PlannedMinutes
}

export interface FinishLearningSessionInput {
  was_completed: boolean
  notes?: string | null
}

// ─── Skill Resources ─────────────────────────────────────────

export type ResourceType = 'youtube' | 'libro' | 'curso' | 'articulo' | 'podcast' | 'otro'
export type ResourceStatus = 'pendiente' | 'en_progreso' | 'consumido' | 'descartado'

export interface SkillResource {
  id: string
  user_id: string
  skill_id: string
  resource_type: ResourceType
  title: string
  url: string | null
  author: string | null
  duration_minutes: number | null
  cost: number
  priority: number
  status: ResourceStatus
  rating: number | null
  notes: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface CreateSkillResourceInput {
  skill_id: string
  resource_type: ResourceType
  title: string
  url?: string | null
  author?: string | null
  duration_minutes?: number | null
  cost?: number
  priority?: number
  notes?: string | null
}

export interface UpdateSkillResourceInput {
  title?: string
  url?: string | null
  author?: string | null
  duration_minutes?: number | null
  cost?: number
  priority?: number
  status?: ResourceStatus
  rating?: number | null
  notes?: string | null
  started_at?: string | null
  finished_at?: string | null
}

// ─── Skill Milestones ────────────────────────────────────────

export interface SkillMilestone {
  id: string
  user_id: string
  skill_id: string
  title: string
  description: string | null
  order_index: number
  completed: boolean
  completed_at: string | null
  created_by: 'user' | 'ai'
  created_at: string
}

export interface CreateSkillMilestoneInput {
  skill_id: string
  title: string
  description?: string | null
  order_index: number
  created_by?: 'user' | 'ai'
}

// ─── Agent ───────────────────────────────────────────────────

export interface AgentConversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface AgentMessage {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AgentNotification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export interface AgentActionsLog {
  id: string
  user_id: string
  conversation_id: string | null
  message_id: string | null
  action_type: 'insert' | 'update' | 'delete'
  target_table: string
  target_row_id: string | null
  payload: Record<string, unknown>
  previous_state: Record<string, unknown> | null
  status: 'success' | 'reverted' | 'failed'
  reasoning: string | null
  source: string | null
  created_at: string
}

// ─── Financial Goals ─────────────────────────────────────────

export interface FinancialGoal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  category: string | null
  notes: string | null
  completed: boolean
  created_at: string
}

export interface CreateFinancialGoalInput {
  name: string
  target_amount: number
  current_amount?: number
  deadline?: string | null
  category?: string | null
  notes?: string | null
}

export type UpdateFinancialGoalInput = Partial<Omit<CreateFinancialGoalInput, never> & { completed: boolean }>

// ─── Fitness: Alimentos ───────────────────────────────────────

export interface ServingUnit {
  label: string
  grams: number
}

export interface Food {
  id: string
  user_id: string | null
  name: string
  brand: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g: number
  serving_units: ServingUnit[]
  is_global: boolean
  created_at: string
}

export interface CreateFoodInput {
  name: string
  brand?: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number
  serving_units?: ServingUnit[]
}

// ─── Fitness: Recetas ─────────────────────────────────────────

export interface Recipe {
  id: string
  user_id: string
  name: string
  description: string | null
  servings: number
  created_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  food_id: string
  grams: number
  display_amount: string | null
  display_unit: string | null
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: Array<RecipeIngredient & { foods: Food }>
}

export interface CreateRecipeInput {
  name: string
  description?: string | null
  servings?: number
}

export interface CreateRecipeIngredientInput {
  recipe_id: string
  food_id: string
  grams: number
  display_amount?: string | null
  display_unit?: string | null
}

// ─── Fitness: Log de comidas ──────────────────────────────────

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'snack'

export interface FoodLog {
  id: string
  user_id: string
  consumed_at: string
  meal_type: MealType
  food_id: string | null
  recipe_id: string | null
  grams: number | null
  servings: number | null
  calories: number
  protein: number
  carbs: number
  fat: number
  notes: string | null
}

export interface FoodLogWithSource extends FoodLog {
  foods: Pick<Food, 'name' | 'brand'> | null
  recipes: Pick<Recipe, 'name'> | null
}

export interface CreateFoodLogInput {
  meal_type: MealType
  food_id?: string | null
  recipe_id?: string | null
  grams?: number | null
  servings?: number | null
  calories: number
  protein: number
  carbs: number
  fat: number
  notes?: string | null
}

export interface DailyMacroSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
  logs: FoodLogWithSource[]
}

// ─── Fitness: Hidratación ─────────────────────────────────────

export interface WaterLog {
  id: string
  user_id: string
  logged_at: string
  liters: number
}

export interface CreateWaterLogInput {
  liters: number
  logged_at?: string
}

// ─── Fitness: Rutinas ─────────────────────────────────────────

export type WorkoutCategory = 'gym' | 'running' | 'bici' | 'otro'

export interface WorkoutRoutine {
  id: string
  user_id: string
  name: string
  category: WorkoutCategory
  description: string | null
  archived: boolean
  adopted_from_template_id: string | null
  created_at: string
}

// ─── Routine templates ────────────────────────────────────────

export type TemplateLevel = 'principiante' | 'intermedio' | 'avanzado'

export interface RoutineTemplate {
  id: string
  name: string
  category: string
  split_type: string | null
  level: TemplateLevel
  days_per_week: number | null
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export interface RoutineTemplateExercise {
  id: string
  template_id: string
  day_label: string
  day_order: number
  exercise_name: string
  exercise_order: number
  target_sets: number | null
  target_reps: string | null
  notes: string | null
}

export interface RoutineTemplateDay {
  day_label: string
  day_order: number
  exercises: RoutineTemplateExercise[]
}

export interface RoutineTemplateWithDays extends RoutineTemplate {
  days: RoutineTemplateDay[]
}

export interface RoutineExercise {
  id: string
  routine_id: string
  exercise_name: string
  order_index: number
  target_sets: number | null
  target_reps: string | null
  notes: string | null
}

export interface WorkoutRoutineWithExercises extends WorkoutRoutine {
  routine_exercises: RoutineExercise[]
}

export interface CreateWorkoutRoutineInput {
  name: string
  category?: WorkoutCategory
  description?: string | null
}

export interface CreateRoutineExerciseInput {
  routine_id: string
  exercise_name: string
  order_index?: number
  target_sets?: number | null
  target_reps?: string | null
  notes?: string | null
}

// ─── Fitness: Sesiones ────────────────────────────────────────

export type SessionFeeling = 'mal' | 'regular' | 'bien' | 'excelente'

export interface WorkoutSession {
  id: string
  user_id: string
  routine_id: string | null
  routine_name_snapshot: string
  started_at: string
  finished_at: string | null
  duration_minutes: number | null
  distance_km: number | null
  notes: string | null
  energy_level: number | null
  sleep_hours: number | null
  muscle_soreness: number | null
  session_feeling: SessionFeeling | null
  post_session_notes: string | null
}

export interface WorkoutPreFeelingInput {
  energy_level?: number | null
  sleep_hours?: number | null
  muscle_soreness?: number | null
}

export interface WorkoutPostFeelingInput {
  session_feeling?: SessionFeeling | null
  post_session_notes?: string | null
}

export interface WorkoutSet {
  id: string
  session_id: string
  exercise_name: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
  notes: string | null
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  workout_sets: WorkoutSet[]
}

export interface CreateWorkoutSessionInput {
  routine_id?: string | null
  routine_name_snapshot: string
}

export interface CreateWorkoutSetInput {
  session_id: string
  exercise_name: string
  set_number: number
  reps?: number | null
  weight_kg?: number | null
  rpe?: number | null
  notes?: string | null
}

// ─── Fitness: Objetivos y PRs ─────────────────────────────────

export type FitnessGoalType =
  | 'daily_calories'
  | 'daily_protein'
  | 'daily_carbs'
  | 'daily_fat'
  | 'daily_water_liters'

export interface FitnessGoal {
  id: string
  user_id: string
  goal_type: FitnessGoalType
  target_value: number
  active: boolean
  created_at: string
}

export interface UpsertFitnessGoalInput {
  goal_type: FitnessGoalType
  target_value: number
}

export type PRCategory = 'gym' | 'running' | 'bici' | 'otro'

export interface PersonalRecord {
  id: string
  user_id: string
  category: PRCategory
  exercise_name: string
  value: number
  unit: string
  achieved_at: string
  notes: string | null
  created_at: string
}

export interface CreatePersonalRecordInput {
  category: PRCategory
  exercise_name: string
  value: number
  unit: string
  achieved_at?: string
  notes?: string | null
}

// ─── Reportes Mensuales ───────────────────────────────────────

export interface ReportCategorySnapshot {
  name: string
  color: string
  amount: number
  percentage: number
}

export interface ReportWalletSnapshot {
  wallet_id: string
  name: string
  color: string
  income: number
  expenses: number
}

export interface MonthlyReport {
  id: string
  user_id: string
  year: number
  month: number
  total_income: number
  total_expenses: number
  balance: number
  savings_rate: number
  top_categories: ReportCategorySnapshot[]
  wallet_breakdown: ReportWalletSnapshot[]
  transaction_count: number
  generated_at: string
}

// ─── Diario personal ─────────────────────────────────────────

export interface DailySnapshot {
  workouts: Array<{ name: string; duration_minutes: number | null }>
  calories: number
  protein: number
  money_spent: number
  skills_studied: Array<{ name: string; hours: number }>
  water_liters: number
}

export type JournalBlockKey =
  | 'what_i_did'
  | 'what_i_achieved'
  | 'how_i_felt'
  | 'gratitude'
  | 'tomorrow_focus'
  | 'free_notes'

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string
  mood: number | null
  what_i_did: string | null
  what_i_achieved: string | null
  how_i_felt: string | null
  gratitude: string | null
  tomorrow_focus: string | null
  free_notes: string | null
  daily_snapshot: DailySnapshot | null
  created_at: string
  updated_at: string
}

export interface UpsertJournalEntryInput {
  mood?: number | null
  what_i_did?: string | null
  what_i_achieved?: string | null
  how_i_felt?: string | null
  gratitude?: string | null
  tomorrow_focus?: string | null
  free_notes?: string | null
  daily_snapshot?: DailySnapshot | null
}

// ─── Presupuestos ─────────────────────────────────────────────

export type PeriodoPresupuesto = 'mensual' | 'semanal' | 'anual'

export interface Presupuesto {
  id: string
  perfil_id: string
  categoria_gasto: string | null
  monto_limite: number
  periodo: PeriodoPresupuesto
  fecha_inicio: string
  fecha_fin: string | null
}

export interface PresupuestoConCategoria extends Presupuesto {
  categories: Pick<Category, 'name' | 'color' | 'icon'> | null
}

export interface VerificacionPresupuesto {
  tienePresupuesto: boolean
  limite: number
  gastadoActual: number
  gastadoConNuevo: number
  excede: boolean
  porcentajeUso: number
}

export interface CreatePresupuestoInput {
  categoria_gasto: string | null
  monto_limite: number
  periodo: PeriodoPresupuesto
  fecha_inicio?: string
  fecha_fin?: string | null
}
