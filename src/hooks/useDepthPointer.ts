import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

// Hiệu ứng 3D nhẹ: ghi vị trí con trỏ (từ -1 đến 1) vào biến CSS --px / --py của phần tử,
// các lớp con dùng biến đó để nghiêng hoặc lệch theo chiều sâu (xem index.css, mục "depth").
// Tự bỏ qua khi người dùng bật "giảm chuyển động" hoặc thiết bị không có chuột.
const canAnimate = () =>
  typeof window !== "undefined" &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function useDepthPointer<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const onPointerMove = (event: ReactPointerEvent<T>) => {
    const element = ref.current;
    if (!element || !canAnimate()) return;
    const rect = element.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    element.style.setProperty("--px", px.toFixed(3));
    element.style.setProperty("--py", py.toFixed(3));
  };

  const onPointerLeave = () => {
    ref.current?.style.removeProperty("--px");
    ref.current?.style.removeProperty("--py");
  };

  return { ref, onPointerMove, onPointerLeave };
}

// Gắn data-in cho phần tử có class "reveal" khi cuộn tới, để CSS chạy hiệu ứng hiện dần theo chiều sâu.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((item) => item.setAttribute("data-in", ""));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-in", "");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return ref;
}
