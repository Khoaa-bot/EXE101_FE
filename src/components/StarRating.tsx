// Hàng sao chỉ để xem (không bấm được). Đọc bằng trình đọc màn hình là "n sao".
export default function StarRating({ value, size = 18 }: { value: number; size?: number }) {
  const filled = Math.round(value);
  return (
    <span role="img" aria-label={`${value} sao`} className="inline-flex items-center gap-px align-middle">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className="material-symbols-outlined icon-fill-solid"
          style={{
            fontSize: size,
            color: star <= filled ? "#9a5b00" : "#c1c6d7",
          }}
        >
          star
        </span>
      ))}
    </span>
  );
}
