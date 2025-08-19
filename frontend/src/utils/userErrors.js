const TEXTS = {
    CANNOT_DISABLE_OWN_ACCOUNT: "Δεν μπορείτε να απενεργοποιήσετε τον δικό σας λογαριασμό.",
    CANNOT_MODIFY_SUPER_ADMIN: "Δεν μπορείτε να τροποποιήσετε χρήστη SUPER_ADMIN.",
    CANNOT_MODIFY_OTHER_STORE_USERS: "Μπορείτε να τροποποιήσετε μόνο χρήστες της δικής σας αποθήκης.",
    CANNOT_DELETE_SELF: "Δεν μπορείτε να διαγράψετε τον δικό σας λογαριασμό.",
    CANNOT_DELETE_SUPER_ADMIN: "Δεν μπορείτε να διαγράψετε χρήστη SUPER_ADMIN.",
    USER_ALREADY_EXISTS: "Το όνομα χρήστη υπάρχει ήδη. Επιλέξτε διαφορετικό.",
    USER_NOT_FOUND: "Ο χρήστης δεν βρέθηκε.",
    INTEGRITY_VIOLATION: "Ο χρήστης δεν μπορεί να διαγραφεί επειδή υπάρχουν συνδεδεμένα δεδομένα στην αποθήκη.",
    ACCESS_DENIED: "Δεν έχετε δικαίωμα για αυτή την ενέργεια.",
    BAD_REQUEST: "Μη έγκυρα δεδομένα.",
    CONFLICT_GENERIC: "Συνδεδεμένα δεδομένα.",
    DEFAULT: "Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά."
};

export function userErrorToGreek(err, ctx = {}) {
    const res = err?.response || err;
    const data = res?.data;
    const code = data?.errorCode || data?.code || data?.error;
    const msg = typeof data?.message === "string" ? data.message : "";
    const status = res?.status;

    // 1) Explicit error codes win
    if (code && TEXTS[code]) return TEXTS[code];

    // 2) Heuristics / pattern match (in case backend sends plain messages)
    if (/already exists/i.test(msg) || /duplicate/i.test(msg)) {
        return TEXTS.USER_ALREADY_EXISTS;
    }
    if (/not found/i.test(msg) || /does not exist/i.test(msg)) {
        return TEXTS.USER_NOT_FOUND;
    }
    if (/access denied/i.test(msg) || /forbidden/i.test(msg)) {
        return TEXTS.ACCESS_DENIED;
    }
    if (/cannot disable.*own account/i.test(msg) || /CANNOT_DISABLE_OWN_ACCOUNT/i.test(msg)) {
        return TEXTS.CANNOT_DISABLE_OWN_ACCOUNT;
    }
    if (/CANNOT_MODIFY_SUPER_ADMIN/i.test(msg)) {
        return TEXTS.CANNOT_MODIFY_SUPER_ADMIN;
    }
    if (/CANNOT_MODIFY_OTHER_STORE_USERS/i.test(msg)) {
        return TEXTS.CANNOT_MODIFY_OTHER_STORE_USERS;
    }

    // 3) Status-based fallbacks WITH context
    if (status === 409) {
        // differentiate by operation
        switch (ctx.op) {
            case "createUser":
                return TEXTS.USER_ALREADY_EXISTS;
            case "deleteUser":
                return TEXTS.INTEGRITY_VIOLATION;
            default:
                return TEXTS.CONFLICT_GENERIC;
        }
    }
    if (status === 403) return TEXTS.ACCESS_DENIED;
    if (status === 404) return TEXTS.USER_NOT_FOUND;
    if (status === 400) return TEXTS.BAD_REQUEST;

    // 4) Final fallback
    return TEXTS.DEFAULT;
}
