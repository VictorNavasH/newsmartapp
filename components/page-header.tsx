interface PageHeaderProps {
  title: string
}

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-[26px] font-bold text-nua-title leading-tight">{title}</h1>
      <p className="text-nua-subtitle text-[12px] mt-[-4px]">Resumen y análisis de {title}</p>
    </div>
  )
}
