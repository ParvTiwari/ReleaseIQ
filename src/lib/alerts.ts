import Swal, { type SweetAlertIcon } from "sweetalert2";

// Custom styled SweetAlert2 base instance matching ReleaseIQ theme
const ReleaseAlert = Swal.mixin({
  customClass: {
    popup: "rounded-xl border border-border bg-card text-card-foreground shadow-2xl font-sans",
    title: "text-lg font-bold text-foreground",
    htmlContainer: "text-xs leading-relaxed text-muted-foreground",
    confirmButton: "rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition mr-2",
    cancelButton: "rounded-md border border-border bg-accent px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition",
    denyButton: "rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition",
  },
  buttonsStyling: false,
});

/**
 * Shows an animated SweetAlert modal (Success / Error / Warning / Info)
 */
export function notifyModal({
  title,
  text,
  icon = "success",
  confirmButtonText = "OK, Got It",
}: {
  title: string;
  text?: string;
  icon?: SweetAlertIcon;
  confirmButtonText?: string;
}) {
  return ReleaseAlert.fire({
    title,
    text,
    icon,
    confirmButtonText,
  });
}

/**
 * Shows an animated SweetAlert confirmation dialog with Confirm and Cancel buttons
 */
export async function confirmModal({
  title,
  text,
  confirmButtonText = "Yes, Proceed",
  cancelButtonText = "Cancel",
  icon = "warning",
}: {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  icon?: SweetAlertIcon;
}): Promise<boolean> {
  const result = await ReleaseAlert.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });

  return result.isConfirmed;
}

/**
 * Shows a lightweight, animated SweetAlert toast in top-right corner
 */
export function notifyToast({
  title,
  icon = "success",
  timer = 3000,
}: {
  title: string;
  icon?: SweetAlertIcon;
  timer?: number;
}) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    customClass: {
      popup: "rounded-xl border border-border bg-card text-card-foreground shadow-xl font-sans text-xs p-3",
      title: "text-xs font-semibold text-foreground",
    },
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  Toast.fire({
    icon,
    title,
  });
}
