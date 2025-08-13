import Image from "next/image"
import { Smartphone } from "lucide-react"

interface EnhancedPhoneMockupProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  showTopBadge?: boolean
  showBottomBadge?: boolean
  topBadgeText?: string
  bottomBadgeText?: string
  topBadgeIcon?: React.ReactNode
  bottomBadgeIcon?: React.ReactNode
}

export default function EnhancedPhoneMockup({
  src,
  alt,
  width = 700,
  height = 1400,
  className = "",
  showTopBadge = false,
  showBottomBadge = true,
  topBadgeText = "Mobile Ready",
  bottomBadgeText = "Responsive Design",
  topBadgeIcon = <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>,
  bottomBadgeIcon = <Smartphone className="h-4 w-4 text-indigo-600" />
}: EnhancedPhoneMockupProps) {
  return (
    <div className="flex justify-center">
      <div className="relative">
        {/* Enhanced Container with Gradient Background */}
        <div className={`bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-3xl p-8 shadow-2xl border border-indigo-100/50 ${className}`}>
          {/* Floating Elements for Visual Interest */}
          {showTopBadge && (
            <div className="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg p-3 border border-indigo-100">
              <div className="flex items-center space-x-2">
                {topBadgeIcon}
                <span className="text-sm font-medium text-indigo-700">{topBadgeText}</span>
              </div>
            </div>
          )}
          
          {/* iPhone Mockup with Enhanced Shadow */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-3xl blur-xl"></div>
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="relative z-10 w-auto h-auto drop-shadow-2xl"
            />
          </div>
          
          {/* Bottom Floating Badge */}
          {showBottomBadge && (
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg px-4 py-2 border border-indigo-100">
              <div className="flex items-center space-x-2">
                {bottomBadgeIcon}
                <span className="text-sm font-medium text-indigo-700">{bottomBadgeText}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
