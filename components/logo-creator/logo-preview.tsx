"use client"

import type React from "react"

import type { LogoSettings } from "./index"

interface LogoPreviewProps {
  settings: LogoSettings
}

export function LogoPreview({ settings }: LogoPreviewProps) {
  const {
    teamName,
    primaryColor,
    secondaryColor,
    backgroundColor,
    fontFamily,
    logoStyle,
    iconName,
    showIcon,
    showText,
    containerStyle,
  } = settings

  // Apply container style
  const containerClasses = `
    flex items-center justify-center p-8 rounded-lg
    ${containerStyle === "badge" ? "logo-badge" : ""}
    ${containerStyle === "emblem" ? "logo-emblem" : ""}
    ${containerStyle === "crest" ? "logo-crest" : ""}
    ${containerStyle === "modern" ? "logo-modern" : ""}
  `

  // Apply logo style
  const logoClasses = `
    text-center text-4xl font-bold
    ${fontFamily ? `font-${fontFamily.toLowerCase()}` : ""}
    ${logoStyle === "neon" ? "logo-neon" : ""}
    ${logoStyle === "raised" ? "logo-raised" : ""}
    ${logoStyle === "shadow" ? "logo-shadow" : ""}
    ${logoStyle === "layered" ? "logo-layered" : ""}
    ${logoStyle === "beveled" ? "logo-beveled" : ""}
    ${logoStyle === "glass" ? "logo-glass" : ""}
    ${logoStyle === "metallic" ? "logo-metallic" : ""}
    ${logoStyle === "holographic" ? "logo-holographic" : ""}
  `

  // Set CSS variables for container styles
  const containerStyle1 = {
    "--primary-color": primaryColor,
    "--secondary-color": secondaryColor,
    "--border-color": secondaryColor,
    "--accent-color": settings.accentColor,
    backgroundColor: containerStyle === "default" ? backgroundColor : undefined,
  } as React.CSSProperties

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Logo Preview</h3>

      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
        <div className={containerClasses} style={containerStyle1}>
          <div className="flex flex-col items-center gap-2">
            {showIcon && iconName && (
              <div className="w-16 h-16 mb-2">
                <img src={`/images/mascots/${iconName}.png`} alt={iconName} className="w-full h-full object-contain" />
              </div>
            )}

            {showText && (
              <div className={logoClasses} style={{ color: primaryColor }}>
                {teamName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
