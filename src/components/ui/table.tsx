import { Component, JSX, splitProps } from "solid-js"

import { cn } from "~/lib/utils"

interface TableProps extends JSX.HTMLAttributes<HTMLTableElement> {
  className?: string
}

const Table: Component<TableProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <div
      data-slot="table-container"
      class="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        class={cn("w-full caption-bottom text-sm", local.className)}
        {...others}
      />
    </div>
  )
}

interface TableHeaderProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const TableHeader: Component<TableHeaderProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <thead
      data-slot="table-header"
      class={cn("[&_tr]:border-b", local.className)}
      {...others}
    />
  )
}

interface TableBodyProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const TableBody: Component<TableBodyProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <tbody
      data-slot="table-body"
      class={cn("[&_tr:last-child]:border-0", local.className)}
      {...others}
    />
  )
}

interface TableFooterProps extends JSX.HTMLAttributes<HTMLTableSectionElement> {
  className?: string
}

const TableFooter: Component<TableFooterProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <tfoot
      data-slot="table-footer"
      class={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        local.className
      )}
      {...others}
    />
  )
}

interface TableRowProps extends JSX.HTMLAttributes<HTMLTableRowElement> {
  className?: string
}

const TableRow: Component<TableRowProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <tr
      data-slot="table-row"
      class={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        local.className
      )}
      {...others}
    />
  )
}

interface TableHeadProps extends JSX.HTMLAttributes<HTMLTableCellElement> {
  className?: string
}

const TableHead: Component<TableHeadProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <th
      data-slot="table-head"
      class={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.className
      )}
      {...others}
    />
  )
}

interface TableCellProps extends JSX.HTMLAttributes<HTMLTableCellElement> {
  className?: string
}

const TableCell: Component<TableCellProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <td
      data-slot="table-cell"
      class={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        local.className
      )}
      {...others}
    />
  )
}

interface TableCaptionProps extends JSX.HTMLAttributes<HTMLTableCaptionElement> {
  className?: string
}

const TableCaption: Component<TableCaptionProps> = (props) => {
  const [local, others] = splitProps(props, ["className"])
  
  return (
    <caption
      data-slot="table-caption"
      class={cn("text-muted-foreground mt-4 text-sm", local.className)}
      {...others}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
