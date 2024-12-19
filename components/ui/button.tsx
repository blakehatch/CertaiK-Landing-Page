import * as React from "react"

import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'bright' | 'dark';
}

const Button: React.FC<ButtonProps> = (props) => {
  const { type, className, variant, disabled, children, ...rest } = props;
  const isBright = variant === 'bright';
  return (
    <button
      type={type}
      className={cn(
        "flex items-center justify-center",
        "appearance-none bg-gradient-to-r text-white py-2 px-5 rounded-md text-md min-w-36 h-9",
        isBright && "from-cyan-500 to-purple-500",
        !isBright && "from-gray-500 to-gray-700",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:opacity-80 transition-opacity",
        className
      )}
      disabled={disabled}
      {...rest}
    >{children}</button>
  )
}
Button.displayName = "Input"

export { Button }