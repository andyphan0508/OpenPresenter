export type DecklinkInfo = Awaited<ReturnType<typeof window.api.decklink.info>>
export type DecklinkStatus = Awaited<ReturnType<typeof window.api.decklink.start>>
export type DecklinkConfig = Parameters<typeof window.api.decklink.start>[0]

export const getDecklinkInfo = () => window.api.decklink.info()
export const startDecklink = (cfg: DecklinkConfig) => window.api.decklink.start(cfg)
export const stopDecklink = () => window.api.decklink.stop()
