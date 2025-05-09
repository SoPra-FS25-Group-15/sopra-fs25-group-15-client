import { useRef, useEffect } from "react";

/**
 * A custom hook that runs a callback function exactly once when all values in the array are not null or undefined.
 * @param {T[]} values - An array of values to check.
 * @param {() => void} callback - The callback function to run exactly once when all values are ready.
 */
export default function useOnceWhenReady<T>(values: T[], callback: () => void) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    if (values.some((v) => v == null)) return;
    ran.current = true;
    callback();
  }, [values, callback]);
}
