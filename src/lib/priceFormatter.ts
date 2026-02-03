import { useStore } from "@/contexts/StoreContext";
import { useExchangeRate } from "@/hooks/useExchangeRate";

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
    return `${currencySymbol}${formattedInteger}${decimalSeparator}${decimalPart}`;
  }

  return `${currencySymbol}${formattedInteger}`;
}

/**
 * Hook to get price formatter with store settings
 * Now includes automatic currency conversion EUR/USD → VES with dual display
 */
export function useFormatPrice() {
  const { store } = useStore();

  // Get product currency (the currency products are stored in)
  const productCurrency = store?.currency || "USD";

  // Check if conversion should be applied
  const shouldShowConversion =
    store?.enable_currency_conversion &&
    (productCurrency === "USD" || productCurrency === "EUR");

  // Get exchange rate if conversion is enabled
  const { rate } = useExchangeRate(
    productCurrency as "USD" | "EUR",
    "VES"
  );

  // Check if original price should be hidden
  const hideOriginalPrice = store?.hide_original_price ?? false;

  return (price: number) => {
    // Always calculate both prices
    const originalPrice = formatPrice(price, {
      currency: productCurrency,
      decimalPlaces: store?.decimal_places ?? 2,
      decimalSeparator: store?.decimal_separator || ".",
      thousandsSeparator: store?.thousands_separator || ",",
    });

    // If conversion is enabled and rate is available, show converted price
    if (shouldShowConversion && rate) {
      const convertedPrice = formatPrice(price * rate, {
        currency: "VES",
        decimalPlaces: store?.decimal_places ?? 2,
        decimalSeparator: store?.decimal_separator || ".",
        thousandsSeparator: store?.thousands_separator || ",",
      });

      // If hide_original_price is true, only show VES price
      if (hideOriginalPrice) {
        return {
          original: convertedPrice, // Show VES as main price
          converted: null,
          isDualDisplay: false,
          hideOriginalPrice: true,
        };
      }

      // Show both prices (normal dual display)
      return {
        original: originalPrice,
        converted: convertedPrice,
        isDualDisplay: true,
        hideOriginalPrice: false,
      };
    }

    // Return single price if conversion is not enabled
    return {
      original: originalPrice,
      converted: null,
      isDualDisplay: false,
      hideOriginalPrice: false,
    };
  };
}

/**
 * Hook to get the active price for checkout/orders
 * Returns the price that should be used for calculations
 */
export function useActivePrice() {
  const { store } = useStore();
  const productCurrency = store?.currency || "USD";

  const shouldConvert =
    store?.enable_currency_conversion &&
    store?.active_currency === "VES" &&
    (productCurrency === "USD" || productCurrency === "EUR");

  const { rate } = useExchangeRate(
    productCurrency as "USD" | "EUR",
    "VES"
  );

  return (price: number) => {
    if (shouldConvert && rate) {
      return {
        amount: price * rate,
        currency: "VES",
      };
    }

    return {
      amount: price,
      currency: productCurrency,
    };
  };
}
