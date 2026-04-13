/**
 * ShareCardRenderer — the wrapper that triggers OS Share sheet.
 *
 * Since react-native-view-shot is not installed, this component uses
 * text-only sharing via React Native's Share API. The component maintains
 * the same public API so parents don't need to change behavior — they just
 * get text shares instead of image shares.
 *
 * The outer View is marked collapsable={false} so if view-shot ever becomes
 * available, it can be retrofitted to capture the card as an image.
 */
import React, { useRef, useCallback } from 'react';
import { View, Share } from 'react-native';

export type ShareCardRendererProps = {
  children: React.ReactNode;
  /** Fallback text if image capture fails. */
  fallbackMessage: string;
  /** Optional onShare callback (analytics hook). */
  onShare?: () => void;
};

export type ShareCardRef = {
  share: () => Promise<void>;
};

export const ShareCardRenderer = React.forwardRef<ShareCardRef, ShareCardRendererProps>(
  ({ children, fallbackMessage, onShare }, ref) => {
    const viewRef = useRef<View>(null);

    const share = useCallback(async () => {
      try {
        onShare?.();
        // Share text-only since react-native-view-shot is not installed.
        // If view-shot is added in future, we can capture the image here:
        // const uri = await captureRef(viewRef, {
        //   format: 'png',
        //   quality: 1,
        //   result: 'tmpfile',
        // });
        // await Share.share({ url: uri, message: fallbackMessage });
        await Share.share({ message: fallbackMessage });
      } catch (err) {
        // Silent fail — user may have dismissed the share sheet
        console.error('Share failed:', err);
      }
    }, [fallbackMessage, onShare]);

    React.useImperativeHandle(ref, () => ({ share }), [share]);

    return (
      <View ref={viewRef} collapsable={false}>
        {children}
      </View>
    );
  }
);

ShareCardRenderer.displayName = 'ShareCardRenderer';
