import BrandedLoader from '@/components/BrandedLoader';

export default function PatientsLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <BrandedLoader size="lg" label="Cargando pacientes..." />
    </div>
  );
}
