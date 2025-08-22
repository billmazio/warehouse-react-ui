const TEXTS = {
    STORE_ALREADY_EXISTS: "Υπάρχει ήδη αποθήκη με αυτόν τον τίτλο.",
    STORE_NOT_FOUND: "Η αποθήκη δεν βρέθηκε.",
    ACCESS_DENIED: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    TITLE_REQUIRED: "Ο τίτλος είναι απαραίτητος.",
    ADDRESS_REQUIRED: "Η διεύθυνση είναι απαραίτητη.",
    ENABLE_REQUIRED: "Η κατάσταση ενεργοποίησης είναι απαραίτητη.",
    STORE_DELETE_HAS_MATERIALS: "Η αποθήκη έχει συνδεδεμένα υλικά και δεν μπορεί να διαγραφεί.",
    STORE_DELETE_HAS_ORDERS: "Η αποθήκη έχει συνδεδεμένες παραγγελίες και δεν μπορεί να διαγραφεί.",
    STORE_DELETE_HAS_USERS: "Η αποθήκη έχει συνδεδεμένους χρήστες και δεν μπορεί να διαγραφεί.",
    INTEGRITY_VIOLATION: "Η αποθήκη δεν μπορεί να διαγραφεί επειδή υπάρχουν συνδεδεμένα δεδομένα.",
    BAD_REQUEST: "Μη έγκυρα δεδομένα.",
    CONFLICT_GENERIC: "Συνδεδεμένα δεδομένα.",
    SYSTEM_STORE_PROTECTED: "Αυτή η αποθήκη είναι προστατευμένη από το σύστημα και δεν μπορεί να διαγραφεί.",
    DEFAULT: "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
};

export function storeErrorToGreek(err, ctx = {}) {
    const res = err?.response || err;
    const data = res?.data;
    const code = data?.errorCode || data?.code || data?.error;
    const msg = typeof data?.message === "string" ? data.message : "";
    const status = res?.status;

    // 1) Άμεσο mapping με errorCode αν υπάρχει
    if (code && TEXTS[code]) return TEXTS[code];

    // 2) Heuristics πάνω στο message (αγγλικά/ελληνικά)
    if (/store.*already exists/i.test(msg) || /already exists/i.test(msg) || /υπάρχει ήδη/i.test(msg)) {
        return TEXTS.STORE_ALREADY_EXISTS;
    }
    if (/store not found/i.test(msg) || /Η αποθήκη.*δεν βρέθηκε/i.test(msg) || /not found/i.test(msg)) {
        return TEXTS.STORE_NOT_FOUND;
    }
    if (/you do not have permission/i.test(msg) || /access denied/i.test(msg) || /δεν έχετε δικαίωμα/i.test(msg)) {
        return TEXTS.ACCESS_DENIED;
    }
    if (/title is required/i.test(msg)) return TEXTS.TITLE_REQUIRED;
    if (/address is required/i.test(msg)) return TEXTS.ADDRESS_REQUIRED;
    if (/enable status is required/i.test(msg)) return TEXTS.ENABLE_REQUIRED;
    if (/έχει συνδεδεμένα υλικά/i.test(msg)) return TEXTS.STORE_DELETE_HAS_MATERIALS;
    if (/έχει συνδεδεμένες παραγγελίες/i.test(msg)) return TEXTS.STORE_DELETE_HAS_ORDERS;
    if (/SYSTEM_STORE_PROTECTED/i.test(msg) || /system entity/i.test(msg) || /προστατευμένη από το σύστημα/i.test(msg)) {
        return TEXTS.SYSTEM_STORE_PROTECTED;
    }

    // 3) Status-based fallbacks ΜΕ context
    if (status === 409) {
        switch (ctx.op) {
            case "createStore":
            case "editStore":
                return TEXTS.STORE_ALREADY_EXISTS;     // συνήθης λόγος conflict στα create/edit
            case "deleteStore":
                return TEXTS.INTEGRITY_VIOLATION;      // conflict λόγω συνδεδεμένων δεδομένων
            default:
                return TEXTS.CONFLICT_GENERIC;
        }
    }
    if (status === 403) return TEXTS.ACCESS_DENIED;
    if (status === 404) return TEXTS.STORE_NOT_FOUND;
    if (status === 400) return TEXTS.BAD_REQUEST;

    // 4) Τελικό default
    return TEXTS.DEFAULT;
}