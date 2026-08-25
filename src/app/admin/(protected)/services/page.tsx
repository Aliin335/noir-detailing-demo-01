import { getAllServices } from "@/lib/services";
import { CreateServiceForm } from "@/components/admin/services/create-service-form";
import { ServiceRow } from "@/components/admin/services/service-row";

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
          Create, edit, and activate or deactivate services.
        </p>
      </div>

      <div className="mt-12">
        <CreateServiceForm />
      </div>

      <div className="mt-12 border-t border-graphite">
        {services.map((service, index) => (
          <ServiceRow key={service.id} service={service} index={index} />
        ))}
      </div>
    </div>
  );
}
