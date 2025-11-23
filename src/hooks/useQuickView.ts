import { create } from 'zustand';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description?: string | null;
  categoryId?: string | null;
}

interface QuickViewStore {
  isOpen: boolean;
  currentProduct: Product | null;
  allProducts: Product[];
  currentIndex: number;
  scrollPosition: number;

  openQuickView: (product: Product, allProducts: Product[], index: number) => void;
  closeQuickView: () => void;
  nextProduct: () => void;
  previousProduct: () => void;
  setScrollPosition: (position: number) => void;
}

export const useQuickView = create<QuickViewStore>((set, get) => ({
  isOpen: false,
  currentProduct: null,
  allProducts: [],
  currentIndex: 0,
  scrollPosition: 0,

  openQuickView: (product, allProducts, index) => {
    // Save current scroll position
    const scrollY = window.scrollY;
    set({
      isOpen: true,
      currentProduct: product,
      allProducts,
      currentIndex: index,
      scrollPosition: scrollY,
    });
  },

  closeQuickView: () => {
    const { scrollPosition } = get();
    set({
      isOpen: false,
      currentProduct: null,
    });
    // Restore scroll position
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
  },

  nextProduct: () => {
    const { allProducts, currentIndex } = get();
    if (currentIndex < allProducts.length - 1) {
      const newIndex = currentIndex + 1;
      set({
        currentProduct: allProducts[newIndex],
        currentIndex: newIndex,
      });
    }
  },

  previousProduct: () => {
    const { currentIndex, allProducts } = get();
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      set({
        currentProduct: allProducts[newIndex],
        currentIndex: newIndex,
      });
    }
  },

  setScrollPosition: (position) => set({ scrollPosition: position }),
}));
