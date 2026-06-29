export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Loading...</p>
      </div>
    </div>
  )
}
