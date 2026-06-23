import { call } from '@/lib/ipc';
import type { DocFile, DocNode } from './types';

export const listDocs = (path: string) => call<DocNode[]>('list_docs', { path });
export const readDoc = (path: string, rel: string) => call<DocFile>('read_doc', { path, rel });
