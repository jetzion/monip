/** A "$" inside an amount field (admin.components.beforeInput); the amounts are US dollars. */
export function DollarPrefix() {
  return (
    <span className="dollar-prefix" aria-hidden="true">
      $
    </span>
  );
}
