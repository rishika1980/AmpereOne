import { useEffect, useRef } from 'react';

export const usePoll = (fn, interval = 30000, deps = []) => {
  const savedFn = useRef(fn);
  useEffect(() => { savedFn.current = fn; });

  useEffect(() => {
    savedFn.current();
    const id = setInterval(() => savedFn.current(), interval);
    return () => clearInterval(id);
  }, deps);
};
