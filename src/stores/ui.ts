import { create } from 'zustand';
interface UiState {
  sidebarOpen: boolean;
  paletteOpen: boolean;
  setSidebar: (open: boolean) => void;
  setPalette: (open: boolean) => void;
}
export const useUi = create<UiState>((set) => ({
  sidebarOpen: false,
  paletteOpen: false,
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  setPalette: (paletteOpen) => set({ paletteOpen }),
}));
