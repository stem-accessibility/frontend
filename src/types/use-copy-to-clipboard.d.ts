declare module 'use-copy-to-clipboard' {
    import { Dispatch, SetStateAction } from 'react';
  
    type UseCopyToClipboardReturn = [
      (text: string) => boolean,
      { value: string; error: Error | null },
      Dispatch<SetStateAction<string>>
    ];
  
    export default function useCopyToClipboard(): UseCopyToClipboardReturn;
  }
  