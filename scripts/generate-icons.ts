import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const root = join(dirname(require.resolve("@material-symbols/svg-400/package.json")), "rounded");

const icons = [
  "home", "local_shipping", "inventory_2", "gavel", "route", "chat", "group", "payments", "account_balance",
  "settings", "logout", "person", "admin_panel_settings", "dashboard", "add", "close", "menu", "search",
  "notifications", "smart_toy", "visibility", "visibility_off", "mail", "lock", "key", "passkey", "check",
  "check_circle", "error", "warning", "info", "arrow_back", "arrow_forward", "chevron_right", "keyboard_arrow_down",
  "light_mode", "dark_mode", "verified_user", "badge", "directions_car", "moving", "forklift", "call",
  "help", "shield_lock", "content_copy", "refresh", "open_in_new", "verified", "schedule", "map", "calculate",
  "scale", "straighten", "package_2", "sailing", "two_wheeler", "rv_hookup", "directions_boat", "agriculture",
  "construction", "apartment", "business_center", "school", "military_tech", "chair", "weight", "star",
  "support_agent", "description", "receipt_long", "handshake", "timer", "location_on", "calendar_month",
  "photo_camera", "draw", "task_alt", "add_circle", "remove", "north_east", "bolt", "savings", "policy",
  "fact_check", "insights", "forum", "edit_note", "list_alt", "groups", "speed", "public", "flag",
  "trip_origin", "pin_drop", "account_balance_wallet", "credit_card", "lock_clock", "sell", "attach_money",
  "local_atm", "rate_review", "thumb_up", "rule", "inventory", "pallet", "conveyor_belt", "garage",
  "airport_shuttle", "fire_truck", "front_loader", "home_work", "storefront", "trolley", "package", "work",
  "school", "workspace_premium", "travel_explore", "mobile_friendly", "notifications_active", "cookie",
  "edit", "sort", "cancel", "replay", "event", "more_vert", "trending_down", "draft", "east", "arrow_downward", "science", "house", "car_rental", "delivery_truck_speed",
  "send", "attach_file", "image", "picture_as_pdf", "done_all", "more_horiz", "download", "chat_bubble", "mark_chat_unread", "notifications_off", "add_photo_alternate", "inbox",
  "navigation", "my_location", "person_add", "delete", "upload", "location_off", "photo_library", "near_me", "signature", "picture_as_pdf", "directions", "person_remove", "send", "share_location",
  "history", "stop", "edit_square",
  "format_bold", "format_italic", "link", "format_list_bulleted", "format_list_numbered", "format_quote", "code", "table", "format_h2", "format_h3", "undo", "stylus_note", "vertical_split", "archive", "unarchive", "public_off", "arrow_upward", "article",
  "brightness_auto", "chevron_left", "play_arrow", "pause", "unfold_more", "unfold_less", "widgets", "swap_horiz",
  "person_pin_circle", "id_card", "keyboard_arrow_up", "zoom_out_map", "forward_to_inbox",
];


const extract = (file: string) => {
  const svg = readFileSync(join(root, file), "utf8");
  const match = svg.match(/<path d="([^"]+)"/);
  if (!match?.[1]) throw new Error(`No path in ${file}`);
  return match[1];
};

const available = [...new Set(icons)].filter((name) => {
  try {
    readFileSync(join(root, `${name}.svg`));
    return true;
  } catch {
    console.warn(`skip ${name}`);
    return false;
  }
});

const dir = new URL("../src/components/ui/icons/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const file of readdirSync(dir)) rmSync(new URL(file, dir));
writeFileSync(new URL("types.ts", dir), "export type IconData = readonly [outline: string, filled: string];\n");

const entries = available.map((name) => {
  const outline = extract(`${name}.svg`);
  let fill = outline;
  try {
    fill = extract(`${name}-fill.svg`);
  } catch {}
  const id = name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
  const file = name.replace(/_/g, "-");
  writeFileSync(
    new URL(`${file}.ts`, dir),
    `import type { IconData } from "./types";\n\nexport const ${id}Icon: IconData = [${JSON.stringify(outline)}, ${JSON.stringify(fill)}];\n`,
  );
  return `export { ${id}Icon } from "./icons/${file}";`;
});

const out = `export type { IconData } from "./icons/types";\n${entries.join("\n")}\n`;
writeFileSync(new URL("../src/components/ui/icons.generated.ts", import.meta.url), out);
console.log(`${available.length} icons written`);
