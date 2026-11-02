import { useState, type ReactNode } from "react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export function Confirm({
  open, onOpenChange, title, description, confirmLabel = "Confirm", danger, typeToConfirm, onConfirm, children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: ReactNode | undefined;
  confirmLabel?: string | undefined;
  danger?: boolean | undefined;
  typeToConfirm?: string | undefined;
  onConfirm: (typed: string) => Promise<void> | void;
  children?: ReactNode | undefined;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const blocked = typeToConfirm ? typed.trim().toLowerCase() !== typeToConfirm.toLowerCase() : false;
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); setTyped(""); } }}>
      <AlertDialogContent className="border-border bg-panel">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        {typeToConfirm && (
          <label className="block space-y-1.5 text-xs text-muted-foreground">
            Type <span className="font-mono text-foreground">{typeToConfirm}</span> to confirm
            <input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </label>
        )}
        <AlertDialogFooter>
          <button className="btn btn-ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            disabled={busy || blocked}
            onClick={async () => {
              setBusy(true);
              try { await onConfirm(typed); onOpenChange(false); setTyped(""); } finally { setBusy(false); }
            }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const errMsg = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e);
  try { const j = JSON.parse(m); if (Array.isArray(j)) return j.map((x) => x.message).join(", "); } catch {}
  return m;
};
