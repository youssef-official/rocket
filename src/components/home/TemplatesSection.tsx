interface TemplatesSectionProps {
  onSelectTemplate: (prompt: string) => void;
}

/**
 * Template management will be served by Vivora X's local API. Do not render an
 * empty remote-driven section while it has no local data source.
 */
export const TemplatesSection = (_props: TemplatesSectionProps) => null;
