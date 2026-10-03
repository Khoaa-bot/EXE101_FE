// Chỉ chữ cái (kể cả có dấu tiếng Việt) và khoảng trắng — không cho số/ký tự đặc biệt.
export const NAME_REGEX =
  /^[A-Za-zÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỂưăạảấầẩẫậắằẳẵặẹẻẽềểưỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;
// Bắt đầu bằng chữ, chỉ gồm chữ/số/gạch dưới, 3-20 ký tự — không dấu, không khoảng trắng.
export const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9_]{2,19}$/;
// Số điện thoại di động Việt Nam: 10 số, bắt đầu 03/05/07/08/09.
export const PHONE_REGEX = /^(0[35789])[0-9]{8}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}
