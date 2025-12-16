import { useFormatPrice } from "@/lib/priceFormatter";
import React from "react";

interface DualPriceProps {
  price: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  style?: React.CSSProperties;
  conversionTextColor?: string;
}

/**
 * Component to display dual currency pricing
 * Shows original price (USD/EUR) with converted VES price below if enabled
 */
export function DualPrice({ price, className = "", size = "md", style, conversionTextColor }: DualPriceProps) {
  const formatPrice = useFormatPrice();
  const priceData = formatPrice(price);

  const sizeClasses = {
    sm: {
      original: "text-base font-bold",
      converted: "text-xs",
    },
    md: {
      original: "text-xl font-bold",
      converted: "text-sm",
    },
    lg: {
      original: "text-2xl font-bold",
      converted: "text-base",
    },
  };

  const classes = sizeClasses[size];

  if (!priceData.isDualDisplay) {
    // Single price display
    return <div className={`${classes.original} ${className}`} style={style}>{priceData.original}</div>;
  }

  // Dual price display
  return (
    <div className={`flex flex-col gap-0.5 ${className}`} style={style}>
      <div className={classes.original}>{priceData.original}</div>
      <div
        className={`${classes.converted} ${conversionTextColor ? '' : 'text-muted-foreground'}`}
        style={conversionTextColor ? { color: conversionTextColor, opacity: 0.85 } : undefined}
      >
        {priceData.converted}
      </div>
    </div>
  );
}
