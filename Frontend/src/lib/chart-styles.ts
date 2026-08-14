/** Recharts tooltip — nền tối + chữ sáng (tránh chữ đen trên nền đen) */
export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "#0f172a",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    color: "#f1f5f9",
  },
  labelStyle: {
    color: "#f8fafc",
    fontWeight: 600,
  },
  itemStyle: {
    color: "#e2e8f0",
  },
} as const;

export function getChartTooltipProps(isDark = true) {
  if (isDark) return chartTooltipProps;
  return {
    contentStyle: {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      color: "#0f172a",
    },
    labelStyle: {
      color: "#0f172a",
      fontWeight: 600,
    },
    itemStyle: {
      color: "#334155",
    },
  } as const;
}
