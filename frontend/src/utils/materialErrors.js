// src/utils/materialErrors.js
const TEXTS = {
    MATERIAL_ALREADY_EXISTS: (ctx = {}) =>
        (ctx.text && ctx.sizeName)
            ? `Το προϊόν '${ctx.text}' με μέγεθος '${ctx.sizeName}' υπάρχει ήδη σε αυτή την αποθήκη.`
            : "Το προϊόν με την ίδια περιγραφή και μέγεθος υπάρχει ήδη σε αυτή την αποθήκη.",
    MATERIAL_NOT_FOUND: "Το προϊόν δεν βρέθηκε.",
    MATERIAL_HAS_ORDERS: "Το προϊόν έχει συνδεδεμένες παραγγελίες και δεν μπορεί να διαγραφεί.",
    SIZE_NOT_FOUND: "Το μέγεθος δεν βρέθηκε.",
    STORE_NOT_FOUND: "Η αποθήκη δεν βρέθηκε.",
    ACCESS_DENIED: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    BAD_REQUEST: "Μη έγκυρα δεδομένα.",
    CONFLICT_GENERIC: "Συνδεδεμένα δεδομένα.",
    LOAD_FAILED: "Αποτυχία φόρτωσης δεδομένων.",
    DEFAULT: "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
};

export function materialErrorToGreek(err, ctx = {}) {
    const res = err?.response || err;
    const data = res?.data;
    const code = data?.errorCode || data?.code || data?.error;
    const msg = typeof data?.message === "string" ? data.message : "";
    const status = res?.status;

    // explicit code
    if (code === "MATERIAL_ALREADY_EXISTS") return TEXTS.MATERIAL_ALREADY_EXISTS(ctx);
    if (code && TEXTS[code]) {
        const v = TEXTS[code];
        return typeof v === "function" ? v(ctx) : v;
    }

    // heuristics
    if (/already exists/i.test(msg) || /υπάρχει ήδη/i.test(msg)) {
        return TEXTS.MATERIAL_ALREADY_EXISTS(ctx);
    }
    if (/not found/i.test(msg) && /size/i.test(msg)) return TEXTS.SIZE_NOT_FOUND;
    if (/not found/i.test(msg) && /store/i.test(msg)) return TEXTS.STORE_NOT_FOUND;
    if (/not found/i.test(msg) && /material/i.test(msg)) return TEXTS.MATERIAL_NOT_FOUND;
    if (/access denied/i.test(msg) || /δεν έχετε δικαίωμα/i.test(msg)) return TEXTS.ACCESS_DENIED;
    if (/συνδεδεμένες παραγγελίες/i.test(msg) || /associated orders/i.test(msg)) {
        return TEXTS.MATERIAL_HAS_ORDERS;
    }

    // status fallbacks with context
    if (status === 409) {
        return ctx.op === "createMaterial" || ctx.op === "editMaterial"
            ? TEXTS.MATERIAL_ALREADY_EXISTS(ctx)
            : TEXTS.CONFLICT_GENERIC;
    }
    if (status === 403) return TEXTS.ACCESS_DENIED;
    if (status === 404) return TEXTS.MATERIAL_NOT_FOUND;
    if (status === 400) return TEXTS.BAD_REQUEST;

    return TEXTS.DEFAULT;
}
