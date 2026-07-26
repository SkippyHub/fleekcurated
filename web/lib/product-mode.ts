/** Product UI hides dev extraction panels; set NEXT_PUBLIC_DEV_PANEL=true to show by default. */
export function showDevPanel(): boolean {
  return process.env.NEXT_PUBLIC_DEV_PANEL === "true";
}
