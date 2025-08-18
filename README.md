# 🚀 NuxtShip

**Skip the auth boilerplate. Ship your idea faster.**

Get enterprise-grade authentication, user management, and database security out of the box. No more coding login flows, password resets, or user profiles. Focus on the unique business logic of your app while standing on the shoulders of giants.

## ✨ What You Get with NuxtShip

- **🔐 Complete Authentication**: Login, logout, password reset, user profiles
- **👤 User Management**: Add, remove, edit users for your app
- **🛡️ Row Level Security**: User-scoped data isolation at the database level
- **🌐 SSL for Development**: Automatic certificates, no browser warnings
- **🐳 Container-First**: Consistent development environment
- **⚡ Zero Config**: From idea to running app in 3 commands

## 🚀 Quick Start

```bash
# 1. Create your project
bun x nuxi init -t github:MichaelSchmidle/NuxtShip@latest my-awesome-app

# 2. Configure (see .env.example for details)
cd my-awesome-app
cp .env.example .env

# 3. Initialize everything
bun run init
```

Your app runs at `https://app.localhost` with full authentication ready. Use `.localhost` subdomains for zero-config setup, or configure custom domains in `.env`.

## 📋 Prerequisites

- **[Node.js](https://nodejs.org/)** (18.0.0+)
- **[Docker](https://www.docker.com/)**
- **[Bun](https://bun.sh/)** (or npm/pnpm/yarn)
- **[mkcert](https://mkcert.dev/)**

## 🛠️ Development

```bash
bun run dev          # Local Nuxt development with containerized infrastructure
```

This approach gives you the best of both worlds:

- **Fast development** - Native Node.js performance, instant hot reload
- **Consistent infrastructure** - Database, authentication, and proxy services run in containers
- **No "works on my machine"** - Infrastructure is identical across all environments

## 🐳 Infrastructure Commands

```bash
# Infrastructure management
bun run infra:start    # Start all containers
bun run infra:stop     # Stop all containers
bun run infra:restart  # Restart infrastructure
bun run infra:logs     # View container logs
bun run infra:status   # Check container status

# Database operations
bun run db:generate    # Generate database migrations
bun run db:migrate     # Run database migrations
bun run db:studio      # Open Drizzle Studio
```

## 🗂️ Project Structure

```
my-awesome-app/
├── app/                    # Your Nuxt application
├── deployment/             # Infrastructure configuration
│   ├── docker-compose.yml      # Base services
│   ├── docker-compose.dev.yml  # Development overrides
│   └── scripts/                # Setup automation
├── server/                 # API and database
└── .env                    # Configuration (see .env.example)
```

### Authentication Flow

1. User visits your app
2. Redirected to Zitadel for secure authentication
3. PKCE flow ensures token security
4. User returns with valid session

## 🔍 Available Services

After setup:

- **`https://app.localhost`** (or your custom app domain): Your application
- **`https://auth.localhost`** (or your custom auth domain): Authentication provider
- **`https://proxy.localhost:8080`** (or your custom proxy domain): Traefik dashboard

## 🧪 Quality Tools

```bash
bun run typecheck    # Type checking
bun run lint         # Code linting
bun run lint:fix     # Auto-fix issues
bun run check        # Run all checks
```

## 🤝 Contributing

1. Fork this repository
2. Make your changes
3. Test with `bun run init`
4. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

Made with ❤️ and [Node.js](https://nodejs.org/), [Docker](https://www.docker.com/), [Bun](https://bun.sh/), [mkcert](https://mkcert.dev/), [Nuxt](https://nuxt.com/), [Traefik](https://traefik.io/), [Zitadel](https://zitadel.com/), [PostgreSQL](https://postgresql.org/), [Drizzle](https://orm.drizzle.team/), [Nuxt UI](https://ui.nuxt.com/), [nuxt-oidc-auth](https://nuxtoidc.cloud), and [Phosphor Icons](https://phosphoricons.com/).
