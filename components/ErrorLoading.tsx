"use client"
import React from "react"
import { Loader2 } from "lucide-react"

interface Props extends React.PropsWithChildren {
  loading: boolean
  error?: {message?: string}
  emptyMessage?: string
  dataLength?: number
  className?: string
  loadingCard?: any
  loadingCols?: number
  loadingRows?: number
  loadingCount?: number
  loaderClassName?: string;
}

export default function ErrorLoading({
  className,
  children,
  loading,
  error,
  emptyMessage = "No data found",
  dataLength,
  loadingCard,
  loadingCols = 1,
  loadingRows = 1,
  loadingCount,
  loaderClassName
}: Props) {
  const errorMessage = error?.message ? error.message : "Something went wrong"

  return (
    <div className={`min-h-[150px] ${className ?? ""}`}>
      {loading ? (
        <SectionLoader
          rows={loadingRows}
          cols={loadingCols}
          count={loadingCount}
          LoadingCard={loadingCard}
          className={loaderClassName}
        />
      ) : error ? (
        <ErrorSection text={errorMessage} />
      ) : dataLength === 0 ? (
        <EmptySection text={emptyMessage} />
      ) : (
        children
      )}
    </div>
  )
}

function ErrorSection({ text }: { text: string }) {
  return (
    <div className="text-center py-10">
      <h3 className="text-red-500 text-sm font-medium">{text}</h3>
    </div>
  )
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground text-sm font-medium">
      {text}
    </div>
  )
}

interface SectionLoaderProps {
  LoadingCard?: any
  count?: number
  rows?: number
  cols?: number
  className?: string
}

function SectionLoader({
  LoadingCard,
  count,
  rows = 1,
  cols = 1,
  className,
}: SectionLoaderProps) {
  if (!LoadingCard) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totalItems = count ?? rows * cols

  return (
    <div
      className={`grid w-full gap-3 ${className ?? ""}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: totalItems }).map((_, i) => (
        <LoadingCard index={i} key={i} />
      ))}
    </div>
  )
}