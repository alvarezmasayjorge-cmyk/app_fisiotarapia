import BrandedLoader from '@/components/BrandedLoader';

export default function PatientDetailLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <BrandedLoader size="lg" label="Cargando paciente..." />
    </div>
  );
}
