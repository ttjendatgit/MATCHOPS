/**
 * Export utilities for admin reports
 */

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return "";

  const headers = columns.map((col) => escapeCSVValue(col.header)).join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCSVValue(String(row[col.key] ?? ""))).join(",")
  );

  return [headers, ...rows].join("\n");
}

/**
 * Escape CSV value (handle quotes and commas)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download data as CSV file
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
): void {
  const csv = convertToCSV(data, columns);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}
