import { Link, LinkProps } from "react-router-dom"
import React from "react"

export const NavLink = React.forwardRef<
  HTMLAnchorElement,
  LinkProps & React.RefAttributes<HTMLAnchorElement>
>((props, ref) => <Link ref={ref} {...props} />)

NavLink.displayName = "NavLink"
