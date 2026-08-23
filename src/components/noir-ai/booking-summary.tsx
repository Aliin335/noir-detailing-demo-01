import { AiActions } from "./ai-actions";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
        {label}
      </p>
      <p className="mt-2 text-sm text-noir-text md:text-base">{value}</p>
    </div>
  );
}

export function BookingSummary({
  vehicle,
  service,
  date,
  time,
  price,
  name,
  phone,
  email,
  onConfirm,
  onEdit,
}: {
  vehicle: string;
  service: string;
  date: string;
  time: string;
  price: string;
  name: string;
  phone: string;
  email: string;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="border-l border-silver pl-4 md:pl-6">
      <p className="text-[10px] font-semibold tracking-[0.25em] text-noir-text-secondary">
        YOUR APPOINTMENT
      </p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-noir-text sm:text-3xl">
        {vehicle}
      </p>
      <p className="mt-1 text-noir-text-secondary">{service}</p>

      <div className="mt-6 grid grid-cols-3 gap-6 border-t border-graphite pt-6">
        <Field label="DATE" value={date} />
        <Field label="TIME" value={time} />
        <Field label="PRICE" value={price} />
      </div>

      <div className="mt-6 grid gap-6 border-t border-graphite pt-6 sm:grid-cols-3">
        <Field label="NAME" value={name} />
        <Field label="PHONE" value={phone} />
        <Field label="EMAIL" value={email} />
      </div>

      <div className="mt-8">
        <AiActions
          items={[
            { label: "CONFIRM APPOINTMENT", arrow: true, onClick: onConfirm },
            { label: "EDIT DETAILS", onClick: onEdit },
          ]}
        />
      </div>
    </div>
  );
}
