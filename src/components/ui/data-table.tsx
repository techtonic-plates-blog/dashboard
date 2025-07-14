"use client"

import type { JSX } from "solid-js"
import { createSignal, createEffect, createMemo, For, Show } from "solid-js"
import { ChevronDown, ChevronUp, ChevronsUpDown, X, Search, ChevronRight, Funnel, Check } from "lucide-solid"
import { Button } from "~/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"

// Generic column definition
export interface Column<TData = any> {
  key: keyof TData
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: TData) => JSX.Element
  filterType?: "select" | "text" | "number" | "date"
  priority?: number // Higher number = higher priority (keep visible longer)
}

// Generic datatable props
export interface DataTableProps<TData = any> {
  data: TData[]
  columns: Column<TData>[]
  searchableColumns?: (keyof TData)[]
  title?: string
  description?: string
  pageSize?: number
  emptyMessage?: string
  // New props for data fetching
  onFetchMore?: () => Promise<TData[]>
  hasMoreData?: boolean
  isLoading?: boolean
  totalCount?: number
  // Row click handler
  onRowClick?: (row: TData) => void
}

// Sort configuration
interface SortConfig<TData> {
  key: keyof TData | null
  direction: "ascending" | "descending" | null
}

export default function DataTable<TData extends Record<string, any>>(props: DataTableProps<TData>): JSX.Element {
  const [searchTerm, setSearchTerm] = createSignal("")
  const [filters, setFilters] = createSignal<Partial<Record<keyof TData, any>>>({})
  const [sortConfig, setSortConfig] = createSignal<SortConfig<TData>>({
    key: null,
    direction: null,
  })
  const [currentPage, setCurrentPage] = createSignal(1)
  const [mobileCardView, setMobileCardView] = createSignal(false)
  const [expandedRows, setExpandedRows] = createSignal<Set<number>>(new Set())

  const [isLoadingMore, setIsLoadingMore] = createSignal(false)
  const [allData, setAllData] = createSignal<TData[]>(props.data)
  const [hasReachedEnd, setHasReachedEnd] = createSignal(false)

  // Toggle mobile card view based on screen size - make it more responsive
  createEffect(() => {
    const handleResize = () => {
      // Use a higher breakpoint for mobile view to handle more cases
      setMobileCardView(window.innerWidth < 768) // Changed from 640 to 768
    }

    // Initial check
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  })

  // Toggle row expansion in mobile view
  const toggleRowExpansion = (index: number) => {
    const expanded = new Set(expandedRows())
    if (expanded.has(index)) {
      expanded.delete(index)
    } else {
      expanded.add(index)
    }
    setExpandedRows(expanded)
  }

  // Get unique values for dropdown filters
  const getUniqueValues = (key: keyof TData) => {
    const values = Array.from(new Set(allData().map((item) => item[key])))
    return values.filter((value) => value !== null && value !== undefined)
  }

  // Computed filtered data (without pagination)
  const allFilteredData = createMemo(() => {
    let result = [...allData()]

    // Apply search across specified columns
    const currentSearchTerm = searchTerm()
    const searchableColumns = props.searchableColumns || []

    if (currentSearchTerm && searchableColumns.length > 0) {
      const lowerSearchTerm = currentSearchTerm.toLowerCase()
      result = result.filter((item) =>
        searchableColumns.some((column) => {
          const value = item[column]
          return value && value.toString().toLowerCase().includes(lowerSearchTerm)
        }),
      )
    }

    // Apply individual column filters
    const currentFilters = filters()
    Object.entries(currentFilters).forEach(([key, filterValue]) => {
      if (filterValue !== null && filterValue !== undefined && filterValue !== "") {
        result = result.filter((item) => {
          const itemValue = item[key as keyof TData]
          return itemValue === filterValue
        })
      }
    })

    // Apply sorting
    const currentSortConfig = sortConfig()
    if (currentSortConfig.key && currentSortConfig.direction) {
      result.sort((a, b) => {
        const aValue = a[currentSortConfig.key as keyof TData]
        const bValue = b[currentSortConfig.key as keyof TData]

        // Handle different data types
        if (typeof aValue === "number" && typeof bValue === "number") {
          return currentSortConfig.direction === "ascending" ? aValue - bValue : bValue - aValue
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue)
          return currentSortConfig.direction === "ascending" ? comparison : -comparison
        }

        // For dates or other types, convert to string for comparison
        const aStr = String(aValue)
        const bStr = String(bValue)
        const comparison = aStr.localeCompare(bStr)
        return currentSortConfig.direction === "ascending" ? comparison : -comparison
      })
    }

    return result
  })

  // Pagination calculations
  const itemsPerPage = () => props.pageSize || 10
  const totalPages = createMemo(() => Math.ceil(allFilteredData().length / itemsPerPage()))
  const paginatedData = createMemo(() => {
    const startIndex = (currentPage() - 1) * itemsPerPage()
    const endIndex = startIndex + itemsPerPage()
    return allFilteredData().slice(startIndex, endIndex)
  })

  // Handle sorting
  const handleSort = (key: keyof TData) => {
    const currentSort = sortConfig()
    let direction: "ascending" | "descending" | null = "ascending"

    if (currentSort.key === key) {
      if (currentSort.direction === "ascending") {
        direction = "descending"
      } else if (currentSort.direction === "descending") {
        direction = null
      }
    }

    setSortConfig({ key, direction })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFilters({})
    setSortConfig({ key: null, direction: null })
    setCurrentPage(1) // Reset to first page
  }

  // Pagination functions
  const goToNextPage = () => {
    if (currentPage() < totalPages()) {
      setCurrentPage(currentPage() + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage() > 1) {
      setCurrentPage(currentPage() - 1)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages()) {
      setCurrentPage(page)
    }
  }

  const fetchMoreData = async () => {
    if (!props.onFetchMore || isLoadingMore() || hasReachedEnd()) return

    setIsLoadingMore(true)
    try {
      const newData = await props.onFetchMore()
      if (newData.length === 0) {
        setHasReachedEnd(true)
      } else {
        setAllData([...allData(), ...newData])
      }
    } catch (error) {
      console.error("Failed to fetch more data:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Render sort icon
  const renderSortIcon = (key: keyof TData) => {
    const currentSort = sortConfig()
    if (currentSort.key !== key) {
      return <ChevronsUpDown class="ml-1 h-4 w-4" />
    }

    if (currentSort.direction === "ascending") {
      return <ChevronUp class="ml-1 h-4 w-4" />
    }

    if (currentSort.direction === "descending") {
      return <ChevronDown class="ml-1 h-4 w-4" />
    }

    return <ChevronsUpDown class="ml-1 h-4 w-4" />
  }

  // Get filterable columns
  const filterableColumns = createMemo(() => props.columns.filter((column) => column.filterable))

  // Check if any filters are active
  const hasActiveFilters = createMemo(() => searchTerm() || Object.keys(filters()).length > 0 || sortConfig().key)

  // Handle filter selection
  const handleFilterSelect = (columnKey: keyof TData, value: any) => {
    const newFilters = { ...filters() }
    newFilters[columnKey] = value
    setFilters(newFilters)
  }

  // Handle filter clear
  const handleFilterClear = (columnKey: keyof TData) => {
    const newFilters = { ...filters() }
    delete newFilters[columnKey]
    setFilters(newFilters)
  }

  // Reset to first page when filters change
  createEffect(() => {
    // Watch for changes in search term or filters
    searchTerm()
    filters()
    setCurrentPage(1)
  })

  createEffect(() => {
    setAllData(props.data)
  })

  createEffect(() => {
    const current = currentPage()
    const total = totalPages()

    // If we're on the last page and have more data to fetch
    if (current === total && props.onFetchMore && !isLoadingMore() && !hasReachedEnd()) {
      // Only fetch if we have filtered data (not empty due to filters)
      if (allFilteredData().length > 0) {
        fetchMoreData()
      }
    }
  })

  // Mobile filter toggle
  const [showMobileFilters, setShowMobileFilters] = createSignal(false)

  return (
      <Card class="w-full">
        <Show when={props.title || props.description}>
          <CardHeader>
            <Show when={props.title}>
              <CardTitle>{props.title}</CardTitle>
            </Show>
            <Show when={props.description}>
              <CardDescription>{props.description}</CardDescription>
            </Show>
          </CardHeader>
        </Show>

        <CardContent class="p-4 sm:p-6 w-full">
          {/* Mobile filter toggle - only show on mobile/tablet */}
          <div class="flex md:hidden mb-4 justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters())}
              class="flex items-center"
            >
              <Funnel class="h-4 w-4 mr-2" />
              {showMobileFilters() ? "Hide filters" : "Show filters"}
            </Button>
            <Show when={hasActiveFilters()}>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </Show>
          </div>

          {/* Filters section - always visible on desktop, toggleable on mobile */}
          <div class={`${showMobileFilters() ? "block" : "hidden"} md:block`}>
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search input */}
              <Show when={(props.searchableColumns || []).length > 0}>
                <div class="relative w-full md:w-auto">
                  <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={`Search...`}
                    value={searchTerm()}
                    onInput={(e) => setSearchTerm(e.currentTarget.value)}
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-8"
                  />
                  <Show when={searchTerm()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      class="absolute right-0 top-0 h-full px-2"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </Show>
                </div>
              </Show>

              {/* Filter dropdowns using DropdownMenu component */}
              <div class="flex flex-wrap items-center gap-2">
                <For each={filterableColumns()}>
                  {(column) => {
                    const currentFilters = filters()
                    const uniqueValues = getUniqueValues(column.key)
                    const hasFilter = currentFilters[column.key] !== undefined

                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" class="h-9">
                            <Funnel class="mr-2 h-4 w-4" />
                            {column.label}
                            <Show when={hasFilter}>
                              <span class="ml-1 text-xs bg-primary text-primary-foreground rounded px-1">1</span>
                            </Show>
                            <ChevronDown class="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" class="w-48">
                          <For each={uniqueValues}>
                            {(value) => {
                              const isSelected = currentFilters[column.key] === value

                              return (
                                <DropdownMenuItem
                                  onClick={() => handleFilterSelect(column.key, value)}
                                  class="flex items-center justify-between cursor-pointer"
                                >
                                  <span class="flex-1">
                                    {column.render ? column.render(value, {} as TData) : String(value)}
                                  </span>
                                  <Show when={isSelected}>
                                    <Check class="h-4 w-4" />
                                  </Show>
                                </DropdownMenuItem>
                              )
                            }}
                          </For>
                          <Show when={hasFilter}>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleFilterClear(column.key)}
                              class="text-red-600 cursor-pointer"
                            >
                              Clear filter
                            </DropdownMenuItem>
                          </Show>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  }}
                </For>

                {/* Clear all filters button */}
                <Show when={hasActiveFilters()}>
                  <Button variant="ghost" size="sm" onClick={clearFilters} class="h-9">
                    Clear all
                  </Button>
                </Show>
              </div>
            </div>
          </div>

          {/* Mobile card view */}
          <Show when={mobileCardView()}>
            <div class="mt-4 space-y-4">
              <Show
                when={allFilteredData().length > 0}
                fallback={
                  <div class="text-center py-8 bg-background border rounded-md">
                    {props.emptyMessage || "No results found"}
                  </div>
                }
              >
                <For each={paginatedData()}>
                  {(row, index) => {
                    const isExpanded = () => expandedRows().has(index())
                    const defaultColumn = props.columns[0]

                    return (
                      <div class="border rounded-md overflow-hidden bg-card">
                        <div
                          class="flex justify-between items-center p-4 cursor-pointer bg-muted/30"
                          onClick={() => toggleRowExpansion(index())}
                        >
                          <div class="font-medium">
                            {defaultColumn.render
                              ? defaultColumn.render(row[defaultColumn.key], row)
                              : String(row[defaultColumn.key] ?? "")}
                          </div>
                          <ChevronRight class={`h-5 w-5 transition-transform ${isExpanded() ? "rotate-90" : ""}`} />
                        </div>

                        <Show when={isExpanded()}>
                          <div class="p-4 space-y-2">
                            <For each={props.columns.slice(1)}>
                              {(column) => (
                                <div class="grid grid-cols-2 gap-2">
                                  <div class="text-sm font-medium text-muted-foreground">{column.label}</div>
                                  <div class="text-sm">
                                    <Tooltip>
                                      <TooltipTrigger >
                                        <div class="cursor-help">
                                          {column.render
                                            ? column.render(row[column.key], row)
                                            : String(row[column.key] ?? "")}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p class="max-w-xs break-words">
                                          {column.render
                                            ? column.render(row[column.key], row)
                                            : String(row[column.key] ?? "")}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              )}
                            </For>
                          </div>
                        </Show>
                      </div>
                    )
                  }}
                </For>
              </Show>
            </div>
          </Show>

          {/* Desktop table view */}
          <Show when={!mobileCardView()}>
            <div class="mt-4 rounded-md border overflow-hidden">
              <div class="overflow-x-auto max-w-full">
                <div class="min-w-full">
                  <Table class="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <For each={props.columns}>
                          {(column, index) => (
                            <TableHead
                              class="font-medium px-2 py-3"
                              style={{
                                width: index() === 0 ? "20%" : `${80 / (props.columns.length - 1)}%`,
                                "min-width": "100px",
                              }}
                            >
                              <Show when={column.sortable} fallback={<span class="p-1">{column.label}</span>}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSort(column.key)}
                                  class="h-8 p-1 font-medium"
                                >
                                  {column.label}
                                  {renderSortIcon(column.key)}
                                </Button>
                              </Show>
                            </TableHead>
                          )}
                        </For>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <Show
                        when={allFilteredData().length > 0}
                        fallback={
                          <TableRow>
                            <TableCell colSpan={props.columns.length} class="h-24 text-center">
                              {props.emptyMessage || "No results found"}
                            </TableCell>
                          </TableRow>
                        }
                      >
                        <For each={paginatedData()}>
                          {(row) => (
                            <TableRow
                              class={props.onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                              onClick={() => props.onRowClick?.(row)}
                            >
                              <For each={props.columns}>
                                {(column, index) => (
                                  <TableCell
                                    class="px-2 py-3 truncate"
                                    style={{
                                      width: index() === 0 ? "20%" : `${80 / (props.columns.length - 1)}%`,
                                      "min-width": "100px",
                                    }}
                                  >
                                    <Tooltip>
                                      <TooltipTrigger >
                                        <div class="truncate cursor-help">
                                          {column.render
                                            ? column.render(row[column.key], row)
                                            : String(row[column.key] ?? "")}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p class="max-w-xs break-words">
                                          {column.render
                                            ? column.render(row[column.key], row)
                                            : String(row[column.key] ?? "")}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TableCell>
                                )}
                              </For>
                            </TableRow>
                          )}
                        </For>
                      </Show>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </Show>

          {/* Pagination Controls - responsive */}
          <div class="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
            <div class="text-sm text-muted-foreground text-center md:text-left">
              Showing {paginatedData().length > 0 ? (currentPage() - 1) * itemsPerPage() + 1 : 0} to{" "}
              {Math.min(currentPage() * itemsPerPage(), allFilteredData().length)} of {allFilteredData().length}
              {props.totalCount && props.totalCount > allFilteredData().length
                ? ` (${props.totalCount} total available)`
                : ""}{" "}
              entries
              <Show when={allFilteredData().length !== allData().length}>
                {` (filtered from ${allData().length} loaded)`}
              </Show>
            </div>
            <Show when={totalPages() > 1}>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage() === 1}
                  class="h-8"
                >
                  Previous
                </Button>

                <div class="hidden md:flex items-center gap-1">
                  <Show when={totalPages() <= 7}>
                    <For each={Array.from({ length: totalPages() }, (_, i) => i + 1)}>
                      {(page) => (
                        <Button
                          variant={currentPage() === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          class="h-8 w-8"
                        >
                          {page}
                        </Button>
                      )}
                    </For>
                  </Show>
                  <Show when={totalPages() > 7}>
                    <Show when={currentPage() <= 4}>
                      <For each={[1, 2, 3, 4, 5]}>
                        {(page) => (
                          <Button
                            variant={currentPage() === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            class="h-8 w-8"
                          >
                            {page}
                          </Button>
                        )}
                      </For>
                      <span class="px-2 text-muted-foreground">...</span>
                      <Button variant="outline" size="sm" onClick={() => goToPage(totalPages())} class="h-8 w-8">
                        {totalPages()}
                      </Button>
                    </Show>

                    <Show when={currentPage() > 4 && currentPage() < totalPages() - 3}>
                      <Button variant="outline" size="sm" onClick={() => goToPage(1)} class="h-8 w-8">
                        1
                      </Button>
                      <span class="px-2 text-muted-foreground">...</span>
                      <For each={[currentPage() - 1, currentPage(), currentPage() + 1]}>
                        {(page) => (
                          <Button
                            variant={currentPage() === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            class="h-8 w-8"
                          >
                            {page}
                          </Button>
                        )}
                      </For>
                      <span class="px-2 text-muted-foreground">...</span>
                      <Button variant="outline" size="sm" onClick={() => goToPage(totalPages())} class="h-8 w-8">
                        {totalPages()}
                      </Button>
                    </Show>

                    <Show when={currentPage() >= totalPages() - 3}>
                      <Button variant="outline" size="sm" onClick={() => goToPage(1)} class="h-8 w-8">
                        1
                      </Button>
                      <span class="px-2 text-muted-foreground">...</span>
                      <For each={Array.from({ length: 5 }, (_, i) => totalPages() - 4 + i)}>
                        {(page) => (
                          <Button
                            variant={currentPage() === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            class="h-8 w-8"
                          >
                            {page}
                          </Button>
                        )}
                      </For>
                    </Show>
                  </Show>
                </div>

                {/* Mobile page indicator */}
                <div class="flex md:hidden items-center">
                  <span class="text-sm">
                    {currentPage()} / {totalPages()}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage() === totalPages()}
                  class="h-8"
                >
                  Next
                </Button>
              </div>
            </Show>
          </div>
          <Show when={isLoadingMore()}>
            <div class="flex items-center justify-center py-4">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Loading more data...
              </div>
            </div>
          </Show>

          <Show when={hasReachedEnd() && props.onFetchMore}>
            <div class="text-center py-4 text-sm text-muted-foreground">No more data available</div>
          </Show>
        </CardContent>
      </Card>
  )
}
