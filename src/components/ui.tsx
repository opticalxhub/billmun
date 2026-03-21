import * as React from "react"

export const Card = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-bg-card rounded-card border border-border-subtle p-6 shadow-sm ${className || ''}`} {...props} />
)

export const SectionLabel = ({className, ...props}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={`font-jotia text-xl mb-4 text-text-primary ${className || ''}`} {...props} />
)

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={`flex h-10 w-full rounded-input border border-border-input bg-transparent px-3 py-2 text-sm md:text-sm text-[16px] placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary ${className || ''}`} {...props} />
  )
)
Input.displayName = "Input"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={`flex h-10 w-full flex-1 rounded-input border border-border-input bg-transparent px-3 py-2 text-sm md:text-sm text-[16px] focus:outline-none focus:ring-2 focus:ring-text-primary ${className || ''}`} {...props} />
  )
)
Select.displayName = "Select"

export const FormLabel = ({className, ...props}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={`block text-form-label mb-2 text-text-primary text-sm md:text-xs font-bold uppercase tracking-widest ${className || ''}`} {...props} />
)

export const FormGroup = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`space-y-2 ${className || ''}`} {...props} />
)

export const ErrorMessage = ({className, ...props}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-error-text text-status-rejected-text mt-1 text-xs ${className || ''}`} {...props} />
)

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-input border border-border-input bg-transparent px-3 py-2 text-sm md:text-sm text-[16px] placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-text-primary ${className || ''}`}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea';

type BadgeVariant = 'default' | 'approved' | 'pending' | 'rejected' | 'suspended';

export const Badge = ({
  className,
  children,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) => {
  const variantClass =
    variant === 'approved'
      ? 'bg-status-approved-bg text-status-approved-text border border-status-approved-border'
      : variant === 'pending'
      ? 'bg-status-pending-bg text-status-pending-text border border-status-pending-border'
      : variant === 'rejected' || variant === 'suspended'
      ? 'bg-status-rejected-bg text-status-rejected-text border border-status-rejected-border'
      : 'bg-bg-raised text-text-secondary border border-border-subtle';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass} ${className || ''}`}
      {...props}
    >
      {children}
    </span>
  );
};

export function Modal({
  isOpen,
  onClose,
  children,
  className,
}: {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-4">
      <div className={`bg-bg-card w-full h-full md:h-auto md:max-w-xl md:rounded-xl p-6 shadow-lg overflow-y-auto ${className || ''}`}>
        <div className="relative h-full">
          {onClose ? (
            <button
              className="absolute top-0 right-0 p-2 text-text-secondary hover:text-text-primary z-10"
              onClick={onClose}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
          <div className="pt-8 md:pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Button } from './button';
