import React from 'react'
import './ui.css'

export function UiButton({children,variant='primary',className='',...props}) {
  return <button className={'ui-button ui-button--'+variant+' '+className} {...props}>{children}</button>
}
export function UiPanel({title,subtitle,action,children,className=''}) {
  return <section className={'ui-panel '+className}>
    {(title || action) && <header className="ui-panel__head">
      <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
      {action}
    </header>}
    {children}
  </section>
}
export function UiStatus({children,tone='neutral'}) {
  return <span className={'ui-status ui-status--'+tone}>{children}</span>
}
export function UiNavLink({href,active,children,onClick}) {
  return <a href={href} aria-current={active?'page':undefined}
    className={'ui-nav-link'+(active?' is-active':'')} onClick={onClick}>{children}</a>
}
