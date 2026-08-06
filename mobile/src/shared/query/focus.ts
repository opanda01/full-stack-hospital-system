import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

/** Sekmeye dönüşte arka planda yenile; önbellekli içeriği gizlemez. */
export function useRefetchOnTabFocus(refetch: () => Promise<unknown>) {
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
}
