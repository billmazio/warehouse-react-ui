// src/utils/orderErrors.js

const TEXTS = {
    INSUFFICIENT_STOCK: (ctx = {}) =>
        ctx.materialText && ctx.sizeName && ctx.storeTitle
            ? `Μη επαρκές απόθεμα για "${ctx.materialText}" (${ctx.sizeName}) στην αποθήκη "${ctx.storeTitle}".`
            : "Μη επαρκές απόθεμα.",
    ORDER_NOT_FOUND: "Η παραγγελία δεν βρέθηκε.",
    MATERIAL_NOT_FOUND: "Το υλικό δεν βρέθηκε για το επιλεγμένο μέγεθος/αποθήκη.",
    STORE_NOT_FOUND: "Η αποθήκη δεν βρέθηκε.",
    SIZE_NOT_FOUND: "Το μέγεθος δεν βρέθηκε.",
    USER_NOT_FOUND: "Ο χρήστης δεν βρέθηκε.",
    ACCESS_DENIED: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    BAD_REQUEST: "Μη έγκυρα δεδομένα.",
    CONFLICT_GENERIC: "Συνδεδεμένα δεδομένα.",
    LOAD_FAILED: "Αποτυχία φόρτωσης δεδομένων.",
    DEFAULT: "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
};

export function orderErrorToGreek(err, ctx = {}) {
    const res = err?.response || err;
    const data = res?.data || {};
    const code = data?.errorCode || data?.code || data?.error;
    const msg = typeof data?.message === "string" ? data.message : "";
    const status = res?.status;

    // explicit code
    if (code) {
        const v = TEXTS[code];
        if (v) return typeof v === "function" ? v(ctx) : v;
    }

    // heuristics on message
    const s = (msg || "").toLowerCase();
    if (s.includes("insufficient stock") || s.includes("μη επαρκές απόθεμα"))
        return TEXTS.INSUFFICIENT_STOCK(ctx);
    if (s.includes("order") && s.includes("not found")) return TEXTS.ORDER_NOT_FOUND;
    if (s.includes("material") && s.includes("not found")) return TEXTS.MATERIAL_NOT_FOUND;
    if (s.includes("store") && s.includes("not found")) return TEXTS.STORE_NOT_FOUND;
    if (s.includes("size") && s.includes("not found")) return TEXTS.SIZE_NOT_FOUND;
    if (s.includes("user") && s.includes("not found")) return TEXTS.USER_NOT_FOUND;
    if (s.includes("access denied") || s.includes("δεν έχετε δικαίωμα"))
        return TEXTS.ACCESS_DENIED;

    // status fallbacks
    if (status === 409) return TEXTS.CONFLICT_GENERIC;
    if (status === 403) return TEXTS.ACCESS_DENIED;
    if (status === 404) {
        switch (ctx.op) {
            case "deleteOrder":
            case "editOrder":
            case "findOrder":
                return TEXTS.ORDER_NOT_FOUND;
            default:
                return TEXTS.MATERIAL_NOT_FOUND;
        }
    }
    if (status === 400) return TEXTS.BAD_REQUEST;

    if (ctx.op === "load") return TEXTS.LOAD_FAILED;
    return TEXTS.DEFAULT;
}
