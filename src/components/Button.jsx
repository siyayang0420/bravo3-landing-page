import './Button.css';

/*
 * Design system button — Bravo Design System (Core).
 * variant: primary (137:1982) | ghost (137:2060)
 * size:    reg (137:1982, 48px) | mid (1042:6330, 41px) | sm (1042:6348, 26px)
 * Renders an <a> when href is given, otherwise a <button>.
 */
export default function Button({
  variant = 'primary',
  size = 'reg',
  full = false,
  href,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    full ? 'button--full' : '',
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return <a className={classes} href={href} {...props}>{children}</a>;
  }
  return <button className={classes} type="button" {...props}>{children}</button>;
}
