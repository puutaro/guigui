//go:build darwin

package image

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework AppKit
#import <AppKit/AppKit.h>

static inline void setMacAppIconInternal(const void* bytes, int length) {
    if (bytes == NULL || length <= 0) return;

    dispatch_async(dispatch_get_main_queue(), ^{
        @autoreleasepool {
            [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];

            NSData* data = [NSData dataWithBytes:bytes length:length];
            NSImage* image = [[NSImage alloc] initWithData:data];
            if (image != nil) {
                [NSApp setApplicationIconImage:image];
            }

            [NSApp activateIgnoringOtherApps:YES];
        }
    });
}
*/
import "C"
import "unsafe"

func ApplyMacAppIcon(iconBytes []byte) {
	if len(iconBytes) == 0 {
		return
	}
	C.setMacAppIconInternal(unsafe.Pointer(&iconBytes[0]), C.int(len(iconBytes)))
}
