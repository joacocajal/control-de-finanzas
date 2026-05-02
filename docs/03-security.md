# Seguridad — Control de Finanzas Personales

## Autenticación
- **Proveedor:** Supabase Auth (email + password)
- **Flujo:** Email/password → JWT access token + refresh token → almacenado en cookies HttpOnly vía `@supabase/ssr`
- **Middleware:** `middleware.ts` en la raíz intercepta todas las rutas y verifica el token. Redirige a `/login` si no hay sesión activa.
- **Rutas protegidas:** todo bajo `(dashboard)/` requiere sesión. Las rutas `(auth)/` redirigen al dashboard si ya hay sesión.

## Autorización
- **Row Level Security (RLS):** ACTIVO en todas las tablas con datos de usuario (`profiles`, `categories`, `transactions`)
- **Principio:** cada usuario solo puede leer y escribir sus propios datos (`auth.uid() = user_id`)
- **Roles:** solo rol `authenticated` (no hay roles admin en esta fase)
- **Service Role Key:** usada ÚNICAMENTE en server-side (API routes), NUNCA expuesta al cliente

## Variables de Entorno
| Variable | Nivel | Cómo se protege |
|----------|-------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | pública | Segura para exponer (solo URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | pública | Segura: RLS la protege |
| `SUPABASE_SERVICE_ROLE_KEY` | privada | Solo en server, NUNCA en cliente |
| `ANTHROPIC_API_KEY` | privada | Solo en API route `/api/ai/chat` |

## Políticas RLS por Tabla

### profiles
```sql
-- Solo el propio usuario puede ver su perfil
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Solo el propio usuario puede actualizar su perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### categories
```sql
-- El usuario ve sus propias categorías
CREATE POLICY "categories_select_own" ON categories
  FOR SELECT USING (auth.uid() = user_id);

-- El usuario crea sus propias categorías
CREATE POLICY "categories_insert_own" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- El usuario actualiza sus propias categorías
CREATE POLICY "categories_update_own" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

-- El usuario elimina sus propias categorías
CREATE POLICY "categories_delete_own" ON categories
  FOR DELETE USING (auth.uid() = user_id);
```

### transactions
```sql
-- El usuario ve sus propias transacciones
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- El usuario crea sus propias transacciones
CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- El usuario actualiza sus propias transacciones
CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- El usuario elimina sus propias transacciones
CREATE POLICY "transactions_delete_own" ON transactions
  FOR DELETE USING (auth.uid() = user_id);
```

## Validación de Inputs
- Todo input del usuario es validado con **Zod** en el servidor antes de tocar la base de datos
- Los montos se validan como números positivos (no negativos, no NaN)
- Las fechas se validan como ISO 8601 válidas
- Los strings se sanean (trim, longitud máxima)
- Los errores de validación nunca revelan detalles internos al cliente

## Chat de IA — Consideraciones de Seguridad
- El endpoint `/api/ai/chat` requiere sesión activa (verificada en el Route Handler)
- Los datos financieros del usuario se envían a Claude solo con su consentimiento implícito al usar el chat
- No se almacena el historial del chat en la base de datos (solo en memoria del cliente)
- La `ANTHROPIC_API_KEY` nunca se expone al cliente

## Reglas INVIOLABLES
- NUNCA hardcodear credenciales en el código
- NUNCA exponer `SUPABASE_SERVICE_ROLE_KEY` en el cliente (sin `NEXT_PUBLIC_`)
- NUNCA desactivar RLS en una tabla con datos de usuario sin autorización explícita
- NUNCA hacer deploy sin revisar el checklist de seguridad de `docs/04-deployment.md`
- SIEMPRE validar inputs en el servidor (no confiar en validaciones del cliente)
- SIEMPRE usar tipos TypeScript para prevenir errores de datos
- NUNCA loguear credenciales, tokens, o datos sensibles del usuario

## Checklist de Seguridad (Pre-Deploy)
- [ ] `.env.local` está en `.gitignore`
- [ ] `.env.example` tiene todas las variables sin valores reales
- [ ] RLS activado y testeado en todas las tablas de usuario
- [ ] `SUPABASE_SERVICE_ROLE_KEY` no está en ningún archivo del cliente
- [ ] `ANTHROPIC_API_KEY` solo accesible desde server routes
- [ ] Validación Zod en todos los endpoints que reciben datos del usuario
- [ ] Middleware de auth protege todas las rutas del dashboard
