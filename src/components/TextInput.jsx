import { forwardRef } from 'react'
import './text-input.css'

/** Native input props and refs pass through unchanged. Set --text-input-height on the field or its parent. */
export const TextInput = forwardRef(function TextInput({ className = '', variant = 'default', ...props }, ref) {
  return <input {...props} ref={ref} className={`text-input${variant === 'bare' ? ' text-input-bare' : ''}${className ? ` ${className}` : ''}`} />
})

/** A single shared surface for an input and leading/trailing controls. Use TextInput variant="bare" inside. */
export const InputShell = forwardRef(function InputShell({ as: Element = 'div', className = '', children, ...props }, ref) {
  return <Element {...props} ref={ref} className={`input-shell${className ? ` ${className}` : ''}`}>{children}</Element>
})
