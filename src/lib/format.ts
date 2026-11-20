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

export function formatDate(iso: string, lang: "en" | "mi") {
  const [year, month, day] = iso.split("-");
  if (!year || !month) return iso;
  const monthName = (lang === "mi" ? monthsMi : monthsEn)[Number(month) - 1] ?? month;
  if (!day) return `${monthName} ${year}`;
  return `${Number(day)} ${monthName} ${year}`;
}
