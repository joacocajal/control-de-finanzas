-- ============================================================
-- Ascend — Suggested Skills Catalog
-- Migración: 00005_suggested_skills.sql
-- Fecha: 2026-05-17
-- Descripción: Catálogo global de skills curadas para el módulo
--   de aprendizaje. Solo lectura desde el cliente. Los registros
--   se vinculan opcionalmente a aprendizaje_skills del usuario.
-- ============================================================

-- ─── Catálogo global ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.suggested_skills (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text        NOT NULL,
  category         text        NOT NULL,
  description      text        NOT NULL,
  why_it_matters   text,
  difficulty       text        CHECK (difficulty IN ('principiante','intermedio','avanzado')) DEFAULT 'intermedio',
  estimated_hours  integer,
  icon             text,
  display_order    integer     DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suggested_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read active suggested skills" ON public.suggested_skills
  FOR SELECT USING (is_active = true);


-- ─── Vincular a skills del usuario ───────────────────────────

ALTER TABLE public.aprendizaje_skills
  ADD COLUMN IF NOT EXISTS suggested_skill_id uuid REFERENCES public.suggested_skills(id) ON DELETE SET NULL;


-- ─── Seed: 22 skills curadas ─────────────────────────────────

INSERT INTO public.suggested_skills
  (name, category, description, why_it_matters, difficulty, estimated_hours, icon, display_order)
VALUES

-- Comunicación
('Comunicación efectiva', 'Comunicación',
 'Transmitir ideas con claridad, escuchar activamente y adaptar el mensaje al interlocutor.',
 'Es la skill que multiplica todas las demás. Sin comunicación, ni tu mejor producto ni tu mejor idea llegan a nadie.',
 'principiante', 60, 'MessageCircle', 1),

('Hablar en público', 'Comunicación',
 'Presentar ideas frente a audiencias con seguridad, estructura y impacto.',
 'Indispensable para vender, liderar equipos, pitchear inversores o crear contenido en video.',
 'intermedio', 40, 'Mic', 2),

('Escritura persuasiva (copywriting)', 'Comunicación',
 'Escribir textos que vendan, convenzan o movilicen a la acción.',
 'Cada email, post o landing page que escribís puede generar o perder dinero. El copy es palanca pura.',
 'intermedio', 50, 'PenLine', 3),

('Storytelling', 'Comunicación',
 'Estructurar narrativas que conecten emocionalmente con la audiencia.',
 'Las marcas, productos y personas que se recuerdan son las que cuentan buenas historias.',
 'intermedio', 30, 'BookOpen', 4),

-- Ventas
('Ventas B2B', 'Ventas',
 'Prospectar, calificar, hacer demos, manejar objeciones y cerrar tratos con empresas.',
 'Si tenés una agencia o un SaaS, esta skill define cuánto facturás. Más importante que el producto.',
 'intermedio', 80, 'Handshake', 5),

('Negociación', 'Ventas',
 'Llegar a acuerdos donde ambas partes ganan, gestionando concesiones y ancla de precio.',
 'Aplica a sueldos, contratos con proveedores, partnerships, cierres comerciales. Se nota en plata real.',
 'intermedio', 40, 'Scale', 6),

('Cold outreach (DMs y emails fríos)', 'Ventas',
 'Contactar prospectos en frío con mensajes que generen respuesta y reuniones.',
 'Cómo conseguís tus primeros clientes cuando no tenés red. Skill base para arrancar una agencia.',
 'principiante', 30, 'Send', 7),

-- Marketing
('Marketing digital', 'Marketing',
 'Entender funnels, métricas, canales (orgánico, paid, email) y atribuir resultados.',
 'Sin esta skill estás tirando plata en anuncios sin saber qué funciona.',
 'intermedio', 80, 'TrendingUp', 8),

('SEO y posicionamiento', 'Marketing',
 'Optimizar contenido y sitios para que Google los encuentre y los muestre arriba.',
 'Tráfico orgánico es el activo más barato y duradero que puede tener un negocio.',
 'intermedio', 60, 'Search', 9),

('Creación de contenido', 'Marketing',
 'Producir video, fotos y posts que atraigan audiencia de forma consistente.',
 'Construir audiencia propia es construir un activo.',
 'principiante', 50, 'Camera', 10),

('Branding personal', 'Marketing',
 'Construir una identidad pública reconocible que genere oportunidades.',
 'En 2026 tu marca personal abre puertas que el CV no abre.',
 'intermedio', 40, 'Star', 11),

-- Tecnología
('Vibe coding (Cursor / Claude Code)', 'Tecnología',
 'Construir productos digitales usando IA como copiloto sin ser dev tradicional.',
 'Hoy podés lanzar SaaS y herramientas internas en días, no meses. Es leverage puro.',
 'intermedio', 60, 'Code2', 12),

('Automatización con n8n', 'Tecnología',
 'Conectar APIs y orquestar flujos de trabajo sin escribir código.',
 'Te ahorra horas semanales y es lo que vendés en tu agencia de IA.',
 'intermedio', 40, 'Workflow', 13),

('Prompt engineering', 'Tecnología',
 'Diseñar prompts que extraigan resultados precisos y reproducibles de modelos de IA.',
 'Si trabajás con IA, la calidad del prompt define la calidad del output. Es la skill más rentable de 2026.',
 'principiante', 30, 'Sparkles', 14),

('Diseño UI/UX básico', 'Tecnología',
 'Crear interfaces que sean usables, claras y estéticamente decentes sin ser diseñador.',
 'Tus apps, landing pages y decks se ven mejor y convierten más.',
 'principiante', 50, 'Palette', 15),

-- Finanzas
('Finanzas personales', 'Finanzas',
 'Presupuesto, ahorro, deuda, inversión básica, manejo de cash flow personal.',
 'Lo que no sabés de plata, te lo cobra el sistema. Es la skill que más libertad te da con menos esfuerzo.',
 'principiante', 30, 'Wallet', 16),

('Unit economics y modelos de negocio', 'Finanzas',
 'Entender costos, márgenes, CAC, LTV y break-even de un negocio.',
 'Sin esto, vendés mucho y perdés plata.',
 'intermedio', 40, 'Calculator', 17),

('Inversión en activos', 'Finanzas',
 'Conceptos base de acciones, ETFs, cripto y renta fija. Diversificación y riesgo.',
 'Hacer crecer el capital sin trabajar más horas. Importante de aprender joven.',
 'intermedio', 60, 'LineChart', 18),

-- Personal
('Productividad y gestión del tiempo', 'Personal',
 'Sistemas para priorizar, ejecutar y no quemarse manejando múltiples proyectos.',
 'Manejás múltiples proyectos a la vez. Esta skill define si llegás o colapsás.',
 'principiante', 30, 'Clock', 19),

('Pensamiento crítico', 'Personal',
 'Analizar información, detectar falacias, tomar decisiones con datos.',
 'En un mundo lleno de ruido y opiniones, ver claro es ventaja competitiva.',
 'intermedio', 40, 'Brain', 20),

('Liderazgo y gestión de equipos', 'Personal',
 'Coordinar, motivar y desarrollar personas para que el equipo rinda más que la suma.',
 'Saber liderar evita perder a las personas clave de tu equipo.',
 'intermedio', 60, 'Users', 21),

('Inglés conversacional avanzado', 'Personal',
 'Hablar, escribir y entender inglés a nivel negocio internacional.',
 'Multiplica tu mercado, tus fuentes de aprendizaje y tus clientes potenciales por 10.',
 'intermedio', 200, 'Languages', 22);
