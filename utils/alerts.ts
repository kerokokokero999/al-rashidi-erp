import Swal from "sweetalert2";
import toast from "react-hot-toast";

const toastStyle = {
  fontFamily: "inherit",
  direction: "rtl" as const,
  background: "#fff",
  color: "#2A2628",
  boxShadow: "0 10px 25px rgba(250,105,158,0.15)",
  borderRadius: "16px",
  padding: "14px 18px",
  border: "1px solid #FFE7F0",
  minWidth: "280px",
  maxWidth: "400px",
};

// ===== Toast Notifications (سريعة) =====
export const showSuccess = (message: string) => {
  toast.success(message, { style: toastStyle, duration: 3000 });
};

export const showError = (message: string) => {
  toast.error(message, { style: toastStyle, duration: 4000 });
};

export const showWarning = (message: string) => {
  toast(message, {
    icon: "⚠️",
    style: toastStyle,
    duration: 3500,
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    icon: "ℹ️",
    style: toastStyle,
    duration: 3000,
  });
};

export const showLoading = (message: string = "جاري التحميل...") => {
  return toast.loading(message, { style: toastStyle });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// ===== SweetAlert2 (تأكيدات ومدخلات) =====
export const showConfirm = async (
  title: string,
  text: string,
  confirmText: string = "نعم",
  cancelText: string = "إلغاء"
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: "#22C55E",
    cancelButtonColor: "#EF4444",
    background: "#fff",
    color: "#2A2628",
    // borderRadius اتشال
    buttonsStyling: true,
  });
  return result.isConfirmed;
};

export const showInput = async (
  title: string,
  placeholder: string,
  inputType: "text" | "number" | "email" | "tel" = "text"
): Promise<string | null> => {
  const result = await Swal.fire({
    title,
    input: inputType,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: "موافق",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#FA699E",
    cancelButtonColor: "#EF4444",
    background: "#fff",
    color: "#2A2628",
    // borderRadius اتشال
    inputAttributes: {
      autocapitalize: "off",
      autocorrect: "off",
    },
    inputValidator: (value) => {
      if (!value || value.trim() === "") return "مطلوب!";
      return null;
    },
  });
  return result.isConfirmed && result.value ? result.value : null;
};

export const showAlert = async (
  title: string,
  text: string,
  icon: "success" | "error" | "warning" | "info" = "info"
) => {
  await Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: "حسناً",
    confirmButtonColor: "#FA699E",
    background: "#fff",
    color: "#2A2628",
    // borderRadius اتشال
  });
};

// ✅ SweetAlert loading
export const showLoadingAlert = (title: string = "جاري التحميل...") => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    showConfirmButton: false,
    background: "#fff",
    color: "#2A2628",
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeAlert = () => {
  Swal.close();
};