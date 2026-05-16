"use client";

import * as React from "react";
import { useTasksStore } from "@/lib/store/tasks-store";

export function StoreHydrator() {
  React.useEffect(() => {
    void useTasksStore.persist.rehydrate();
  }, []);

  return null;
}
