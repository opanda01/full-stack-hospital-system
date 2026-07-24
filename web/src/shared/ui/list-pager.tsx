import { Button } from "./button";

type ListPagerProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

/** Minimal prev/next pager for admin/bashekim table pages. */
export function ListPager({
  page,
  pageSize,
  total,
  onPageChange,
}: ListPagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  return (
    <div className="mt-4 flex items-center gap-2 text-sm">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Önceki
      </Button>
      <span className="text-muted-foreground">
        Sayfa {page} / {pageCount}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Sonraki
      </Button>
    </div>
  );
}
