import type { ReactNode } from 'react'

type Props = {
  title?: string
  icon?: string
  children: ReactNode
  className?: string
}

export default function Card({ title, icon, children, className = '' }: Props) {
  return (
    <section className={`card ${className}`.trim()}>
      {title && (
        <div className="card-title">
          {icon && <span aria-hidden="true">{icon}</span>}
          <h2>{title}</h2>
        </div>
      )}
      {children}
    </section>
  )
}
