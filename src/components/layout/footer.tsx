/**
 * [INPUT]: None
 * [OUTPUT]: Footer JSX
 * [POS]: 全局布局组件，显示在所有页面底部
 */

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container mx-auto flex h-14 max-w-4xl items-center justify-center px-4 text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Kaelem. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
