
export default function getInitials(name) {
  if (!name || typeof name !== "string") return "";

  const words = name.trim().split(/\s+/).filter(Boolean);
 
  return words
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
