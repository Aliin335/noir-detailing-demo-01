import { getAllServices } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await getAllServices();

  return (
    <div>
      <div>
        <p className="text-xs font-semibold tracking-[0.5em] text-noir-text-secondary">
          NOIR ADMIN
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-noir-text md:text-5xl">
          Services
        </h1>
        <p className="mt-3 text-sm text-noir-text-secondary">
          Read-only for this phase.
        </p>
      </div>

      <div className="mt-12 border-t border-graphite">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="grid gap-3 border-b border-graphite py-8 md:grid-cols-[80px_1fr_auto_auto] md:items-center md:gap-10"
          >
            <span className="text-sm tracking-[0.3em] text-noir-text-secondary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-noir-text">
                {service.name}
              </h3>
              <p className="mt-2 max-w-md text-sm text-noir-text-secondary">
                {service.description}
              </p>
              {!service.active && (
                <p className="mt-2 text-[10px] font-semibold tracking-[0.2em] text-graphite">
                  INACTIVE
                </p>
              )}
            </div>
            <span className="text-lg font-semibold text-noir-text">€{service.price}</span>
            <span className="text-sm text-noir-text-secondary">
              {service.durationMinutes} min
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
