export const DATA_ROOM_CATEGORIES: { key: string; label: string }[] = [
  { key: "corporate", label: "Corporate" },
  { key: "financial", label: "Financial" },
  { key: "product", label: "Product & Technology" },
  { key: "commercial", label: "Commercial" },
  { key: "legal", label: "Legal & Compliance" },
  { key: "fundraising", label: "Fundraising" },
];

export const categoryLabel = (key: string) =>
  DATA_ROOM_CATEGORIES.find((c) => c.key === key)?.label ?? key;