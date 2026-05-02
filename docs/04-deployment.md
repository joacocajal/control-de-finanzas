# Deployment — Control de Finanzas Personales

> Este documento se completa cuando el proyecto esté listo para deploy.

## Plataforma Target
- **Frontend + API Routes:** Vercel
- **Base de datos + Auth:** Supabase (hosted)

## Variables de Entorno en Producción
Configurar en el dashboard de Vercel:
| Variable | Obtener desde |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (Service Role) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

## Checklist Pre-Deploy
- [ ] Build local exitoso (`npm run build`)
- [ ] Sin errores TypeScript (`npm run type-check`)
- [ ] Variables de entorno configuradas en Vercel
- [ ] RLS activo en todas las tablas
- [ ] Migraciones de Supabase aplicadas en producción
- [ ] `.env.local` en `.gitignore`
- [ ] Dominio configurado en Vercel

## Proceso de Deploy
```bash
# 1. Verificar build local
npm run build

# 2. Push a main (Vercel auto-deploy)
git push origin main

# 3. Verificar en Vercel dashboard que el build pasó
# 4. Verificar que las env vars están configuradas
```

## Rollback
- Vercel permite revertir a deployments anteriores desde el dashboard
- Para la DB: Supabase tiene backups automáticos diarios
