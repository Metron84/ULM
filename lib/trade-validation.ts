export function isFootballRelatedItem(text: string) {
  const value = text.trim().toLowerCase();
  if (!value) return true;

  const allowed = [
    "jersey",
    "shirt",
    "ticket",
    "world cup",
    "football",
    "soccer",
    "boots",
    "ball",
    "scarf",
    "memorabilia",
    "signed",
    "kit",
    "match",
    "stadium",
    "club",
    "player",
    "training",
  ];

  const banned = [
    "iphone",
    "laptop",
    "car",
    "watch",
    "bitcoin",
    "cash",
    "dollar",
    "phone",
    "ps5",
    "xbox",
  ];

  if (banned.some((word) => value.includes(word))) return false;
  return allowed.some((word) => value.includes(word));
}
