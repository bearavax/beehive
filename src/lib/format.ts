const monthsEn = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthsMi = [
  "Hānuere",
  "Pēpuere",
  "Māehe",
  "Āperira",
  "Mei",
  "Hune",
  "Hūrae",
  "Ākuhata",
  "Hepetema",
  "Oketopa",
  "Noema",
  "Tīhema",
];

/** Clock time in Pacific/Auckland, so a sync instant is not shown as a bare UTC stamp. */
export function formatSyncTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")} Pacific/Auckland`;
}

export function formatDate(iso: string, lang: "en" | "mi") {
  const [year, month, day] = iso.split("-");
  if (!year || !month) return iso;
  const monthName = (lang === "mi" ? monthsMi : monthsEn)[Number(month) - 1] ?? month;
  if (!day) return `${monthName} ${year}`;
  return `${Number(day)} ${monthName} ${year}`;
}
