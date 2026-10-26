// Fictional demo content for the non-admin sections. Not real data.
export const DEMO_NOTICE = "Demo content — sample entries for illustration only.";

export const servers = [
  { name: "Night Owls Lounge", members: 1284, joined: "2025-02-14", role: "Member" },
  { name: "Pixel Foundry", members: 532, joined: "2025-05-03", role: "Helper" },
  { name: "Quiet Library", members: 211, joined: "2025-08-21", role: "Member" },
  { name: "Signal & Noise", members: 3940, joined: "2026-01-09", role: "Moderator" },
  { name: "Late Train Club", members: 87, joined: "2026-03-30", role: "Member" },
];

export const nicknames = [
  "quiet_orbit", "Northwind", "lamplighter", "v0id.walker", "Paper Moth", "slowcoast",
  "midnight_relay", "Grey Heron", "echo.field", "sundial", "c0ld_brew", "Hollow Pine",
  "static.bloom", "Tidewater", "ash_and_oak", "Wanderer", "neon.monk", "fieldnotes",
];

export const media = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  title: ["Fog study", "Night street", "Window light", "Concrete", "Coastline", "Static"][i % 6] + ` ${i + 1}`,
  date: `2026-0${(i % 9) + 1}-1${i % 9}`,
}));

export const contacts = [
  { name: "Mara Ellison", handle: "@mara.e", status: "online" },
  { name: "Theo Park", handle: "@theopark", status: "away" },
  { name: "Ines Varga", handle: "@ivarga", status: "offline" },
  { name: "Jonah Reyes", handle: "@jreyes", status: "online" },
  { name: "Lena Kovač", handle: "@lena.k", status: "offline" },
  { name: "Omar Haddad", handle: "@omarh", status: "away" },
];

export const events = [
  { date: "2026-10-20", title: "Joined server “Signal & Noise”", kind: "Server" },
  { date: "2026-09-02", title: "Nickname changed to “quiet_orbit”", kind: "Nickname" },
  { date: "2026-07-18", title: "Uploaded 4 media items", kind: "Media" },
  { date: "2026-05-11", title: "Added 2 contacts", kind: "Contacts" },
  { date: "2026-03-30", title: "Joined server “Late Train Club”", kind: "Server" },
  { date: "2026-01-09", title: "Account linked to demo dataset", kind: "System" },
];
