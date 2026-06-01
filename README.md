# 🩺 Helpy

Sistema de primeiros socorros gamificado. Tira foto, a IA analisa, ganhas pontos por ajudar.

## Stack
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Base de dados**: Supabase (PostgreSQL)
- **IA**: Claude API (análise de imagens)
- **Docker**: para correr tudo junto

---

## Configuração inicial

### 1. Clona e entra na pasta
```bash
git clone <url-do-teu-repo>
cd helpy
```

### 2. Variáveis de ambiente


## Pass supabase: 67PoRCa_bYou


**backend/.env**
```
SUPABASE_URL=https://vghrhjexnrocqugcxohp.supabase.co
SUPABASE_SERVICE_KEY=https://vghrhjexnrocqugcxohp.supabase.co
PORT=3001
```

**frontend/.env**
```
VITE_SUPABASE_URL=https://vghrhjexnrocqugcxohp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaHJoamV4bnJvY3F1Z2N4b2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDAzODAsImV4cCI6MjA5NTg3NjM4MH0.ZImzFzjxY1_tizi9EIUhg0VWYNZG_iH10LJPVffzGwk
VITE_API_URL=http://localhost:3001
```

### 3. Supabase — cria estas tabelas

```sql
-- Perfis dos utilizadores
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  total_points integer default 0,
  level integer default 1,
  created_at timestamp default now()
);

-- Missões completadas
create table missions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  mission_type text not null,
  points_earned integer not null,
  ai_result text,
  completed_at timestamp default now()
);

-- Row Level Security (importante!)
alter table profiles enable row level security;
alter table missions enable row level security;

create policy "Utilizadores veem o seu perfil"
  on profiles for select using (auth.uid() = id);

create policy "Utilizadores veem as suas missões"
  on missions for select using (auth.uid() = user_id);
```

### 4. Corre com Docker
```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 5. Ou sem Docker (desenvolvimento)
```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

---

## Estrutura do projeto

```
helpy/
├── frontend/          # React + Vite
│   └── src/
│       ├── pages/     # Home, Camera, Result, Ranking, Login
│       ├── components/ # HelpyBot, XPBar, MissionCard
│       └── lib/       # supabase.js, api.js
├── backend/           # Node.js + Express
│   └── routes/        # analyze.js, users.js, points.js
└── docker-compose.yml
```

---

## Fases do projeto

- **Fase 1** — Login, ecrã principal, sistema de pontos básico
- **Fase 2** — Câmara + análise IA
- **Fase 3** — Gamificação (níveis, conquistas, ranking)
- **Fase 4** — PWA, modo offline, polimento




