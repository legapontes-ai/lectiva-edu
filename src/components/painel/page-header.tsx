export function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">{titulo}</h1>
        {descricao && <p className="mt-1 text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
