import type { MouseEventHandler, ReactNode } from "react"
import clsx from "clsx"

type ButtonProps = {
  type?: HTMLButtonElement["type"]
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined
  children?: ReactNode
  variant?: "primary" | "secondary"
  disabled?: boolean
  icon?: ReactNode
  rounded?: boolean
}

export default function Button({
  type = "button",
  children,
  className,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
  rounded = true
}: ButtonProps) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center",
        "p-4 text-sm",
        variant === "primary" ? "bg-toxic-orange" : "bg-orange-50",
        variant === "primary" ? "text-black" : "text-white",
        disabled && variant === "primary" ? "bg-gray-400" : null,
        disabled && variant === "secondary" ? "bg-boat-color-gray-900" : null,
        rounded ? "rounded-full" : null,
        className
      )}
      disabled={disabled}
    >
      {icon ? <span className="mr-2">{icon}</span> : null}
      {children}
    </button>
  )
}
