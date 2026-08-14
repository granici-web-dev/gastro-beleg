"use client";

import * as React from "react";

import type {
  BelegDocument,
  DocumentLine,
  SavingsEvent,
  SupplierProductMapping,
} from "@/lib/domain";
import {
  documents as seedDocuments,
  mappings as seedMappings,
  savingsEvents as seedSavings,
} from "@/lib/mock/data";

const STORAGE_KEY = "gastrobeleg-prototype-v1";

interface PrototypeState {
  documents: BelegDocument[];
  mappings: SupplierProductMapping[];
  savingsEvents: SavingsEvent[];
  skr: "SKR03" | "SKR04";
}

const seedState: PrototypeState = {
  documents: seedDocuments,
  mappings: seedMappings,
  savingsEvents: seedSavings,
  skr: "SKR03",
};

/**
 * Plain external store rather than component state: the saved snapshot must not
 * be read until after hydration, or the server and client markup disagree.
 */
let state: PrototypeState = seedState;
let restored = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: (current: PrototypeState) => PrototypeState) {
  state = next(state);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emit();
}

function subscribe(listener: () => void) {
  if (!restored) {
    restored = true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        state = JSON.parse(stored) as PrototypeState;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const patchDocument = (
  documentId: string,
  patch: (document: BelegDocument) => BelegDocument,
) =>
  setState((current) => ({
    ...current,
    documents: current.documents.map((document) =>
      document.id === documentId ? patch(document) : document,
    ),
  }));

const actions = {
  updateLine: (
    documentId: string,
    lineId: string,
    patch: Partial<DocumentLine>,
  ) =>
    patchDocument(documentId, (document) => ({
      ...document,
      lines: document.lines.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line,
      ),
    })),

  removeLine: (documentId: string, lineId: string) =>
    patchDocument(documentId, (document) => ({
      ...document,
      lines: document.lines.filter((line) => line.id !== lineId),
    })),

  setDocumentStatus: (documentId: string, status: BelegDocument["status"]) =>
    patchDocument(documentId, (document) => ({ ...document, status })),

  addDocument: (document: BelegDocument) =>
    setState((current) => ({
      ...current,
      documents: [document, ...current.documents],
    })),

  /** Remembers the mapping per (supplier, raw string) and applies it to every open line. */
  mapProduct: (mapping: SupplierProductMapping) =>
    setState((current) => ({
      ...current,
      mappings: [
        ...current.mappings.filter(
          (existing) =>
            !(
              existing.supplierId === mapping.supplierId &&
              existing.rawString === mapping.rawString
            ),
        ),
        mapping,
      ],
      documents: current.documents.map((document) =>
        document.supplierId === mapping.supplierId
          ? {
              ...document,
              lines: document.lines.map((line) =>
                line.rawDescription === mapping.rawString
                  ? { ...line, catalogItemId: mapping.catalogItemId }
                  : line,
              ),
            }
          : document,
      ),
    })),

  confirmSaving: (savingId: string) =>
    setState((current) => ({
      ...current,
      savingsEvents: current.savingsEvents.map((event) =>
        event.id === savingId ? { ...event, confirmed: true } : event,
      ),
    })),

  addSaving: (event: SavingsEvent) =>
    setState((current) => ({
      ...current,
      savingsEvents: [event, ...current.savingsEvents],
    })),

  setSkr: (skr: "SKR03" | "SKR04") =>
    setState((current) => ({ ...current, skr })),

  reset: () => {
    window.localStorage.removeItem(STORAGE_KEY);
    state = seedState;
    emit();
  },
};

export type PrototypeStore = PrototypeState & typeof actions;

export function usePrototype(): PrototypeStore {
  const snapshot = React.useSyncExternalStore(
    subscribe,
    () => state,
    () => seedState,
  );
  return { ...snapshot, ...actions };
}
