# TurnoVivo Frontend

Frontend de TurnoVivo construido con Next.js (App Router), React 19 y TypeScript.

## Requisitos previos

1. Node.js 20 o superior.
2. npm 10 o superior.
3. Backend de TurnoVivo corriendo en localhost:3000.

Referencia de backend:
[turnovivo-backend/README.md](../turnovivo-backend/README.md)

## Instalación

Desde la carpeta frontend:

cd turnovivo-frontend
npm install

## Arranque en desarrollo

Este proyecto incluye dos scripts de desarrollo:

1. Puerto por defecto (3000)
npm run dev

2. Puerto recomendado para evitar choque con backend (3001)
npm run dev:3001

Abrir en navegador:

http://localhost:3001

## Dependencia con el backend

Para funcionamiento completo (login, registro, agenda, reservas) necesitas backend activo.

Validación rápida:
1. Backend arriba en localhost:3000
2. Frontend arriba en localhost:3001
3. Login funcional en /login

## Configuración de API

El servicio de API usa NEXT_PUBLIC_API_URL con fallback a http://localhost:3000 en:
[src/services/api.ts](src/services/api.ts)

Puedes agregar archivo .env.local en frontend con:

NEXT_PUBLIC_API_URL=http://localhost:3000

Opcional para personalizar la demo sin tocar código:

NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG=barberia-premium
NEXT_PUBLIC_DEFAULT_BUSINESS_NAME=Barberia Premium

Nota importante:
El frontend consume backend desde una sola capa centralizada en [src/services/api.ts](src/services/api.ts).

## Scripts útiles

1. npm run dev
2. npm run dev:3001
3. npm run build
4. npm run start
5. npm run test
6. npm run lint

## Flujo recomendado para desarrolladores nuevos

1. Levantar infraestructura y backend siguiendo:
[turnovivo-backend/README.md](../turnovivo-backend/README.md)
2. En otra terminal levantar frontend:
cd turnovivo-frontend
npm run dev:3001
3. Abrir http://localhost:3001

## Demo en 5 minutos (portfolio)

Objetivo:
Que una persona externa pueda validar valor funcional y arquitectura sin conocer el código.

Checklist rápido:
1. Backend activo en localhost:3000
2. Frontend activo en localhost:3001
3. Abrir http://localhost:3001
4. Clic en "Entrar a la demo"
5. Login con:
	- Email: cliente.real@turnovivo.com
	- Password: password123

Flujo recomendado de validación:
1. Reservar un turno disponible.
2. Intentar reservar otro turno para validar regla de una cita activa.
3. Liberar turno (cancelación) y observar actualización de grilla.
4. Entrar a lista de espera en un turno ocupado y salir de la fila.

Resultado esperado:
1. Cambios visibles en tiempo real en tarjetas de slots.
2. Mensajes de feedback consistentes (éxito/error/advertencia).
3. Navegación estable entre home, login y agenda de demo.

## Entregable sugerido para entrevista

1. Compartir URL local o despliegue.
2. Compartir este README con la sección "Demo en 5 minutos".
3. Preparar explicación breve de arquitectura:
	- Next.js App Router (UI)
	- NestJS + Prisma (reglas y datos)
	- Redis (eventos y estado efímero)

## Script de demo para entrevista (2-3 minutos)

Puedes decir algo como:

1. "TurnoVivo es un MVP de agenda inteligente con flujo completo de reservas, lista de espera y cancelaciones en tiempo real."
2. "La UI está en Next.js con App Router y el backend en NestJS con Prisma; Redis maneja estado efímero y la cascada de turnos."
3. "La demo está pensada para mostrar criterio de producto y arquitectura: login, reservas, validaciones y feedback inmediato."
4. "No está sobrecargado con CRUD innecesario; el foco es resolver el flujo central y dejar preparado el camino para multiempresa."
5. "Si te interesa, te puedo mostrar cómo el seed y el polling mantienen la demo viva sin intervención manual."

## Troubleshooting rápido

1. Error de red en login o agenda
	Verifica backend arriba en localhost:3000.

2. Pantalla sin datos de slots
	Verifica que backend tenga migraciones y seed aplicados.

3. Puerto ocupado al iniciar frontend
	Usa npm run dev:3001 para evitar conflictos.

4. Token inválido o sesión rara
	Limpia cookie turnovivo_token del navegador y vuelve a iniciar sesión.

## Despliegue recomendado

Referencia completa:
[DEPLOYMENT.md](../DEPLOYMENT.md)

Para frontend en producción:
1. Define `NEXT_PUBLIC_API_URL` apuntando al backend público.
2. Mantén `NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG` y `NEXT_PUBLIC_DEFAULT_BUSINESS_NAME` si quieres personalizar la demo.
3. Ejecuta `npm run build`.
4. Arranca con `npm run start` o despliega en Vercel.
