import type { MouseEvent, ReactNode } from "react";

type BrandLinkProps = {
  className?: string;
  children: ReactNode;
};

// Logo Servio ở sidebar: bấm để về trang giới thiệu. Chỉ bọc khối logo có sẵn, không đổi giao diện.
export default function BrandLink({ className, children }: BrandLinkProps) {
  const goToLanding = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <a href="/" onClick={goToLanding} aria-label="Servio, về trang giới thiệu" className={className}>
      {children}
    </a>
  );
}
