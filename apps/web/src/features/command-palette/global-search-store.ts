import { create } from 'zustand'

type GlobalSearchStore = {
  open: boolean
  setOpen: (open: boolean) => void
  close: () => void
  toggle: () => void
}

export const useGlobalSearchStore = create<GlobalSearchStore>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  close: () => set({ open: false }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
