"use client";

import * as React from "react";
import { KitDialog, KitSpinner } from "@/components/kit/local";

type ConfirmOptions = {
    title?: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
};

type Pending = ConfirmOptions & {
    resolve: (ok: boolean) => void;
};

export function useConfirm(): {
    confirm: (opts: ConfirmOptions) => Promise<boolean>;
    element: React.ReactNode;
} {
    const [pending, setPending] = React.useState<Pending | null>(null);
    const [busy, setBusy] = React.useState(false);

    const confirm = React.useCallback(
        (opts: ConfirmOptions): Promise<boolean> => {
            return new Promise<boolean>((resolve) => {
                setBusy(false);
                setPending({ ...opts, resolve });
            });
        },
        [],
    );

    const close = (ok: boolean) => {
        if (!pending) return;
        pending.resolve(ok);
        setPending(null);
    };

    const element = pending ? (
        <KitDialog
            title={pending.title ?? "Confirm"}
            onClose={() => close(false)}
            maxWidth={380}
            footer={
                <>
                    <button
                        type="button"
                        className="btn-kit btn-kit-ghost"
                        onClick={() => close(false)}
                        disabled={busy}
                    >
                        {pending.cancelLabel ?? "Cancel"}
                    </button>
                    <button
                        type="button"
                        className={
                            pending.destructive
                                ? "btn-kit btn-kit-danger"
                                : "btn-kit btn-kit-primary"
                        }
                        onClick={() => {
                            setBusy(true);
                            close(true);
                        }}
                        disabled={busy}
                    >
                        {busy ? <KitSpinner size={12} /> : null}
                        {pending.confirmLabel ?? (pending.destructive ? "Delete" : "Confirm")}
                    </button>
                </>
            }
        >
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.55 }}>
                {pending.message}
            </div>
        </KitDialog>
    ) : null;

    return { confirm, element };
}
