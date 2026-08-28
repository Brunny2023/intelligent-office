import { toast } from "sonner";

/**
 * Copy text to the clipboard with a fallback for browsers/iframes where the
 * async Clipboard API is unavailable or blocked (preview iframes, http origins).
 */
export async function copyToClipboard(text: string, successMessage = "Copied to clipboard") {
  const fallback = () => {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      el.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  };

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }

  if (fallback()) {
    toast.success(successMessage);
    return true;
  }

  toast.error("Couldn't copy automatically — select the link and copy it manually.");
  return false;
}
