import Link from 'next/link';
import { DEFAULT_DEMO_NAME, DEFAULT_DEMO_PATH } from '@/config/app';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060816] text-zinc-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute right-[-8%] top-28 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-t from-zinc-950 to-transparent" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
              TurnoVivo MVP
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Agenda inteligente anti no-show
            </div>

            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Gestiona turnos en tiempo real sin perder el control de tu agenda.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
              Una demo funcional para mostrar reservas, lista de espera, cancelaciones y manejo de slots con Redis y
              NestJS. Diseñada como MVP de portafolio, lista para que alguien entre, pruebe el flujo y entienda el valor
              en pocos minutos.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={DEFAULT_DEMO_PATH}
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-transform hover:-translate-y-0.5 hover:bg-amber-400"
              >
                Entrar a la demo
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/70 px-6 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                Crear cuenta de prueba
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Flujo</p>
                <p className="mt-2 text-lg font-bold text-white">Reserva, espera y hold</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">El usuario vive el ciclo completo de una cita.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Backend</p>
                <p className="mt-2 text-lg font-bold text-white">NestJS + Prisma</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Autenticación, slots y reglas de negocio centralizadas.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Tiempo real</p>
                <p className="mt-2 text-lg font-bold text-white">Redis en acción</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">Cascadas de cancelación y expiración de hold visibles.</p>
              </div>
            </div>
          </div>

          <aside className="relative">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Demo disponible</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-white">{DEFAULT_DEMO_NAME}</h2>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                  Seed ready
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm text-zinc-300">
                <div className="flex items-start justify-between gap-4 rounded-2xl bg-zinc-950/60 p-4">
                  <div>
                    <p className="font-semibold text-white">Credenciales demo</p>
                    <p className="mt-1 text-zinc-400">cliente.real@turnovivo.com</p>
                  </div>
                  <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-300">
                    password123
                  </span>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Qué se puede probar</p>
                  <ul className="mt-3 space-y-2 text-zinc-300">
                    <li>• Reservar un turno disponible</li>
                    <li>• Entrar y salir de la lista de espera</li>
                    <li>• Cancelar una cita y ver la cascada</li>
                    <li>• Revisar el panel admin de operación</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
                  <p className="font-semibold">MVP de portafolio, no producto final</p>
                  <p className="mt-1 text-sm leading-6 text-amber-50/80">
                    El enfoque es demostrar arquitectura, flujo de usuario y control operativo sin meter CRUD de empresas.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
