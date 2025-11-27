import { useStore } from "@/contexts/StoreContext";

/**
 * Formats a price according to store settings
 */
export function formatPrice(
  price: number,
  options: {
    currency?: string;
    decimalPlaces?: number;
    decimalSeparator?: string;
    thousandsSeparator?: string;
  }
): string {
  const {
    currency = "USD",
    decimalPlaces = 2,
    decimalSeparator = ".",
    thousandsSeparator = ",",
  } = options;

  // Get currency symbol
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    BRL: "R$",
    VES: "Bs",
    COP: "$",
    MXN: "$",
    ARS: "$",
    CLP: "$",
    PEN: "S/",
  };

  const currencySymbol = currencySymbols[currency] || currency;

  // Split number into integer and decimal parts
  const fixedPrice = price.toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixedPrice.split(".");

  // Add thousands separator
  const formattedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandsSeparator
  );

  // Construct final price string
  if (decimalPlaces > 0 && decimalPart) {
    return `${currencySymbol} ${formattedInteger}${decimalSeparator}${decimalPart}`;
  }

  return `${currencySymbol} ${formattedInteger}`;
}

/**
 * Hook to get price formatter with store settings
 */
export function useFormatPrice() {
  const { store } = useStore();

  return (price: number) =>
    formatPrice(price, {
      currency: store?.currency || "USD",
      decimalPlaces: store?.decimal_places ?? 2,
      decimalSeparator: store?.decimal_separator || ".",
      thousandsSeparator: store?.thousands_separator || ",",
    });
}
