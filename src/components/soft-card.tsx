type SoftCardProps = React.ComponentPropsWithoutRef<"article">;

export function SoftCard({ className = "", ...props }: SoftCardProps) {
  return <article className={`soft-card ${className}`} {...props} />;
}
