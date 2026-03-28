import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';

const PERSISTED_KEY_PREFIXES: readonly (readonly string[])[] = [
  ['profile'],
  ['clients'],
  ['patients'],
  ['modules'],
  ['attempts', 'therapist', 'modules']
];

const shouldPersistQuery = (query: Query): boolean =>
  PERSISTED_KEY_PREFIXES.some((prefix) => prefix.every((segment, i) => query.queryKey[i] === segment));

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'bwell-query-cache',
  throttleTime: 2000
});

export const persistDehydrateOptions = {
  shouldDehydrateQuery: shouldPersistQuery
};
