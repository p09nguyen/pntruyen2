import { useRef, useEffect } from 'react';

/**
 * Hook cho phép kéo scroll ngang bằng chuột trái trên desktop
 * @returns ref để gán cho container scroll
 */
export default function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const mouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // chỉ chuột trái
      isDown = true;
      el.classList.add('dragging');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const mouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX;
      el.scrollLeft = scrollLeft - walk;
    };
    const mouseUp = () => {
      isDown = false;
      el.classList.remove('dragging');
    };
    el.addEventListener('mousedown', mouseDown);
    el.addEventListener('mousemove', mouseMove);
    el.addEventListener('mouseleave', mouseUp);
    el.addEventListener('mouseup', mouseUp);
    return () => {
      el.removeEventListener('mousedown', mouseDown);
      el.removeEventListener('mousemove', mouseMove);
      el.removeEventListener('mouseleave', mouseUp);
      el.removeEventListener('mouseup', mouseUp);
    };
  }, []);

  return ref;
}
